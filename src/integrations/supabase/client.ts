
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xmnpfnrndmwxnzkmcqkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbnBmbnJuZG13eG56a21jcWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzYwMDAsImV4cCI6MjA1NTI1MjAwMH0.C5qk1VmGUysVT4isiK4SiBBQ0IjE4fQMGh6C_r1mKBw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  headers: {
    'Content-Type': 'application/json',
  }
});

export type SupabaseClient = typeof supabase;
