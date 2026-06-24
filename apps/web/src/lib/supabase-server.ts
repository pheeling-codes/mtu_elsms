import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const getEnvVars = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.'
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export async function createServerComponentClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // @ts-expect-error - Expected error when passing cookies without @supabase/ssr
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}

export async function createServerActionClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // @ts-expect-error - Expected error when passing cookies without @supabase/ssr
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}
