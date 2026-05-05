"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Plus, 
  Grid3X3, 
  Undo2, 
  Redo2, 
  Save,
  ChevronRight,
  ChevronLeft,
  Palette,
  Maximize2,
  Check,
  X,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Move
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Seat {
  id: string
  name: string
  zoneId: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
  x: number
  y: number
  width: number
  height: number
  features: string[]
  createdAt?: string
  updatedAt?: string
}

interface Zone {
  id: string
  name: string
  color: string
  gridBlockSize: number
  seatSize: number
  canvasWidth: number
  canvasHeight: number
  features?: string[]
  createdAt?: string
  updatedAt?: string
}

type HistoryState = {
  seats: Seat[]
  zone: Zone | null
}

const ZONE_COLORS = [
  { name: "Emerald", value: "#10B981", class: "bg-emerald-500" },
  { name: "Blue", value: "#3B82F6", class: "bg-blue-500" },
  { name: "Purple", value: "#8B5CF6", class: "bg-purple-500" },
  { name: "Rose", value: "#F43F5E", class: "bg-rose-500" },
  { name: "Amber", value: "#F59E0B", class: "bg-amber-500" },
  { name: "Cyan", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "Slate", value: "#64748B", class: "bg-slate-500" },
  { name: "Indigo", value: "#6366F1", class: "bg-indigo-500" },
]

const SEAT_FEATURES = [
  { id: "window", label: "Window View" },
  { id: "power", label: "Power Outlets" },
  { id: "quiet", label: "Quiet Zone" },
  { id: "group", label: "Group Study" },
  { id: "wifi", label: "WiFi Connection" },
  { id: "pod", label: "Individual Pod" },
]

