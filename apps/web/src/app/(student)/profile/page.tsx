"use client"

import { useEffect, useState } from "react"
import { User, Mail, Hash, Clock, Calendar, Award, Bell, Smartphone, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AuthService, type AuthUser } from "@/services/auth.service"

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsReminders: false,
    defaultZonePreference: true,
  })

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  if (!user) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-[#10B981]/10 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-[#10B981]" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user.matricNumber || user.email}</h2>
                  <p className="text-gray-500">{user.role}</p>
                </div>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  {user.matricNumber || "No Matric Number"}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">42</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Across all library zones</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">128h</p>
                <p className="text-sm text-gray-500">Hours Spent</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">No-Shows</p>
              </div>
            </div>
            <p className="text-xs text-[#10B981] mt-4">Perfect attendance record</p>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive booking confirmations and reminders via email.</p>
              </div>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />
          </div>

          {/* SMS Reminders */}
          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">SMS Reminders</p>
                <p className="text-sm text-gray-500">Get an SMS reminder 15 minutes before your reservation starts.</p>
              </div>
            </div>
            <Switch
              checked={preferences.smsReminders}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, smsReminders: checked })
              }
            />
          </div>

          {/* Default Zone Preference */}
          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Default Zone Preference</p>
                <p className="text-sm text-gray-500">Prioritize seats from the Quiet Zone when finding a seat.</p>
              </div>
            </div>
            <Switch
              checked={preferences.defaultZonePreference}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, defaultZonePreference: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Sign Out</p>
              <p className="text-sm text-gray-500">Log out of your E-Library Space account on this device.</p>
            </div>
            <Button variant="outline" className="text-[#F43F5E] hover:bg-[#F43F5E]/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
