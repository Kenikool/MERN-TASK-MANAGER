import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Helmet } from 'react-helmet-async'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Camera,
  Save,
  Lock,
  Bell,
  Palette,
  Shield,
  Activity,
  Calendar,
  Clock,
  Target,
  Award,
  Upload,
  X,
  Eye,
  Download
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { uploadAPI, analyticsAPI } from '../../utils/api'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const profileSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  phone: yup.string(),
  department: yup.string(),
  position: yup.string(),
})

const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your password'),
})

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  // Fetch user analytics for real stats
  const { data: userAnalytics } = useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: () => analyticsAPI.getUser(user?.id),
    enabled: !!user?.id,
    select: (data) => data.data
  })

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || '',
    }
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm({
    resolver: yupResolver(passwordSchema)
  })

  const [notifications, setNotifications] = useState({
    email: user?.preferences?.notifications?.email ?? true,
    push: user?.preferences?.notifications?.push ?? true,
    taskAssigned: user?.preferences?.notifications?.taskAssigned ?? true,
    taskDue: user?.preferences?.notifications?.taskDue ?? true,
    taskCompleted: user?.preferences?.notifications?.taskCompleted ?? true,
  })

  const departments = [
    'Engineering',
    'Design',
    'Product',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Other',
  ]

  const onProfileSubmit = async (data) => {
    setIsUpdatingProfile(true)
    try {
      const result = await updateProfile(data)
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true)
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      if (result.success) {
        toast.success('Password changed successfully!')
        resetPasswordForm()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
    // Here you would typically save to backend
    toast.success('Notification preferences updated')
  }

  const handleAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setIsUploadingAvatar(true)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const response = await uploadAPI.uploadAvatar(file)
      
      if (response.data.success) {
        // Update user profile with new avatar URL
        const updateResult = await updateProfile({ avatar: response.data.avatar.url })
        if (updateResult.success) {
          toast.success('Avatar updated successfully!')
        }
      }
    } catch (error) {
      toast.error('Failed to upload avatar')
      setAvatarPreview(user?.avatar || null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true)
      const result = await updateProfile({ avatar: null })
      if (result.success) {
        setAvatarPreview(null)
        toast.success('Avatar removed successfully!')
      }
    } catch (error) {
      toast.error('Failed to remove avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ]

  // Real user stats from analytics
  const userStats = {
    tasksCompleted: userAnalytics?.overview?.completedTasks || 0,
    projectsWorked: userAnalytics?.overview?.projectsCount || 0,
    hoursLogged: Math.round(userAnalytics?.overview?.totalHours || 0),
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
  }

  return (
    <>
      <Helmet>
        <title>Profile - Task Management</title>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-16 rounded-full">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="bg-primary text-primary-content w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-base-content/60 capitalize">{user?.role}</p>
              {user?.department && (
                <p className="text-sm text-base-content/50">{user.department}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Tasks Completed</p>
                  <p className="text-2xl font-bold">{userStats.tasksCompleted}</p>
                </div>
                <Target className="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Projects</p>
                  <p className="text-2xl font-bold">{userStats.projectsWorked}</p>
                </div>
                <Award className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Hours Logged</p>
                  <p className="text-2xl font-bold">{userStats.hoursLogged}h</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Member Since</p>
                  <p className="text-lg font-bold">{userStats.joinDate}</p>
                </div>
                <Calendar className="w-8 h-8 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-0">
                <ul className="menu menu-lg">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 ${
                            activeTab === tab.id ? 'active' : ''
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {tab.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Profile Information</h2>
                  
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-base-300">
                    <div className="relative">
                      <div className="avatar">
                        <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt={user?.name} className="object-cover" />
                          ) : (
                            <div className="bg-primary text-primary-content w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold">
                              {user?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <span className="loading loading-spinner loading-sm text-white"></span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Profile Picture</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleAvatarUpload}
                          className="btn btn-outline btn-sm"
                          disabled={isUploadingAvatar}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {avatarPreview ? 'Change' : 'Upload'}
                        </button>
                        
                        {avatarPreview && (
                          <button 
                            onClick={handleRemoveAvatar}
                            className="btn btn-ghost btn-sm text-error"
                            disabled={isUploadingAvatar}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-base-content/60 mt-1">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Full Name</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerProfile('name')}
                            type="text"
                            className={`input input-bordered w-full pl-10 ${
                              profileErrors.name ? 'input-error' : ''
                            }`}
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                        {profileErrors.name && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {profileErrors.name.message}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Email */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Email</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerProfile('email')}
                            type="email"
                            className={`input input-bordered w-full pl-10 ${
                              profileErrors.email ? 'input-error' : ''
                            }`}
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                        {profileErrors.email && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {profileErrors.email.message}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Phone</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerProfile('phone')}
                            type="tel"
                            className="input input-bordered w-full pl-10"
                            placeholder="Optional"
                          />
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                      </div>

                      {/* Department */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Department</span>
                        </label>
                        <div className="relative">
                          <select
                            {...registerProfile('department')}
                            className="select select-bordered w-full pl-10"
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" />
                        </div>
                      </div>

                      {/* Position */}
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-medium">Position</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerProfile('position')}
                            type="text"
                            className="input input-bordered w-full pl-10"
                            placeholder="Your job title"
                          />
                          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Security Settings</h2>
                  
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      {/* Current Password */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Current Password</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerPassword('currentPassword')}
                            type="password"
                            className={`input input-bordered w-full pl-10 ${
                              passwordErrors.currentPassword ? 'input-error' : ''
                            }`}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                        {passwordErrors.currentPassword && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {passwordErrors.currentPassword.message}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* New Password */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">New Password</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerPassword('newPassword')}
                            type="password"
                            className={`input input-bordered w-full pl-10 ${
                              passwordErrors.newPassword ? 'input-error' : ''
                            }`}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                        {passwordErrors.newPassword && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {passwordErrors.newPassword.message}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Confirm New Password</span>
                        </label>
                        <div className="relative">
                          <input
                            {...registerPassword('confirmPassword')}
                            type="password"
                            className={`input input-bordered w-full pl-10 ${
                              passwordErrors.confirmPassword ? 'input-error' : ''
                            }`}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                        </div>
                        {passwordErrors.confirmPassword && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {passwordErrors.confirmPassword.message}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">General Notifications</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={notifications.email}
                              onChange={(e) => handleNotificationChange('email', e.target.checked)}
                            />
                            <div>
                              <span className="label-text font-medium">Email Notifications</span>
                              <div className="text-sm text-base-content/60">
                                Receive notifications via email
                              </div>
                            </div>
                          </label>
                        </div>

                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={notifications.push}
                              onChange={(e) => handleNotificationChange('push', e.target.checked)}
                            />
                            <div>
                              <span className="label-text font-medium">Push Notifications</span>
                              <div className="text-sm text-base-content/60">
                                Receive browser push notifications
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Task Notifications</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={notifications.taskAssigned}
                              onChange={(e) => handleNotificationChange('taskAssigned', e.target.checked)}
                            />
                            <div>
                              <span className="label-text font-medium">Task Assigned</span>
                              <div className="text-sm text-base-content/60">
                                When a task is assigned to you
                              </div>
                            </div>
                          </label>
                        </div>

                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={notifications.taskDue}
                              onChange={(e) => handleNotificationChange('taskDue', e.target.checked)}
                            />
                            <div>
                              <span className="label-text font-medium">Task Due</span>
                              <div className="text-sm text-base-content/60">
                                When a task is approaching its due date
                              </div>
                            </div>
                          </label>
                        </div>

                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={notifications.taskCompleted}
                              onChange={(e) => handleNotificationChange('taskCompleted', e.target.checked)}
                            />
                            <div>
                              <span className="label-text font-medium">Task Completed</span>
                              <div className="text-sm text-base-content/60">
                                When a task you're involved in is completed
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Appearance</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="toggle"
                              checked={isDarkMode}
                              onChange={toggleTheme}
                            />
                            <div>
                              <span className="label-text font-medium">Dark Mode</span>
                              <div className="text-sm text-base-content/60">
                                Use dark theme for better viewing in low light
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              defaultChecked
                            />
                            <div>
                              <span className="label-text font-medium">Compact View</span>
                              <div className="text-sm text-base-content/60">
                                Show more content in less space
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Language & Region</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Language</span>
                          </label>
                          <select className="select select-bordered">
                            <option>English (US)</option>
                            <option>English (UK)</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                          </select>
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Timezone</span>
                          </label>
                          <select className="select select-bordered">
                            <option>UTC-8 (Pacific Time)</option>
                            <option>UTC-5 (Eastern Time)</option>
                            <option>UTC+0 (GMT)</option>
                            <option>UTC+1 (Central European Time)</option>
                          </select>
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Date Format</span>
                          </label>
                          <select className="select select-bordered">
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Productivity</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              defaultChecked
                            />
                            <div>
                              <span className="label-text font-medium">Auto-save drafts</span>
                              <div className="text-sm text-base-content/60">
                                Automatically save task and project drafts
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                            />
                            <div>
                              <span className="label-text font-medium">Smart suggestions</span>
                              <div className="text-sm text-base-content/60">
                                Show AI-powered task and time suggestions
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Default task priority</span>
                          </label>
                          <select className="select select-bordered">
                            <option>Low</option>
                            <option selected>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Privacy</h3>
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                              defaultChecked
                            />
                            <div>
                              <span className="label-text font-medium">Activity tracking</span>
                              <div className="text-sm text-base-content/60">
                                Allow tracking for productivity insights
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              className="checkbox"
                            />
                            <div>
                              <span className="label-text font-medium">Share usage data</span>
                              <div className="text-sm text-base-content/60">
                                Help improve the app by sharing anonymous usage data
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile