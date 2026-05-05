"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  VolumeX,
  Users,
  Zap,
  Pencil,
  Trash2,
  LayoutGrid,
  Search,
  X,
  Check,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Zone {
  id: string
  name: string
  type: "QUIET" | "GROUP" | "CHARGING"
  createdAt: string
  updatedAt: string
  seatCount?: number
}

interface ZoneFormData {
  name: string
  type: "QUIET" | "GROUP" | "CHARGING"
}

const zoneTypeConfig = {
  QUIET: {
    label: "Quiet Zone",
    icon: VolumeX,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
  },
  GROUP: {
    label: "Group Zone",
    icon: Users,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    bgColor: "bg-purple-50",
  },
  CHARGING: {
    label: "Charging Zone",
    icon: Zap,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    bgColor: "bg-amber-50",
  },
}

export default function ZonesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ZoneFormData>({ name: "", type: "QUIET" })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null)
  const [newZoneForm, setNewZoneForm] = useState<ZoneFormData>({ name: "", type: "QUIET" })

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      setIsLoading(true)
      
      // Fetch zones with seat counts
      const { data: zonesData, error: zonesError } = await supabase
        .from("zones")
        .select("*, seats:seats(count)")
        .order("createdAt", { ascending: false })

      if (zonesError) throw zonesError

      const formattedZones: Zone[] = (zonesData || []).map((z: any) => ({
        ...z,
        seatCount: z.seats?.[0]?.count || 0,
      }))

      setZones(formattedZones)
    } catch (error) {
      console.error("Error fetching zones:", error)
      toast({
        title: "Error",
        description: "Failed to load zones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddZone = async () => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("zones")
        .insert({
          id: crypto.randomUUID(),
          name: newZoneForm.name,
          type: newZoneForm.type,
          "createdAt": now,
          "updatedAt": now,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Zone created successfully",
        className: "bg-[#10B981] text-white border-none",
      })

      setIsAddDialogOpen(false)
      setNewZoneForm({ name: "", type: "QUIET" })
      fetchZones()
    } catch (error) {
      console.error("Error adding zone:", error)
      toast({
        title: "Error",
        description: "Failed to create zone",
        variant: "destructive",
      })
    }
  }

  const handleUpdateZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from("zones")
        .update({
          name: editForm.name,
          type: editForm.type,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", zoneId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Zone updated successfully",
        className: "bg-[#10B981] text-white border-none",
      })

      setEditingZone(null)
      fetchZones()
    } catch (error) {
      console.error("Error updating zone:", error)
      toast({
        title: "Error",
        description: "Failed to update zone",
        variant: "destructive",
      })
    }
  }

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return

    try {
      const { error } = await supabase
        .from("zones")
        .delete()
        .eq("id", zoneToDelete.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Zone deleted successfully",
        className: "bg-[#10B981] text-white border-none",
      })

      setIsDeleteDialogOpen(false)
      setZoneToDelete(null)
      fetchZones()
    } catch (error) {
      console.error("Error deleting zone:", error)
      toast({
        title: "Error",
        description: "Failed to delete zone",
        variant: "destructive",
      })
    }
  }

  const startEditing = (zone: Zone) => {
    setEditingZone(zone.id)
    setEditForm({ name: zone.name, type: zone.type })
  }

  const cancelEditing = () => {
    setEditingZone(null)
    setEditForm({ name: "", type: "QUIET" })
  }

  const navigateToSeats = (zoneId: string) => {
    router.push(`/admin/seats/${zoneId}`)
  }

  const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Generate simple grid preview based on zone type
  const MapPreview = ({ type, seatCount }: { type: string; seatCount: number }) => {
    const config = zoneTypeConfig[type as keyof typeof zoneTypeConfig] || zoneTypeConfig.QUIET
    const gridSize = Math.min(Math.ceil(Math.sqrt(seatCount || 4)), 4)
    
    return (
      <div className={cn("w-12 h-12 rounded-lg p-1 grid gap-0.5", config.bgColor)}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-sm",
              i < (seatCount || 4) ? config.color.split(" ")[0].replace("bg-", "bg-").replace("100", "400") : "bg-slate-200/50"
            )}
            style={{ width: "100%", height: "100%" }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zone Management</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage library sections, capacities, and layout logic.
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Add New Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Add New Zone</DialogTitle>
              <DialogDescription className="text-slate-500">
                Create a new library zone with type and capacity.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Zone Name</label>
                <Input
                  placeholder="e.g., North Wing Quiet Area"
                  value={newZoneForm.name}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Zone Type</label>
                <Select
                  value={newZoneForm.type}
                  onValueChange={(value: any) => setNewZoneForm({ ...newZoneForm, type: value })}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="QUIET">Quiet Zone</SelectItem>
                    <SelectItem value="GROUP">Group Zone</SelectItem>
                    <SelectItem value="CHARGING">Charging Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddZone}
                disabled={!newZoneForm.name.trim()}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl"
              >
                Create Zone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search zones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-xl border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20"
        />
      </div>

      {/* Zones Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Zone Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Map Preview
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton loading
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredZones.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      No zones found
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Add your first library zone to get started"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Zone
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => {
                  const config = zoneTypeConfig[zone.type] || zoneTypeConfig.QUIET
                  const Icon = config.icon
                  const isEditing = editingZone === zone.id

                  return (
                    <tr
                      key={zone.id}
                      className={cn(
                        "hover:bg-slate-50 transition-colors",
                        isEditing && "bg-[#10B981]/5"
                      )}
                    >
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full rounded-xl border-slate-200"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => navigateToSeats(zone.id)}
                            className="flex items-center gap-3 hover:text-[#10B981] transition-colors"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                config.bgColor
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-slate-900">
                              {zone.name}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <Select
                            value={editForm.type}
                            onValueChange={(value: any) =>
                              setEditForm({ ...editForm, type: value })
                            }
                          >
                            <SelectTrigger className="w-40 rounded-xl border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="QUIET">Quiet Zone</SelectItem>
                              <SelectItem value="GROUP">Group Zone</SelectItem>
                              <SelectItem value="CHARGING">Charging Zone</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium border",
                              config.color
                            )}
                          >
                            {config.label}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {zone.seatCount || 0} Seats
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => navigateToSeats(zone.id)}>
                          <MapPreview type={zone.type} seatCount={zone.seatCount || 0} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              className="rounded-xl border-slate-200 h-8 px-3"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateZone(zone.id)}
                              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl h-8 px-3"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditing(zone)}
                              className="p-2 rounded-lg text-slate-400 hover:text-[#10B981] hover:bg-[#10B981]/10 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setZoneToDelete(zone)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-slate-900">
              Delete {zoneToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. This will permanently delete the zone
              and all associated seats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Delete Zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
