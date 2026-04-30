"use client"

import { supabase } from "@/lib/supabase"
import type { Role } from "@elsms/types"

// Helper to sync Supabase session from localStorage to cookies (for middleware detection)
export function syncSessionToCookies(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Get session from localStorage (where Supabase stores it by default)
    const sessionKey = 'sb-session'
    const sessionData = localStorage.getItem(sessionKey)
    
    if (!sessionData) {
      return false
    }
    
    const session = JSON.parse(sessionData)
    const accessToken = session.access_token
    const refreshToken = session.refresh_token
    
    if (!accessToken) {
      return false
    }
    
    // Set cookies that middleware can detect
    const maxAge = 60 * 60 * 24 * 7 // 7 days
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`
    
    if (refreshToken) {
      document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=${maxAge}; SameSite=Lax`
    }
    
    return true
  } catch (err) {
    return false
  }
}

export interface SignInCredentials {
  identifier: string
  password: string
  role: Role
}

export interface SignUpData {
  email: string
  password: string
  matricNumber?: string
  role: Role
}

export interface AuthUser {
  id: string
  email: string
  role: Role
  matricNumber?: string
  avatarUrl?: string
}

export class AuthService {
  static async signIn({ identifier, password, role }: SignInCredentials): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const isEmail = identifier.includes("@")
      let email = identifier
      let matricNumber: string | undefined

      // If using matric number, lookup email first
      if (!isEmail && role === "STUDENT") {
        matricNumber = identifier
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, matricNumber, role")
          .eq("matricNumber", identifier)
          .single()

        if (userError || !userData) {
          return { user: null, error: "Invalid matric number or account not found" }
        }

        if (userData.role !== role) {
          return { user: null, error: `This account is registered as a ${userData.role.toLowerCase()}` }
        }

        email = userData.email
      }

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data || !data.user) {
        return { user: null, error: "Authentication failed" }
      }

      // Fetch user role from database
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id, role, matricNumber")
        .eq("id", data.user.id)
        .single()

      // If user record not found (trigger failed), create it now
      if (userError || !userRecord) {
        // User is authenticated now, so this should work with RLS
        const userRole = (data.user.user_metadata?.role as Role) || "STUDENT"
        const userMatric = data.user.user_metadata?.matricNumber as string
        
        // Try to create the user record
        const now = new Date().toISOString()
        const { error: createError } = await supabase.from("users").insert({
          id: data.user.id,
          matricNumber: userMatric || 'TEMP-' + data.user.id.substring(0, 8),
          role: userRole,
          createdAt: now,
          updatedAt: now,
        })
        
        if (createError) {
          // Return user-friendly error for profile not found
          return { user: null, error: "Profile not found. Please contact an administrator." }
        }
        
        // Return user with metadata from auth
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            role: userRole,
            matricNumber: userMatric,
          }
        }
      }

      if (userRecord.role !== role) {
        return { user: null, error: `Please select ${userRecord.role.toLowerCase()} login` }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userRecord.role as Role,
          matricNumber: userRecord.matricNumber,
        }
      }
    } catch (err) {
      return { user: null, error: "An unexpected error occurred" }
    }
  }

  static async signUp({ email, password, matricNumber, role }: SignUpData): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      if (role === "STUDENT" && !matricNumber) {
        return { user: null, error: "Matric number is required for students" }
      }

      // Pre-check: Verify matricNumber is unique before attempting signup
      if (matricNumber) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id, matricNumber")
          .eq("matricNumber", matricNumber)
          .single()

        if (existingUser) {
          return { user: null, error: "This Matric Number is already registered." }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            matricNumber,
          }
        }
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: "Registration failed" }
      }

      // Manual sync: Create user record if trigger failed
      // User is authenticated now, so this should work with RLS
      const { error: syncError } = await supabase.from("users").upsert({
        id: data.user.id,
        matricNumber: matricNumber || 'TEMP-' + data.user.id.substring(0, 8),
        role: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'id' })

      if (syncError) {
        console.warn("User sync warning (trigger may have failed):", syncError.message)
        // Continue anyway - auth user was created
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role,
          matricNumber,
        }
      }
    } catch (err) {
      return { user: null, error: "An unexpected error occurred" }
    }
  }

  static async signOut(): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signOut()
    return { error: error?.message }
  }

  static async resetPassword(email: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message }
  }

  static async updatePassword(newPassword: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error: error?.message }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    try {
      // Try with avatarUrl column (may not exist yet in DB)
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("role, matricNumber, avatarUrl")
        .eq("id", user.id)
        .single()

      if (error) {
        // If avatarUrl column doesn't exist, try without it
        if (error.message?.includes("avatarUrl") || error.message?.includes("column")) {
          const { data: basicRecord } = await supabase
            .from("users")
            .select("role, matricNumber")
            .eq("id", user.id)
            .single()
          
          return {
            id: user.id,
            email: user.email!,
            role: (basicRecord?.role as Role) || "STUDENT",
            matricNumber: basicRecord?.matricNumber,
          }
        }
        throw error
      }

      return {
        id: user.id,
        email: user.email!,
        role: (userRecord?.role as Role) || "STUDENT",
        matricNumber: userRecord?.matricNumber,
        avatarUrl: userRecord?.avatarUrl,
      }
    } catch (error) {
      console.error("getCurrentUser error:", error)
      // Return basic user info even if DB query fails
      return {
        id: user.id,
        email: user.email!,
        role: "STUDENT",
      }
    }
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}
