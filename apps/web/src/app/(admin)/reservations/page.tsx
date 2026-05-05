"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Calendar,
  MapPin,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Seat,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  CalendarX,
} from "lucide-react"

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
    zoneId: string
    zone: {
      id: string
      name: string
    }
  }
}

interface Zone {
  id: string
  name: string
}

const ITEMS_PER_PAGE = 10

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [dateFilter, setDateFilter] = useState("today")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("reservations")
        .select(`
          id,
          userId,
          seatId,
          startTime,
          endTime,
          status,
          checkInTime,
          checkOutTime,
          createdAt,
          users:userId (
            id,
            fullName,
            email,
            matricNumber
          ),
          seats:seatId (
            id,
            seatNumber,
            zoneId,
            zones:zoneId (
              id,
              name
            )
          )
        `, { count: "exact" })

      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = now.toISOString().split("T")[0]
        query = query.gte("startTime", today).lt("startTime", today + "T23:59:59")
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString()
        query = query.gte("startTime", weekAgo)
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
        query = query.gte("startTime", monthAgo)
      }

      // Apply zone filter
      if (zoneFilter !== "all") {
        query = query.eq("seats.zoneId", zoneFilter)
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter.toUpperCase())
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to).order("startTime", { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to match interface
      const transformedData: Reservation[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.userId,
        seatId: item.seatId,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        checkInTime: item.checkInTime,
        checkOutTime: item.checkOutTime,
        createdAt: item.createdAt,
        user: item.users || { id: "", fullName: "Unknown", email: "-", matricNumber: "-" },
        seat: {
          id: item.seats?.id || "",
          seatNumber: item.seats?.seatNumber || "-",
          zoneId: item.seats?.zoneId || "",
          zone: item.seats?.zones || { id: "", name: "Unknown Zone" },
        },
      }))

      setReservations(transformedData)
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [dateFilter, zoneFilter, statusFilter, currentPage, toast])

  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("zones").select("id, name")
      if (error) throw error
      setZones(data || [])
    } catch (error) {
      console.error("Error fetching zones:", error)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchZones()
    fetchReservations()
  }, [fetchZones, fetchReservations])

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          fetchReservations()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchReservations])

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

      fetchReservations()
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

      fetchReservations()
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

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
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-6" />
                <Skeleton className="w-24 h-8" />
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
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
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

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
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
                        {reservation.status === "NO_SHOW"
                          ? "Missed"
                          : "Cancelled"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
                {totalCount} reservations
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          currentPage === page
                            ? "bg-[#10B981] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-slate-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          currentPage === totalPages
                            ? "bg-[#10B981] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg"
                >
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
