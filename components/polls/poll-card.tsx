'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Poll, PollVote, FAMILY } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Lock, Trash2, Check } from 'lucide-react'

interface PollCardProps {
  poll: Poll
  votes: PollVote[]
  userVote: PollVote | null
  userEmail: string
  onVote: (pollId: string, optionIndex: number) => void
  onClose: (pollId: string) => void
  onDelete: (pollId: string) => void
}

export function PollCard({
  poll,
  votes,
  userVote,
  userEmail,
  onVote,
  onClose,
  onDelete,
}: PollCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = poll.user_email === userEmail
  const hasVoted = !!userVote
  const showResults = hasVoted || poll.is_closed
  const totalVotes = votes.length

  const voteCounts: Record<number, number> = {}
  const votersByOption: Record<number, string[]> = {}
  for (const vote of votes) {
    voteCounts[vote.option_index] = (voteCounts[vote.option_index] || 0) + 1
    if (!votersByOption[vote.option_index]) votersByOption[vote.option_index] = []
    votersByOption[vote.option_index].push(vote.user_name)
  }

  const handleDelete = () => {
    if (!confirm('Delete this poll?')) return
    setIsDeleting(true)
    onDelete(poll.id)
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {poll.question}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {poll.user_name} · {format(new Date(poll.created_at), 'MMM d')}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {poll.is_closed && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                Closed
              </Badge>
            )}
            {isOwner && !poll.is_closed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClose(poll.id)}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                title="Close poll"
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0"
                title="Delete poll"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map((option: string, index: number) => {
            const count = voteCounts[index] || 0
            const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isSelected = userVote?.option_index === index
            const voters = votersByOption[index] || []

            if (showResults) {
              return (
                <div key={index} className="space-y-1">
                  <div
                    className={cn(
                      'relative rounded-lg overflow-hidden border transition-colors cursor-pointer',
                      isSelected
                        ? 'border-blue-500/50'
                        : 'border-border hover:border-border'
                    )}
                    onClick={() => !poll.is_closed && onVote(poll.id, index)}
                  >
                    {/* Bar */}
                    <div
                      className={cn(
                        'absolute inset-0 transition-all',
                        isSelected ? 'bg-blue-500/15' : 'bg-muted/50'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-sm truncate',
                            isSelected ? 'font-medium text-foreground' : 'text-foreground/80'
                          )}
                        >
                          {option}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2 shrink-0">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  {voters.length > 0 && (
                    <p className="text-xs text-muted-foreground pl-3">
                      {voters.join(', ')}
                    </p>
                  )}
                </div>
              )
            }

            return (
              <button
                key={index}
                onClick={() => onVote(poll.id, index)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:bg-muted/50 hover:border-border transition-colors"
              >
                <span className="text-sm text-foreground">{option}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          {!hasVoted && !poll.is_closed && ' · Vote to see results'}
        </p>
      </CardContent>
    </Card>
  )
}
