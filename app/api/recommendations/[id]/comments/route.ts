import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { getRecommendationComments, createRecommendationComment } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'

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
    const comments = await getRecommendationComments(id)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
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
    const { content, rating } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const comment = await createRecommendationComment({
      recommendation_id: id,
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      content: content.trim().slice(0, 2000),
      rating: rating ? Math.round(rating) : undefined,
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
