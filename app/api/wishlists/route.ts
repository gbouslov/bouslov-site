import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { getAllWishlistItems, createWishlistItem, WishlistOccasion } from '@/lib/supabase'
import { apiLimiters, isValidUrl } from '@/lib/security'

export async function GET() {
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

    const items = await getAllWishlistItems()

    // Strip claimed_by for items that belong to the current user (preserve surprise)
    const sanitized = items.map((item) => {
      if (item.user_email === session.user!.email) {
        return {
          ...item,
          claimed_by: item.claimed_by ? '__claimed__' : null,
          claimed_at: item.claimed_by ? item.claimed_at : null,
        }
      }
      return item
    })

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('Error fetching wishlist items:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist items' }, { status: 500 })
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
    const { title, link, price, notes, priority, occasion } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (link && !isValidUrl(link)) {
      return NextResponse.json({ error: 'Invalid link URL' }, { status: 400 })
    }

    const validOccasions: WishlistOccasion[] = ['birthday', 'holiday', 'general']
    const validPriority = [1, 2, 3].includes(priority) ? priority : 2

    const item = await createWishlistItem({
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      title: title.trim().slice(0, 200),
      link: link || undefined,
      price: price?.trim()?.slice(0, 50) || undefined,
      notes: notes?.trim()?.slice(0, 1000) || undefined,
      priority: validPriority,
      occasion: validOccasions.includes(occasion) ? occasion : 'general',
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating wishlist item:', error)
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 })
  }
}
