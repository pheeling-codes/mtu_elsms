"use client"

import { useEffect, useState } from "react"
import {
  User,
  Mail,
  Shield,
  Clock,
  Moon,
  Sun,
  Monitor,
  Bell,
  LogOut,
  AlertTriangle,
  Trash2,
  UserX,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  openingTime: string
  closingTime: string
  checkInGracePeriod: number
  maxReservationDuration: number
  systemAlertEmails: boolean
}

interface AdminProfile {
  id: string
  name: string
  email: string
  role: string
  employeeId: string
}

type ThemeMode = "light" | "dark" | "system"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  
  const [settings, setSettings] = useState<SystemSettings>({
    openingTime: "08:00",
    closingTime: "22:00",
    checkInGracePeriod: 15,
    maxReservationDuration: 4,
    systemAlertEmails: true,
  })
  
  const [theme, setTheme] = useState<ThemeMode>("system")
  
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  useEffect(() => {
    fetchAdminData()
    fetchSettings()
  }, [])

  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("matricNumber, role")
          .eq("id", user.id)
          .single()
        
        setAdminProfile({
          id: user.id,
          name: userData?.matricNumber || "Administrator",
          email: user.email || "",
          role: userData?.role || "ADMIN",
          employeeId: `EMP-${user.id.slice(0, 8).toUpperCase()}`,
        })
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single()
      
      if (data && !error) {
        setSettings({
          openingTime: data.openingTime || "08:00",
          closingTime: data.closingTime || "22:00",
          checkInGracePeriod: data.checkInGracePeriod || 15,
          maxReservationDuration: data.maxReservationDuration || 4,
          systemAlertEmails: data.systemAlertEmails ?? true,
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          id: 1,
          ...settings,
          updatedAt: new Date().toISOString(),
        })
      
      if (error) throw error
      
      toast({
        title: "Settings Saved",
        description: "System configuration updated successfully.",
        className: "bg-emerald-600 text-white",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const handleDeleteAllData = async () => {
    if (confirmText !== "RESET") {
      toast({
        title: "Error",
        description: "Please type RESET to confirm.",
        variant: "destructive",
      })
      return
    }
    
    try {
      await supabase.from("reservations").delete().neq("id", "")
      await supabase.from("seats").delete().neq("id", "")
      await supabase.from("zones").delete().neq("id", "")
      
      toast({
        title: "Data Cleared",
        description: "All system data has been reset.",
        className: "bg-emerald-600 text-white",
      })
      
      setDeleteDataDialogOpen(false)
      setConfirmText("")
    } catch (error) {
      console.error("Error deleting data:", error)
      toast({
        title: "Error",
        description: "Failed to delete data.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type DELETE to confirm.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(adminProfile?.id || "")
      if (error) throw error
      
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} mode.`,
    })
  }

  if (isLoading) {
    return (
      <div className="p-10 bg-white min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="w-28 h-28 rounded-full" />
            <Skeleton className="w-48 h-8" />
            <div className="flex gap-3">
              <Skeleton className="w-32 h-10 rounded-full" />
              <Skeleton className="w-40 h-10 rounded-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Identity Header */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
              <User className="w-14 h-14 text-slate-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-950 tracking-tight">
              {adminProfile?.name || "Administrator"}
            </h1>
            <p className="text-slate-500 font-medium text-lg">System Administrator</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-4 py-2.5 text-sm rounded-full bg-slate-100 text-slate-700 border-slate-200 font-medium">
              <Mail className="w-4 h-4 mr-2 text-slate-500" />
              {adminProfile?.email || "admin@institution.edu"}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2.5 text-sm rounded-full bg-slate-100 text-slate-700 border-slate-200 font-medium">
              <User className="w-4 h-4 mr-2 text-slate-500" />
              {adminProfile?.employeeId || "EMP-001"}
            </Badge>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="space-y-8">
          {/* Section Header */}
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Operational Settings</h2>
            <p className="text-slate-500 mt-1">Configure the core logic of the library system</p>
          </div>

          {/* Library Operations Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">Library Operations</h3>
                <p className="text-sm text-slate-500">Define daily operating hours</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="openingTime" className="text-slate-700 font-medium">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="closingTime" className="text-slate-700 font-medium">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Access Rules Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">Access Rules</h3>
                <p className="text-sm text-slate-500">Control reservation behavior</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="maxDuration" className="text-slate-700 font-medium">Maximum Reservation Duration</Label>
                <Select
                  value={settings.maxReservationDuration.toString()}
                  onValueChange={(value) => setSettings({ ...settings, maxReservationDuration: parseInt(value) })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Hours</SelectItem>
                    <SelectItem value="3">3 Hours</SelectItem>
                    <SelectItem value="4">4 Hours</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="8">8 Hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Maximum time a student can book per session</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="gracePeriod" className="text-slate-700 font-medium">Check-in Grace Period</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="gracePeriod"
                    type="number"
                    min={5}
                    max={60}
                    value={settings.checkInGracePeriod}
                    onChange={(e) => setSettings({ ...settings, checkInGracePeriod: parseInt(e.target.value) })}
                    className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span className="text-slate-500 font-medium whitespace-nowrap">minutes</span>
                </div>
                <p className="text-xs text-slate-400">How long a seat stays reserved before returning to the public pool</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Global Preferences */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Global Preferences</h2>
            <p className="text-slate-500 mt-1">Customize your system experience</p>
          </div>

          {/* System Appearance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">System Appearance</h3>
                <p className="text-sm text-slate-500">Choose your preferred theme</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                  theme === "light" 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Sun className={cn("w-8 h-8", theme === "light" ? "text-emerald-600" : "text-slate-400")} />
                <span className={cn("font-medium", theme === "light" ? "text-emerald-700" : "text-slate-600")}>Light</span>
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                  theme === "dark" 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Moon className={cn("w-8 h-8", theme === "dark" ? "text-emerald-600" : "text-slate-400")} />
                <span className={cn("font-medium", theme === "dark" ? "text-emerald-700" : "text-slate-600")}>Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                  theme === "system" 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Monitor className={cn("w-8 h-8", theme === "system" ? "text-emerald-600" : "text-slate-400")} />
                <span className={cn("font-medium", theme === "system" ? "text-emerald-700" : "text-slate-600")}>System</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">Global System Alerts</h3>
                  <p className="text-sm text-slate-500">Receive notifications for critical events</p>
                </div>
              </div>
              <Switch
                checked={settings.systemAlertEmails}
                onCheckedChange={(checked) => setSettings({ ...settings, systemAlertEmails: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Account Management */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Account Management</h2>
            <p className="text-slate-500 mt-1">Manage your session and account</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">End Session</h3>
                  <p className="text-sm text-slate-500">Sign out of your administrator account</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLogoutDialogOpen(true)}
                className="h-12 px-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-rose-200" />

        {/* Danger Zone */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-rose-500/80 mt-1">Irreversible actions that affect system data</p>
          </div>

          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rose-900">Reset System Data</h3>
                    <p className="text-sm text-rose-600">Delete all zones, seats, and reservations</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDataDialogOpen(true)}
                  className="h-12 px-6 rounded-xl text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Data
                </Button>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                    <UserX className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rose-900">Delete Account</h3>
                    <p className="text-sm text-rose-600">Permanently remove your administrator account</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteAccountDialogOpen(true)}
                  className="h-12 px-6 rounded-xl text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-slate-600" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to authenticate again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Data Confirmation Dialog */}
      <Dialog open={deleteDataDialogOpen} onOpenChange={setDeleteDataDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              Reset System Data
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              This will permanently delete all zones, seats, and reservations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm text-rose-800">
                Type <strong className="font-bold">RESET</strong> to confirm this action.
              </p>
            </div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET"
              className="h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDataDialogOpen(false)
                setConfirmText("")
              }}
              className="rounded-xl h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllData}
              disabled={confirmText !== "RESET"}
              className="rounded-xl h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
            >
              Reset Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <UserX className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              This will permanently delete your administrator account. You will lose all access to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm text-rose-800">
                Type <strong className="font-bold">DELETE</strong> to confirm account deletion.
              </p>
            </div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="h-12 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAccountDialogOpen(false)
                setConfirmText("")
              }}
              className="rounded-xl h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE"}
              className="rounded-xl h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
