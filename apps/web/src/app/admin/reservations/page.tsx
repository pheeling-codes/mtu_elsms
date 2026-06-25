"use client"

import { useEffect, useState, useCallback } from "react"
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
  Trash2,
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
  createdAt: string
  user: {
    id: string
    matricNumber: string
    avatarUrl?: string
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

const TABLE_HEIGHT = "calc(100vh - 280px)"

const statusConfig = {
  RESERVED: { label: "Reserved", variant: "secondary" as const, color: "bg-slate-100 text-slate-700" },
  ACTIVE: { label: "Active", variant: "default" as const, color: "bg-[#10B981] text-white" },
  COMPLETED: { label: "Completed", variant: "outline" as const, color: "bg-slate-50 text-slate-600" },
  NO_SHOW: { label: "No Show", variant: "destructive" as const, color: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Cancelled", variant: "outline" as const, color: "bg-amber-100 text-amber-700" },
  UNKNOWN: { label: "Unknown", variant: "outline" as const, color: "bg-gray-100 text-gray-700" },
}

export default function ReservationsPage() {
  const { toast } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [dateFilter, setDateFilter] = useState("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const fetchReservations = useCallback(async () => {
    console.log("fetchReservations called")
    setIsLoading(true)
    try {
      console.log('Fetching admin reservations with filters:', { zoneFilter, statusFilter, dateFilter })

      // Build simple query with joins to get related data
      let query = supabase
        .from("reservations")
        .select("*, users(full_name, email, matric_number), seats(seatNumber, zoneId, zones(name))", { count: "exact" })
        .order("startTime", { ascending: false })

      console.log('Query built with explicit lowercase columns')

      // Apply date filter
      const now = new Date()
      if (dateFilter === "today") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte("startTime", today.toISOString())
          .lt("startTime", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        query = query.gte("startTime", yesterday.toISOString())
          .lt("startTime", new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte("startTime", weekAgo.toISOString())
      } else if (dateFilter === "month") {
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        query = query.gte("startTime", monthAgo.toISOString())
      }

      // Apply zone filter
      if (zoneFilter !== "all") {
        query = query.eq("seatId", zoneFilter)
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter.toUpperCase())
      }

      const { data, error, count } = await query

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Fetched reservations:", data?.length || 0, "Total:", count)

      // Transform data to match interface
      const transformedData: Reservation[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.userId,
        seatId: item.seatId,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        createdAt: item.createdAt,
        user: {
          id: item.userId,
          matricNumber: item.users?.matric_number || `MTU/${item.userId?.substring(0, 6) || 'Unknown'}`,
          avatarUrl: undefined,
          fullName: item.users?.email || item.users?.full_name || 'Unknown Student',
        },
        seat: {
          id: item.seatId,
          seatNumber: item.seats?.seatNumber ? `Seat ${item.seats.seatNumber}` : `Seat ${item.seatId?.substring(0, 6) || 'Unknown'}`,
          zoneId: item.seats?.zoneId || "",
          zone: {
            id: item.seats?.zoneId || "",
            name: item.seats?.zones?.name || 'Unknown',
          },
        },
      }))

      console.log("Transformed data:", transformedData.length)
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
  }, [dateFilter, zoneFilter, statusFilter, toast])

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
    console.log("ReservationsPage mounted")
    fetchZones()
    fetchReservations()
  }, [fetchZones, fetchReservations])

  // Refetch when filters change
  useEffect(() => {
    fetchReservations()
  }, [dateFilter, zoneFilter, statusFilter, fetchReservations])

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
        description: `Cancelled reservation for student ${selectedReservation.user.matricNumber}`,
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
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "COMPLETED",
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

  const handleDelete = async () => {
    if (!selectedReservation) return

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", selectedReservation.id)

      if (error) throw error

      toast({
        title: "Reservation Deleted",
        description: `Deleted reservation for ${selectedReservation.user.matricNumber}`,
        className: "bg-[#10B981] text-white border-none",
      })

      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast({
        title: "Error",
        description: "Failed to delete reservation",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
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
            {/* Table Header - Fixed */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                User
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                Seat & Zone
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                Time
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                Status
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                Created At
              </div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
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
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {reservation.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 truncate max-w-[140px]">
                        {reservation.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reservation.user.matricNumber}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="font-semibold text-slate-900">
                      {reservation.seat.seatNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reservation.seat.zone.name}
                    </p>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm text-slate-900">
                      {formatDate(reservation.startTime)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(reservation.startTime)} -{" "}
                      {formatTime(reservation.endTime)}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        statusConfig[reservation.status]?.color || statusConfig.UNKNOWN.color
                      )}
                    >
                      {statusConfig[reservation.status]?.label || statusConfig.UNKNOWN.label}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-slate-600">
                      {reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reservation.createdAt ? new Date(reservation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setViewDialogOpen(true)
                      }}
                      className="rounded-lg text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setDeleteDialogOpen(true)
                      }}
                      className="rounded-lg text-rose-600 hover:text-rose-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer - Fixed */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <p className="text-sm text-slate-500">
                {totalCount} reservation{totalCount !== 1 ? 's' : ''} total
              </p>
              <p className="text-sm text-slate-400">
                Scroll to view more
              </p>
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
              <strong>{selectedReservation?.user.fullName || selectedReservation?.user.matricNumber}</strong> at{" "}
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
              <strong>{selectedReservation?.user.fullName || selectedReservation?.user.matricNumber}</strong> at{" "}
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

      {/* View Details Dialog */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="rounded-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reservation Details</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Student</p>
              <p className="font-semibold text-slate-900">{selectedReservation?.user.fullName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Seat</p>
              <p className="font-semibold text-slate-900">{selectedReservation?.seat.seatNumber}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Zone</p>
              <p className="font-semibold text-slate-900">{selectedReservation?.seat.zone.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Time</p>
              <p className="font-semibold text-slate-900">
                {selectedReservation ? new Date(selectedReservation.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''} - {selectedReservation ? new Date(selectedReservation.endTime).toLocaleTimeString([], { timeStyle: 'short' }) : ''}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Status</p>
              <Badge
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  statusConfig[selectedReservation?.status || 'UNKNOWN']?.color || statusConfig.UNKNOWN.color
                )}
              >
                {statusConfig[selectedReservation?.status || 'UNKNOWN']?.label || statusConfig.UNKNOWN.label}
              </Badge>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction className="rounded-lg">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reservation for{" "}
              <strong>{selectedReservation?.user.fullName || selectedReservation?.user.matricNumber}</strong> at{" "}
              <strong>{selectedReservation?.seat.seatNumber}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">
              Keep Reservation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-lg bg-rose-600 hover:bg-rose-700"
            >
              Delete Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
