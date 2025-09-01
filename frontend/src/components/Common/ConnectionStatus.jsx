import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Sync, Database, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useNetworkStatus, useSyncManager } from '../../hooks/useOfflineAware';

const ConnectionStatus = () => {
  const { isConnected, connectionError } = useSocket();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, syncProgress, pendingCount, syncPendingActions } = useSyncManager();
  const [showStatus, setShowStatus] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const timer = setTimeout(() => {
        syncPendingActions();
      }, 2000); // Wait 2 seconds after coming online
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncPendingActions]);

  // Show status when connection changes
  useEffect(() => {
    if (!isConnected || connectionError || !isOnline) {
      setShowStatus(true);
    } else if (isConnected && isOnline) {
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    }
  }, [isConnected, connectionError, isOnline]);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-5 h-5" />,
        message: "You're offline. Changes will be saved locally.",
        className: "alert-warning",
        persistent: true,
        showSync: pendingCount > 0
      };
    }

    if (connectionError) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        message: `Connection error: ${connectionError}`,
        className: "alert-error",
        persistent: true,
        showSync: false
      };
    }

    if (!isConnected) {
      return {
        icon: <WifiOff className="w-5 h-5" />,
        message: "Connecting to real-time updates...",
        className: "alert-warning",
        persistent: true,
        showSync: false
      };
    }

    if (isConnected && isOnline) {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        message: "Connected! Real-time updates active.",
        className: "alert-success",
        persistent: false,
        showSync: pendingCount > 0
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  
  // Always show if offline or has pending sync
  const shouldShow = showStatus || !isOnline || pendingCount > 0 || isSyncing;

  if (!shouldShow && !statusInfo) return null;

  return (
    <>
      {/* Main Status Alert */}
      {shouldShow && statusInfo && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`alert ${statusInfo.className} shadow-lg`}>
            <div className="flex items-center gap-2 w-full">
              {statusInfo.icon}
              <div className="flex-1">
                <span className="text-sm font-medium">{statusInfo.message}</span>
                
                {/* Pending sync indicator */}
                {pendingCount > 0 && (
                  <div className="text-xs mt-1 opacity-75">
                    {pendingCount} action{pendingCount > 1 ? 's' : ''} pending sync
                  </div>
                )}
                
                {/* Sync progress */}
                {isSyncing && (
                  <div className="mt-2">
                    <div className="text-xs mb-1">Syncing... {Math.round(syncProgress)}%</div>
                    <progress 
                      className="progress progress-primary w-full h-1" 
                      value={syncProgress} 
                      max="100"
                    />
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {statusInfo.showSync && !isSyncing && (
                  <button
                    onClick={syncPendingActions}
                    className="btn btn-ghost btn-xs"
                    title="Sync now"
                  >
                    <Sync className="w-4 h-4" />
                  </button>
                )}
                
                {pendingCount > 0 && (
                  <button
                    onClick={() => setShowSyncPanel(true)}
                    className="btn btn-ghost btn-xs"
                    title="View sync details"
                  >
                    <Database className="w-4 h-4" />
                  </button>
                )}
                
                {!statusInfo.persistent && (
                  <button
                    onClick={() => setShowStatus(false)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Panel Modal */}
      {showSyncPanel && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Offline Sync Status</h3>
              <button
                onClick={() => setShowSyncPanel(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-success" />
                ) : (
                  <WifiOff className="w-5 h-5 text-error" />
                )}
                <div>
                  <div className="font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-sm text-base-content/60">
                    {isOnline ? 'Connected to server' : 'Working offline'}
                  </div>
                </div>
              </div>

              {/* Pending Actions */}
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <Database className="w-5 h-5 text-info" />
                <div>
                  <div className="font-medium">
                    {pendingCount} Pending Actions
                  </div>
                  <div className="text-sm text-base-content/60">
                    {pendingCount === 0 
                      ? 'All changes are synced'
                      : `${pendingCount} changes waiting to sync`
                    }
                  </div>
                </div>
              </div>

              {/* Sync Progress */}
              {isSyncing && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sync className="w-4 h-4 text-primary animate-spin" />
                    <span className="font-medium">Syncing...</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full" 
                    value={syncProgress} 
                    max="100"
                  />
                  <div className="text-xs text-center mt-1">
                    {Math.round(syncProgress)}% complete
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {pendingCount > 0 && !isSyncing && isOnline && (
                  <button
                    onClick={() => {
                      syncPendingActions();
                      setShowSyncPanel(false);
                    }}
                    className="btn btn-primary flex-1"
                  >
                    <Sync className="w-4 h-4 mr-2" />
                    Sync Now
                  </button>
                )}
                
                <button
                  onClick={() => setShowSyncPanel(false)}
                  className="btn btn-ghost flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatus;