
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xmnpfnrndmwxnzkmcqkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbnBmbnJuZG13eG56a21jcWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzYwMDAsImV4cCI6MjA1NTI1MjAwMH0.C5qk1VmGUysVT4isiK4SiBBQ0IjE4fQMGh6C_r1mKBw";

// Configurar el cliente con opciones optimizadas
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Mantener la sesión entre recargas
    autoRefreshToken: true, // Refrescar automáticamente el token
    detectSessionInUrl: true // Detectar la sesión en la URL
  },
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name',
    },
  },
  db: {
    schema: 'public'
  },
  // Configuración específica para funciones edge
  edgeFunction: {
    retry: {
      count: 3, // Intentar hasta 3 veces
      initialDelay: 100, // Esperar 100ms antes del primer reintento
    }
  }
});

// Exportar una versión tipada del cliente
export type SupabaseClient = typeof supabase;
