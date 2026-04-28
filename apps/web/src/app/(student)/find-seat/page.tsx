"use client"

import { useEffect, useState } from "react"
import { MapPin, Filter, ZoomIn, ZoomOut, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Seat {
  id: string
  name: string
  zone: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED"
  features: string[]
  x: number
  y: number
}

interface Zone {
  id: string
  name: string
  description: string
  color: string
}

export default function FindSeatPage() {
  const { toast } = useToast()
  const [seats, setSeats] = useState<Seat[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [scale, setScale] = useState(1)

  useEffect(() => {
    fetchZones()
    fetchSeats()

    // Subscribe to real-time seat updates
    const channel = supabase
      .channel("seat_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seats" },
        (payload: { new?: Seat }) => {
          console.log("Seat update:", payload)
          fetchSeats()
          if (selectedSeat && payload.new && payload.new.id === selectedSeat.id) {
            setSelectedSeat(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSeat])

  const fetchZones = async () => {
    const { data } = await supabase.from("zones").select("*")
    if (data) {
      setZones(data)
    }
  }

  const fetchSeats = async () => {
    const { data } = await supabase.from("seats").select("*")
    if (data) {
      setSeats(data)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-[#10B981] hover:bg-[#059669]"
      case "OCCUPIED":
        return "bg-[#F43F5E] cursor-not-allowed"
      case "RESERVED":
        return "bg-[#F59E0B] cursor-not-allowed"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">
            Available
          </Badge>
        )
      case "OCCUPIED":
        return (
          <Badge className="bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/20">
            Occupied
          </Badge>
        )
      case "RESERVED":
        return (
          <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
            Reserved
          </Badge>
        )
    }
  }

  const filteredSeats = seats.filter((seat) => {
    if (filter === "all") return true
    return seat.status.toLowerCase() === filter
  })

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "AVAILABLE") {
      setSelectedSeat(seat)
    } else {
      toast({
        variant: "destructive",
        title: "Seat Unavailable",
        description: `This seat is currently ${seat.status.toLowerCase()}.`,
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Seat</h1>
          <p className="text-gray-500 mt-1">
            Browse the library map and reserve your perfect study spot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Map Area */}
        <div className="flex-1">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              {/* Filter Bar */}
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Filter:</span>
                {["all", "available", "occupied", "reserved"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={filter === f ? "bg-[#10B981] hover:bg-[#059669]" : ""}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#10B981]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#F43F5E]" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#F59E0B]" />
                  <span>Reserved</span>
                </div>
              </div>

              {/* Seat Grid */}
              <div
                className="relative bg-gray-50 rounded-lg p-8 min-h-[500px] overflow-auto"
                style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
                {/* Zone Labels */}
                {zones.map((zone: Zone) => (
                  <div
                    key={zone.id}
                    className="absolute text-sm font-semibold text-gray-400 uppercase tracking-wider"
                    style={{ left: 20, top: 20 }}
                  >
                    {zone.name}
                  </div>
                ))}

                {/* Seats */}
                <div className="grid grid-cols-6 gap-4 mt-12">
                  {filteredSeats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      className={`relative w-16 h-16 rounded-lg flex items-center justify-center text-white font-semibold transition-all hover:scale-105 ${getStatusColor(
                        seat.status
                      )} ${selectedSeat?.id === seat.id ? "ring-4 ring-blue-400" : ""}`}
                    >
                      {seat.name}
                      {seat.features.includes("power") && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="w-80 space-y-4">
          {selectedSeat ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Seat {selectedSeat.name}</CardTitle>
                  {getStatusBadge(selectedSeat.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Zone</p>
                  <p className="font-medium">{selectedSeat.zone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeat.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-3">Schedule Reservation</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Date</label>
                      <input
                        type="date"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Start</label>
                        <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                          <option>08:00 AM</option>
                          <option>09:00 AM</option>
                          <option>10:00 AM</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">End</label>
                        <select className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                          <option>12:00 PM</option>
                          <option>02:00 PM</option>
                          <option>04:00 PM</option>
                        </select>
                      </div>
                    </div>
                    <Button className="w-full bg-[#10B981] hover:bg-[#059669]">
                      Reserve Seat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Select an available seat on the map to view details and make a reservation.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Map Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available</span>
                <span className="font-medium text-[#10B981]">
                  {seats.filter((s) => s.status === "AVAILABLE").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Occupied</span>
                <span className="font-medium text-[#F43F5E]">
                  {seats.filter((s) => s.status === "OCCUPIED").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reserved</span>
                <span className="font-medium text-[#F59E0B]">
                  {seats.filter((s) => s.status === "RESERVED").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
