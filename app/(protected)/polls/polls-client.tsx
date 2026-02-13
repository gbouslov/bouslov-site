'use client'

import { useState, useEffect, useMemo } from 'react'
import { Poll, PollVote } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Vote } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PollCard } from '@/components/polls/poll-card'
import { CreatePollDialog } from '@/components/polls/create-poll-dialog'

type PollWithVotes = Poll & {
  votes: PollVote[]
  userVote: PollVote | null
}

interface PollsClientProps {
  userEmail: string
  userName: string
}

export function PollsClient({ userEmail, userName }: PollsClientProps) {
  const [polls, setPolls] = useState<PollWithVotes[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'active' | 'closed' | 'all'>('all')

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const res = await fetch('/api/polls')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPolls(data)
    } catch (error) {
      toast.error('Failed to load polls')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPolls = useMemo(() => {
    if (filter === 'active') return polls.filter((p) => !p.is_closed)
    if (filter === 'closed') return polls.filter((p) => p.is_closed)
    return polls
  }, [polls, filter])

  const activePollCount = polls.filter((p) => !p.is_closed).length
  const closedPollCount = polls.filter((p) => p.is_closed).length

  const handleCreate = async (question: string, options: string[]) => {
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const poll = await res.json()
      setPolls([poll, ...polls])
      setShowCreate(false)
      toast.success('Poll created')
    } catch (error) {
      toast.error('Failed to create poll')
    }
  }

  const handleVote = async (pollId: string, optionIndex: number) => {
    const poll = polls.find((p) => p.id === pollId)
    if (!poll) return

    try {
      // If already voted, remove first then re-vote
      if (poll.userVote) {
        await fetch(`/api/polls/${pollId}/vote`, { method: 'DELETE' })
      }

      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex }),
      })
      if (!res.ok) throw new Error('Failed to vote')
      const vote = await res.json()

      setPolls(
        polls.map((p) => {
          if (p.id !== pollId) return p
          const votes = p.userVote
            ? p.votes.filter((v) => v.user_email !== userEmail)
            : p.votes
          return { ...p, votes: [...votes, vote], userVote: vote }
        })
      )
    } catch (error) {
      toast.error('Failed to vote')
    }
  }

  const handleClose = async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'PUT' })
      if (!res.ok) throw new Error('Failed to close')

      setPolls(polls.map((p) => (p.id === pollId ? { ...p, is_closed: true } : p)))
      toast.success('Poll closed')
    } catch (error) {
      toast.error('Failed to close poll')
    }
  }

  const handleDelete = async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      setPolls(polls.filter((p) => p.id !== pollId))
      toast.success('Poll deleted')
    } catch (error) {
      toast.error('Failed to delete poll')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Polls</h1>
          <p className="text-muted-foreground mt-1">Vote on family decisions</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'closed'] as const).map((f) => (
          <Button
            key={f}
            variant="outline"
            size="sm"
            onClick={() => setFilter(f)}
            className={cn(
              'border-border capitalize',
              filter === f
                ? 'bg-muted text-foreground border-border'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {f}
            <Badge variant="secondary" className="ml-2 bg-muted text-foreground/80 text-xs">
              {f === 'all' ? polls.length : f === 'active' ? activePollCount : closedPollCount}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Poll Grid */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'all' ? 'No polls yet' : `No ${filter} polls`}
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create the first poll
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              votes={poll.votes}
              userVote={poll.userVote}
              userEmail={userEmail}
              onVote={handleVote}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePollDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
