import { createServerComponentClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

interface AuthenticatedUser {
  id: string
  email: string
  role: string
  fullName?: string
  matricNumber?: string
}

interface RouteHandlerContext {
  user: AuthenticatedUser | null
  request: NextRequest
}

export function createRouteHandlerClient(
  handler: (request: NextRequest, context: RouteHandlerContext) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      // Get user session from Supabase
      const supabase = await createServerComponentClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('No authenticated user found:', error)
        return handler(request, { user: null, request })
      }

      // Get user profile data including role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, fullName, matricNumber')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        return handler(request, { user: null, request })
      }

      const authenticatedUser: AuthenticatedUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        matricNumber: profile.matricNumber
      }

      console.log('Authenticated user:', {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      })

      return handler(request, { user: authenticatedUser, request })

    } catch (error) {
      console.error('Route handler authentication error:', error)
      return handler(request, { user: null, request })
    }
  }
}

export function createAdminRouteHandler(
  handler: (request: NextRequest, context: RouteHandlerContext) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      // Get user session from Supabase
      const supabase = await createServerComponentClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('No authenticated user found:', error)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Get user profile data including role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, fullName, matricNumber')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        return new Response(JSON.stringify({ error: 'User profile not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Admin-only guardrail
      if (profile.role !== 'ADMIN') {
        console.log('Unauthorized admin access attempt:', {
          userId: profile.id,
          userRole: profile.role
        })
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const authenticatedUser: AuthenticatedUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        matricNumber: profile.matricNumber
      }

      console.log('Admin authenticated:', {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      })

      return handler(request, { user: authenticatedUser, request })

    } catch (error) {
      console.error('Admin route handler authentication error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

export function createStudentRouteHandler(
  handler: (request: NextRequest, context: RouteHandlerContext) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      // Get user session from Supabase
      const supabase = await createServerComponentClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('No authenticated user found:', error)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Get user profile data including role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, fullName, matricNumber')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        return new Response(JSON.stringify({ error: 'User profile not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Student-only guardrail
      if (profile.role !== 'STUDENT') {
        console.log('Unauthorized student access attempt:', {
          userId: profile.id,
          userRole: profile.role
        })
        return new Response(JSON.stringify({ error: 'Student access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const authenticatedUser: AuthenticatedUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        matricNumber: profile.matricNumber
      }

      console.log('Student authenticated:', {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      })

      return handler(request, { user: authenticatedUser, request })

    } catch (error) {
      console.error('Student route handler authentication error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
