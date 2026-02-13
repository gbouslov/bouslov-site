import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateWishlistItem, deleteWishlistItem, WishlistOccasion } from '@/lib/supabase'
import { apiLimiters, isValidUrl } from '@/lib/security'

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
    if (body.link !== undefined) {
      updates.link = body.link && isValidUrl(body.link) ? body.link : null
    }
    if (body.price !== undefined) updates.price = body.price?.trim()?.slice(0, 50) || null
    if (body.notes !== undefined) updates.notes = body.notes?.trim()?.slice(0, 1000) || null
    if (body.priority !== undefined && [1, 2, 3].includes(body.priority)) {
      updates.priority = body.priority
    }
    if (body.occasion !== undefined) {
      const valid: WishlistOccasion[] = ['birthday', 'holiday', 'general']
      if (valid.includes(body.occasion)) updates.occasion = body.occasion
    }

    const item = await updateWishlistItem(id, session.user.email, updates)
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating wishlist item:', error)
    return NextResponse.json({ error: 'Failed to update wishlist item' }, { status: 500 })
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
    await deleteWishlistItem(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wishlist item:', error)
    return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 })
  }
}
