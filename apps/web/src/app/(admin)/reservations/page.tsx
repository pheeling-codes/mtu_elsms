"use client"

import { useEffect, useState, useCallback } from "react"

// Version busting to force component reload
const ADMIN_VERSION = "v2.1"
import {
  Calendar,
  MapPin,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
// Date formatting utilities
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '/')
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  userId: string
  seatId: string
  startTime: string
  endTime: string
  status: "RESERVED" | "ACTIVE" | "COMPLETED" | "NO_SHOW" | "CANCELLED"
  checkInTime?: string
  checkOutTime?: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    matricNumber: string
  }
  seat: {
    id: string
    seatNumber: string
    features: string[]
    zone: {
      id: string
      name: string
      themeColor?: string
    }
  }
}

interface Zone {
  id: string
  name: string
  themeColor?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

const TABLE_HEIGHT = "calc(100vh - 280px)"
const PAGE_SIZE = 20
const statusConfig = {
  RESERVED: { label: "Reserved", variant: "secondary" as const, color: "bg-slate-100 text-slate-700" },
  ACTIVE: { label: "Active", variant: "default" as const, color: "bg-[#10B981] text-white" },
  COMPLETED: { label: "Completed", variant: "outline" as const, color: "bg-slate-50 text-slate-600" },
  NO_SHOW: { label: "No Show", variant: "destructive" as const, color: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Cancelled", variant: "outline" as const, color: "bg-amber-100 text-amber-700" },
}

export default function ReservationsPage() {
  const { toast } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGE_SIZE
  })

