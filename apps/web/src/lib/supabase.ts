import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client for SSR/build time when env vars aren't available
const createDummyClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Not configured' } }),
      signUp: async () => ({ data: null, error: { message: 'Not configured' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: null, error: { message: 'Not configured' } }),
      insert: () => ({ error: { message: 'Not configured' } }),
      upsert: () => ({ error: { message: 'Not configured' } }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  } as any;
};

// Configure Supabase client with explicit auth settings for cookie persistence
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars missing, using dummy client')
    return createDummyClient();
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-session',
    },
  });
};

export const supabase = createSupabaseClient();
