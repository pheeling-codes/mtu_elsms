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
  type: "QUIET" | "GROUP" | "CHARGING"
  color: string
  gridBlockSize?: number
  canvasWidth?: number
  canvasHeight?: number
}

export default function FindSeatPage() {
  const router = useRouter()
  const [seats, setSeats] = useState<Seat[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null)
  
  // Map view state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Filters
  const [filters, setFilters] = useState({
    availability: {
      all: true,
      available: true,
      occupied: true,
      reserved: true,
    },
    zones: {
      all: true,
      selected: [] as ("QUIET" | "GROUP" | "CHARGING")[], // Zone types
    },
    features: {
      all: true,
      selected: [] as string[], // Feature names
    }
  })
  
  // Reservation form
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("12:00")
  const [isReserving, setIsReserving] = useState(false)

  // Fetch seats, zones, and reservations from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch zones with seat count > 0
        const { data: zonesData, error: zonesError } = await supabase
          .from('zones')
          .select(`
            id,
            name,
            type,
            color,
            gridblocksize,
            canvaswidth,
            canvasheight,
            seats(count)
          `)
        
        if (zonesError) throw zonesError
        
        // Filter zones that have seats
        const zonesWithSeats = zonesData?.filter((zone: any) => zone.seats && zone.seats[0]?.count > 0) || []
        
        // Fetch seats
        const { data: seatsData, error: seatsError } = await supabase
          .from('seats')
          .select('*')
          .order('seatNumber')
        
        if (seatsError) throw seatsError
        
        // Fetch active reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .in('status', ['ACTIVE', 'UPCOMING'])
        
        if (reservationsError) throw reservationsError
        
        setSeats(seatsData || [])
        setZones(zonesWithSeats)
        setReservations(reservationsData || [])
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

  // Helper function to get current time in WAT (West African Time)
  const getCurrentWATTime = () => {
    const now = new Date()
    // WAT is UTC+1
    const watOffset = 1 * 60 // 1 hour in minutes
    const localOffset = now.getTimezoneOffset() // in minutes (negative for ahead of UTC)
    const totalOffset = watOffset + localOffset
    const watTime = new Date(now.getTime() + totalOffset * 60 * 1000)
    return watTime
  }

  // Helper function to calculate dynamic seat status based on reservations
  const getDynamicSeatStatus = (seat: Seat): "AVAILABLE" | "OCCUPIED" | "RESERVED" => {
    const now = getCurrentWATTime()
    
    // Check if seat has an active reservation at current time
    const activeReservation = reservations.find(res => 
      res.seatId === seat.id && 
      res.status === 'ACTIVE' &&
      new Date(res.startTime) <= now &&
      new Date(res.endTime) > now
    )
    
    if (activeReservation) {
      return "OCCUPIED"
    }
    
    // Check if seat has an upcoming reservation
    const upcomingReservation = reservations.find(res => 
      res.seatId === seat.id && 
      res.status === 'UPCOMING' &&
      new Date(res.startTime) > now
    )
    
    if (upcomingReservation) {
      return "RESERVED"
    }
    
    return "AVAILABLE"
  }

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

  // Real-time zone updates
  useEffect(() => {
    const channel = supabase
      .channel("zone_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "zones" },
        (payload: { new?: Zone }) => {
          if (payload.new) {
            setZones((prev) =>
              prev.map((z) => (z.id === payload.new!.id ? { ...z, ...payload.new } : z))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Real-time reservation updates
  useEffect(() => {
    const channel = supabase
      .channel("reservation_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        (payload: { new?: any }) => {
          if (payload.new) {
            setReservations((prev) => {
              const existingIndex = prev.findIndex(r => r.id === payload.new!.id)
              if (existingIndex >= 0) {
                return prev.map((r, i) => i === existingIndex ? payload.new : r)
              } else {
                return [...prev, payload.new]
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter logic
  const filteredSeats = useMemo(() => {
    return seats.filter((seat) => {
      const dynamicStatus = getDynamicSeatStatus(seat)
      const zone = zones.find(z => z.id === seat.zoneId)
      const zoneType = zone?.type || "QUIET"
      
      // Availability filter
      if (!filters.availability.all) {
        if (!filters.availability.available && dynamicStatus === "AVAILABLE") return false
        if (!filters.availability.occupied && dynamicStatus === "OCCUPIED") return false
        if (!filters.availability.reserved && dynamicStatus === "RESERVED") return false
      }

      // Zone filter
      if (!filters.zones.all && filters.zones.selected.length > 0) {
        if (!filters.zones.selected.includes(zoneType as "QUIET" | "GROUP" | "CHARGING")) return false
      }

      // Feature filter
      if (!filters.features.all && filters.features.selected.length > 0) {
        const hasSelectedFeature = seat.features?.some(feature => 
          filters.features.selected.includes(feature)
        )
        if (!hasSelectedFeature) return false
      }

      return true
    })
  }, [seats, filters, reservations, zones])

  // Stats
  const stats = useMemo(() => ({
    available: seats.filter((s) => getDynamicSeatStatus(s) === "AVAILABLE").length,
    occupied: seats.filter((s) => getDynamicSeatStatus(s) === "OCCUPIED").length,
    reserved: seats.filter((s) => getDynamicSeatStatus(s) === "RESERVED").length,
  }), [seats, reservations])

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

      // Get user identity from metadata
      const fullName = user.user_metadata?.fullName || undefined
      const email = user.email || undefined
      const matricNumber = user.user_metadata?.matricNumber || undefined

      // Calculate times
      const now = new Date()
      const startDateTime = new Date(now)
      const [startHour, startMinute] = startTime.split(':').map(Number)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      
      const endDateTime = new Date(now)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      
      // Get zone ID for the selected seat
      const zoneId = selectedSeat.zoneId
      
      // Create reservation record with identity fields
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          userId: user.id,
          seatId: selectedSeat.id,
          zoneId: zoneId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: 'UPCOMING',
          fullName: fullName,
          email: email,
          matricNumber: matricNumber,
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
            viewBox={`0 0 ${zones.reduce((max, z) => Math.max(max, (z.canvasWidth || 300) + 50), 300) * zones.length} ${zones.reduce((max, z) => Math.max(max, (z.canvasHeight || 400) + 50), 450)}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Zone Backgrounds - Dynamic rendering from database */}
            <g>
              {zones.map((zone, index) => {
                const xOffset = zones.slice(0, index).reduce((sum, z) => sum + ((z.canvasWidth || 300) + 50), 50)
                const zoneColor = zone.color || "#E0F2FE"
                const zoneName = zone.name || "Unknown Zone"
                const zoneType = zone.type || "QUIET"
                const canvasWidth = zone.canvasWidth || 300
                const canvasHeight = zone.canvasHeight || 400
                
                return (
                  <g key={zone.id}>
                    {/* Zone Background */}
                    <rect 
                      x={xOffset} 
                      y="50" 
                      width={canvasWidth} 
                      height={canvasHeight} 
                      fill={zoneColor} 
                      rx="12" 
                      opacity="0.6" 
                      stroke={zoneColor}
                      strokeWidth="2" 
                    />
                    {/* Zone Label */}
                    <text x={xOffset + canvasWidth / 2} y="80" textAnchor="middle" className="text-sm font-bold fill-slate-600 uppercase tracking-wider">
                      {zoneName}
                    </text>
                    <text x={xOffset + canvasWidth / 2} y="100" textAnchor="middle" className="text-xs fill-slate-400">
                      {zoneType === "QUIET" && "Silent Study Area"}
                      {zoneType === "GROUP" && "Collaborative Space"}
                      {zoneType === "CHARGING" && "Power + USB Available"}
                    </text>
                  </g>
                )
              })}
            </g>

            {/* Seats - Dynamic rendering from database coordinates */}
            <g>
              {filteredSeats.map((seat) => {
                const dynamicStatus = getDynamicSeatStatus(seat)
                const color = getStatusColor(dynamicStatus)
                const isAvailable = dynamicStatus === "AVAILABLE"
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
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
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

            {/* Hover Tooltip */}
            {hoveredSeat && (
              <g>
                <rect
                  x={(hoveredSeat.x || 0) - 60}
                  y={(hoveredSeat.y || 0) - 70}
                  width="120"
                  height="40"
                  rx="8"
                  fill="white"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x={hoveredSeat.x || 0}
                  y={(hoveredSeat.y || 0) - 55}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-slate-900"
                >
                  {hoveredSeat.seatNumber}
                </text>
                <text
                  x={hoveredSeat.x || 0}
                  y={(hoveredSeat.y || 0) - 40}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                >
                  {hoveredSeat.features?.slice(0, 2).join(", ") || "No features"}
                </text>
              </g>
            )}
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
                  id="all" 
                  checked={filters.availability.all}
                  disabled
                  className="pointer-events-none"
                />
                <Label htmlFor="all" className="text-sm font-medium text-slate-700">
                  All Seats
                </Label>
              </div>
            </div>
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="available" 
                  checked={filters.availability.available}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ 
                      ...f, 
                      availability: { ...f.availability, available: checked === true }
                    }))
                  }
                />
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <Label htmlFor="available" className="text-sm font-medium text-slate-700">
                  Available
                </Label>
              </div>
              <span className="text-sm text-slate-500">{stats.available}</span>
            </div>
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="occupied" 
                  checked={filters.availability.occupied}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ 
                      ...f, 
                      availability: { ...f.availability, occupied: checked === true }
                    }))
                  }
                />
                <div className="w-4 h-4 rounded bg-rose-500" />
                <Label htmlFor="occupied" className="text-sm font-medium text-slate-700">
                  Occupied
                </Label>
              </div>
              <span className="text-sm text-slate-500">{stats.occupied}</span>
            </div>
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="reserved" 
                  checked={filters.availability.reserved}
                  onCheckedChange={(checked: boolean | "indeterminate") => 
                    setFilters(f => ({ 
                      ...f, 
                      availability: { ...f.availability, reserved: checked === true }
                    }))
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
                disabled
                className="pointer-events-none"
              />
              <Label htmlFor="allZones" className="text-sm font-medium text-slate-700">
                All Zones
              </Label>
            </div>
            {[
              { type: "GROUP", label: "Group Study" },
              { type: "CHARGING", label: "Charged Up Arena" },
              { type: "QUIET", label: "Quiet Zone" },
            ].map((zoneType) => (
              <div key={zoneType.type} className="flex items-center gap-3 pl-6">
                <Checkbox 
                  id={zoneType.type}
                  checked={filters.zones.selected.includes(zoneType.type as "QUIET" | "GROUP" | "CHARGING")}
                  onCheckedChange={(checked: boolean | "indeterminate") => {
                    if (checked === true) {
                      setFilters(f => ({
                        ...f,
                        zones: {
                          ...f.zones,
                          selected: [...f.zones.selected, zoneType.type as "QUIET" | "GROUP" | "CHARGING"]
                        }
                      }))
                    } else {
                      setFilters(f => ({
                        ...f,
                        zones: {
                          ...f.zones,
                          selected: f.zones.selected.filter(t => t !== zoneType.type)
                        }
                      }))
                    }
                  }}
                />
                <Label htmlFor={zoneType.type} className="text-sm text-slate-600">
                  {zoneType.label}
                </Label>
              </div>
            ))}
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
                id="allFeatures" 
                checked={filters.features.all}
                disabled
                className="pointer-events-none"
              />
              <Label htmlFor="allFeatures" className="text-sm font-medium text-slate-700">
                All Seats
              </Label>
            </div>
            {[
              { name: "Power Outlet", id: "power" },
              { name: "Window View", id: "window" },
              { name: "Dual Monitors", id: "monitors" },
              { name: "Ergonomic Chair", id: "ergonomic" },
            ].map((feature) => (
              <div key={feature.id} className="flex items-center gap-3 pl-6">
                <Checkbox 
                  id={feature.id}
                  checked={filters.features.selected.includes(feature.name)}
                  onCheckedChange={(checked: boolean | "indeterminate") => {
                    if (checked === true) {
                      setFilters(f => ({
                        ...f,
                        features: {
                          ...f.features,
                          selected: [...f.features.selected, feature.name]
                        }
                      }))
                    } else {
                      setFilters(f => ({
                        ...f,
                        features: {
                          ...f.features,
                          selected: f.features.selected.filter(name => name !== feature.name)
                        }
                      }))
                    }
                  }}
                />
                <Label htmlFor={feature.id} className="text-sm text-slate-600">
                  {feature.name}
                </Label>
              </div>
            ))}
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
                        {zones.find(z => z.id === selectedSeat.zoneId)?.name || "Unknown Zone"}
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
                    {[
                      { name: "Power Outlet", icon: Zap },
                      { name: "Window View", icon: Sun },
                      { name: "Dual Monitors", icon: Monitor },
                      { name: "Ergonomic Chair", icon: Armchair },
                    ].map((feature) => (
                      <div key={feature.name} className="flex items-center gap-3 text-sm text-slate-600">
                        <Checkbox 
                          checked={selectedSeat.features?.includes(feature.name)}
                          disabled
                          className="pointer-events-none"
                        />
                        <feature.icon className="w-4 h-4 text-slate-400" />
                        <span>{feature.name}</span>
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
