import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllTravels, addTravel, removeTravel, getTravelsByUser } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'

export async function GET(req: NextRequest) {
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
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('user')

    let travels
    if (userEmail) {
      travels = await getTravelsByUser(userEmail)
    } else {
      travels = await getAllTravels()
    }

    return NextResponse.json(travels)
  } catch (error) {
    console.error('Failed to fetch travels:', error)
    return NextResponse.json({ error: 'Failed to fetch travels' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { country_code, country_name, notes } = body

    if (!country_code || !country_name) {
      return NextResponse.json(
        { error: 'Country code and name are required' },
        { status: 400 }
      )
    }

    // Validate country code format (ISO 3166-1 alpha-2)
    if (!/^[A-Z]{2}$/.test(country_code)) {
      return NextResponse.json(
        { error: 'Invalid country code format' },
        { status: 400 }
      )
    }

    // Rate limit writes
    const rateLimit = apiLimiters.write.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const travel = await addTravel({
      user_email: session.user.email,
      country_code,
      country_name,
      notes,
    })

    return NextResponse.json(travel, { status: 201 })
  } catch (error: any) {
    console.error('Failed to add travel:', error)

    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You have already added this country' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to add travel' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Travel ID is required' }, { status: 400 })
    }

    await removeTravel(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove travel:', error)
    return NextResponse.json({ error: 'Failed to remove travel' }, { status: 500 })
  }
}
