"use client"

import { useEffect, useState } from "react"
import {
  Armchair,
  Clock,
  CalendarDays,
  AlertTriangle,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock3,
  MapPin,
  ArrowRight,
  Filter,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 mt-1">Library space management and analytics overview</p>
        </div>

        {/* Date Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              {selectedDate}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedDate("Today, Oct 24, 2023")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Yesterday, Oct 23, 2023")}>
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Last 7 Days")}>
              Last 7 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedDate("Last 30 Days")}>
              Last 30 Days
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={index}
              className={cn(
                "border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow",
                card.borderColor
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {card.title}
                </CardTitle>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.iconBg)}>
                  <Icon className={cn("w-5 h-5", card.iconColor)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                <p className={cn(
                  "text-xs mt-1 font-medium",
                  card.trendUp === true ? "text-[#10B981]" : card.trendUp === false ? "text-red-500" : "text-gray-500"
                )}>
                  {card.trendUp === true && "↗ "}
                  {card.trendUp === false && "↘ "}
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">System Alerts</CardTitle>
              <p className="text-sm text-gray-500">High-priority events requiring attention</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669]">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getAlertBadge(alert.type)}
                    <span className="text-xs text-gray-400">{alert.time}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Live Activity Feed</CardTitle>
              <p className="text-sm text-gray-500">Real-time stream of library activities</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669]">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        {activity.action}
                        {activity.seat && (
                          <span className="font-medium text-[#10B981]"> {activity.seat}</span>
                        )}
                      </p>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                    {activity.zone && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {activity.zone}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No recent activity to display</p>
                <p className="text-xs text-gray-400 mt-1">
                  Activity logs will appear here once students begin making reservations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