  // Filters
  const [dateFilter, setDateFilter] = useState("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // New reservation tracking for animations
  const [newReservationIds, setNewReservationIds] = useState<Set<string>>(new Set())

  const fetchReservations = useCallback(async (page: number = 1) => {
    setIsLoading(true)

    try {
      // Build simple query without joins to avoid relationship issues
      // Explicitly select columns to prevent PostgREST from trying to resolve relationships
      let query = supabase
        .from('reservations')
        .select('id, userid, seatid, zoneid, starttime, endtime, status, checkintime, checkouttime, createdat, updatedat', { count: 'exact' })
        .order('starttime', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      // Apply filters
      if (zoneFilter !== 'all') {
        query = query.eq('seatid', zoneFilter)
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter.toUpperCase())
      }
      if (dateFilter === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('starttime', today.toISOString())
          .lt('starttime', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        query = query.gte('starttime', yesterday.toISOString())
          .lt('starttime', new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('starttime', weekAgo.toISOString())
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        query = query.gte('starttime', monthAgo.toISOString())
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        setReservations([])
        setPagination(prev => ({
          ...prev,
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        }))
        return
      }
      
      // Transform the data to match our interface with mock data for user and seat details
      const transformedData: Reservation[] = data.map((item: any) => ({
        id: item.id,
        userId: item.userid,
        seatId: item.seatid,
        startTime: item.starttime,
        endTime: item.endtime,
        status: item.status,
        checkInTime: item.checkintime,
        checkOutTime: item.checkouttime,
        createdAt: item.createdat,
        user: {
          id: item.userid,
          fullName: `Student ${item.userid.substring(0, 8)}`,
          email: `student${item.userid.substring(0, 8)}@mtu.edu`,
          matricNumber: `MTU/${item.userid.substring(0, 6)}`
        },
        seat: {
          id: item.seatid,
          seatNumber: `Seat ${item.seatid.substring(0, 6)}`,
          features: [],
          zone: {
            id: item.seatid?.substring(0, 4) || 'unknown',
            name: `Zone ${item.seatid?.substring(0, 4)}`,
            themeColor: '#10B981'
          }
        }
      }))
      
      setReservations(transformedData)
      setPagination(prev => ({
        ...prev,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE),
        currentPage: page
      }))
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive',
      })
      setReservations([])
    } finally {
      setIsLoading(false)
    }
  }, [toast, zoneFilter, statusFilter, dateFilter])

  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("zones").select("id, name")
      if (error) throw error
      setZones(data || [])
    } catch (error) {
    }
  }, [])

  // Initial fetch - force refresh on mount
  useEffect(() => {
    fetchZones()
    fetchReservations(1)
  }, [fetchZones, fetchReservations])

  // Refetch when filters change
  useEffect(() => {
    fetchReservations(1)
  }, [dateFilter, zoneFilter, statusFilter, fetchReservations])

  // Real-time subscription with enhanced feedback
  useEffect(() => {
    const subscription = supabase
      .channel("reservations-admin-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        async (payload: any) => {
          // Add to new reservations for animation
          setNewReservationIds(prev => new Set(prev).add(payload.new.id))
          
          // Remove from new reservations after animation (5 seconds)
          setTimeout(() => {
            setNewReservationIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(payload.new.id)
              return newSet
            })
          }, 5000)
          
          // Show toast notification for new reservation
          const newReservation = payload.new
          toast({
            title: "🎉 New reservation received!",
            description: `${newReservation.userId} reserved a seat`,
            className: "bg-emerald-500 text-white border-none"
          })
          
          // Refetch reservations to get the full data with relations
          await fetchReservations(pagination.currentPage)
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations" },
        async (payload: any) => {
          // Show toast for status changes
          const updatedReservation = payload.new
          const oldReservation = payload.old
          
          if (oldReservation.status !== updatedReservation.status) {
            toast({
              title: "Reservation Status Updated",
              description: `Status changed from ${oldReservation.status} to ${updatedReservation.status}`,
            })
          }
          
          await fetchReservations(pagination.currentPage)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchReservations, toast, pagination.currentPage])

  const handleCancel = async () => {
    if (!selectedReservation) return

    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "CANCELLED" })
        .eq("id", selectedReservation.id)

      if (error) throw error

      toast({
        title: "Reservation Cancelled",
        description: `Cancelled reservation for ${selectedReservation.user.fullName}`,
        className: "bg-[#10B981] text-white border-none",
      })

      fetchReservations(pagination.currentPage)
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel reservation",
        variant: "destructive",
      })
    } finally {
      setCancelDialogOpen(false)
      setSelectedReservation(null)
    }
  }

  const handleForceRelease = async () => {
    if (!selectedReservation) return

    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "COMPLETED",
          checkOutTime: now,
        })
        .eq("id", selectedReservation.id)

      if (error) throw error

      toast({
        title: "Seat Released",
        description: `Force released seat ${selectedReservation.seat.seatNumber}`,
        className: "bg-[#10B981] text-white border-none",
      })

      fetchReservations(pagination.currentPage)
    } catch (error) {
      console.error("Error releasing seat:", error)
      toast({
        title: "Error",
        description: "Failed to release seat",
        variant: "destructive",
      })
    } finally {
      setReleaseDialogOpen(false)
      setSelectedReservation(null)
    }
  }

  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchReservations(page)
    }
  }

  return (
    <div className="p-10 bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reservations</h1>
        <p className="text-slate-500">
          Manage and oversee all seat reservations across the library.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-36 h-10 rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-40 h-10 rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-20 h-3" />
                </div>
                <div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
                <div className="text-right">
                  <Skeleton className="w-20 h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarX className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No reservations found
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              All study sessions will appear here once booked by students.
              Check back later or adjust your filters.
            </p>
          </div>
        ) : (
          <>
            {/* Table Header - Fixed */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                User
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                Seat & Zone
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                Time
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                Status
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Table Body - Scrollable */}
            <div
              className="divide-y divide-slate-100 overflow-y-auto"
              style={{ height: TABLE_HEIGHT }}
            >
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className={`grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-4 items-center transition-all duration-500 ${
                    newReservationIds.has(reservation.id)
                      ? 'bg-emerald-50 border-l-4 border-emerald-500 animate-pulse'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {reservation.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {reservation.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reservation.user.matricNumber}
                      </p>
                      <p className="text-xs text-slate-400">
                        {reservation.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      Seat {reservation.seat.seatNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reservation.seat.zone.name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-slate-900">
                      {formatDate(reservation.startTime)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(reservation.startTime)} -{" "}
                      {formatTime(reservation.endTime)}
                    </p>
                  </div>

                  <div>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        statusConfig[reservation.status].color
                      )}
                    >
                      {statusConfig[reservation.status].label}
                    </Badge>
                  </div>

                  <div className="text-right">
                    {reservation.status === "RESERVED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setCancelDialogOpen(true)
                        }}
                        className="rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Cancel
                      </Button>
                    )}
                    {reservation.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setReleaseDialogOpen(true)
                        }}
                        className="rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        Force Release
                      </Button>
                    )}
                    {reservation.status === "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    )}
                    {(reservation.status === "NO_SHOW" ||
                      reservation.status === "CANCELLED") && (
                      <span className="text-xs text-slate-400">
                        {reservation.status === "NO_SHOW" ? "Missed" : "Cancelled"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Fixed */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <p className="text-sm text-slate-500">
                {pagination.totalCount} reservation{pagination.totalCount !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-slate-600 px-3">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="rounded-lg"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the reservation for{" "}
              <strong>{selectedReservation?.user.fullName}</strong> at Seat{" "}
              <strong>{selectedReservation?.seat.seatNumber}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">
              Keep Reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="rounded-lg bg-rose-600 hover:bg-rose-700"
            >
              Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Release Dialog */}
      <AlertDialog
        open={releaseDialogOpen}
        onOpenChange={setReleaseDialogOpen}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Force Release Seat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end the active session for{" "}
              <strong>{selectedReservation?.user.fullName}</strong> at Seat{" "}
              <strong>{selectedReservation?.seat.seatNumber}</strong>. The user
              will be checked out and the seat will become available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">
              Keep Active
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceRelease}
              className="rounded-lg bg-amber-600 hover:bg-amber-700"
            >
              Force Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
