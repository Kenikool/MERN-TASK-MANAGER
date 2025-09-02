import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';

const Timer = ({ taskId, taskTitle, className = '' }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const queryClient = useQueryClient();

  // Get active timer
  const { data: activeTimer, isLoading } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => timeTrackingAPI.getActiveTimer().then(res => res.data.data),
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 1000 // Consider data stale after 1 second
  });

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: (data) => timeTrackingAPI.startTimer(data),
    onMutate: () => {
      setIsLocalRunning(true);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['activeTimer']);
      queryClient.invalidateQueries(['timeEntries']);
      queryClient.invalidateQueries(['timeStats']);
      toast.success('Timer started!', { icon: '▶️' });
    },
    onError: (error) => {
      setIsLocalRunning(false);
      toast.error(error.response?.data?.message || 'Failed to start timer');
    }
  });

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: (id) => timeTrackingAPI.stopTimer(id),
    onMutate: () => {
      setIsLocalRunning(false);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['activeTimer']);
      queryClient.invalidateQueries(['timeEntries']);
      queryClient.invalidateQueries(['timeStats']);
      queryClient.invalidateQueries(['tasks']);
      
      const duration = response.data.data.duration;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      
      toast.success(
        `Timer stopped! Tracked ${hours > 0 ? `${hours}h ` : ''}${minutes}m`,
        { icon: '⏹️', duration: 4000 }
      );
    },
    onError: (error) => {
      setIsLocalRunning(true);
      toast.error(error.response?.data?.message || 'Failed to stop timer');
    }
  });

  // Calculate elapsed time for active timer
  useEffect(() => {
    let interval;
    
    if (activeTimer && activeTimer.isRunning) {
      const updateElapsed = () => {
        const elapsed = Math.floor((new Date() - new Date(activeTimer.startTime)) / 1000);
        setElapsedTime(elapsed);
      };
      
      updateElapsed(); // Initial calculation
      interval = setInterval(updateElapsed, 1000);
      setIsLocalRunning(true);
    } else {
      setElapsedTime(0);
      setIsLocalRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = () => {
    startTimerMutation.mutate({
      taskId,
      description: `Working on ${taskTitle}`,
      billable: true
    });
  };

  const handleStop = () => {
    if (activeTimer) {
      stopTimerMutation.mutate(activeTimer._id);
    }
  };

  const isCurrentTask = activeTimer?.task?._id === taskId;
  const isRunning = activeTimer?.isRunning && isCurrentTask;
  const hasActiveTimer = activeTimer?.isRunning && !isCurrentTask;
  const isLoading_ = startTimerMutation.isPending || stopTimerMutation.isPending || isLoading;

  if (isLoading && !activeTimer) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="skeleton w-20 h-8"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isRunning ? (
        <>
          {/* Running Timer Display */}
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-mono text-lg font-semibold">
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          {/* Stop Button */}
          <button
            onClick={handleStop}
            disabled={isLoading_}
            className="btn btn-error btn-sm"
            title="Stop timer"
          >
            {isLoading_ ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </>
      ) : (
        <>
          {/* Start Timer Button */}
          <button
            onClick={handleStart}
            disabled={isLoading_ || hasActiveTimer}
            className="btn btn-primary btn-sm"
            title={hasActiveTimer ? 'Stop other timer first' : 'Start timer'}
          >
            {isLoading_ ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start Timer
          </button>
          
          {/* Active Timer Warning */}
          {hasActiveTimer && (
            <div className="tooltip tooltip-warning" data-tip="Another timer is running">
              <div className="badge badge-warning badge-sm">
                <Clock className="w-3 h-3 mr-1" />
                Other task active
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Compact version for task cards
export const CompactTimer = ({ taskId, taskTitle, className = '' }) => {
  const { data: activeTimer } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => timeTrackingAPI.getActiveTimer().then(res => res.data.data),
    refetchInterval: 5000
  });

  const isCurrentTask = activeTimer?.task?._id === taskId;
  const isRunning = activeTimer?.isRunning && isCurrentTask;

  if (!isRunning) {
    return (
      <Timer taskId={taskId} taskTitle={taskTitle} className={className} />
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
      <Clock className="w-3 h-3 text-success" />
      <span className="text-xs text-success font-medium">Running</span>
    </div>
  );
};

// Global timer widget for header/sidebar
export const GlobalTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();

  const { data: activeTimer } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => timeTrackingAPI.getActiveTimer().then(res => res.data.data),
    refetchInterval: 5000
  });

  const stopTimerMutation = useMutation({
    mutationFn: (id) => timeTrackingAPI.stopTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeTimer']);
      queryClient.invalidateQueries(['timeEntries']);
      toast.success('Timer stopped!', { icon: '⏹️' });
    }
  });

  useEffect(() => {
    let interval;
    
    if (activeTimer && activeTimer.isRunning) {
      const updateElapsed = () => {
        const elapsed = Math.floor((new Date() - new Date(activeTimer.startTime)) / 1000);
        setElapsedTime(elapsed);
      };
      
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeTimer || !activeTimer.isRunning) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-2 rounded-lg">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        <Clock className="w-4 h-4" />
      </div>
      
      <div className="flex flex-col">
        <span className="font-mono text-sm font-semibold">
          {formatTime(elapsedTime)}
        </span>
        <span className="text-xs opacity-75 truncate max-w-32">
          {activeTimer.task?.title}
        </span>
      </div>
      
      <button
        onClick={() => stopTimerMutation.mutate(activeTimer._id)}
        disabled={stopTimerMutation.isPending}
        className="btn btn-ghost btn-xs btn-circle"
        title="Stop timer"
      >
        {stopTimerMutation.isPending ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Square className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export default Timer;