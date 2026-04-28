"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  MapPin, 
  Calendar, 
  User, 
  LogOut, 
  Search, 
  Bell,
  BookOpen,
  Loader2,
  AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthService, syncSessionToCookies, type AuthUser } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/find-seat", label: "Find Seat", icon: MapPin },
  { href: "/reservations", label: "My Reservations", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async (retryCount = 0) => {
      try {
        setIsLoading(true)
        setLoadError(null)
        
        // Sync session from localStorage to cookies (CRITICAL for middleware)
        const synced = syncSessionToCookies()
        console.log("DEBUG: Layout session sync:", synced)
        
        // Longer delay for session propagation after login (1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const currentUser = await AuthService.getCurrentUser()
        
        if (!currentUser) {
          // Retry up to 2 times before giving up
          if (retryCount < 2) {
            console.log(`DEBUG: No user found, retrying... (${retryCount + 1}/2)`)
            setIsLoading(false)
            setTimeout(() => loadUser(retryCount + 1), 1000)
            return
          }
          
          // Clear stale cookies before redirecting
          document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          
          // Only redirect if we're not already on a public route
          const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]
          if (!publicPaths.some(path => pathname.startsWith(path))) {
            router.push("/login")
          }
          setIsLoading(false)
          return
        }
        
        console.log("DEBUG: StudentLayout loaded user:", currentUser.id)
        console.log("DEBUG: User loaded successfully")
        setUser(currentUser)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load user:", error)
        setLoadError("Failed to load account. Please try again.")
        setIsLoading(false)
      }
    }
    loadUser()
  }, [router, pathname])

  const handleRetry = () => {
    window.location.reload()
  }

  const handleSignOut = async () => {
    const { error } = await AuthService.signOut()
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      return
    }
    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <p className="text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Setup Issue</h2>
          <p className="text-gray-500 mb-4">{loadError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} className="bg-[#10B981] hover:bg-[#059669]">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Return loading state instead of null to prevent layout flash
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block">E-Library Space</span>
              <span className="text-xs text-gray-500">ELSMS</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#10B981]/10 text-[#10B981] font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search for zones, seats, or help..."
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#F43F5E] rounded-full" />
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.matricNumber || user.email}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-[#10B981]/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#10B981]" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
