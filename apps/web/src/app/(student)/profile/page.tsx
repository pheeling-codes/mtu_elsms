"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import {
  User,
  Mail,
  Hash,
  Clock,
  Calendar,
  Award,
  LogOut,
  Pencil,
  Camera,
  Trash2,
  AlertTriangle,
  Loader2,
  Bell,
  Moon,
  Sun,
  Monitor,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { AuthService, type AuthUser } from "@/services/auth.service"
import { supabase } from "@/lib/supabase"

// Analytics data interface
interface UserAnalytics {
  totalBookings: number
  hoursSpent: number
  noShows: number
}

interface Reservation {
  start_time: string
  end_time: string
  status: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalBookings: 0,
    hoursSpent: 0,
    noShows: 0,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Preferences state
  const [preferences, setPreferences] = useState({
    notifications: true,
    theme: "system" as "light" | "dark" | "system",
  })

  // Load user data and analytics
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)

        if (currentUser) {
          // Fetch analytics from Supabase
          const { data: reservations } = await supabase
            .from("reservations")
            .select("*")
            .eq("user_id", currentUser.id)

          if (reservations) {
            const typedReservations = reservations as Reservation[]
            const totalBookings = typedReservations.length
            const hoursSpent = typedReservations.reduce((acc: number, r: Reservation) => {
              const start = new Date(r.start_time)
              const end = new Date(r.end_time)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              return acc + hours
            }, 0)
            const noShows = typedReservations.filter((r: Reservation) => r.status === "no_show").length

            setAnalytics({
              totalBookings,
              hoursSpent: Math.round(hoursSpent),
              noShows,
            })
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Handle avatar upload with cropping
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Read file and open crop modal
    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(reader.result as string)
      setSelectedFile(file)
      setCropModalOpen(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"))
          return
        }
        resolve(blob)
      }, "image/jpeg", 0.95)
    })
  }

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image: HTMLImageElement = document.createElement("img")
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error: Event) => reject(error))
      image.src = url
    })

  const handleCropUpload = async () => {
    if (!cropImage || !croppedAreaPixels || !user) return

    setUploading(true)

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], "avatar.png", {
        type: "image/png",
      })

      // Upload via secure API route (uses service role key server-side)
      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('userId', user.id)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update user record with new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatarUrl: result.url })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update local state
      setUser({ ...user, avatarUrl: result.url })

      // Close modal
      setCropModalOpen(false)
      setCropImage(null)
      setSelectedFile(null)

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCropCancel = () => {
    setCropModalOpen(false)
    setCropImage(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle logout
  const handleLogout = async () => {
    setLogoutDialogOpen(false)
    await AuthService.signOut()
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    })
    router.push("/login")
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return

    setDeleteLoading(true)

    try {
      // Delete user data
      await supabase.from("reservations").delete().eq("user_id", user.id)
      await supabase.from("users").delete().eq("id", user.id)

      // Sign out and redirect
      await AuthService.signOut()

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })

      router.push("/signup")
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your identity, analytics, and account security.</p>
      </div>

      {/* Identity Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Avatar with Upload */}
            <div className="relative">
              <div
                className="w-28 h-28 rounded-full overflow-hidden bg-emerald-50 flex items-center justify-center cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-emerald-500" />
                )}

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {user.matricNumber || user.email.split("@")[0]}
                  </h2>
                  <p className="text-slate-500">{user.role}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 border-0 flex items-center gap-2 px-3 py-1"
                >
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  {user.matricNumber || "No Matric Number"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 border-0 flex items-center gap-2 px-3 py-1"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Bookings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalBookings}</p>
                <p className="text-sm text-slate-500">Total Bookings</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Across all library zones</p>
          </CardContent>
        </Card>

        {/* Hours Spent */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{analytics.hoursSpent}h</p>
                <p className="text-sm text-slate-500">Hours Spent</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">In all library zones</p>
          </CardContent>
        </Card>

        {/* No-Shows */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${analytics.noShows === 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                <Award className={`w-6 h-6 ${analytics.noShows === 0 ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${analytics.noShows === 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {analytics.noShows}
                </p>
                <p className="text-sm text-slate-500">No-Shows</p>
              </div>
            </div>
            <p className={`text-xs mt-4 ${analytics.noShows === 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {analytics.noShows === 0 ? "Perfect reservation puctuality" : "Misssed reservations"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-slate-600" />
            System Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Receive Notifications</p>
                <p className="text-sm text-slate-500">Get updates on your reservation status and library announcements.</p>
              </div>
            </div>
            <Switch
              checked={preferences.notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notifications: checked })
              }
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                {preferences.theme === "light" ? (
                  <Sun className="w-5 h-5 text-slate-600" />
                ) : preferences.theme === "dark" ? (
                  <Moon className="w-5 h-5 text-slate-600" />
                ) : (
                  <Monitor className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">Appearance</p>
                <p className="text-sm text-slate-500">Switch between light and dark mode.</p>
              </div>
            </div>
            <Select
              value={preferences.theme}
              onValueChange={(value: "light" | "dark" | "system") =>
                setPreferences({ ...preferences, theme: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-900">Logout</p>
              <p className="text-sm text-slate-500">Log out of your E-Library Space account on this device.</p>
            </div>
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-rose-500 border-rose-200 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-900">
                    Are you sure you want to logout?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out of your E-Library Space account on this device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setLogoutDialogOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Confirm Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Delete Account</p>
              <p className="text-sm text-slate-500">Permanently delete your account and all associated data.</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  disabled={deleteLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. It will delete all your reservation
                    history, preferences, and account data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete My Account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Crop Profile Picture Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Adjust Profile Picture</DialogTitle>
            <DialogDescription className="text-slate-500">
              Crop and adjust your profile picture before uploading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cropImage && (
              <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Zoom:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCropCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropUpload}
              disabled={uploading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Skeleton className="w-28 h-28 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-9 w-32" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-32 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
