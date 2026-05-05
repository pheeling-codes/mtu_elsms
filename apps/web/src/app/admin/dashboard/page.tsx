"use client"

import { useEffect, useState } from "react"
import {
  Armchair,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  AlertTriangle,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  Filter,
  BarChart3,
  Clock3,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface DashboardMetrics {
  totalSeats: number
  occupancyRate: number
  activeReservations: number
  noShowRate: number
}

interface SeatUsageData {
  day: string
  usage: number
}

interface PeakHourData {
  hour: string
  occupancy: number
}

interface Alert {
  id: string
  type: "overdue" | "warning" | "info"
  title: string
  description: string
  time: string
}

interface Activity {
  id: string
  user: string
  action: string
  seat?: string
  zone?: string
  time: string
  type: "check-in" | "reservation" | "check-out"
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSeats: 0,
    occupancyRate: 0,
    activeReservations: 0,
    noShowRate: 0,
  })
  const [seatUsageData, setSeatUsageData] = useState<SeatUsageData[]>([])
  const [peakHoursData, setPeakHoursData] = useState<PeakHourData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState("Today, Oct 24, 2023")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch seats data
      const { data: seatsData, error: seatsError } = await supabase
        .from("seats")
        .select("status")

      if (seatsError) throw seatsError

      const totalSeats = seatsData?.length || 0
      const occupiedSeats = seatsData?.filter((s: { status: string }) => s.status === "OCCUPIED").length || 0
      const maintenanceSeats = seatsData?.filter((s: { status: string }) => s.status === "MAINTENANCE").length || 0

      // Fetch reservations data
      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select("status")

      if (reservationsError) throw reservationsError

      const activeReservations = reservationsData?.filter(
        (r: { status: string }) => r.status === "ACTIVE" || r.status === "confirmed"
      ).length || 0

      const completedReservations = reservationsData?.filter(
        (r: { status: string }) => r.status === "COMPLETED" || r.status === "completed"
      ).length || 0

      const noShowReservations = reservationsData?.filter(
        (r: { status: string }) => r.status === "NO_SHOW" || r.status === "no_show"
      ).length || 0

      const totalCompleted = completedReservations + noShowReservations
      const noShowRate = totalCompleted > 0 ? (noShowReservations / totalCompleted) * 100 : 0

      // Calculate occupancy rate
      const availableSeats = totalSeats - maintenanceSeats
      const occupancyRate = availableSeats > 0 ? (occupiedSeats / availableSeats) * 100 : 0

      setMetrics({
        totalSeats,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        activeReservations,
        noShowRate: Math.round(noShowRate * 10) / 10,
      })

      // Set chart data (mock for now, can be connected to real data later)
      setSeatUsageData([
        { day: "Mon", usage: 320 },
        { day: "Tue", usage: 380 },
        { day: "Wed", usage: 420 },
        { day: "Thu", usage: 450 },
        { day: "Fri", usage: 380 },
        { day: "Sat", usage: 280 },
        { day: "Sun", usage: 250 },
      ])

      setPeakHoursData([
        { hour: "08:00", occupancy: 20 },
        { hour: "10:00", occupancy: 65 },
        { hour: "12:00", occupancy: 95 },
        { hour: "14:00", occupancy: 88 },
        { hour: "16:00", occupancy: 55 },
        { hour: "18:00", occupancy: 30 },
      ])

      // Fetch recent reservations for activity feed
      const { data: recentReservations, error: recentError } = await supabase
        .from("reservations")
        .select(`
          id,
          status,
          createdAt,
          userId,
          seat:seats (seatNumber, zone:zones (name))
        `)
        .order("createdAt", { ascending: false })
        .limit(10)

      if (!recentError && recentReservations) {
        const mappedActivities: Activity[] = recentReservations.map((r: any) => ({
          id: r.id,
          user: "User",
          action: r.status === "ACTIVE" ? "checked into" : r.status === "COMPLETED" ? "checked out of" : "reserved",
          seat: r.seat?.seatNumber ? `Seat ${r.seat.seatNumber}` : undefined,
          zone: r.seat?.zone?.name,
          time: formatTimeAgo(r.createdAt),
          type: r.status === "ACTIVE" ? "check-in" : r.status === "COMPLETED" ? "check-out" : "reservation",
        }))
        setActivities(mappedActivities)
      }

      // Generate mock alerts for now
      setAlerts([
        {
          id: "1",
          type: "overdue",
          title: "Overdue: Gideon M. missed check-in window",
          description: "Seat B5 - Seat automatically released",
          time: "2 mins ago",
        },
        {
          id: "2",
          type: "warning",
          title: "Warning: Quiet Zone A at 98% capacity",
          description: "Consider opening additional zones",
          time: "15 mins ago",
        },
        {
          id: "3",
          type: "overdue",
          title: "Reservation for Seat G12 expired with no show",
          description: "45 mins ago - Seat now available",
          time: "45 mins ago",
        },
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const kpiCards = [
    {
      title: "Total Seats",
      value: metrics.totalSeats,
      icon: Armchair,
      trend: "+12 from last month",
      trendUp: true,
      borderColor: "border-gray-300",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      title: "Occupancy Rate",
      value: `${metrics.occupancyRate}%`,
      icon: Clock,
      trend: "+5.2% from yesterday",
      trendUp: true,
      borderColor: "border-[#10B981]",
      iconBg: "bg-[#10B981]/10",
      iconColor: "text-[#10B981]",
    },
    {
      title: "Active Reservations",
      value: metrics.activeReservations,
      icon: CalendarDays,
      trend: "Right now",
      trendUp: null,
      borderColor: "border-blue-400",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "No-show Rate",
      value: `${metrics.noShowRate}%`,
      icon: AlertTriangle,
      trend: "-1.1% from last week",
      trendUp: true,
      borderColor: "border-red-400",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ]

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
    }
  }

  const getAlertBadge = (type: Alert["type"]) => {
    switch (type) {
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-medium text-xs">
            OVERDUE
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-medium text-xs">
            WARNING
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium text-xs">
            INFO
          </Badge>
        )
    }
  }

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "check-in":
        return (
          <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-[#10B981]" />
          </div>
        )
      case "check-out":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock3 className="w-4 h-4 text-blue-500" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-purple-500" />
          </div>
        )
    }
  }

  // Find max value for highlighting
  const maxUsage = Math.max(...seatUsageData.map(d => d.usage), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">Library space management and analytics overview</p>
        </div>

        {/* Date Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700">{selectedDate}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setSelectedDate("Today, Oct 24, 2023")} className="rounded-lg">
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Yesterday, Oct 23, 2023")} className="rounded-lg">
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Last 7 Days")} className="rounded-lg">
              Last 7 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Last 30 Days")} className="rounded-lg">
              Last 30 Days
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Cards - Minimalist with clean borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* Total Seats */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Seats</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-slate-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metrics.totalSeats || 450}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs text-[#10B981] font-medium">+12</span>
                  <span className="text-xs text-slate-400">from last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Rate */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Occupancy Rate</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metrics.occupancyRate || 68}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs text-[#10B981] font-medium">+5.2%</span>
                  <span className="text-xs text-slate-400">from yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Reservations */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Active Reservations</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metrics.activeReservations || 124}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-slate-400">Right now</span>
                </div>
              </CardContent>
            </Card>

            {/* No-show Rate */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">No-show Rate</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{metrics.noShowRate || 4.2}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs text-[#10B981] font-medium">-1.1%</span>
                  <span className="text-xs text-slate-400">from last week</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seat Usage Over Time */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Seat Usage Over Time</CardTitle>
              <p className="text-sm text-slate-500">Daily seat utilization</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669] rounded-xl">
              Last 7 Days
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seatUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Bar dataKey="usage" radius={[6, 6, 0, 0]} barSize={40}>
                      {seatUsageData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.usage === maxUsage ? '#10B981' : '#10B98120'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Peak Hours (Today)</CardTitle>
              <p className="text-sm text-slate-500">Library occupancy by hour</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669] rounded-xl">
              All Zones
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {peakHoursData.map((hour, index) => {
                  const isPeak = hour.occupancy >= 80
                  return (
                    <div key={hour.hour} className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 w-14">{hour.hour}</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-lg transition-all duration-500",
                            isPeak ? "bg-[#10B981]" : "bg-[#10B981]/20"
                          )}
                          style={{ width: `${hour.occupancy}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-medium w-10 text-right",
                        isPeak ? "text-[#10B981]" : "text-slate-600"
                      )}>
                        {hour.occupancy}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">System Alerts</CardTitle>
              <p className="text-sm text-slate-500">High-priority events requiring attention</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669] rounded-xl font-medium">
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {alert.type === "overdue" ? (
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                  ) : alert.type === "warning" ? (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {alert.type === "overdue" ? (
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-semibold px-2 py-0.5">
                          OVERDUE
                        </Badge>
                      ) : alert.type === "warning" ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-semibold px-2 py-0.5">
                          WARNING
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 text-[10px] font-semibold px-2 py-0.5">
                          INFO
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">{alert.time}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Live Activity Feed</CardTitle>
              <p className="text-sm text-slate-500">Real-time stream of library activities</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669] rounded-xl font-medium">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {activity.type === "check-in" ? (
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    </div>
                  ) : activity.type === "check-out" ? (
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Clock3 className="w-4 h-4 text-blue-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-purple-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        {activity.action}
                        {activity.seat && (
                          <span className="font-medium text-[#10B981]"> {activity.seat}</span>
                        )}
                      </p>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                    {activity.zone && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {activity.zone}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No recent activity</p>
                <p className="text-xs text-slate-400 mt-1">Activity logs will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
