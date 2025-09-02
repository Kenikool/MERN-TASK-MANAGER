import React, { useState } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCw,
  Move,
  Maximize2
} from 'lucide-react'

const ImagePreview = ({ 
  isOpen, 
  onClose, 
  src, 
  alt = 'Image preview',
  title,
  downloadable = true 
}) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  if (!isOpen || !src) return null

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = title || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
      case 'R':
        handleRotate()
        break
      case '0':
        handleReset()
        break
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-white">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <p className="text-sm text-white/70">
            {Math.round(scale * 100)}% • {rotation}°
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
            disabled={scale <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-white text-sm min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
            disabled={scale >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="divider divider-horizontal mx-1"></div>
          
          <button
            onClick={handleRotate}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="btn btn-ghost btn-sm text-white hover:bg-white/20"
          >
            Reset
          </button>
          
          {downloadable && (
            <>
              <div className="divider divider-horizontal mx-1"></div>
              <button
                onClick={handleDownload}
                className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none max-h-none transition-transform duration-200 select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center'
          }}
          draggable={false}
          onLoad={() => {
            // Reset position when image loads
            setPosition({ x: 0, y: 0 })
          }}
        />
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute top-4 right-4 text-white/70 text-xs">
        <div className="bg-black/50 backdrop-blur-sm rounded p-2">
          <div>ESC: Close</div>
          <div>+/-: Zoom</div>
          <div>R: Rotate</div>
          <div>0: Reset</div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}

export default ImagePreview