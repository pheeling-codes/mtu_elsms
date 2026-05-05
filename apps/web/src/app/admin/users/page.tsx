"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search,
  Filter,
  Users,
  BookOpen,
  UserX,
  Edit,
  Ban,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

interface UserData {
  id: string
  matricNumber: string
  role: "STUDENT" | "ADMIN"
  createdAt: string
  email?: string
}

interface ReservationData {
  id: string
  seatId: string
  startTime: string
  endTime: string
  status: string
  seat: {
    seatNumber: string
    zone: {
      name: string
    }
  }
}

interface UserStats {
  totalReservations: number
  noShows: number
  recentReservations: ReservationData[]
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [userToSuspend, setUserToSuspend] = useState<UserData | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, matricNumber, role, createdAt")
        .order("createdAt", { ascending: false })

      if (usersError) throw usersError

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      const emailMap = new Map()
      if (!authError && authUsers?.users) {
        authUsers.users.forEach((authUser: any) => {
          emailMap.set(authUser.id, authUser.email)
        })
      }

      const transformedUsers: UserData[] = (usersData || []).map((user: any) => ({
        id: user.id,
        matricNumber: user.matricNumber,
        role: user.role,
        createdAt: user.createdAt,
        email: emailMap.get(user.id) || `${user.matricNumber.toLowerCase()}@university.edu`,
      }))

      setUsers(transformedUsers)
      setFilteredUsers(transformedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let filtered = users

    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (user) => user.role.toLowerCase() === roleFilter.toLowerCase()
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.matricNumber.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, users])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const subscription = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUsers])

  const fetchUserStats = async (userId: string) => {
    setIsLoadingStats(true)
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId)

      if (totalError) throw totalError

      const { data: recentData, error: recentError } = await supabase
        .from("reservations")
        .select(`
          id,
          seatId,
          startTime,
          endTime,
          status,
          seats:seatId (
            seatNumber,
            zones:zoneId (
              name
            )
          )
        `)
        .eq("userId", userId)
        .order("startTime", { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      const recentReservations: ReservationData[] = (recentData || []).map((r: any) => ({
        id: r.id,
        seatId: r.seatId,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        seat: {
          seatNumber: r.seats?.seatNumber || "-",
          zone: {
            name: r.seats?.zones?.name || "Unknown",
          },
        },
      }))

      setUserStats({
        totalReservations: totalCount || 0,
        noShows: 0,
        recentReservations,
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
      setUserStats({
        totalReservations: 0,
        noShows: 0,
        recentReservations: [],
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleRowClick = (user: UserData) => {
    setSelectedUser(user)
    setIsSheetOpen(true)
    fetchUserStats(user.id)
  }

  const handleSuspend = async () => {
    if (!userToSuspend) return

    try {
      const { error: cancelError } = await supabase
        .from("reservations")
        .update({ status: "CANCELLED" })
        .eq("userId", userToSuspend.id)
        .in("status", ["UPCOMING", "ACTIVE"])

      if (cancelError) {
        console.error("Error cancelling reservations:", cancelError)
      }

      toast({
        title: "User Suspended",
        description: `${userToSuspend.matricNumber} has been suspended`,
        className: "bg-rose-600 text-white",
      })
    } catch (error) {
      console.error("Error suspending user:", error)
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      })
    } finally {
      setSuspendDialogOpen(false)
      setUserToSuspend(null)
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="p-10 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Users</h1>
        <p className="text-slate-500">Manage students and administrators.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, matric number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg border-slate-200 bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32 h-10 rounded-lg border-slate-200 bg-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="actions">
            <SelectTrigger className="w-36 h-10 rounded-lg border-slate-200 bg-white">
              <span className="text-sm">Bulk Actions</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="actions" disabled>Select Action</SelectItem>
              <SelectItem value="suspend">Suspend Selected</SelectItem>
              <SelectItem value="activate">Activate Selected</SelectItem>
              <SelectItem value="export">Export to CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-20 h-6" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? "No users found" : "No users registered"}
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              {searchQuery
                ? "No users match your search criteria. Try adjusting your filters."
                : "No users have been registered in the system yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 items-center">
              <Checkbox
                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                onCheckedChange={toggleAllSelection}
                className="rounded border-slate-300"
              />
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">User</div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Email</div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Matric Number</div>
              <div className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Role</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(user)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="rounded border-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.matricNumber.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-slate-900">{user.matricNumber}</p>
                  </div>
                  <div className="text-sm text-slate-600 truncate">{user.email}</div>
                  <div className="text-sm text-slate-700">{user.role === "ADMIN" ? "-" : user.matricNumber}</div>
                  <div>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {user.role === "ADMIN" ? "Admin" : "Student"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">Showing {filteredUsers.length} of {users.length} users</p>
              {selectedUsers.size > 0 && (
                <p className="text-sm text-slate-500">{selectedUsers.size} selected</p>
              )}
            </div>
          </>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader className="px-6 py-6 border-b border-slate-200">
                <SheetTitle className="text-lg font-semibold text-slate-900">User Profile</SheetTitle>
              </SheetHeader>

              {isLoadingStats ? (
                <div className="p-6 space-y-6">
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-24 h-24 rounded-full mb-4" />
                    <Skeleton className="w-32 h-6 mb-2" />
                    <Skeleton className="w-20 h-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-6 space-y-8">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
                      {selectedUser.matricNumber.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedUser.matricNumber}</h2>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        selectedUser.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {selectedUser.role === "ADMIN" ? "Admin" : "Student"}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Matric Number</p>
                        <p className="text-sm font-medium text-slate-900">{selectedUser.role === "ADMIN" ? "-" : selectedUser.matricNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="text-sm font-medium text-slate-900 break-all">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Role</p>
                        <p className="text-sm font-medium text-slate-900 capitalize">{selectedUser.role.toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Joined</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {userStats && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Activity Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Total Reservations</span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{userStats.totalReservations}</p>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <UserX className="w-4 h-4 text-rose-500" />
                            <span className="text-xs text-rose-600">No-shows</span>
                          </div>
                          <p className="text-2xl font-bold text-rose-700">{userStats.noShows}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {userStats && userStats.recentReservations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Reservations</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userStats.recentReservations.map((res) => (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-slate-900">Seat {res.seat.seatNumber} - {res.seat.zone.name}</p>
                              <p className="text-xs text-slate-500">{formatDate(res.startTime)}</p>
                            </div>
                            <Badge
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs",
                                res.status === "COMPLETED" ? "bg-slate-100 text-slate-600" :
                                res.status === "CANCELLED" ? "bg-rose-100 text-rose-700" :
                                res.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                                "bg-slate-100 text-slate-600"
                              )}
                            >
                              {res.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Admin Actions</h3>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-lg border-[#10B981] text-[#10B981] hover:bg-emerald-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-lg border-rose-500 text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          setUserToSuspend(selectedUser)
                          setSuspendDialogOpen(true)
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend <strong>{userToSuspend?.matricNumber}</strong>&apos;s account and cancel all their active reservations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} className="rounded-lg bg-rose-600 hover:bg-rose-700">
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
