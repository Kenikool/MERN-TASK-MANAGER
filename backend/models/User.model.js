import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member'
  },
  avatar: {
    type: String,
    default: null
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      taskAssigned: { type: Boolean, default: true },
      taskDue: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    features: {
      maxTasks: { type: Number, default: 5 },
      maxProjects: { type: Number, default: 2 },
      teamMembers: { type: Number, default: 1 },
      timeTracking: { type: Boolean, default: false },
      advancedReports: { type: Boolean, default: false },
      aiFeatures: { type: Boolean, default: false },
      aiRequests: { type: Number, default: 0 },
      apiAccess: { type: Boolean, default: false }
    },
    paymentMethod: {
      type: String,
      default: null
    },
    lastPayment: {
      amount: Number,
      date: Date,
      method: String,
      transactionId: String
    },
    paymentHistory: [{
      transactionId: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      },
      method: {
        type: String,
        enum: ['stripe', 'paypal'],
        required: true
      },
      planId: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    department: this.department,
    position: this.position
  };
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Check if user can perform action based on role
userSchema.methods.canPerformAction = function(action, resource) {
  const permissions = {
    admin: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
    member: ['read', 'update']
  };
  
  return permissions[this.role]?.includes(action) || false;
};

export default mongoose.model('User', userSchema);