"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  Zap,
  ArrowRight,
  AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

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

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true)
      setDataError(null)
      
      try {
        // Fetch with 3-second timeout
        await Promise.race([
          Promise.all([fetchSeatStats(), fetchActiveReservation()]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Data fetch timeout")), 3000)
          )
        ])
      } catch (err) {
        console.error("DEBUG: Dashboard data fetch failed:", err)
        setDataError("Failed to load dashboard data. Click retry to try again.")
      } finally {
        setIsDataLoading(false)
      }
    }
    
    loadData()
  }, [])

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

  const fetchSeatStats = async () => {
    try {
      const { data: seats, error } = await supabase.from("seats").select("status")
      if (error) throw error
      if (seats) {
        const available = seats.filter((s: { status: string }) => s.status === "AVAILABLE").length
        const occupied = seats.filter((s: { status: string }) => s.status === "OCCUPIED").length
        const reserved = seats.filter((s: { status: string }) => s.status === "RESERVED").length
        setStats({
          available,
          occupied,
          reserved,
          total: seats.length,
        })
      }
    } catch (err) {
      console.error("DEBUG: fetchSeatStats error:", err)
      throw err
    }
  }

  const fetchActiveReservation = async () => {
    try {
      // Placeholder for now - would fetch from reservations table
      setActiveReservation(null)
    } catch (err) {
      console.error("DEBUG: fetchActiveReservation error:", err)
      throw err
    }
  }

  const handleRetry = () => {
    setDataError(null)
    setIsDataLoading(true)
    Promise.all([fetchSeatStats(), fetchActiveReservation()])
      .catch(err => {
        console.error("DEBUG: Retry failed:", err)
        setDataError("Still unable to load data. Please refresh the page.")
      })
      .finally(() => setIsDataLoading(false))
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening in the E-Library Space today.</p>
      </div>

      {/* Loading State */}
      {isDataLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {dataError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-rose-900 mb-2">Data Loading Failed</h3>
          <p className="text-rose-600 mb-4">{dataError}</p>
          <Button 
            onClick={handleRetry}
            className="bg-[#10B981] hover:bg-[#059669] text-white"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-[#10B981]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available Seats</CardTitle>
            <div className="w-8 h-8 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#10B981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.available}</div>
            <p className="text-xs text-gray-500 mt-1">of {stats.total} total seats</p>
            <div className="mt-2">
              <Badge variant="outline" className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">
                {Math.round((stats.available / stats.total) * 100) || 0}% availability
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#F43F5E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Occupied</CardTitle>
            <div className="w-8 h-8 bg-[#F43F5E]/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-[#F43F5E]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.occupied}</div>
            <p className="text-xs text-gray-500 mt-1">Currently in use</p>
            <div className="mt-2">
              <Badge variant="outline" className="bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/20">
                Live
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#F59E0B]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reserved</CardTitle>
            <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.reserved}</div>
            <p className="text-xs text-gray-500 mt-1">Upcoming bookings</p>
            <div className="mt-2">
              <Badge variant="outline" className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
                Pending check-in
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Reservation or Empty State */}
      {activeReservation ? (
        <Card className="bg-gradient-to-r from-[#10B981]/5 to-transparent border-[#10B981]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#10B981]" />
                Active Reservation
              </CardTitle>
              <Badge className="bg-[#10B981] text-white">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">Seat {activeReservation.seatId}</p>
                <p className="text-gray-500">{activeReservation.zone}</p>
                <div className="flex gap-2 mt-2">
                  {activeReservation.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Time Remaining</p>
                <p className="text-3xl font-bold text-[#10B981]">{timeRemaining}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-[#10B981] hover:bg-[#059669]">
                Check In Now
              </Button>
              <Button variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Reservation</h3>
            <p className="text-gray-500 mb-4">Find and reserve a seat to get started.</p>
            <Link href="/find-seat">
              <Button className="bg-[#10B981] hover:bg-[#059669]">
                <MapPin className="w-4 h-4 mr-2" />
                Find a Seat
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/find-seat">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#10B981] transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Library Map</h3>
                <p className="text-sm text-gray-500">Browse available seats across all zones</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/find-seat?filter=group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Group Study</h3>
                <p className="text-sm text-gray-500">Find collaborative spaces for team work</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Report Issue</h3>
              <p className="text-sm text-gray-500">Report problems with seats or facilities</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
