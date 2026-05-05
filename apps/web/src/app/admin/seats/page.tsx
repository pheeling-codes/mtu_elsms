"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LayoutGrid, Armchair, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Zone {
  id: string
  name: string
  type: string
  color?: string
  seatCount?: number
}

const ZONE_COLORS: Record<string, string> = {
  "#10B981": "bg-emerald-500",
  "#3B82F6": "bg-blue-500",
  "#8B5CF6": "bg-purple-500",
  "#F43F5E": "bg-rose-500",
  "#F59E0B": "bg-amber-500",
  "#06B6D4": "bg-cyan-500",
  "#64748B": "bg-slate-500",
  "#6366F1": "bg-indigo-500",
}

export default function SeatManagementLanding() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .order("createdAt", { ascending: true })

      if (error) throw error
      
      // Get seat counts for each zone
      const zonesWithCounts = await Promise.all(
        (data || []).map(async (zone) => {
          const { count } = await supabase
            .from("seats")
            .select("*", { count: "exact", head: true })
            .eq("zoneId", zone.id)
          
          return {
            ...zone,
            color: zone.color || "#10B981",
            seatCount: count || 0,
          }
        })
      )
      
      setZones(zonesWithCounts)
    } catch (error) {
      console.error("Error fetching zones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoneClick = (zoneId: string) => {
    router.push(`/admin/seats/${zoneId}`)
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Seat Management</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Select a zone to manage its seats and layout
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/zones")}
          className="rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Zone
        </Button>
      </div>

      {/* Zone Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            No zones found
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Create a zone first to manage its seats
          </p>
          <Button
            onClick={() => router.push("/admin/zones")}
            className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Zone
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {zones.map((zone) => (
            <Card
              key={zone.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-slate-200 rounded-2xl group"
              onClick={() => handleZoneClick(zone.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    ZONE_COLORS[zone.color || "#10B981"] || "bg-emerald-500"
                  )}
                >
                  <Armchair className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {zone.seatCount} seats
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">
                {zone.name}
              </h3>
              <p className="text-sm text-slate-500 capitalize">
                {zone.type.toLowerCase()} Zone
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-[#10B981] font-medium group-hover:underline">
                  Manage Layout &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
