"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  MapPin,
  Armchair,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Library,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  Mail,
  Shield,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AuthService, type AuthUser } from "@/services/auth.service"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Zones", href: "/admin/zones", icon: MapPin },
  { name: "Seats", href: "/admin/seats", icon: Armchair },
  { name: "Reservations", href: "/admin/reservations", icon: CalendarDays },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        
        if (!currentUser) {
          router.push("/login")
          return
        }
        
        if (currentUser.role !== "ADMIN") {
          router.push("/dashboard")
          return
        }
        
        setUser(currentUser)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await AuthService.signOut()
    document.cookie = "user-role=; path=/; max-age=0"
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white border-r border-slate-200 fixed h-full flex flex-col z-40"
      >
        
        {/* Branding */}
        <div className={cn(
          "border-b border-slate-100 flex items-center relative",
          isCollapsed ? "p-4 justify-center" : "p-6"
        )}>
          <Link href="/admin/dashboard" className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Library className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="font-bold text-slate-900 text-lg leading-tight">E-Library Space</h1>
                  <p className="text-xs text-slate-500 font-bold">ELSMS</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
            className="absolute top-1/2 -translate-y-1/2 -right-3 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors z-50"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Menu Label */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-6 pt-6 pb-2"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center py-5 px-3" : "gap-3 px-4 py-5",
                  isActive
                    ? "bg-[#10B981]/10 text-[#10B981]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-[3px] h-8 bg-[#10B981] rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "w-5 h-5 shrink-0",
                  isActive ? "text-[#10B981]" : "text-slate-400"
                )} />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className={cn(
              "flex items-center justify-center rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 w-full",
              isCollapsed ? "justify-center py-5 px-3" : "gap-5 px-4 py-5"
            )}
          >
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
             <LogOut className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        {/* TopBar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="h-16 px-8 flex items-center justify-between">
            {/* Search - aligned with main content */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search for zones, seats, users..."
                  className="pl-10 pr-4 py-2 w-full bg-slate-50 border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>

              {/* User Dropdown - Profile Card Only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900">{user.email?.split("@")[0] || "Admin"}</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                      {user.email?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0">
                  {/* Profile Card Only */}
                  <div className="p-4 bg-gradient-to-br from-[#10B981]/5 to-[#10B981]/10">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {user.email?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.email?.split("@")[0] || "Admin User"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Shield className="w-3 h-3 text-[#10B981]" />
                          <span>Administrator</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-1">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-10 bg-slate-50 min-h-[calc(100vh-64px)]">{children}</main>
      </motion.div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
