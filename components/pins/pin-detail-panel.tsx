'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Pin, PinComment } from '@/lib/supabase'
import { PIN_TYPES, USER_COLORS } from '@/lib/pins'
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
} from 'lucide-react'

interface PinDetailPanelProps {
  pin: Pin
  isOpen: boolean
  onClose: () => void
  onEdit: (pin: Pin) => void
  onDelete: (pin: Pin) => void
  userEmail: string
}

export function PinDetailPanel({
  pin,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  userEmail,
}: PinDetailPanelProps) {
  const [comments, setComments] = useState<PinComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const pinType = PIN_TYPES[pin.pin_type]
  const TypeIcon = pinType.icon
  const isOwner = pin.user_email === userEmail

  useEffect(() => {
    if (isOpen) {
      fetchComments()
      setCurrentImageIndex(0)
    }
  }, [isOpen, pin.id])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/pins/${pin.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
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
      const res = await fetch(`/api/pins/${pin.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments([...comments, comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/pins/${pin.id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleDeletePin = async () => {
    if (!confirm('Are you sure you want to delete this pin?')) return
    setIsDeleting(true)
    onDelete(pin)
  }

  const images = pin.images || []
  const links = pin.links || []

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
          'fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 p-4 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(pin)}
                className="text-zinc-400 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePin}
                disabled={isDeleting}
                className="text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Pin Type Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: pinType.bgColor, color: pinType.color }}
          >
            <TypeIcon className="h-4 w-4" />
            {pinType.label}
          </div>

          {/* Title & Meta */}
          <div>
            <h2 className="text-2xl font-bold text-white">{pin.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: USER_COLORS[pin.user_email] || '#3b82f6' }}
              />
              <span>{pin.user_name}</span>
              <span>·</span>
              <span>{format(new Date(pin.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Location */}
          {pin.location_name && (
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin className="h-4 w-4" />
              <span>{pin.location_name}</span>
            </div>
          )}

          {/* Trip Date */}
          {pin.trip_date && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(pin.trip_date), 'MMMM d, yyyy')}</span>
            </div>
          )}

          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative">
              <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <img
                  src={images[currentImageIndex].url}
                  alt={images[currentImageIndex].caption || pin.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          i === currentImageIndex ? 'bg-white' : 'bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
              {images[currentImageIndex].caption && (
                <p className="text-sm text-zinc-400 mt-2">{images[currentImageIndex].caption}</p>
              )}
            </div>
          )}

          {/* Description */}
          {pin.description && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-zinc-300 whitespace-pre-wrap">{pin.description}</p>
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Links
              </h3>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group"
                  >
                    <span className="text-white group-hover:text-blue-400 transition-colors">
                      {link.title || link.url}
                    </span>
                    <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
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
                        <span className="font-medium text-white text-sm">{comment.user_name}</span>
                        <span className="text-xs text-zinc-500">
                          {format(new Date(comment.created_at), 'MMM d')}
                        </span>
                        {comment.user_email === userEmail && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-zinc-300 text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-800 border-zinc-700"
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
    </>
  )
}
