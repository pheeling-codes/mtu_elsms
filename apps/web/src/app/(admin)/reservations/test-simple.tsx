// Simple test component to debug admin reservations issue
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestReservations() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log("=== SIMPLE TEST START ===")
        
        // Test 1: Direct table query
        const { data: directData, error: directError } = await supabase
          .from('reservations')
          .select('*')
          .limit(10)
        
        console.log("Direct query result:", directData?.length, directError)
        
        // Test 2: Count query
        const { data: countData } = await supabase
          .from('reservations')
          .select('id')
        
        console.log("Count query result:", countData?.length)
        
        // Test 3: Check if we can access users table
        const { data: userData } = await supabase
          .from('users')
          .select('id, fullName, email')
          .limit(5)
        
        console.log("Users table result:", userData?.length)
        
        if (directData) {
          setReservations(directData)
        }
        
      } catch (error) {
        console.error("Test error:", error)
      } finally {
        setLoading(false)
      }
    }
    
    testFetch()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Admin Reservations Test</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Direct Query Results</h3>
        <p>Found: {reservations.length} reservations</p>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(reservations.slice(0, 3), null, 2)}
        </pre>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Check browser console for detailed debugging information.</p>
      </div>
    </div>
  )
}
