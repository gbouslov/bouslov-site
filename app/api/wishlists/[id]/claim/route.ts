import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claimWishlistItem, unclaimWishlistItem } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'

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

    // Check if item exists and prevent self-claim
    const { data: item } = await supabase
      .from('wishlist_items')
      .select('user_email, claimed_by')
      .eq('id', id)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.user_email === session.user.email) {
      return NextResponse.json({ error: 'Cannot claim your own item' }, { status: 400 })
    }

    if (item.claimed_by) {
      return NextResponse.json({ error: 'Item already claimed' }, { status: 409 })
    }

    const updated = await claimWishlistItem(id, session.user.email)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error claiming item:', error)
    return NextResponse.json({ error: 'Failed to claim item' }, { status: 500 })
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
    const updated = await unclaimWishlistItem(id, session.user.email)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error unclaiming item:', error)
    return NextResponse.json({ error: 'Failed to unclaim item' }, { status: 500 })
  }
}
