import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  name: string;
  email: string;
  calendar_connected: boolean;
  calendar_type?: 'google' | 'apple';
  created_at: string;
  updated_at: string;
}

export interface FamilyEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  attendees: string[];
  event_type: 'school' | 'sports' | 'medical' | 'personal';
  has_conflict: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceNote {
  id: string;
  user_id: string;
  text: string;
  duration: string;
  is_processed: boolean;
  extracted_event_id?: string;
  created_at: string;
}

export interface UploadedDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: 'processing' | 'completed' | 'error';
  summary: string;
  created_at: string;
}