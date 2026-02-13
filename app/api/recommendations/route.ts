import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { getAllRecommendations, createRecommendation, RecommendationCategory } from '@/lib/supabase'
import { apiLimiters, isValidUrl } from '@/lib/security'

const VALID_CATEGORIES: RecommendationCategory[] = [
  'restaurant', 'show', 'movie', 'music', 'book', 'game', 'podcast', 'other',
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = apiLimiters.general.check(session.user.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    let recs = await getAllRecommendations()

    // Filter by query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const user = searchParams.get('user')

    if (category && VALID_CATEGORIES.includes(category as RecommendationCategory)) {
      recs = recs.filter((r) => r.category === category)
    }
    if (user) {
      recs = recs.filter((r) => r.user_email === user)
    }

    return NextResponse.json(recs)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, category, rating, notes, link } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    if (link && !isValidUrl(link)) {
      return NextResponse.json({ error: 'Invalid link URL' }, { status: 400 })
    }

    const rec = await createRecommendation({
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      title: title.trim().slice(0, 200),
      category,
      rating: Math.round(rating),
      notes: notes?.trim()?.slice(0, 2000) || undefined,
      link: link || undefined,
    })

    return NextResponse.json(rec)
  } catch (error) {
    console.error('Error creating recommendation:', error)
    return NextResponse.json({ error: 'Failed to create recommendation' }, { status: 500 })
  }
}
