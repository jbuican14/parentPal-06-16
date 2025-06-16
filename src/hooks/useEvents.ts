import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface FamilyEvent {
  id: string
  title: string
  description?: string
  date: string
  time: string
  location: string
  attendees: string[]
  type: 'school' | 'personal' | 'medical' | 'sports'
  has_conflict?: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export function useEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    fetchEvents()
  }, [user])

  const fetchEvents = async () => {
    if (!user || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('family_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching events:', error)
      } else {
        setEvents(data || [])
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEvent = async (eventData: Omit<FamilyEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('family_events')
      .insert([{ ...eventData, user_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error('Error adding event:', error)
      return { error }
    }

    setEvents(prev => [...prev, data])
    return { data, error: null }
  }

  const updateEvent = async (eventId: string, updates: Partial<FamilyEvent>) => {
    if (!user || !isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('family_events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return { error }
    }

    setEvents(prev => prev.map(event => event.id === eventId ? data : event))
    return { data, error: null }
  }

  const deleteEvent = async (eventId: string) => {
    if (!user || !isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { error } = await supabase
      .from('family_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting event:', error)
      return { error }
    }

    setEvents(prev => prev.filter(event => event.id !== eventId))
    return { error: null }
  }

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
    isConfigured: isSupabaseConfigured
  }
}