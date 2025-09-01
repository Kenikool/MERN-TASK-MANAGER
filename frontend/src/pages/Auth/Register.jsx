import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff, Mail, Lock, User, Building, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  department: yup.string(),
  position: yup.string(),
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

const Register = () => {

 const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, loading, error, clearError } = useAuth()
 const navigate = useNavigate()
 
 const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })
 
 const onSubmit = async (data) => {
    clearError()
    const { confirmPassword, ...userData } = data
    const result = await registerUser(userData)
    
    if (result.success) {
      toast.success('Registration successful! Welcome to Task Management.')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }
  return (
    <>
       <Helmet>
        <title>Register - Task Management</title>
    </Helmet>
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-base-content">
                  Task Management
                </h1>
                <p className="text-base-content/60 mt-2">
                  Create your account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Enter your full name"
                      className={`input input-bordered w-full pl-10 ${
                        errors.name ? 'input-error' : ''
                      }`}
                      autoComplete="name"
                      autoFocus
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  </div>
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.name.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Email Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Enter your email"
                      className={`input input-bordered w-full pl-10 ${
                        errors.email ? 'input-error' : ''
                      }`}
                      autoComplete="email"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  </div>
                  {errors.email && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.email.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Password Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`input input-bordered w-full pl-10 pr-10 ${
                        errors.password ? 'input-error' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.password.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className={`input input-bordered w-full pl-10 pr-10 ${
                        errors.confirmPassword ? 'input-error' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.confirmPassword.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Department Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <div className="relative">
                    <select
                      {...register('department')}
                      className={`select select-bordered w-full pl-10 ${
                        errors.department ? 'select-error' : ''
                      }`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40 pointer-events-none" />
                  </div>
                  {errors.department && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.department.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Position Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Position</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('position')}
                      type="text"
                      placeholder="Enter your position"
                      className={`input input-bordered w-full pl-10 ${
                        errors.position ? 'input-error' : ''
                      }`}
                      autoComplete="organization-title"
                    />
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  </div>
                  {errors.position && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.position.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Sign Up'
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center">
                  <RouterLink
                    to="/login"
                    className="link link-primary text-sm"
                  >
                    Already have an account? Sign In
                  </RouterLink>
                </div>
              </form>
            </div>
          </div>
        </div>

    </div>
    </>
  )
}

export default Register
