"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
  AlertCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Inbox
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AuthService, syncSessionToCookies, type AuthUser } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/find-seat", label: "Find Seat", icon: MapPin },
  { href: "/my-reservations", label: "My Reservations", icon: Calendar },
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
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) setIsCollapsed(saved === "true")
  }, [])

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed.toString())
  }, [isCollapsed])

  useEffect(() => {
    const loadUser = async (retryCount = 0) => {
      try {
        setIsLoading(true)
        setLoadError(null)
        syncSessionToCookies()
        await new Promise(resolve => setTimeout(resolve, 1500))
        const currentUser = await AuthService.getCurrentUser()
        
        if (!currentUser) {
          if (retryCount < 2) {
            setIsLoading(false)
            setTimeout(() => loadUser(retryCount + 1), 1000)
            return
          }
          document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]
          if (!publicPaths.some(path => pathname.startsWith(path))) {
            router.push("/login")
          }
          setIsLoading(false)
          return
        }
        setUser(currentUser)
        setIsLoading(false)
      } catch (error) {
        setLoadError("Failed to load account. Please try again.")
        setIsLoading(false)
      }
    }
    loadUser()
  }, [router, pathname])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const { error } = await AuthService.signOut()
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error })
      setIsSigningOut(false)
      return
    }
    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Account Setup Issue</h2>
          <p className="text-slate-500 mb-4">{loadError}</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-500 hover:bg-emerald-600">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const sidebarWidth = isCollapsed ? "w-20" : "w-64"
  const mainMargin = isCollapsed ? "ml-20" : "ml-64"

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`bg-white border-r border-slate-200 fixed h-full flex flex-col z-50 hidden lg:flex`}
      >
        {/* Logo */}
        <div className={`p-6 border-b border-slate-100 ${isCollapsed ? "px-4" : ""}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="font-black text-slate-900 block text-xl tracking-tight">E-Library Space</span>
                <span className="text-xs font-bold text-emerald-600 tracking-wider">ELSMS</span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-3 space-y-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 relative overflow-hidden
                  ${isCollapsed ? "justify-center px-2" : ""}
                  ${isActive 
                    ? "bg-gradient-to-r from-emerald-50/50 to-transparent text-emerald-600 font-semibold border-l-[3px] border-emerald-500" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-transparent"
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : ""}`} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t border-slate-100 ${isCollapsed ? "px-2" : ""}`}>
          <Button
            variant="ghost"
            className={`w-full gap-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all ${
              isCollapsed ? "justify-center px-2" : "justify-start"
            }`}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 lg:hidden"
          >
            {/* Mobile Logo */}
            <div className="p-6 border-b border-slate-100">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-xl tracking-tight">E-Library</span>
                  <span className="text-xs font-bold text-emerald-600 tracking-wider">ELSMS</span>
                </div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-8 px-3 space-y-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200
                      ${isActive 
                        ? "bg-gradient-to-r from-emerald-50/50 to-transparent text-emerald-600 font-semibold border-l-[3px] border-emerald-500" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Logout */}
            <div className="p-4 border-t border-slate-100">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Notifications</h2>
              <p className="text-slate-500">No new notifications. You're all caught up!</p>
              <Button 
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                onClick={() => setShowNotificationModal(false)}
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Logout</h2>
              <p className="text-slate-500 mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)} disabled={isSigningOut}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Out"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div 
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 min-w-0"
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="h-20 flex items-center justify-between px-4 lg:px-8">
            {/* Left: Mobile Menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </Button>

              {/* Search - Aligned with page content */}
              <div className="relative max-w-xl w-full lg:ml-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search for zones, seats, or help..."
                  className="pl-10 bg-slate-50 border-slate-200 h-11 w-full"
                />
              </div>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-3 pl-4 pr-28">
              {/* Notification Bell with Circular Border */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all p-2 h-10 w-10"
                onClick={() => setShowNotificationModal(true)}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </Button>

              {/* User Profile Cluster */}
              <div className="flex items-center gap-6 pl-8 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-slate-900 font-medium">{user.email}</p>
                  <Badge className="bg-emerald-500 text-white text-[10px] font-medium px-2 py-0 mt-0.5">
                    Student
                  </Badge>
                </div>
                {/* Real Avatar Image */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-100">
                  <Image
                    src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email || user.id}`}
                    alt="Profile"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </motion.div>
    </div>
  )
}
