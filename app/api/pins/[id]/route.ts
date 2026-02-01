import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPinById, updatePin, deletePin } from '@/lib/supabase'
import { apiLimiters, isValidUrl, isValidCoordinate } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const pin = await getPinById(id)
    
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    return NextResponse.json(pin)
  } catch (error) {
    console.error('Error fetching pin:', error)
    return NextResponse.json({ error: 'Failed to fetch pin' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Rate limit writes
    const rateLimit = apiLimiters.write.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }
    
    // Only allow updating certain fields
    const updates: any = {}
    if (body.location_name !== undefined) updates.location_name = body.location_name?.slice(0, 200)
    if (body.pin_type !== undefined) {
      const validTypes = ['bucket_list', 'trip_planned', 'been_there', 'home_base']
      if (validTypes.includes(body.pin_type)) {
        updates.pin_type = body.pin_type
      }
    }
    if (body.title !== undefined) updates.title = body.title.slice(0, 200)
    if (body.description !== undefined) updates.description = body.description?.slice(0, 5000)
    if (body.links !== undefined) {
      // Validate links
      updates.links = body.links.filter((link: { url: string }) => 
        link.url && isValidUrl(link.url)
      )
    }
    if (body.images !== undefined) updates.images = body.images
    if (body.trip_date !== undefined) updates.trip_date = body.trip_date
    if (body.lat !== undefined && body.lng !== undefined) {
      const lat = parseFloat(body.lat)
      const lng = parseFloat(body.lng)
      if (isValidCoordinate(lat, lng)) {
        updates.lat = lat
        updates.lng = lng
      }
    }

    const pin = await updatePin(id, session.user.email, updates)
    return NextResponse.json(pin)
  } catch (error) {
    console.error('Error updating pin:', error)
    return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deletePin(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pin:', error)
    return NextResponse.json({ error: 'Failed to delete pin' }, { status: 500 })
  }
}
