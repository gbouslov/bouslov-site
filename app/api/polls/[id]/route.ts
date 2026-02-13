import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { closePoll, deletePoll } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'

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
    const poll = await closePoll(id, session.user.email)
    return NextResponse.json(poll)
  } catch (error) {
    console.error('Error closing poll:', error)
    return NextResponse.json({ error: 'Failed to close poll' }, { status: 500 })
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
    await deletePoll(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting poll:', error)
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
  }
}
