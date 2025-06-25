import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Check } from 'lucide-react'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const initializePasswordReset = async () => {
      try {
        // Get all possible parameters from URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        const tokenHash = searchParams.get('token_hash')
        const token = searchParams.get('token')

        console.log('URL Parameters:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          tokenHash: tokenHash ? 'present' : 'missing',
          token: token ? 'present' : 'missing'
        })

        // Check if we have the required parameters for password reset
        if (type !== 'recovery') {
          setError('Invalid reset link. Please request a new password reset.')
          setInitializing(false)
          return
        }

        // Try different approaches based on available parameters
        if (accessToken && refreshToken) {
          // Method 1: Use access_token and refresh_token
          console.log('Using access_token and refresh_token method')
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Session error:', error)
            throw error
          }
        } else if (tokenHash) {
          // Method 2: Use token_hash (newer Supabase versions)
          console.log('Using token_hash method')
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          })
          
          if (error) {
            console.error('Token verification error:', error)
            throw error
          }
        } else if (token) {
          // Method 3: Use token parameter
          console.log('Using token method')
          const { error } = await supabase.auth.verifyOtp({
            token: token,
            type: 'recovery'
          })
          
          if (error) {
            console.error('Token verification error:', error)
            throw error
          }
        } else {
          throw new Error('No valid reset parameters found in URL')
        }

        // Verify we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          throw new Error('Failed to establish valid session for password reset')
        }

        console.log('Password reset session established successfully')
        setInitializing(false)

      } catch (error: any) {
        console.error('Password reset initialization error:', error)
        
        // Provide more specific error messages
        if (error.message?.includes('expired')) {
          setError('Reset link has expired. Please request a new password reset.')
        } else if (error.message?.includes('invalid')) {
          setError('Invalid reset link. Please request a new password reset.')
        } else if (error.message?.includes('already_used')) {
          setError('This reset link has already been used. Please request a new password reset.')
        } else {
          setError('Unable to process reset link. Please request a new password reset.')
        }
        
        setInitializing(false)
      }
    }

    initializePasswordReset()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Verify we still have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Reset session has expired. Please request a new password reset.')
        setLoading(false)
        return
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password update error:', error)
        
        if (error.message.includes('session_not_found') || error.message.includes('invalid_token')) {
          setError('Reset session has expired. Please request a new password reset.')
        } else {
          setError(error.message || 'Failed to update password. Please try again.')
        }
        return
      }

      console.log('Password updated successfully')
      setSuccess(true)
      
      // Sign out after successful password reset to force fresh login
      setTimeout(async () => {
        await supabase.auth.signOut()
        navigate('/login')
      }, 3000)

    } catch (error: any) {
      console.error('Unexpected password update error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNewReset = () => {
    navigate('/login')
  }

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">
            Verifying Reset Link
          </h2>
          <p className="text-gray-400">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Password Updated!
          </h2>
          <p className="text-gray-400 mb-6">
            Your password has been successfully updated. You will be signed out and redirected to the login page shortly.
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut()
              navigate('/login')
            }}
            className="text-white hover:text-gray-300 underline transition-colors"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    )
  }

  if (error && (error.includes('expired') || error.includes('Invalid') || error.includes('Unable to process'))) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-8">⏰</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Reset Link Issue
          </h2>
          <p className="text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={handleRequestNewReset}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Panel - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Set New Password
            </h2>
            <p className="text-gray-400">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !error.includes('expired') && !error.includes('Invalid') && !error.includes('Unable to process') && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-12"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                'Update Password'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-white hover:text-gray-300 underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-800 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-8">🔐</div>
          <blockquote className="text-2xl font-medium text-white mb-6">
            "Secure your account with a strong new password."
          </blockquote>
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-black font-bold">🔑</span>
            </div>
            <span className="text-gray-300">@SecureReset</span>
          </div>
        </div>
      </div>
    </div>
  )
}