import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import User from '../models/User.model.js';

// Configure Cloudinary (only if credentials are provided)
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️ Cloudinary credentials not configured. File upload features will be limited.');
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false);
    }
  }
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      // Mock upload for development without Cloudinary
      // Use a reliable placeholder service instead of local mock files
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockResult = {
        secure_url: `https://picsum.photos/400/300?random=${mockId}`,
        public_id: mockId,
        bytes: buffer.length,
        format: 'jpg',
        width: 400,
        height: 300,
        created_at: new Date().toISOString()
      };
      console.log('📁 Mock upload created:', mockResult.secure_url);
      resolve(mockResult);
      return;
    }
    
    const uploadOptions = {
      folder: 'task-manager',
      resource_type: 'auto',
      ...options
    };
    
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Upload single image
export const uploadSingleImage = async (req, res) => {
  try {
    // Allow uploads even without Cloudinary for development
    console.log('📁 Image upload request received. Cloudinary configured:', isCloudinaryConfigured);
    
    if (!isCloudinaryConfigured) {
      console.log('⚠️ Using mock upload system - images will be placeholder URLs');
    }
    
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        
        res.json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: req.file.originalname,
            size: result.bytes,
            format: result.format
          }
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage'
        });
      }
    });
  } catch (error) {
    console.error('Upload single image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading image'
    });
  }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
  try {
    const uploadMultiple = upload.array('images', 10); // Max 10 files
    
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      // Upload all files to Cloudinary
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      
      const uploadedFiles = results.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.files[index].originalname,
        size: result.bytes,
        format: result.format
      }));
      
      res.json({
        success: true,
        message: `${req.files.length} files uploaded successfully`,
        data: uploadedFiles
      });
    });
  } catch (error) {
    console.error('Upload multiple images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading images'
    });
  }
};

// Upload base64 image
export const uploadBase64Image = async (req, res) => {
  try {
    const { image, folder = 'task-manager' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Base64 image data is required'
      });
    }
    
    if (!isCloudinaryConfigured) {
      // Mock upload for development without Cloudinary
      const mockId = `mock_base64_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockResult = {
        secure_url: `https://picsum.photos/400/300?random=${mockId}`,
        public_id: mockId,
        width: 400,
        height: 300,
        format: 'jpg',
        bytes: 1024
      };
      
      console.log('📁 Mock base64 upload created:', mockResult.secure_url);
      
      return res.json({
        success: true,
        message: 'Image uploaded successfully (mock)',
        data: mockResult
      });
    }
    
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: folder,
        resource_type: 'auto'
      });
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes
        }
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }
  } catch (error) {
    console.error('Upload base64 image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading base64 image'
    });
  }
};

// Delete image by public ID
export const deleteImageByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }
    
    if (!isCloudinaryConfigured) {
      // Mock deletion when Cloudinary is not configured
      return res.json({
        success: true,
        message: 'Image deleted successfully (mock)'
      });
    }
    
    try {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'Image deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Image not found or already deleted'
        });
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image from cloud storage'
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting image'
    });
  }
};

// Upload user avatar
export const uploadAvatar = async (req, res) => {
  try {
    const uploadSingle = upload.single('avatar');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file uploaded'
        });
      }
      
      try {
        // Upload to Cloudinary (or mock if not configured)
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'task-manager/avatars',
          transformation: isCloudinaryConfigured ? [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' }
          ] : undefined
        });
        
        // Update user's avatar
        const user = await User.findByIdAndUpdate(
          req.user.id,
          {
            avatar: result.secure_url
          },
          { new: true }
        ).select('-password');
        
        res.json({
          success: true,
          message: 'Avatar uploaded successfully',
          data: {
            user,
            avatar: {
              url: result.secure_url,
              publicId: result.public_id
            }
          }
        });
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload avatar'
        });
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading avatar'
    });
  }
};

// Get upload statistics
export const getUploadStats = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      // Return mock stats when Cloudinary is not configured
      return res.json({
        success: true,
        data: {
          totalStorage: 0,
          totalTransformations: 0,
          totalRequests: 0,
          plan: 'development',
          credits: 'unlimited'
        }
      });
    }
    
    try {
      // This would require tracking uploads in a separate collection
      // For now, we'll return basic Cloudinary usage stats
      const usage = await cloudinary.api.usage();
      
      res.json({
        success: true,
        data: {
          totalStorage: usage.storage.used,
          totalTransformations: usage.transformations.used,
          totalRequests: usage.requests,
          plan: usage.plan,
          credits: usage.credits
        }
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary API error:', cloudinaryError);
      res.status(500).json({
        success: false,
        message: 'Failed to get upload statistics from cloud service'
      });
    }
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting upload statistics'
    });
  }
};

// Upload task attachment
export const uploadTaskAttachment = async (req, res) => {
  try {
    const uploadSingle = upload.single('attachment');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No attachment uploaded'
        });
      }
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'task-manager/attachments'
      });
      
      const attachment = {
        url: result.secure_url,
        publicId: result.public_id,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        size: result.bytes,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      };
      
      res.json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: attachment
      });
    });
  } catch (error) {
    console.error('Upload task attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading attachment'
    });
  }
};

// Get file info
export const getFileInfo = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!isCloudinaryConfigured) {
      // Return mock file info when Cloudinary is not configured
      return res.json({
        success: true,
        data: {
          publicId: publicId,
          url: `https://picsum.photos/400/300?random=${publicId}`,
          format: 'jpg',
          width: 400,
          height: 300,
          size: 1024,
          createdAt: new Date().toISOString(),
          resourceType: 'image'
        }
      });
    }
    
    try {
      const result = await cloudinary.api.resource(publicId);
      
      res.json({
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes,
          createdAt: result.created_at,
          resourceType: result.resource_type
        }
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary API error:', cloudinaryError);
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting file info'
    });
  }
};

export { upload };