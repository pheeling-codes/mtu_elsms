/**
 * Utility to clear stale authentication data
 * Run this in browser console: clearStaleAuth()
 */

export function clearStaleAuth(): void {
  // Clear all sb- prefixed cookies (Supabase session cookies)
  const cookiesToClear = [
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
    "user-role",
  ]

  // Get all cookies and find any sb- prefixed ones
  const allCookies = document.cookie.split(";")
  const supabaseCookies = allCookies
    .map(c => c.trim().split("=")[0])
    .filter(name => name.startsWith("sb-") || name.includes("auth"))

  // Combine standard and discovered cookies
  const allToClear = [...new Set([...cookiesToClear, ...supabaseCookies])]

  // Clear each cookie
  allToClear.forEach(name => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`
  })

  // Clear localStorage
  const localKeys = Object.keys(localStorage).filter(
    key => key.startsWith("sb-") || key.includes("supabase")
  )
  localKeys.forEach(key => {
    localStorage.removeItem(key)
  })

  // Clear sessionStorage
  const sessionKeys = Object.keys(sessionStorage).filter(
    key => key.startsWith("sb-") || key.includes("supabase")
  )
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key)
  })
}

// Expose for debugging if needed
if (typeof window !== "undefined") {
  // @ts-expect-error - exposing for debugging
  window.clearStaleAuth = clearStaleAuth
}
