import React from 'react'

const LoadingScreen = ({ message = 'Loading...', size = 'lg' }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-base-100 p-6">
      <div className="card bg-base-200 shadow-xl p-8 flex flex-col items-center gap-4">
        <div className={`loading loading-spinner loading-${size} text-primary`}></div>
        <p className="text-base-content text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}

export default LoadingScreen