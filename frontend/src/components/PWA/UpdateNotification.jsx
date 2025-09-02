import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';

const UpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      toast.success('App is ready to work offline!', {
        icon: '📱',
        duration: 5000,
      });
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="alert alert-info shadow-lg">
        <div className="flex items-center gap-2 w-full">
          <RefreshCw className="w-5 h-5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Update Available</h3>
            <p className="text-xs opacity-75">
              A new version of the app is available. Update now for the latest features and improvements.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleUpdate}
              className="btn btn-primary btn-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Update
            </button>
            <button
              onClick={handleDismiss}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;