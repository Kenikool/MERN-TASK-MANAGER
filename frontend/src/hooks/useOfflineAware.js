import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { offlineStorage } from '../utils/offlineStorage';
import toast from 'react-hot-toast';

// Hook for offline-aware queries
export const useOfflineAwareQuery = (queryKey, queryFn, options = {}) => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    ...options,
    queryKey,
    queryFn: async () => {
      try {
        // Try online first
        if (isOnline) {
          const result = await queryFn();
          
          // Store in offline cache based on query type
          if (queryKey[0] === 'tasks') {
            await offlineStorage.storeTasks(Array.isArray(result) ? result : [result]);
          } else if (queryKey[0] === 'projects') {
            await offlineStorage.storeProjects(Array.isArray(result) ? result : [result]);
          } else if (queryKey[0] === 'users' || queryKey[0] === 'team-members') {
            await offlineStorage.storeUsers(Array.isArray(result) ? result : [result]);
          } else if (queryKey[0] === 'timeEntries') {
            await offlineStorage.storeTimeEntries(Array.isArray(result) ? result : [result]);
          }
          
          return result;
        } else {
          throw new Error('Offline');
        }
      } catch (error) {
        // If offline or error, try to get from cache
        if (!isOnline || error.message === 'Offline') {
          console.log('Offline: Loading from cache for', queryKey[0]);
          
          let cachedData = null;
          const filters = queryKey[1] || {};
          
          switch (queryKey[0]) {
            case 'tasks':
              cachedData = await offlineStorage.getTasks(filters);
              break;
            case 'task':
              cachedData = await offlineStorage.getTask(queryKey[1]);
              break;
            case 'projects':
              cachedData = await offlineStorage.getProjects(filters);
              break;
            case 'project':
              cachedData = await offlineStorage.getProject(queryKey[1]);
              break;
            case 'users':
            case 'team-members':
              cachedData = await offlineStorage.getUsers();
              break;
            case 'timeEntries':
              cachedData = await offlineStorage.getTimeEntries(filters);
              break;
            default:
              throw error;
          }
          
          if (cachedData) {
            if (!isOnline) {
              toast.info('Showing cached data (offline)', { duration: 2000 });
            }
            return cachedData;
          }
        }
        
        throw error;
      }
    },
    staleTime: isOnline ? (options.staleTime || 5 * 60 * 1000) : Infinity, // 5 min online, infinite offline
    retry: isOnline ? (options.retry || 3) : 0,
    refetchOnWindowFocus: isOnline,
    refetchOnReconnect: isOnline,
  });
};

// Hook for offline-aware mutations
export const useOfflineAwareMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useMutation({
    ...options,
    mutationFn: async (variables) => {
      if (!isOnline) {
        // Store action for later sync
        await offlineStorage.storeOfflineAction({
          type: options.mutationType || 'unknown',
          variables,
          queryKeys: options.invalidateQueries || [],
          endpoint: options.endpoint,
          method: options.method || 'POST'
        });
        
        toast.info('Action saved. Will sync when online.', { 
          duration: 3000,
          icon: '📱' 
        });
        
        // Optimistically update cache if possible
        if (options.optimisticUpdate) {
          options.optimisticUpdate(variables, queryClient);
        }
        
        return { offline: true, data: variables };
      }
      
      return await mutationFn(variables);
    },
    onSuccess: (data, variables, context) => {
      if (!data?.offline && options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    }
  });
};

// Hook for sync management
export const useSyncManager = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  // Check pending actions count
  useEffect(() => {
    const checkPending = async () => {
      const pending = await offlineStorage.getPendingActions();
      setPendingCount(pending.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const syncPendingActions = async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      
      if (pendingActions.length === 0) {
        toast.success('All data is synced!');
        setIsSyncing(false);
        return;
      }

      toast.info(`Syncing ${pendingActions.length} pending actions...`);

      let completed = 0;
      const total = pendingActions.length;

      for (const action of pendingActions) {
        try {
          // Skip actions that have failed too many times
          if (action.retryCount >= 3) {
            await offlineStorage.deleteAction(action.id);
            completed++;
            setSyncProgress((completed / total) * 100);
            continue;
          }

          // Execute the action based on type
          await executeOfflineAction(action);
          
          // Mark as synced
          await offlineStorage.markActionSynced(action.id);
          
          // Invalidate related queries
          if (action.queryKeys) {
            action.queryKeys.forEach(key => {
              queryClient.invalidateQueries(key);
            });
          }

          completed++;
          setSyncProgress((completed / total) * 100);

        } catch (error) {
          console.error('Sync error for action:', action, error);
          
          // Increment retry count
          await offlineStorage.incrementRetryCount(action.id);
          
          completed++;
          setSyncProgress((completed / total) * 100);
        }
      }

      // Update pending count
      const remainingPending = await offlineStorage.getPendingActions();
      setPendingCount(remainingPending.length);

      if (remainingPending.length === 0) {
        toast.success('All data synced successfully!');
      } else {
        toast.warning(`${remainingPending.length} actions failed to sync`);
      }

    } catch (error) {
      console.error('Sync process error:', error);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const clearOfflineData = async () => {
    try {
      await offlineStorage.clearAllData();
      setPendingCount(0);
      toast.success('Offline data cleared');
    } catch (error) {
      toast.error('Failed to clear offline data');
    }
  };

  const getStorageInfo = async () => {
    return await offlineStorage.getStorageInfo();
  };

  return {
    isSyncing,
    syncProgress,
    pendingCount,
    syncPendingActions,
    clearOfflineData,
    getStorageInfo
  };
};

// Helper function to execute offline actions
const executeOfflineAction = async (action) => {
  const { type, variables, endpoint, method } = action;

  // Import API functions dynamically to avoid circular dependencies
  const { tasksAPI, projectsAPI, usersAPI, timeTrackingAPI } = await import('../utils/api');

  switch (type) {
    case 'createTask':
      return tasksAPI.createTask(variables);
    
    case 'updateTask':
      return tasksAPI.updateTask(variables.id, variables.data);
    
    case 'deleteTask':
      return tasksAPI.deleteTask(variables.id);
    
    case 'updateTaskStatus':
      return tasksAPI.updateStatus(variables.taskId, variables.status);
    
    case 'addComment':
      return tasksAPI.addComment(variables.taskId, variables.comment);
    
    case 'createProject':
      return projectsAPI.createProject(variables);
    
    case 'updateProject':
      return projectsAPI.updateProject(variables.id, variables.data);
    
    case 'deleteProject':
      return projectsAPI.deleteProject(variables.id);
    
    case 'startTimer':
      return timeTrackingAPI.startTimer(variables);
    
    case 'stopTimer':
      return timeTrackingAPI.stopTimer(variables.id);
    
    case 'createManualEntry':
      return timeTrackingAPI.createManualEntry(variables);
    
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Back online! Syncing data...', { icon: '🌐' });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('You are offline. Changes will be saved locally.', { 
        icon: '📱',
        duration: 5000 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};