import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { getAllPins, createPin, PinType } from '@/lib/supabase'
import { apiLimiters, isValidUrl, isValidCoordinate } from '@/lib/security'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const rateLimit = apiLimiters.general.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) }
        }
      )
    }

    const pins = await getAllPins()
    return NextResponse.json(pins)
  } catch (error) {
    console.error('Error fetching pins:', error)
    return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lat, lng, location_name, pin_type, title, description, links, images, trip_date } = body

    if (!lat || !lng || !pin_type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: lat, lng, pin_type, title' },
        { status: 400 }
      )
    }

    const validPinTypes: PinType[] = ['bucket_list', 'trip_planned', 'been_there', 'home_base']
    if (!validPinTypes.includes(pin_type)) {
      return NextResponse.json(
        { error: 'Invalid pin_type' },
        { status: 400 }
      )
    }

    // Validate coordinates
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (!isValidCoordinate(parsedLat, parsedLng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Validate and sanitize links
    const sanitizedLinks = (links || []).filter((link: { url: string; title?: string }) => {
      return link.url && isValidUrl(link.url)
    })

    // Rate limit write operations
    const rateLimit = apiLimiters.write.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) }
        }
      )
    }

    const pin = await createPin({
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      lat: parsedLat,
      lng: parsedLng,
      location_name,
      pin_type,
      title: title.slice(0, 200), // Limit title length
      description: description?.slice(0, 5000), // Limit description length
      links: sanitizedLinks,
      images: images || [],
      trip_date,
    })

    return NextResponse.json(pin)
  } catch (error) {
    console.error('Error creating pin:', error)
    return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 })
  }
}
