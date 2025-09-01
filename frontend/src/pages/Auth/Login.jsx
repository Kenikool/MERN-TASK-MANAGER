import React, { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet-async'

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    clearError()
    const result = await login(data)
    
    if (result.success) {
      toast.success('Login successful!')
      navigate(from, { replace: true })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - Task Management</title>
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
                  Sign in to your account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      autoFocus
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
                      autoComplete="current-password"
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center">
                  <RouterLink
                    to="/register"
                    className="link link-primary text-sm"
                  >
                    Don't have an account? Sign Up
                  </RouterLink>
                </div>
              </form>

              {/* Demo Credentials */}
              <div className="bg-base-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-sm mb-2 text-base-content/80">
                  Demo Credentials:
                </h3>
                <div className="space-y-1 text-xs text-base-content/60">
                  <p>Admin: admin@example.com / password123</p>
                  <p>Manager: manager@example.com / password123</p>
                  <p>Member: member@example.com / password123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login