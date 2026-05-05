"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Bell,
  Settings,
  BookOpen,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { AuthService, type AuthUser } from "@/services/auth.service"
import { useAuth } from "@/hooks/useAuth"
import { DashboardSkeleton } from "@/components/ui/skeleton-dashboard"
import { toast } from "@/lib/toast-utils"
import { useRealtime } from "@/hooks/useRealtime"

interface SeatStats {
  available: number
  occupied: number
  reserved: number
  total: number
}

interface ActiveReservation {
  id: string
  seatId: string
  zone: string
  startTime: string
  endTime: string
  features: string[]
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<SeatStats>({ available: 0, occupied: 0, reserved: 0, total: 0 })
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [dataError, setDataError] = useState<string | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  const fetchStats = useCallback(async () => {
    setIsDataLoading(true)
    try {
      // Fetch current user
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)

        // Fetch seat stats
        await fetchSeatStats()
        
        // Fetch active reservation (demo for now)
        setActiveReservation({
          id: "res-001",
          seatId: "A-12",
          zone: "Quiet Zone - Floor 2",
          startTime: "2024-01-15T09:00:00",
          endTime: "2024-01-15T12:00:00",
          features: ["Power Outlet", "Window View", "WiFi"]
        })
      } catch (err) {
        setDataError("Failed to load dashboard data")
      } finally {
        setIsDataLoading(false)
      }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Real-time stats fetching
  const fetchSeatStats = async () => {
    try {
      // Fetch system-wide available seats
      const { data: seats, error: seatsError } = await supabase.from("seats").select("status")
      if (seatsError) throw seatsError
      
      let available = 0
      if (seats) {
        available = seats.filter((s: { status: string }) => s.status === "AVAILABLE").length
      }

      // Fetch user-specific stats (fallback to demo data for now)
      // TODO: Replace with actual reservation history queries
      const userTotalOccupied = 12  // Demo: total seats user has occupied in history
      const userReserved = 3        // Demo: current reservations by user

      setStats({
        available,
        occupied: userTotalOccupied,
        reserved: userReserved,
        total: seats?.length || 255,
      })
    } catch (err) {
      // Fallback to demo data if fetch fails
      setStats({ available: 142, occupied: 12, reserved: 3, total: 255 })
    }
  }

  // Timer for active reservation
  useEffect(() => {
    if (!activeReservation) return
    const updateTimer = () => {
      const end = new Date(activeReservation.endTime)
      const now = new Date()
      const diff = end.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeRemaining("Expired")
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeRemaining(`${hours}h ${minutes}m`)
    }
    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [activeReservation])

  // Real-time subscription to seats table
  useRealtime({
    table: "seats",
    event: "*",
    onChange: () => {
      // Refresh stats when seats change
      fetchStats()
    },
  })

  // Real-time subscription to reservations table
  useRealtime({
    table: "reservations",
    event: "*",
    filter: user?.id ? `userId=eq.${user.id}` : undefined,
    onChange: () => {
      // Refresh stats and active reservation when user's reservations change
      fetchStats()
    },
  })

  if (isDataLoading) {
    return <DashboardSkeleton />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Premium Greeting Header - Matric Number Based */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Hello
            </h1>
            <span className="text-xm font-bold text-slate-900 ">
              {user?.matricNumber || "Student"} 
            </span>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-slate-500 mt-1">
            Welcome to your e-library space management dashboard
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-200">
            {(user?.matricNumber?.substring(0, 2) || "ST")}
          </div>
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Available Seats</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Ready to book
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Seats Occupied</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.occupied}</p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-50">
                Your usage history
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Your Reservations</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.reserved}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                Active bookings
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Reservation */}
      {activeReservation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-md border-0 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Active Reservation</h3>
                    <p className="text-sm text-slate-500">Your current study session</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Seat Number</p>
                  <p className="text-2xl font-bold text-slate-900">{activeReservation.seatId}</p>
                  <p className="text-sm text-slate-500">{activeReservation.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Time Remaining</p>
                  <p className="text-2xl font-bold text-emerald-600">{timeRemaining}</p>
                  <p className="text-sm text-slate-500">Until 12:00 PM</p>
                </div>
                <div className="flex items-end">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white w-full">
                    Check In Now
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {activeReservation.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="bg-white">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Reservation</h3>
            <p className="text-slate-500 mb-4">Find and reserve a seat to get started.</p>
            <Link href="/find-seat">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <MapPin className="w-4 h-4 mr-2" />
                Find a Seat
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <p className="text-slate-500 text-sm mb-4">Shortcuts to common tasks</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/find-seat">
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Library Map</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                    <Settings className="w-6 h-6 text-slate-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Profile/Settings</h3>
                <p className="text-sm text-slate-500">Manage your account and preferences</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
