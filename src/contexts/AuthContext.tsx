import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string) => Promise<any>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Access code removed - registration is now open to public

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get the profile directly
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create...')
          await createUserProfileFallback(userId)
          return
        }
        // For other errors, set loading to false so user isn't stuck
        setLoading(false)
        return
      }
      
      setUserProfile(data)
      setLoading(false)
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error)
      setLoading(false)
    }
  }

  const createUserProfileFallback = async (userId: string, fullName?: string, email?: string) => {
    try {
      // Get user info if not provided
      if (!email || !fullName) {
        const { data: { user } } = await supabase.auth.getUser()
        email = email || user?.email || ''
        fullName = fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
      }

      // Try using edge function first
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user-profile', {
        body: {
          userId: userId,
          email: email,
          fullName: fullName,
          role: 'member',
          status: 'approved'
        }
      })

      if (functionError) {
        console.error('Edge function error:', functionError)
        // Create a temporary profile object for the session
        const tempProfile = {
          id: userId,
          email: email,
          full_name: fullName,
          role: 'member',
          status: 'approved'
        }
        setUserProfile(tempProfile)
        setLoading(false)
        return tempProfile
      }

      setUserProfile(functionData.data)
      setLoading(false)
      return functionData.data
    } catch (error) {
      console.error('Error creating user profile fallback:', error)
      // Create a temporary profile object for the session
      const tempProfile = {
        id: userId,
        email: email || '',
        full_name: fullName || 'User',
        role: 'member',
        status: 'approved'
      }
      setUserProfile(tempProfile)
      setLoading(false)
      return tempProfile
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) throw error

    if (data.user) {
      // Try to create user profile with fallback handling
      try {
        await createUserProfileFallback(data.user.id, fullName, email)
      } catch (profileError) {
        console.error('Profile creation failed, but user was created:', profileError)
        // Don't throw error here - user can still sign in and profile will be created later
      }
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    
    // Profile will be fetched automatically via the auth state change listener
    return result
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = userProfile?.role === 'admin'

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}