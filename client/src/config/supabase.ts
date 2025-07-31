import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
const validateSupabaseConfig = () => {
  const requiredKeys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Supabase configuration: ${missingKeys.join(', ')}. Please check your .env file.`
    );
  }
};

// Validate configuration before initializing
if (import.meta.env.PROD) {
  validateSupabaseConfig();
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export configuration for use in other parts of the app
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export default supabase;