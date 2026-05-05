"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ZoomIn, 
  ZoomOut, 
  Hand, 
  Crosshair,
  Zap,
  Sun,
  Monitor,
  Armchair,
  CheckCircle2,
  Calendar,
  Clock,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox-simple"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FindSeatSkeleton } from "@/components/ui/skeleton-findseat"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Seat {
  id: string
  seatNumber: string
  zoneId: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED"
  x?: number
  y?: number
  features?: string[]
}

interface Zone {
  id: string
  name: string
  description: string
  color: string
}

// Demo zones
const ZONES: Zone[] = [
  { id: "quiet", name: "Quiet Zone", description: "Individual study area", color: "#E0F2FE" },
  { id: "group", name: "Group Zone", description: "Collaborative workspace", color: "#F3E8FF" },
  { id: "charging", name: "Charging Zone", description: "Power outlets available", color: "#ECFDF5" },
]

// Demo seat data with positions
const DEMO_SEATS: Seat[] = [
  // Quiet Zone - A1-A12
  { id: "a1", seatNumber: "A1", zoneId: "quiet", status: "AVAILABLE", features: ["Power Outlet", "Window View"], x: 100, y: 100 },
  { id: "a2", seatNumber: "A2", zoneId: "quiet", status: "OCCUPIED", features: ["Power Outlet"], x: 160, y: 100 },
  { id: "a3", seatNumber: "A3", zoneId: "quiet", status: "RESERVED", features: ["Ergonomic Chair"], x: 100, y: 160 },
  { id: "a4", seatNumber: "A4", zoneId: "quiet", status: "AVAILABLE", features: ["Power Outlet", "Window View"], x: 160, y: 160 },
  { id: "a5", seatNumber: "A5", zoneId: "quiet", status: "AVAILABLE", features: ["Dual Monitors"], x: 300, y: 100 },
  { id: "a6", seatNumber: "A6", zoneId: "quiet", status: "AVAILABLE", features: ["Power Outlet"], x: 360, y: 100 },
  { id: "a7", seatNumber: "A7", zoneId: "quiet", status: "OCCUPIED", features: ["Window View"], x: 300, y: 160 },
  { id: "a8", seatNumber: "A8", zoneId: "quiet", status: "AVAILABLE", features: ["Ergonomic Chair", "Power Outlet"], x: 360, y: 160 },
  { id: "a9", seatNumber: "A9", zoneId: "quiet", status: "OCCUPIED", features: ["Power Outlet"], x: 500, y: 100 },
  { id: "a10", seatNumber: "A10", zoneId: "quiet", status: "OCCUPIED", features: ["Window View"], x: 560, y: 100 },
  { id: "a11", seatNumber: "A11", zoneId: "quiet", status: "RESERVED", features: ["Dual Monitors"], x: 500, y: 160 },
  { id: "a12", seatNumber: "A12", zoneId: "quiet", status: "OCCUPIED", features: ["Ergonomic Chair"], x: 560, y: 160 },
  
  // Group Zone - G1-G4
  { id: "g1", seatNumber: "G1", zoneId: "group", status: "AVAILABLE", features: ["Power Outlet", "Dual Monitors"], x: 700, y: 100 },
  { id: "g2", seatNumber: "G2", zoneId: "group", status: "AVAILABLE", features: ["Power Outlet"], x: 700, y: 160 },
  { id: "g3", seatNumber: "G3", zoneId: "group", status: "AVAILABLE", features: ["Window View"], x: 760, y: 100 },
  { id: "g4", seatNumber: "G4", zoneId: "group", status: "AVAILABLE", features: ["Ergonomic Chair"], x: 760, y: 160 },
  
  // Charging Zone - B1-B12
  { id: "b1", seatNumber: "B1", zoneId: "charging", status: "AVAILABLE", features: ["Power Outlet", "Window View"], x: 100, y: 350 },
  { id: "b2", seatNumber: "B2", zoneId: "charging", status: "AVAILABLE", features: ["Power Outlet"], x: 160, y: 350 },
  { id: "b3", seatNumber: "B3", zoneId: "charging", status: "AVAILABLE", features: ["Ergonomic Chair"], x: 100, y: 410 },
  { id: "b4", seatNumber: "B4", zoneId: "charging", status: "AVAILABLE", features: ["Power Outlet", "Dual Monitors"], x: 160, y: 410 },
  { id: "b5", seatNumber: "B5", zoneId: "charging", status: "RESERVED", features: ["Power Outlet"], x: 300, y: 350 },
  { id: "b6", seatNumber: "B6", zoneId: "charging", status: "OCCUPIED", features: ["Window View"], x: 360, y: 350 },
  { id: "b7", seatNumber: "B7", zoneId: "charging", status: "AVAILABLE", features: ["Power Outlet"], x: 300, y: 410 },
  { id: "b8", seatNumber: "B8", zoneId: "charging", status: "AVAILABLE", features: ["Ergonomic Chair", "Power Outlet"], x: 360, y: 410 },
  { id: "b9", seatNumber: "B9", zoneId: "charging", status: "OCCUPIED", features: ["Power Outlet"], x: 500, y: 350 },
  { id: "b10", seatNumber: "B10", zoneId: "charging", status: "OCCUPIED", features: ["Dual Monitors"], x: 560, y: 350 },
  { id: "b11", seatNumber: "B11", zoneId: "charging", status: "OCCUPIED", features: ["Power Outlet"], x: 500, y: 410 },
  { id: "b12", seatNumber: "B12", zoneId: "charging", status: "OCCUPIED", features: ["Window View"], x: 560, y: 410 },
  
  // More Group Seats
  { id: "g5", seatNumber: "G5", zoneId: "group", status: "RESERVED", features: ["Power Outlet", "Dual Monitors"], x: 700, y: 350 },
  { id: "g6", seatNumber: "G6", zoneId: "group", status: "AVAILABLE", features: ["Power Outlet"], x: 760, y: 350 },
  { id: "g7", seatNumber: "G7", zoneId: "group", status: "AVAILABLE", features: ["Ergonomic Chair"], x: 700, y: 410 },
  { id: "g8", seatNumber: "G8", zoneId: "group", status: "RESERVED", features: ["Window View"], x: 760, y: 410 },
]

