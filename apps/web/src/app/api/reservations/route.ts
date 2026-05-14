import { createRouteHandlerClient } from '@/lib/route-handler'
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const GET = createRouteHandlerClient(
  async (request: NextRequest, { user }) => {
    try {
      // Server-side validation: Ensure user is authenticated
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - No user session found' },
          { status: 401 }
        )
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const status = searchParams.get('status')
      const zoneId = searchParams.get('zoneId')
      const dateFilter = searchParams.get('dateFilter')

      console.log('API Request:', {
        userId: user.id,
        userRole: user.role,
        page,
        limit,
        status,
        zoneId,
        dateFilter
      })

      // Build query based on user role
      let query = supabase
        .from('reservations')
        .select(`
          id,
          userId,
          seatId,
          startTime,
          endTime,
          status,
          checkInTime,
          checkOutTime,
          createdAt,
          users!inner (
            id,
            fullName,
            email,
            matricNumber,
            role
          ),
          seats!inner (
            id,
            seatNumber,
            features,
            zones!inner (
              id,
              name,
              themeColor
            )
          )
        `, { count: 'exact' })
        .order('startTime', { ascending: false })

      // Apply privacy guardrails based on user role
      if (user.role === 'ADMIN') {
        // Admins can see all reservations
        console.log('Admin access - fetching all reservations')
      } else {
        // Students can only see their own reservations
        console.log('Student access - filtering by userId:', user.id)
        query = query.eq('userId', user.id)
      }

      // Apply additional filters
      if (status && status !== 'all') {
        query = query.eq('status', status.toUpperCase())
      }
      if (zoneId && zoneId !== 'all') {
        query = query.eq('seats.zoneId', zoneId)
      }
      if (dateFilter === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('startTime', today.toISOString())
          .lt('startTime', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        query = query.gte('startTime', yesterday.toISOString())
          .lt('startTime', new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString())
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('startTime', weekAgo.toISOString())
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        query = query.gte('startTime', monthAgo.toISOString())
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('API Error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch reservations', details: error.message },
          { status: 500 }
        )
      }

      // Log successful fetch
      console.log('API Success:', {
        userId: user.id,
        userRole: user.role,
        fetchedCount: data?.length || 0,
        totalCount: count,
        page
      })

      return NextResponse.json({
        data: data || [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count || 0) / limit),
          totalCount: count || 0,
          pageSize: limit
        },
        user: {
          id: user.id,
          role: user.role
        }
      })

    } catch (error) {
      console.error('API Route Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const POST = createRouteHandlerClient(
  async (request: NextRequest, { user }) => {
    try {
      // Server-side validation
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - No user session found' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const { seatId, startTime, endTime } = body

      // Validate required fields
      if (!seatId || !startTime || !endTime) {
        return NextResponse.json(
          { error: 'Missing required fields: seatId, startTime, endTime' },
          { status: 400 }
        )
      }

      // Check for conflicting reservations
      const { data: conflicts, error: conflictError } = await supabase
        .from('reservations')
        .select('id')
        .eq('seatId', seatId)
        .or(`startTime.lte.${startTime},startTime.gte.${startTime}`)
        .neq('status', 'CANCELLED')

      if (conflictError) {
        return NextResponse.json(
          { error: 'Failed to check for conflicts', details: conflictError.message },
          { status: 500 }
        )
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Seat is already reserved for this time slot' },
          { status: 409 }
        )
      }

      // Create reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          userId: user.id,
          seatId,
          startTime,
          endTime,
          status: 'RESERVED'
        })
        .select()
        .single()

      if (error) {
        console.error('Insert Error:', error)
        return NextResponse.json(
          { error: 'Failed to create reservation', details: error.message },
          { status: 500 }
        )
      }

      console.log('Reservation created:', {
        id: data.id,
        userId: user.id,
        seatId,
        startTime,
        endTime
      })

      return NextResponse.json({
        success: true,
        data
      })

    } catch (error) {
      console.error('POST Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const PUT = createRouteHandlerClient(
  async (request: NextRequest, { user }) => {
    try {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - No user session found' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const { reservationId, status } = body

      if (!reservationId || !status) {
        return NextResponse.json(
          { error: 'Missing required fields: reservationId, status' },
          { status: 400 }
        )
      }

      // First, check if user owns this reservation or is admin
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('userId, status')
        .eq('id', reservationId)
        .single()

      if (fetchError || !reservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        )
      }

      // Privacy guardrail: Students can only update their own reservations
      if (user.role !== 'ADMIN' && reservation.userId !== user.id) {
        console.log('Unauthorized update attempt:', {
          requestUserId: user.id,
          reservationUserId: reservation.userId,
          userRole: user.role
        })
        return NextResponse.json(
          { error: 'Unauthorized - You can only update your own reservations' },
          { status: 403 }
        )
      }

      // Update reservation
      const { data, error } = await supabase
        .from('reservations')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('id', reservationId)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update reservation', details: error.message },
          { status: 500 }
        )
      }

      console.log('Reservation updated:', {
        id: reservationId,
        newStatus: status,
        updatedBy: user.id,
        userRole: user.role
      })

      return NextResponse.json({
        success: true,
        data
      })

    } catch (error) {
      console.error('PUT Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
