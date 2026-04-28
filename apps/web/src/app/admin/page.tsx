"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  LogOut, Shield, Users, MapPin, BarChart3, AlertTriangle, 
  Settings, FileText, Activity, Clock, TrendingUp, Database,
  CheckCircle, XCircle, Bell
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService, type AuthUser } from "@/services/auth.service"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const currentUser = await AuthService.getCurrentUser()
    
    // Redirect if not admin
    if (currentUser?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    setUser(currentUser)
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    await AuthService.signOut()
    // Clear role cookie
    document.cookie = "user-role=; path=/; max-age=0"
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mr-2">
                Admin
              </span>
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
          <p className="text-gray-500 mt-1">Library space management and analytics overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">--</div>
              <p className="text-xs text-gray-500 mt-1">Registered students</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#10B981]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Reservations</CardTitle>
              <MapPin className="w-4 h-4 text-[#10B981]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#10B981]">--</div>
              <p className="text-xs text-gray-500 mt-1">Current bookings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Occupancy Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">--%</div>
              <p className="text-xs text-gray-500 mt-1">Real-time usage</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Maintenance</CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">--</div>
              <p className="text-xs text-gray-500 mt-1">Seats under maintenance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#10B981]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full justify-start h-14">
                    <Users className="w-5 h-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Manage Users</div>
                      <div className="text-xs text-gray-500">View and edit student accounts</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14">
                    <MapPin className="w-5 h-5 mr-3 text-[#10B981]" />
                    <div className="text-left">
                      <div className="font-medium">Manage Zones</div>
                      <div className="text-xs text-gray-500">Configure study areas</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14">
                    <FileText className="w-5 h-5 mr-3 text-purple-500" />
                    <div className="text-left">
                      <div className="font-medium">View Reports</div>
                      <div className="text-xs text-gray-500">Analytics and usage stats</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Force Release Seat</div>
                      <div className="text-xs text-gray-500">Emergency seat unlock</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Database
                  </span>
                  <span className="text-xs font-medium text-emerald-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Authentication
                  </span>
                  <span className="text-xs font-medium text-emerald-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    API Service
                  </span>
                  <span className="text-xs font-medium text-emerald-600">Operational</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-500">
                  <p>No recent activity to display.</p>
                  <p className="text-xs">Activity logs will appear here once students begin making reservations.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
