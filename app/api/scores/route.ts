import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, ALLOWED_EMAILS } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/constants'
import { apiLimiters } from '@/lib/security'

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
    const { category, score, proof_url } = body

    // Validate category
    const categoryData = CATEGORIES.find(c => c.slug === category)
    if (!categoryData) {
      return NextResponse.json(
        { message: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate score
    if (typeof score !== 'number' || isNaN(score)) {
      return NextResponse.json(
        { message: 'Invalid score' },
        { status: 400 }
      )
    }

    // Score sanity checks based on category
    if (category === 'wpm' && (score < 0 || score > 300)) {
      return NextResponse.json(
        { message: 'WPM must be between 0 and 300' },
        { status: 400 }
      )
    }
    if (category === 'reaction' && (score < 100 || score > 2000)) {
      return NextResponse.json(
        { message: 'Reaction time must be between 100ms and 2000ms' },
        { status: 400 }
      )
    }
    if (category === 'accuracy' && (score < 0 || score > 100)) {
      return NextResponse.json(
        { message: 'Accuracy must be between 0% and 100%' },
        { status: 400 }
      )
    }
    if (category === 'chess' && (score < 0 || score > 3500)) {
      return NextResponse.json(
        { message: 'Chess rating must be between 0 and 3500' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(email, category)) {
      return NextResponse.json(
        { message: 'Rate limited. Wait 5 minutes between submissions for the same category.' },
        { status: 429 }
      )
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found. Please log out and log in again.' },
        { status: 404 }
      )
    }

    // Get category ID
    const { data: categoryRow, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()

    if (catError || !categoryRow) {
      return NextResponse.json(
        { message: 'Category not found in database. Please run seed script.' },
        { status: 404 }
      )
    }

    // Insert score
    const { data: newScore, error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        category_id: categoryRow.id,
        score,
        proof_url: proof_url || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert score:', insertError)
      return NextResponse.json(
        { message: 'Failed to save score' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, score: newScore })
  } catch (error) {
    console.error('Score submission error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit by IP or email
    const identifier = session.user.email
    const rateLimit = apiLimiters.general.check(identifier)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) }
        }
      )
    }

    const { data, error } = await supabase
      .from('scores')
      .select(`
        *,
        user:users(*),
        category:categories(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch scores:', error)
    return NextResponse.json(
      { message: 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}
