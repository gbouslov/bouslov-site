import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, EMAIL_TO_NAME } from '@/lib/auth'
import { getAllPolls, getAllPollVotes, createPoll } from '@/lib/supabase'
import { apiLimiters } from '@/lib/security'

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

    const [polls, votes] = await Promise.all([getAllPolls(), getAllPollVotes()])

    const votesByPoll: Record<string, typeof votes> = {}
    for (const vote of votes) {
      if (!votesByPoll[vote.poll_id]) votesByPoll[vote.poll_id] = []
      votesByPoll[vote.poll_id].push(vote)
    }

    const pollsWithVotes = polls.map((poll) => ({
      ...poll,
      votes: votesByPoll[poll.id] || [],
      userVote: (votesByPoll[poll.id] || []).find(
        (v) => v.user_email === session.user!.email
      ) || null,
    }))

    return NextResponse.json(pollsWithVotes)
  } catch (error) {
    console.error('Error fetching polls:', error)
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
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
    const { question, options } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return NextResponse.json(
        { error: 'Must have 2-10 options' },
        { status: 400 }
      )
    }

    const cleanOptions = options
      .map((o: string) => o?.trim())
      .filter((o: string) => o)

    if (cleanOptions.length < 2) {
      return NextResponse.json(
        { error: 'Must have at least 2 non-empty options' },
        { status: 400 }
      )
    }

    const poll = await createPoll({
      user_email: session.user.email,
      user_name: EMAIL_TO_NAME[session.user.email] || session.user.name || 'Unknown',
      question: question.trim().slice(0, 500),
      options: cleanOptions.map((o: string) => o.slice(0, 200)),
    })

    return NextResponse.json({ ...poll, votes: [], userVote: null })
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}
