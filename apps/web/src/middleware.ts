import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

// Paths that should be excluded from middleware (static files, api, _next)
const EXCLUDED_PATHS = [
  "/_next",
  "/api",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for excluded paths (static files, internal Next.js routes)
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Check for Supabase session - look for various cookie patterns
  const hasSession = checkForSession(request)
  const userRole = request.cookies.get("user-role")?.value
  

  // If accessing auth pages while logged in, redirect to appropriate dashboard
  // BUT only if the session is actually valid (has both session AND role)
  if (isPublicRoute && hasSession && userRole) {
    // Prevent redirect loops by checking if we're already navigating
    const isNavigating = request.headers.get("sec-fetch-mode") === "navigate"
    
    // Only redirect if we have a valid role cookie (indicates successful login)
    if (isNavigating) {
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Protected routes require authentication
  // BUT: If session exists but role is missing, don't redirect (let client-side handle it)
  // This prevents redirect loops during the login cookie propagation phase
  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Special case: Session exists but no role cookie yet (login in progress)
  // Allow access to protected routes, the layout will handle role validation
  if (!isPublicRoute && hasSession && !userRole) {
    // Add a header to indicate we're in a transition state
    const response = NextResponse.next()
    response.headers.set("x-auth-transition", "true")
    return response
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

// Helper function to check for Supabase session in various cookie formats
// This checks for all possible Supabase auth cookie patterns
function checkForSession(request: NextRequest): boolean {
  const cookies = request.cookies
  const allCookies = cookies.getAll()
  
  // Check for all Supabase-related cookie patterns
  const supabasePatterns = [
    "sb-access-token",
    "sb-refresh-token", 
    "supabase-auth-token",
    "sb-", // Any cookie starting with sb-
  ]
  
  for (const cookie of allCookies) {
    const name = cookie.name.toLowerCase()
    
    // Check for exact matches
    if (supabasePatterns.slice(0, 3).includes(name)) {
      return true
    }
    
    // Check for project-specific Supabase cookies
    // Patterns: sb-<project-ref>-auth-token, sb-<ref>-access-token, etc.
    if (name.startsWith("sb-") && (name.includes("auth") || name.includes("access") || name.includes("refresh"))) {
      return true
    }
  }
  
  return false
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
