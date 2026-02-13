import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getRecommendationById,
  updateRecommendation,
  deleteRecommendation,
  RecommendationCategory,
} from '@/lib/supabase'
import { apiLimiters, isValidUrl } from '@/lib/security'

const VALID_CATEGORIES: RecommendationCategory[] = [
  'restaurant', 'show', 'movie', 'music', 'book', 'game', 'podcast', 'other',
]

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
    const rec = await getRecommendationById(id)

    if (!rec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(rec)
  } catch (error) {
    console.error('Error fetching recommendation:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 })
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

    const rateLimit = apiLimiters.write.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const { id } = await params
    const body = await request.json()

    const updates: any = {}
    if (body.title !== undefined) updates.title = body.title.trim().slice(0, 200)
    if (body.category !== undefined && VALID_CATEGORIES.includes(body.category)) {
      updates.category = body.category
    }
    if (body.rating !== undefined && body.rating >= 1 && body.rating <= 5) {
      updates.rating = Math.round(body.rating)
    }
    if (body.notes !== undefined) updates.notes = body.notes?.trim()?.slice(0, 2000) || null
    if (body.link !== undefined) {
      updates.link = body.link && isValidUrl(body.link) ? body.link : null
    }

    const rec = await updateRecommendation(id, session.user.email, updates)
    return NextResponse.json(rec)
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
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
    await deleteRecommendation(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recommendation:', error)
    return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 })
  }
}
