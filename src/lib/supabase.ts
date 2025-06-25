import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcaibguxsmwzihehhhar.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYWliZ3V4c213emloZWhoaGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODEzNTksImV4cCI6MjA2NTc1NzM1OX0.xnzUul9yhfXxV4dICYdwy5TpbE2OIgj8NB0AUnw3gO4'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          minister_name: string
          minister_phone?: string
          contact_phone: string
          sunday_service_time?: string
          photo_url?: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          minister_name: string
          minister_phone?: string
          contact_phone: string
          sunday_service_time?: string
          photo_url?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          minister_name?: string
          minister_phone?: string
          contact_phone?: string
          sunday_service_time?: string
          photo_url?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'member' | 'admin'
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'member' | 'admin'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'member' | 'admin'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}