export default function FindSeatPage() {
  const router = useRouter()
  const [seats, setSeats] = useState<Seat[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Map view state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Filters
  const [filters, setFilters] = useState({
    available: true,
    occupied: true,
    reserved: true,
    zones: {
      all: true,
      quiet: true,
      group: true,
      charging: true,
    },
    features: {
      power: false,
      window: false,
      monitors: false,
      ergonomic: false,
    }
  })
  
  // Reservation form
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("12:00")
  const [isReserving, setIsReserving] = useState(false)

  // Fetch seats and zones from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch seats
        const { data: seatsData, error: seatsError } = await supabase
          .from('seats')
          .select('*')
          .order('seatNumber')
        
        if (seatsError) throw seatsError
        
        // Fetch zones
        const { data: zonesData, error: zonesError } = await supabase
          .from('zones')
          .select('*')
        
        if (zonesError) throw zonesError
        
        setSeats(seatsData || [])
        setZones(zonesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load seats', {
          description: 'Please try refreshing the page.',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Real-time seat updates
  useEffect(() => {
    const channel = supabase
      .channel("seat_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats" },
        (payload: { new?: Seat }) => {
          if (payload.new) {
            setSeats((prev) =>
              prev.map((s) => (s.id === payload.new!.id ? { ...s, ...payload.new } : s))
            )
            if (selectedSeat && payload.new.id === selectedSeat.id) {
              setSelectedSeat({ ...selectedSeat, ...payload.new })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSeat])

  // Filter logic
  const filteredSeats = useMemo(() => {
    return seats.filter((seat) => {
      // Availability filter
      if (!filters.available && seat.status === "AVAILABLE") return false
      if (!filters.occupied && seat.status === "OCCUPIED") return false
      if (!filters.reserved && seat.status === "RESERVED") return false

      // Zone filter
      if (!filters.zones.all) {
        if (seat.zoneId === "quiet" && !filters.zones.quiet) return false
        if (seat.zoneId === "group" && !filters.zones.group) return false
        if (seat.zoneId === "charging" && !filters.zones.charging) return false
      }

      return true
    })
  }, [seats, filters])

  // Stats
  const stats = useMemo(() => ({
    available: seats.filter((s) => s.status === "AVAILABLE").length,
    occupied: seats.filter((s) => s.status === "OCCUPIED").length,
    reserved: seats.filter((s) => s.status === "RESERVED").length,
  }), [seats])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#10B981"
      case "OCCUPIED":
        return "#F43F5E"
      case "RESERVED":
        return "#F59E0B"
      default:
        return "#9CA3AF"
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
      case "OCCUPIED":
        return "bg-rose-500 cursor-not-allowed"
      case "RESERVED":
        return "bg-amber-500 cursor-not-allowed"
      default:
        return "bg-slate-400"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
            Available Now
          </Badge>
        )
      case "OCCUPIED":
        return (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200">
            <div className="w-2 h-2 bg-rose-500 rounded-full mr-2" />
            Occupied
          </Badge>
        )
      case "RESERVED":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
            Reserved
          </Badge>
        )
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "AVAILABLE") {
      setSelectedSeat(seat)
      setIsReservationOpen(true)
    } else {
      toast.error("Seat Unavailable", {
        description: `This seat is currently ${seat.status.toLowerCase()}.`,
      })
    }
  }

  const handleReserve = async () => {
    console.log("[handleReserve] Starting...")
    if (!selectedSeat) {
      console.log("[handleReserve] No seat selected, returning")
      return
    }
    
    setIsReserving(true)
    try {
      console.log("[handleReserve] Getting user...")
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      console.log("[handleReserve] User:", user)
      if (!user) {
        toast.error("Authentication Required", {
          description: "Please sign in to make a reservation.",
        })
        return
      }

      // Calculate times
      const now = new Date()
      const startDateTime = new Date(now)
      const [startHour, startMinute] = startTime.split(':').map(Number)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      
      const endDateTime = new Date(now)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      
      // Create reservation record
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          userId: user.id,
          seatId: selectedSeat.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: 'UPCOMING',
        })
        .select()
        .single()

      if (reservationError) {
        throw reservationError
      }

      // Update seat status to RESERVED
      const { error: seatError } = await supabase
        .from('seats')
        .update({ status: 'RESERVED' })
        .eq('id', selectedSeat.id)

      if (seatError) {
        throw seatError
      }
      
      console.log("[handleReserve] Reservation created successfully")
      
      toast.success("Reservation Successful", {
        description: `Seat #${selectedSeat.seatNumber} reserved from ${startTime} to ${endTime}`,
      })
      
      setIsReservationOpen(false)
      setSelectedSeat(null)
      
      // Navigate to my-reservations page to show the new booking
      router.push("/my-reservations")
    } catch (error) {
      console.error("[handleReserve] Error:", error)
      toast.error("Reservation Failed", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      console.log("[handleReserve] Finally block - setting isReserving to false")
      setIsReserving(false)
    }
  }

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Show skeleton while loading
  if (isLoading) {
    return <FindSeatSkeleton />
  }

  return (
    <div className="h-[calc(100vh-6rem)] -m-4 lg:-m-8 flex">
      {/* Left: Map Workspace */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        {/* Dot Grid Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Live Updates Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-white shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
            Live Updates
          </Badge>
        </div>

        {/* Map Canvas */}
        <div 
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 1080 520"
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Zone Backgrounds - Three distinct vertical columns */}
            <g>
              {/* Quiet Zone - Left column */}
              <rect x="50" y="50" width="300" height="400" fill="#E0F2FE" rx="12" opacity="0.6" stroke="#bae6fd" strokeWidth="2" />
              <text x="200" y="80" textAnchor="middle" className="text-sm font-bold fill-slate-600 uppercase tracking-wider">QUIET ZONE</text>
              <text x="200" y="100" textAnchor="middle" className="text-xs fill-slate-400">Silent Study Area</text>
              
              {/* Group Zone - Middle column */}
              <rect x="380" y="50" width="300" height="400" fill="#F3E8FF" rx="12" opacity="0.6" stroke="#e9d5ff" strokeWidth="2" />
              <text x="530" y="80" textAnchor="middle" className="text-sm font-bold fill-slate-600 uppercase tracking-wider">GROUP ZONE</text>
              <text x="530" y="100" textAnchor="middle" className="text-xs fill-slate-400">Collaborative Space</text>
              
              {/* Charging Zone - Right column */}
              <rect x="710" y="50" width="300" height="400" fill="#ECFDF5" rx="12" opacity="0.6" stroke="#a7f3d0" strokeWidth="2" />
              <text x="860" y="80" textAnchor="middle" className="text-sm font-bold fill-slate-600 uppercase tracking-wider">CHARGING ZONE</text>
              <text x="860" y="100" textAnchor="middle" className="text-xs fill-slate-400">Power + USB Available</text>
            </g>

            {/* Seats */}
            <g>
              {filteredSeats.map((seat) => {
                const color = getStatusColor(seat.status)
                const isAvailable = seat.status === "AVAILABLE"
                return (
                  <g key={seat.id}>
                    {/* Seat Button Background */}
                    <rect
                      x={(seat.x || 0) - 20}
                      y={(seat.y || 0) - 20}
                      width="40"
                      height="40"
                      rx="8"
                      fill={color}
                      className={isAvailable ? "cursor-pointer hover:brightness-110" : "cursor-not-allowed"}
                      onClick={() => handleSeatClick(seat)}
                    />
                    {/* Seat Label */}
                    <text
                      x={seat.x || 0}
                      y={(seat.y || 0) + 4}
                      textAnchor="middle"
                      className="text-sm font-semibold fill-white pointer-events-none"
                    >
                      #{seat.seatNumber}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Floating Toolbar */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 bg-white shadow-lg hover:bg-slate-50"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 bg-white shadow-lg hover:bg-slate-50"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 bg-white shadow-lg hover:bg-slate-50"
            onClick={resetView}
          >
            <Crosshair className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={`w-10 h-10 shadow-lg ${isPanning ? 'bg-emerald-50 text-emerald-600' : 'bg-white hover:bg-slate-50'}`}
            onClick={() => setIsPanning(!isPanning)}
          >
            <Hand className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right: Filter Sidebar */}
      <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Map Filters</h2>

        {/* Availability Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Availability
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="available" 
                  checked={filters.available}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ ...f, available: checked === true }))
                  }
                />
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <Label htmlFor="available" className="text-sm font-medium text-slate-700">
                  Available
                </Label>
              </div>
              <span className="text-sm text-slate-500">{stats.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="occupied" 
                  checked={filters.occupied}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ ...f, occupied: checked === true }))
                  }
                />
                <div className="w-4 h-4 rounded bg-rose-500" />
                <Label htmlFor="occupied" className="text-sm font-medium text-slate-700">
                  Occupied
                </Label>
              </div>
              <span className="text-sm text-slate-500">{stats.occupied}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="reserved" 
                  checked={filters.reserved}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ ...f, reserved: checked === true }))
                  }
                />
                <div className="w-4 h-4 rounded bg-amber-500" />
                <Label htmlFor="reserved" className="text-sm font-medium text-slate-700">
                  Reserved
                </Label>
              </div>
              <span className="text-sm text-slate-500">{stats.reserved}</span>
            </div>
          </div>
        </div>

        {/* Zones Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Zones
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="allZones" 
                checked={filters.zones.all}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    zones: { ...f.zones, all: checked === true }
                  }))
                }
              />
              <Label htmlFor="allZones" className="text-sm font-medium text-slate-700">
                All Zones
              </Label>
            </div>
            <div className="flex items-center gap-3 pl-6">
              <Checkbox 
                id="quiet" 
                checked={filters.zones.quiet || filters.zones.all}
                disabled={filters.zones.all}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    zones: { ...f.zones, quiet: checked === true }
                  }))
                }
              />
              <Label htmlFor="quiet" className="text-sm text-slate-600">
                Quiet Zone
              </Label>
            </div>
            <div className="flex items-center gap-3 pl-6">
              <Checkbox 
                id="group" 
                checked={filters.zones.group || filters.zones.all}
                disabled={filters.zones.all}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    zones: { ...f.zones, group: checked === true }
                  }))
                }
              />
              <Label htmlFor="group" className="text-sm text-slate-600">
                Group Zone
              </Label>
            </div>
            <div className="flex items-center gap-3 pl-6">
              <Checkbox 
                id="charging" 
                checked={filters.zones.charging || filters.zones.all}
                disabled={filters.zones.all}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    zones: { ...f.zones, charging: checked === true }
                  }))
                }
              />
              <Label htmlFor="charging" className="text-sm text-slate-600">
                Charging Zone
              </Label>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Seat Features
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="power" 
                checked={filters.features.power}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    features: { ...f.features, power: checked === true }
                  }))
                }
              />
              <Label htmlFor="power" className="text-sm text-slate-600">
                Power Outlets
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox 
                id="window" 
                checked={filters.features.window}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    features: { ...f.features, window: checked === true }
                  }))
                }
              />
              <Label htmlFor="window" className="text-sm text-slate-600">
                Window View
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox 
                id="monitors" 
                checked={filters.features.monitors}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    features: { ...f.features, monitors: checked === true }
                  }))
                }
              />
              <Label htmlFor="monitors" className="text-sm text-slate-600">
                Dual Monitors
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox 
                id="ergonomic" 
                checked={filters.features.ergonomic}
                onCheckedChange={(checked: boolean | "indeterminate") => 
                  setFilters(f => ({ 
                    ...f, 
                    features: { ...f.features, ergonomic: checked === true }
                  }))
                }
              />
              <Label htmlFor="ergonomic" className="text-sm text-slate-600">
                Ergonomic Chair
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Sheet */}
      <AnimatePresence>
        {isReservationOpen && selectedSeat && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsReservationOpen(false)}
            />
            {/* Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Seat #{selectedSeat.seatNumber}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedSeat.status)}
                      <Badge variant="secondary" className="text-slate-600">
                        {selectedSeat.zoneId === "quiet" && "Quiet Zone"}
                        {selectedSeat.zoneId === "group" && "Group Zone"}
                        {selectedSeat.zoneId === "charging" && "Charging Zone"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsReservationOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Info Callout */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <p className="text-sm text-emerald-800">
                      This seat is currently unoccupied and available for reservation.
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Seat Features</h3>
                  <div className="space-y-3">
                    {selectedSeat.features?.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                        {feature === "Power Outlet" && <Zap className="w-4 h-4 text-slate-400" />}
                        {feature === "Window View" && <Sun className="w-4 h-4 text-slate-400" />}
                        {feature === "Dual Monitors" && <Monitor className="w-4 h-4 text-slate-400" />}
                        {feature === "Ergonomic Chair" && <Armchair className="w-4 h-4 text-slate-400" />}
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule Reservation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Schedule Reservation</h3>
                  
                  {/* Date Picker */}
                  <div>
                    <Label className="text-xs text-slate-500 mb-2 block">Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={reservationDate}
                        onChange={(e) => setReservationDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Time Selectors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="08:00">08:00 AM</option>
                          <option value="09:00">09:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">01:00 PM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="15:00">03:00 PM</option>
                          <option value="16:00">04:00 PM</option>
                          <option value="17:00">05:00 PM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="09:00">09:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">01:00 PM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="15:00">03:00 PM</option>
                          <option value="16:00">04:00 PM</option>
                          <option value="17:00">05:00 PM</option>
                          <option value="18:00">06:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <Button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-semibold mt-4"
                    onClick={handleReserve}
                    disabled={isReserving}
                  >
                    {isReserving ? "Reserving..." : "Reserve Seat"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
