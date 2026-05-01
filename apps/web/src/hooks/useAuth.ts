"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AuthService, type AuthUser } from "@/services/auth.service"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial load
    const loadUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        setError("Failed to load user")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Listen for auth state changes (session expiry, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string } } | null) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null)
        } else if (session?.user) {
          // Refresh user data when session changes
          const currentUser = await AuthService.getCurrentUser()
          setUser(currentUser)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading, error }
}
