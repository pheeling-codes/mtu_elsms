"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import {
  Calendar,
  Clock,
  MapPin,
  X,
  Armchair,
  Zap,
  Sun,
  Monitor,
  ChevronLeft,
  Maximize2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface Reservation {
  id: string
  seatId: string
  seatName: string
  zone: string
  date: string
  startTime: string
  endTime: string
  status: "active" | "upcoming" | "past" | "reserved"
  features: string[]
  checkInDeadline?: Date
}

// Mock data matching the design
const mockReservations: Reservation[] = [
  {
    id: "res_001",
    seatId: "B5",
    seatName: "B5",
    zone: "Charging Zone",
    date: "Today, 24 Oct 2023",
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    status: "upcoming",
    features: ["Power Outlet"],
    checkInDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 mins from now
  },
  {
    id: "res_002",
    seatId: "G10",
    seatName: "G10",
    zone: "Group Zone",
    date: "Tomorrow, 25 Oct 2023",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    status: "upcoming",
    features: ["Dual Monitors"],
  },
  {
    id: "res_003",
    seatId: "A11",
    seatName: "A11",
    zone: "Quiet Zone",
    date: "Mon, 28 Oct 2023",
    startTime: "09:00 AM",
    endTime: "01:00 PM",
    status: "upcoming",
    features: ["Window View"],
  },
]

// Countdown timer hook
function useCountdown(targetDate: Date | undefined) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!targetDate) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft("00:00")
        return
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return { timeLeft, isExpired }
}

// Feature icon mapping
function FeatureIcon({ feature }: { feature: string }) {
  switch (feature) {
    case "Power Outlet":
      return <Zap className="w-3 h-3" />
    case "Window View":
      return <Sun className="w-3 h-3" />
    case "Dual Monitors":
      return <Monitor className="w-3 h-3" />
    default:
      return <Armchair className="w-3 h-3" />
  }
}

export default function ReservationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch reservations (mock for now)
  const reservations = useMemo(() => mockReservations, [])

  // Count by status
  const counts = useMemo(() => {
    return {
      active: reservations.filter((r) => r.status === "active").length,
      upcoming: reservations.filter((r) => r.status === "upcoming").length,
      past: reservations.filter((r) => r.status === "past").length,
    }
  }, [reservations])

  // Filter reservations by active tab
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => r.status === activeTab)
  }, [reservations, activeTab])

  // Handle view details
  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsDialogOpen(true)
  }

  // Handle check in
  const handleCheckIn = async () => {
    // TODO: Implement Supabase mutation
    console.log("Checking in...", selectedReservation?.id)
    setIsDialogOpen(false)
  }

  // Handle cancel
  const handleCancel = async (reservationId: string) => {
    // TODO: Implement Supabase mutation
    console.log("Cancelling...", reservationId)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Active
          </Badge>
        )
      case "upcoming":
      case "reserved":
        return (
          <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Reserved
          </Badge>
        )
      case "past":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-200">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Reservations</h1>
          <p className="text-slate-500 mt-1">Manage your current and upcoming library bookings.</p>
        </div>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => router.push("/find-seat")}
        >
          <span className="mr-1">+</span> New Reservation
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 border border-slate-200 p-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
          >
            Active
            <span className="ml-2 bg-slate-200 text-slate-700 text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
              {counts.active}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
          >
            Upcoming
            <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
              {counts.upcoming}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
          >
            Past
            <span className="ml-2 bg-slate-200 text-slate-700 text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
              {counts.past}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReservations.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Seat Information</div>
                <div className="col-span-3 text-center">Schedule</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-100">
                {filteredReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Seat Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Armchair className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Seat {reservation.seatName}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{reservation.zone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="col-span-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {reservation.date}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {reservation.startTime} - {reservation.endTime}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 text-center">
                      <StatusBadge status={reservation.status} />
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() => handleViewDetails(reservation)}
                      >
                        View Details
                      </Button>
                      {reservation.status !== "past" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleCancel(reservation.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-slate-50 border-dashed border-slate-200">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No {activeTab} reservations
                </h3>
                <p className="text-slate-500 mb-4">
                  {activeTab === "past"
                    ? "Your reservation history will appear here."
                    : `You don't have any ${activeTab} reservations at the moment.`}
                </p>
                {activeTab !== "past" && (
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => router.push("/find-seat")}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Find a Seat
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reservation Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white">
          <DialogTitle className="sr-only">
            {selectedReservation ? `Reservation Details - Seat ${selectedReservation.seatName}` : "Reservation Details"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View your reservation details, QR code for check-in, and manage your booking.
          </DialogDescription>
          {selectedReservation && (
            <ReservationDetailModal
              reservation={selectedReservation}
              onCheckIn={handleCheckIn}
              onClose={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Reservation Detail Modal Component
function ReservationDetailModal({
  reservation,
  onCheckIn,
  onClose,
}: {
  reservation: Reservation
  onCheckIn: () => void
  onClose: () => void
}) {
  const { timeLeft, isExpired } = useCountdown(reservation.checkInDeadline)

  // Calculate duration
  const getDuration = () => {
    // Mock calculation - would parse actual times
    return "2 Hours"
  }

  return (
    <div className="relative">
      {/* Back Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors z-10"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Reservations
      </button>

      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center border-b border-slate-100">
        <StatusBadge status={reservation.status} />
        <h2 className="text-3xl font-bold text-slate-900 mt-3">
          Seat {reservation.seatName}
        </h2>
        <p className="text-slate-500 text-sm mt-1">{reservation.zone}</p>
      </div>

      {/* Check-in Timer */}
      {reservation.status === "upcoming" && reservation.checkInDeadline && (
        <div className="mx-6 my-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-amber-600 tabular-nums">
              {timeLeft}
            </div>
            <p className="text-amber-600 text-sm mt-1">Time remaining to check in</p>
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="px-6 py-4">
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG
              value={`ELSMS:${reservation.id}:${reservation.seatId}`}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center max-w-[200px]">
            Scan this code at the desk to confirm your arrival and unlock your seat.
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Date</span>
          <span className="font-medium text-slate-900">{reservation.date}</span>
        </div>
        <Separator className="bg-slate-100" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Time Booked</span>
          <span className="font-medium text-slate-900">
            {reservation.startTime} - {reservation.endTime}
          </span>
        </div>
        <Separator className="bg-slate-100" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Duration</span>
          <span className="font-medium text-slate-900">{getDuration()}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 pt-2 space-y-3">
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12"
          onClick={onCheckIn}
          disabled={isExpired}
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Check In
        </Button>
        <Button
          variant="outline"
          className="w-full border-slate-200 text-rose-500 hover:bg-rose-50 h-12"
          onClick={onClose}
        >
          Cancel Reservation
        </Button>
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Active
        </Badge>
      )
    case "upcoming":
    case "reserved":
      return (
        <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Reserved
        </Badge>
      )
    case "past":
      return (
        <Badge variant="outline" className="text-slate-500 border-slate-200">
          Completed
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