export default function SeatManagementPage() {
  const params = useParams()
  const router = useRouter()
  const zoneId = params.zoneId as string
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Zone and seats state
  const [zone, setZone] = useState<Zone | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // UI state
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Editing state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingSeat, setDraggingSeat] = useState<string | null>(null)
  const [resizingCanvas, setResizingCanvas] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  // Fetch zone and seats
  useEffect(() => {
    if (zoneId) {
      fetchZoneAndSeats()
    }
  }, [zoneId])

  const fetchZoneAndSeats = async () => {
    try {
      setIsLoading(true)

      const { data: zoneData, error: zoneError } = await supabase
        .from("zones")
        .select("*")
        .eq("id", zoneId)
        .single()

      if (zoneError) throw zoneError
      
      // Map snake_case columns to camelCase
      const zoneWithDefaults: Zone = {
        ...zoneData,
        color: zoneData.color || "#10B981",
        gridBlockSize: zoneData.grid_block_size || 0.5,
        seatSize: zoneData.seat_size || 1.0,
        canvasWidth: zoneData.canvas_width || 20,
        canvasHeight: zoneData.canvas_height || 15,
        features: zoneData.features || [],
      }
      setZone(zoneWithDefaults)

      const { data: seatsData, error: seatsError } = await supabase
        .from("seats")
        .select("*")
        .eq("zoneId", zoneId)
        .order("createdAt", { ascending: true })

      if (seatsError) throw seatsError
      
      // Map database columns to Seat interface
      const mappedSeats: Seat[] = (seatsData || []).map((s: any) => ({
        id: s.id,
        name: s.seatNumber || s.name || "",
        zoneId: s.zoneId,
        status: s.status,
        x: s.x || 0,
        y: s.y || 0,
        width: s.width || 50,
        height: s.height || 50,
        features: s.features || [],
      }))
      setSeats(mappedSeats)

      // Initialize history
      setHistory([{ seats: mappedSeats, zone: zoneWithDefaults }])
      setHistoryIndex(0)
    } catch (error) {
      console.error("Error fetching zone/seats:", error)
      toast({
        title: "Error",
        description: "Failed to load zone data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // History management
  const addToHistory = useCallback((newSeats: Seat[], newZone: Zone | null) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ seats: newSeats, zone: newZone })
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setSeats(history[newIndex].seats)
      setZone(history[newIndex].zone)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setSeats(history[newIndex].seats)
      setZone(history[newIndex].zone)
    }
  }

  // Snap seats to grid
  const snapToGrid = () => {
    if (!zone) return
    
    const gridSize = zone.gridBlockSize * 50 // Convert meters to pixels
    const snappedSeats = seats.map(seat => ({
      ...seat,
      x: Math.round(seat.x / gridSize) * gridSize,
      y: Math.round(seat.y / gridSize) * gridSize,
    }))
    
    setSeats(snappedSeats)
    addToHistory(snappedSeats, zone)
    toast({
      title: "Snapped to Grid",
      description: "All seats aligned to nearest grid intersection",
      className: "bg-emerald-600 text-white",
    })
  }

  // Add new seat
  const addSeat = () => {
    if (!zone) return

    const seatSize = zone.seatSize * 50
    const newSeat: Seat = {
      id: crypto.randomUUID(),
      name: `Seat ${seats.length + 1}`,
      zoneId: zoneId,
      status: "AVAILABLE",
      x: 100,
      y: 100,
      width: seatSize,
      height: seatSize,
      features: [],
    }

    const newSeats = [...seats, newSeat]
    setSeats(newSeats)
    addToHistory(newSeats, zone)
  }

  // Duplicate selected seats
  const handleDuplicateSelected = () => {
    if (!zone || selectedSeats.length === 0) return

    const duplicatedSeats = selectedSeats.map(seatId => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return null
      return {
        ...seat,
        id: crypto.randomUUID(),
        name: `${seat.name} (Copy)`,
        x: seat.x + zone.gridBlockSize * 50,
        y: seat.y + zone.gridBlockSize * 50,
      }
    }).filter(Boolean) as Seat[]

    const newSeats = [...seats, ...duplicatedSeats]
    setSeats(newSeats)
    setSelectedSeats(duplicatedSeats.map(s => s.id))
    addToHistory(newSeats, zone)
    toast({
      title: "Seats Duplicated",
      description: `Created ${duplicatedSeats.length} copy`,
      className: "bg-emerald-600 text-white",
    })
  }

  // Move selected seats in direction
  const moveSelected = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!zone || selectedSeats.length === 0) return

    const gridSize = zone.gridBlockSize * 50
    const delta = {
      up: { x: 0, y: -gridSize },
      down: { x: 0, y: gridSize },
      left: { x: -gridSize, y: 0 },
      right: { x: gridSize, y: 0 },
    }[direction]

    const newSeats = seats.map(seat => {
      if (selectedSeats.includes(seat.id)) {
        return { ...seat, x: seat.x + delta.x, y: seat.y + delta.y }
      }
      return seat
    })

    setSeats(newSeats)
    addToHistory(newSeats, zone)
  }

  // Delete selected seats
  const handleDeleteSelected = () => {
    if (selectedSeats.length === 0) return

    const newSeats = seats.filter(seat => !selectedSeats.includes(seat.id))
    setSeats(newSeats)
    setSelectedSeats([])
    addToHistory(newSeats, zone)
    toast({
      title: "Seats Deleted",
      description: `Removed ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`,
      className: "bg-rose-600 text-white",
    })
  }

  // Update seat position
  const updateSeatPosition = (seatId: string, x: number, y: number) => {
    const newSeats = seats.map(seat =>
      seat.id === seatId ? { ...seat, x, y } : seat
    )
    setSeats(newSeats)
  }

  // Update seat name
  const updateSeatName = (seatId: string, name: string) => {
    const newSeats = seats.map(seat =>
      seat.id === seatId ? { ...seat, name } : seat
    )
    setSeats(newSeats)
  }

  // Toggle seat feature
  const toggleSeatFeature = (featureId: string) => {
    if (selectedSeats.length === 0) return

    const newSeats = seats.map(seat => {
      if (selectedSeats.includes(seat.id)) {
        const features = seat.features.includes(featureId)
          ? seat.features.filter(f => f !== featureId)
          : [...seat.features, featureId]
        return { ...seat, features }
      }
      return seat
    })

    setSeats(newSeats)
    addToHistory(newSeats, zone)
  }

  // Update zone settings
  const updateZone = (updates: Partial<Zone>) => {
    if (!zone) return
    const newZone = { ...zone, ...updates }
    setZone(newZone)
  }

  // Save all changes
  const saveLayout = async () => {
    setIsSaving(true)
    try {
      // Save zone settings (using snake_case for Supabase)
      const { error: zoneError } = await supabase
        .from("zones")
        .update({
          color: zone?.color,
          grid_block_size: zone?.gridBlockSize,
          seat_size: zone?.seatSize,
          canvas_width: zone?.canvasWidth,
          canvas_height: zone?.canvasHeight,
          features: zone?.features || [],
        })
        .eq("id", zoneId)

      if (zoneError) {
        console.error("Zone update error:", zoneError)
        throw zoneError
      }

      // Save seats (using snake_case for Supabase)
      for (const seat of seats) {
        // Extract number from seat name or use a fallback number
        const nameStr = String(seat.name || "");
        const seatNum = parseInt(nameStr.replace(/\D/g, '')) || Math.abs(seat.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % 10000

        const { error: seatError } = await supabase
          .from("seats")
          .upsert({
            id: seat.id,
            "seatNumber": seatNum,
            zoneId: seat.zoneId,
            status: seat.status,
            x: seat.x,
            y: seat.y,
            width: seat.width,
            height: seat.height,
            features: seat.features,
            updatedAt: new Date().toISOString(),
          })

        if (seatError) throw seatError
      }

      toast({
        title: "Layout Saved",
        description: "Zone configuration and seats persisted successfully",
        className: "bg-emerald-600 text-white",
      })
    } catch (error) {
      console.error("Error saving layout:", error)
      toast({
        title: "Error",
        description: "Failed to save layout",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Canvas resize handlers
  const handleCanvasResizeStart = (handle: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setResizingCanvas(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCanvas && zone) {
        const deltaX = (e.clientX - dragStart.x) / 50
        const deltaY = (e.clientY - dragStart.y) / 50

        if (resizeHandle === "right") {
          updateZone({ canvasWidth: Math.max(10, zone.canvasWidth + deltaX) })
        } else if (resizeHandle === "bottom") {
          updateZone({ canvasHeight: Math.max(10, zone.canvasHeight + deltaY) })
        } else if (resizeHandle === "corner") {
          updateZone({
            canvasWidth: Math.max(10, zone.canvasWidth + deltaX),
            canvasHeight: Math.max(10, zone.canvasHeight + deltaY),
          })
        }
        setDragStart({ x: e.clientX, y: e.clientY })
      }

      if (isDragging && draggingSeat) {
        updateSeatPosition(draggingSeat, e.clientX - 25, e.clientY - 25)
      }

      if (isDraggingSidebar) {
        setSidebarWidth(Math.max(280, Math.min(480, window.innerWidth - e.clientX)))
      }
    }

    const handleMouseUp = () => {
      if (resizingCanvas) {
        setResizingCanvas(false)
        setResizeHandle(null)
        if (zone) addToHistory(seats, zone)
      }
      if (isDragging) {
        setIsDragging(false)
        setDraggingSeat(null)
        if (zone) addToHistory(seats, zone)
      }
      if (isDraggingSidebar) {
        setIsDraggingSidebar(false)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingCanvas, isDragging, isDraggingSidebar, dragStart, draggingSeat, seats, zone, resizeHandle, addToHistory])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-slate-500">Zone not found</p>
      </div>
    )
  }

  const pixelsPerMeter = 50
  const canvasWidthPx = zone.canvasWidth * pixelsPerMeter
  const canvasHeightPx = zone.canvasHeight * pixelsPerMeter
  const gridSizePx = zone.gridBlockSize * pixelsPerMeter

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 w-full">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar - Fixed at top */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 sticky top-0 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/seats")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          {/* Zone Name */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs font-semibold"
              style={{ borderColor: zone.color, color: zone.color }}
            >
              {zone.name.toUpperCase()}
            </Badge>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Grid Scale Input */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>1 block =</span>
            <Input
              type="number"
              value={zone.gridBlockSize}
              onChange={(e) => updateZone({ gridBlockSize: parseFloat(e.target.value) || 0.5 })}
              className="w-16 h-8 text-sm"
              step={0.1}
              min={0.1}
            />
            <span>m</span>
          </div>

          {/* Duplicate Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateSelected}
            disabled={selectedSeats.length === 0}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Seat Size Input */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Seat Size:</span>
            <Input
              type="number"
              value={zone.seatSize}
              onChange={(e) => updateZone({ seatSize: parseFloat(e.target.value) || 1.0 })}
              className="w-16 h-8 text-sm"
              step={0.1}
              min={0.5}
            />
            <span>m</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            <select
              value={zone.color}
              onChange={(e) => updateZone({ color: e.target.value })}
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-white"
            >
              {ZONE_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={addSeat}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Seat
          </Button>

          <Button
            onClick={saveLayout}
            disabled={isSaving}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Layout
          </Button>

          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Canvas - Scrollable content only */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-slate-100 min-w-0 relative">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg"
            style={{
              width: canvasWidthPx,
              height: canvasHeightPx,
              backgroundImage: `
                linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
              `,
              backgroundSize: `${gridSizePx}px ${gridSizePx}px`,
              border: `2px dashed ${zone.color}`,
            }}
          >
            {/* Canvas Label */}
            <div
              className="absolute -top-6 left-0 text-xs font-semibold uppercase tracking-wider"
              style={{ color: zone.color }}
            >
              {zone.name}
            </div>

            {/* Seats */}
            {seats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id)
              const fontSize = Math.max(10, Math.min(14, seat.width / 3))
              
              return (
                <div
                  key={seat.id}
                  className={cn(
                    "absolute flex items-center justify-center cursor-pointer select-none transition-all",
                    isSelected ? "ring-2 ring-emerald-500 z-10" : "hover:ring-1 hover:ring-slate-300"
                  )}
                  style={{
                    left: seat.x,
                    top: seat.y,
                    width: seat.width,
                    height: seat.height,
                    backgroundColor: isSelected ? zone.color : `${zone.color}20`,
                    border: `1px solid ${zone.color}`,
                    borderRadius: 4,
                  }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSeats(selectedSeats.filter(id => id !== seat.id))
                    } else {
                      setSelectedSeats([...selectedSeats, seat.id])
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsDragging(true)
                    setDraggingSeat(seat.id)
                  }}
                >
                  <span 
                    className="font-medium text-slate-700 truncate px-1"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {seat.name}
                  </span>
                </div>
              )
            })}

            {/* Resize Handles */}
            <div
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-8 bg-white border-2 cursor-e-resize hover:bg-slate-100"
              style={{ borderColor: zone.color }}
              onMouseDown={handleCanvasResizeStart("right")}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-white border-2 cursor-s-resize hover:bg-slate-100"
              style={{ borderColor: zone.color }}
              onMouseDown={handleCanvasResizeStart("bottom")}
            />
            <div
              className="absolute -right-1 -bottom-1 w-4 h-4 bg-white border-2 cursor-se-resize hover:bg-slate-100"
              style={{ borderColor: zone.color }}
              onMouseDown={handleCanvasResizeStart("corner")}
            >
              <Maximize2 className="w-2 h-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: zone.color }} />
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sidebar */}
      {sidebarOpen && (
        <>
          {/* Resize Handle */}
          <div
            className="w-1 cursor-col-resize bg-slate-200 hover:bg-emerald-500 transition-colors"
            onMouseDown={() => setIsDraggingSidebar(true)}
          />

          {/* Sidebar Content */}
          <div 
            className="bg-white border-l border-slate-200 flex flex-col shrink-0 h-full"
            style={{ width: sidebarWidth }}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-semibold text-slate-900">Selection ({selectedSeats.length} Seats)</h3>
              {selectedSeats.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSeats([])}
                  className="h-8 px-2"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Click seats to select
                </p>
              ) : (
                <>
                  {/* Seat Name */}
                  {selectedSeats.length === 1 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Seat Name</Label>
                      <Input
                        value={seats.find(s => s.id === selectedSeats[0])?.name || ""}
                        onChange={(e) => updateSeatName(selectedSeats[0], e.target.value)}
                        className="h-10"
                      />
                    </div>
                  )}

                  {/* Movement Controls */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Move Seat</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveSelected('up')}
                      >
                        <span className="text-lg">↑</span>
                      </Button>
                      <div />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveSelected('left')}
                      >
                        <span className="text-lg">←</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveSelected('down')}
                      >
                        <span className="text-lg">↓</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveSelected('right')}
                      >
                        <span className="text-lg">→</span>
                      </Button>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="w-full gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
                  </Button>

                  {/* Seat Features */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Features</Label>
                    <div className="space-y-2">
                      {SEAT_FEATURES.map((feature) => {
                        const allSelectedHaveFeature = selectedSeats.every(seatId =>
                          seats.find(s => s.id === seatId)?.features.includes(feature.id)
                        )
                        const someSelectedHaveFeature = selectedSeats.some(seatId =>
                          seats.find(s => s.id === seatId)?.features.includes(feature.id)
                        )

                        return (
                          <div key={feature.id} className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors",
                                allSelectedHaveFeature
                                  ? "bg-emerald-500 border-emerald-500"
                                  : someSelectedHaveFeature
                                  ? "bg-emerald-200 border-emerald-400"
                                  : "bg-white border-slate-300 hover:border-slate-400"
                              )}
                              onClick={() => toggleSeatFeature(feature.id)}
                            >
                              {(allSelectedHaveFeature || someSelectedHaveFeature) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-slate-700">{feature.label}</span>
                          </div>
                        )
                      })}
                    </div>
                    {selectedSeats.length > 1 && (
                      <p className="text-xs text-slate-500">
                        Changes apply to all {selectedSeats.length} selected seats
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
