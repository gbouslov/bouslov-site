'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Recommendation, RecommendationComment, FAMILY } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  X,
  Pencil,
  Trash2,
  ExternalLink,
  MessageCircle,
  Send,
} from 'lucide-react'
import { StarRating } from './star-rating'

const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#3b82f6',
  'dbouslov@gmail.com': '#10b981',
  'jbouslov@gmail.com': '#f59e0b',
  'bouslovd@gmail.com': '#ef4444',
  'bouslovb@gmail.com': '#8b5cf6',
  'lbouslov@gmail.com': '#ec4899',
}

interface RecDetailPanelProps {
  rec: Recommendation
  isOpen: boolean
  onClose: () => void
  onEdit: (rec: Recommendation) => void
  onDelete: (rec: Recommendation) => void
  userEmail: string
}

export function RecDetailPanel({
  rec,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  userEmail,
}: RecDetailPanelProps) {
  const [comments, setComments] = useState<RecommendationComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentRating, setCommentRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = rec.user_email === userEmail

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, rec.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/recommendations/${rec.id}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/recommendations/${rec.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          rating: commentRating > 0 ? commentRating : undefined,
        }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments([...comments, comment])
        setNewComment('')
        setCommentRating(0)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/recommendations/${rec.id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleDelete = () => {
    if (!confirm('Delete this recommendation?')) return
    setIsDeleting(true)
    onDelete(rec)
  }

  // Compute average rating from rec + comments with ratings
  const allRatings = [rec.rating, ...comments.filter((c) => c.rating).map((c) => c.rating!)]
  const avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-popover border-l border-border z-50 overflow-y-auto',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-popover/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(rec)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Category badge */}
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground capitalize">
            {rec.category}
          </span>

          {/* Title & Meta */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{rec.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: USER_COLORS[rec.user_email] || '#3b82f6' }}
              />
              <span>{rec.user_name}</span>
              <span>·</span>
              <span>{format(new Date(rec.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-1">
            <StarRating rating={rec.rating} />
            {allRatings.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Avg: {avgRating.toFixed(1)} from {allRatings.length} ratings
              </p>
            )}
          </div>

          {/* Notes */}
          {rec.notes && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-foreground/80 whitespace-pre-wrap">{rec.notes}</p>
            </div>
          )}

          {/* Link */}
          {rec.link && (
            <a
              href={rec.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
            >
              <span className="text-foreground group-hover:text-blue-400 transition-colors truncate">
                {rec.link}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 transition-colors ml-auto shrink-0" />
            </a>
          )}

          {/* Comments */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </h3>

            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                      style={{
                        backgroundColor: (USER_COLORS[comment.user_email] || '#3b82f6') + '20',
                        color: USER_COLORS[comment.user_email] || '#3b82f6',
                      }}
                    >
                      {comment.user_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {comment.user_name}
                        </span>
                        {comment.rating && (
                          <StarRating rating={comment.rating} size="sm" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d')}
                        </span>
                        {comment.user_email === userEmail && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-foreground/80 text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Your rating (optional):</span>
                <StarRating rating={commentRating} onChange={setCommentRating} size="sm" />
                {commentRating > 0 && (
                  <button
                    onClick={() => setCommentRating(0)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-muted border-border"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
