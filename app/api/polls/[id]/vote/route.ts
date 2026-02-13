import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { castVote, removeVote } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'
import { supabase } from '@/lib/supabase'

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
    const { option_index } = body

    if (typeof option_index !== 'number' || option_index < 0) {
      return NextResponse.json({ error: 'Invalid option_index' }, { status: 400 })
    }

    // Check if poll exists and is not closed
    const { data: poll } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single()

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (poll.is_closed) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
    }

    if (option_index >= poll.options.length) {
      return NextResponse.json({ error: 'Invalid option_index' }, { status: 400 })
    }

    const vote = await castVote({
      poll_id: id,
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      option_index,
    })

    return NextResponse.json(vote)
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Already voted. Remove your vote first.' },
        { status: 409 }
      )
    }
    console.error('Error casting vote:', error)
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
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

    // Check poll is not closed
    const { data: poll } = await supabase
      .from('polls')
      .select('is_closed')
      .eq('id', id)
      .single()

    if (poll?.is_closed) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
    }

    await removeVote(id, session.user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
  }
}
