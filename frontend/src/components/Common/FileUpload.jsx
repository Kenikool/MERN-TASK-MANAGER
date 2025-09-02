import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader,
  Download,
  Eye,
  Trash2
} from 'lucide-react'
import { uploadAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const FileUpload = ({
  onUpload,
  onRemove,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  existingFiles = [],
  className = '',
  showPreview = true,
  multiple = true
}) => {
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState(existingFiles)

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Max size is ${formatFileSize(maxSize)}`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported file type`)
        } else {
          toast.error(`Error with ${file.name}: ${error.message}`)
        }
      })
    })

    // Check total file limit
    const totalFiles = uploadedFiles.length + acceptedFiles.length
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Process accepted files
    for (const file of acceptedFiles) {
      const fileId = Date.now() + Math.random()
      const uploadingFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      }

      setUploadingFiles(prev => [...prev, uploadingFile])

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
              : f
          ))
        }, 500)

        // Upload file
        const response = await uploadAPI.uploadImage(file)
        
        clearInterval(progressInterval)

        const uploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: response.data.image.url,
          publicId: response.data.image.publicId,
          status: 'completed'
        }

        setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
        setUploadedFiles(prev => [...prev, uploadedFile])
        
        onUpload?.(uploadedFile)
        toast.success(`${file.name} uploaded successfully`)

      } catch (error) {
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: error.message }
            : f
        ))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }, [uploadedFiles.length, maxFiles, maxSize, onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {}),
    maxSize,
    multiple,
    disabled: uploadedFiles.length >= maxFiles
  })

  const removeFile = async (fileId, publicId) => {
    try {
      if (publicId) {
        await uploadAPI.deleteImage(publicId)
      }
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      onRemove?.(fileId)
      toast.success('File removed successfully')
    } catch (error) {
      toast.error('Failed to remove file')
    }
  }

  const cancelUpload = (fileId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryUpload = (fileId) => {
    const failedFile = uploadingFiles.find(f => f.id === fileId)
    if (failedFile) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0, error: null }
          : f
      ))
      // Retry upload logic here
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    if (type.includes('pdf') || type.includes('document')) return FileText
    if (type.includes('zip') || type.includes('rar')) return Archive
    return File
  }

  const getFileTypeColor = (type) => {
    if (type.startsWith('image/')) return 'text-success'
    if (type.startsWith('video/')) return 'text-error'
    if (type.startsWith('audio/')) return 'text-warning'
    if (type.includes('pdf')) return 'text-error'
    if (type.includes('document')) return 'text-info'
    return 'text-base-content'
  }

  const isImage = (type) => type.startsWith('image/')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {uploadedFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-base-300 hover:border-primary hover:bg-base-200'
          }`}
        >
          <input {...getInputProps()} />
          
          <Upload className="w-12 h-12 mx-auto mb-4 text-base-content/40" />
          
          {isDragActive ? (
            <p className="text-primary font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-base-content font-medium mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-base-content/60 text-sm">
                Max {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
              <p className="text-base-content/40 text-xs mt-1">
                Supported: {acceptedTypes.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Uploading...</h4>
          {uploadingFiles.map(file => {
            const FileIcon = getFileIcon(file.type)
            
            return (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <FileIcon className={`w-5 h-5 ${getFileTypeColor(file.type)}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{file.name}</span>
                    <span className="text-xs text-base-content/60">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="w-full bg-base-300 rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="text-error text-xs">{file.error}</div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {file.status === 'uploading' && (
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                  )}
                  
                  {file.status === 'error' && (
                    <>
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="btn btn-ghost btn-xs"
                        title="Retry upload"
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                      <AlertCircle className="w-4 h-4 text-error" />
                    </>
                  )}
                  
                  <button
                    onClick={() => cancelUpload(file.id)}
                    className="btn btn-ghost btn-xs"
                    title="Cancel upload"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          <div className={showPreview ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
            {uploadedFiles.map(file => {
              const FileIcon = getFileIcon(file.type)
              
              return (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-lg">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {showPreview && isImage(file.type) ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <FileIcon className={`w-8 h-8 ${getFileTypeColor(file.type)}`} />
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{file.name}</div>
                    <div className="text-xs text-base-content/60">
                      {formatFileSize(file.size)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    
                    {file.url && (
                      <>
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="btn btn-ghost btn-xs"
                          title="View file"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        
                        <a
                          href={file.url}
                          download={file.name}
                          className="btn btn-ghost btn-xs"
                          title="Download file"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </>
                    )}
                    
                    <button
                      onClick={() => removeFile(file.id, file.publicId)}
                      className="btn btn-ghost btn-xs text-error"
                      title="Remove file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* File Limit Warning */}
      {uploadedFiles.length >= maxFiles && (
        <div className="alert alert-warning">
          <AlertCircle className="w-5 h-5" />
          <span>Maximum number of files ({maxFiles}) reached. Remove files to upload more.</span>
        </div>
      )}
    </div>
  )
}

export default FileUpload