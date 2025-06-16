import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Profile {
  id: string
  name: string
  email: string
  calendar_connected: boolean
  calendar_type?: 'google' | 'apple'
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await createProfile()
      } else if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user || !isSupabaseConfigured) return

    const newProfile = {
      id: user.id,
      name: user.user_metadata?.name || '',
      email: user.email || '',
      calendar_connected: false
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
    } else {
      setProfile(data)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return { error }
    }

    setProfile(data)
    return { data, error: null }
  }

  return {
    profile,
    loading,
    updateProfile,
    isConfigured: isSupabaseConfigured
  }
}