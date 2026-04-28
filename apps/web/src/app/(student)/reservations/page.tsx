"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Eye, X, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Reservation {
  id: string
  seatName: string
  zone: string
  date: string
  startTime: string
  endTime: string
  status: "active" | "upcoming" | "past"
  features: string[]
}

const mockReservations: Reservation[] = [
  {
    id: "1",
    seatName: "B5",
    zone: "Charging Zone",
    date: "Today, 24 Oct 2023",
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    status: "active",
    features: ["Power Outlet"],
  },
  {
    id: "2",
    seatName: "G10",
    zone: "Group Zone",
    date: "Tomorrow, 25 Oct 2023",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    status: "upcoming",
    features: ["Dual Monitors"],
  },
  {
    id: "3",
    seatName: "A11",
    zone: "Quiet Zone",
    date: "Mon, 28 Oct 2023",
    startTime: "09:00 AM",
    endTime: "01:00 PM",
    status: "upcoming",
    features: ["Window View"],
  },
]

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState("active")

  const filteredReservations = mockReservations.filter((r) => r.status === activeTab)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">Active</Badge>
      case "upcoming":
        return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">Upcoming</Badge>
      case "past":
        return <Badge variant="outline">Past</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
          <p className="text-gray-500 mt-1">Manage your current and upcoming library bookings.</p>
        </div>
        <Button className="bg-[#10B981] hover:bg-[#059669]">
          <Calendar className="w-4 h-4 mr-2" />
          New Reservation
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="active" className="data-[state=active]:bg-white">
            Active
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              1
            </span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white">
            Upcoming
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-white">
            Past
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              12
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReservations.length > 0 ? (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Seat Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#10B981]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Seat {reservation.seatName}</h3>
                          <p className="text-sm text-gray-500">{reservation.zone}</p>
                          <div className="flex gap-2 mt-1">
                            {reservation.features.map((feature) => (
                              <span key={feature} className="text-xs text-gray-400">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{reservation.date}</p>
                        <p className="text-sm text-gray-500">
                          {reservation.startTime} - {reservation.endTime}
                        </p>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-4">
                        {getStatusBadge(reservation.status)}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {reservation.status === "active" && (
                            <Button variant="outline" size="sm" className="text-[#F43F5E] hover:bg-[#F43F5E]/10">
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Check-in Banner for Active */}
                    {reservation.status === "active" && (
                      <div className="mt-4 p-4 bg-[#10B981]/5 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-[#10B981]" />
                          <span className="text-sm">Time remaining: 1h 45m</span>
                        </div>
                        <Button size="sm" className="bg-[#10B981] hover:bg-[#059669]">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Check In
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} reservations</h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === "past"
                    ? "Your reservation history will appear here."
                    : `You don't have any ${activeTab} reservations at the moment.`}
                </p>
                {activeTab !== "past" && (
                  <Button className="bg-[#10B981] hover:bg-[#059669]">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find a Seat
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
