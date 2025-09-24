import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase configuration (same as Flutter app)
const supabaseUrl = 'https://iogxtdeurvperjzrjhsl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ3h0ZGV1cnZwZXJqenJqaHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTYwMDQsImV4cCI6MjA3NDE5MjAwNH0.7PVljydJ2787rg7ZOSOFGYaOjLr_XPuWWOVWpyTQlso';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types for our MVP
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  alias?: string;
  created_at: string;
  user_id: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  quantity: number;
  logged_at: string;
  user_id: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
}
