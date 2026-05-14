// FINAL admin reservations page - completely fresh approach
"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function ReservationsPage() {
  const { toast } = useToast()
  const [reservations, setReservations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(0)

  const fetchReservations = useCallback(async () => {
    console.log("=== FINAL ADMIN RESERVATIONS FETCH ===", new Date().toISOString())
    setIsLoading(true)
    
    try {
      // Most basic query possible
      const { data, error } = await supabase
        .from("reservations")
        .select("id, userId, seatId, startTime, endTime, status, createdAt")
        .order("createdAt", { ascending: false })
        .limit(10)
      
      console.log("Final query result:", {
        count: data?.length || 0,
        error: error,
        timestamp: new Date().toISOString()
      })
      
      if (error) {
        console.error("Final fetch error:", error)
        toast({
          title: "Error",
          description: "Failed to load reservations",
          variant: "destructive",
        })
        return
      }
      
      if (!data || data.length === 0) {
        console.log("No reservations found")
        setReservations([])
        return
      }
      
      console.log("SUCCESS: Found", data.length, "reservations")
      setReservations(data)
      
    } catch (error) {
      console.error("Error fetching reservations:", error)
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    console.log("=== FINAL ADMIN PAGE MOUNTED ===", new Date().toISOString())
    fetchReservations()
  }, [fetchReservations])

  // Force refresh every 10 seconds to bypass cache
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1)
      fetchReservations()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading reservations...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Admin Reservations (Final)</h1>
        <p className="text-slate-600">All reservations from all users - Cache: {forceUpdate}</p>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-slate-600">
          Found: {reservations.length} reservations
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No reservations found
          </h3>
          <p className="text-slate-500">
            Check console for detailed debugging information.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Student {reservation.userId?.substring(0, 8) || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-600">
                      student{reservation.userId?.substring(0, 8) || "unknown"}@mtu.edu
                    </p>
                  </div>
                </div>
                <Badge 
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    reservation.status === 'UPCOMING' ? "bg-blue-100 text-blue-700" :
                    reservation.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  )}
                >
                  {reservation.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Seat ID</p>
                  <p className="text-slate-600">{reservation.seatId || "Unknown"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Start Time</p>
                  <p className="text-slate-600">{new Date(reservation.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">End Time</p>
                  <p className="text-slate-600">{new Date(reservation.endTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Created</p>
                  <p className="text-slate-600">{new Date(reservation.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
