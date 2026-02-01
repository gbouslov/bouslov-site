import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, ALLOWED_EMAILS } from '@/lib/auth'
import {
  getRecentScores,
  getBestScoresByCategory,
  getCategoryBySlug,
  submitScore,
  FAMILY
} from '@/lib/supabase'
import { SCORE_LIMITS } from '@/lib/constants'

// Rate limit: 1 score per category per 5 minutes
const rateLimitMap = new Map<string, Map<string, number>>()

function checkRateLimit(email: string, category: string): boolean {
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (!rateLimitMap.has(email)) {
    rateLimitMap.set(email, new Map())
  }

  const userLimits = rateLimitMap.get(email)!
  const lastSubmit = userLimits.get(category)

  if (lastSubmit && now - lastSubmit < fiveMinutes) {
    return false
  }

  userLimits.set(category, now)
  return true
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')

    if (categorySlug) {
      // Get scores for specific category
      const category = await getCategoryBySlug(categorySlug)
      if (!category) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 })
      }
      const scores = await getBestScoresByCategory(category.id, category.higher_is_better)
      return NextResponse.json(scores)
    }

    // Get recent activity
    const recentScores = await getRecentScores(20)
    return NextResponse.json(recentScores)
  } catch (error) {
    console.error('Failed to fetch scores:', error)
    return NextResponse.json(
      { message: 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const email = session.user.email.toLowerCase()

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { category_slug, value, proof_url } = body

    // Validate category
    const category = await getCategoryBySlug(category_slug)
    if (!category) {
      return NextResponse.json(
        { message: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate score
    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json(
        { message: 'Invalid score value' },
        { status: 400 }
      )
    }

    // Score sanity checks based on category
    const limits = SCORE_LIMITS[category_slug]
    if (limits && (value < limits.min || value > limits.max)) {
      return NextResponse.json(
        { message: `${category.name} must be between ${limits.min} and ${limits.max} ${category.unit}` },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(email, category_slug)) {
      return NextResponse.json(
        { message: 'Rate limited. Wait 5 minutes between submissions for the same category.' },
        { status: 429 }
      )
    }

    // Get user name from family list
    const familyMember = FAMILY.find(f => f.email === email)
    const userName = familyMember?.name || session.user.name || 'Unknown'

    // Insert score
    const newScore = await submitScore(
      email,
      userName,
      category_slug,
      value,
      proof_url,
      'manual'
    )

    return NextResponse.json({ success: true, score: newScore })
  } catch (error) {
    console.error('Score submission error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
