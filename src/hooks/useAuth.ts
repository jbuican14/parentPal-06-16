import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please connect to Supabase first.' } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please connect to Supabase first.' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    try {
      // Clear all local storage data
      localStorage.clear()
      
      // Clear session storage data
      sessionStorage.clear()
      
      // Clear any cached data in memory
      setUser(null)
      
      if (isSupabaseConfigured) {
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Error signing out from Supabase:', error)
          return { error }
        }
      }
      
      // Force a page reload to clear any remaining state
      // and prevent back-button access to protected routes
      window.location.href = '/'
      
      return { error: null }
    } catch (error: any) {
      console.error('Error during sign out:', error)
      return { error: { message: error.message || 'Failed to sign out' } }
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isConfigured: isSupabaseConfigured
  }
}