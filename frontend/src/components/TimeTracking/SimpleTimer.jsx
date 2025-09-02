import React, { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';

// Simple timer component for demonstration
const SimpleTimer = ({ taskId, taskTitle, className = '' }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isRunning ? (
        <>
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-mono text-lg font-semibold">
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          <button
            onClick={handleStop}
            className="btn btn-error btn-sm"
            title="Stop timer"
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button
          onClick={handleStart}
          className="btn btn-primary btn-sm"
          title="Start timer"
        >
          <Play className="w-4 h-4" />
          Start Timer
        </button>
      )}
    </div>
  );
};

// Global timer widget for header
export const GlobalTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskTitle] = useState('Sample Task');

  useEffect(() => {
    let interval;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  if (!isRunning) {
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
          {taskTitle}
        </span>
      </div>
      
      <button
        onClick={handleStop}
        className="btn btn-ghost btn-xs btn-circle"
        title="Stop timer"
      >
        <Square className="w-3 h-3" />
      </button>
    </div>
  );
};

export default SimpleTimer;