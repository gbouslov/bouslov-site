'use client'

import { useState, useEffect } from 'react'
import { Recommendation, RecommendationCategory } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'

const CATEGORIES: { value: RecommendationCategory; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'show', label: 'Show' },
  { value: 'movie', label: 'Movie' },
  { value: 'music', label: 'Music' },
  { value: 'book', label: 'Book' },
  { value: 'game', label: 'Game' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'other', label: 'Other' },
]

interface AddRecDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    category: RecommendationCategory
    rating: number
    notes?: string
    link?: string
  }) => void
  editRec: Recommendation | null
}

export function AddRecDialog({ isOpen, onClose, onSave, editRec }: AddRecDialogProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<RecommendationCategory>('restaurant')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editRec) {
      setTitle(editRec.title)
      setCategory(editRec.category)
      setRating(editRec.rating)
      setNotes(editRec.notes || '')
      setLink(editRec.link || '')
    } else {
      setTitle('')
      setCategory('restaurant')
      setRating(0)
      setNotes('')
      setLink('')
    }
  }, [editRec, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || rating === 0) return

    setIsSubmitting(true)
    try {
      await onSave({
        title: title.trim(),
        category,
        rating,
        notes: notes.trim() || undefined,
        link: link.trim() || undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-popover border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {editRec ? 'Edit Recommendation' : 'Add Recommendation'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rec-title">Title</Label>
              <Input
                id="rec-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Bear"
                className="bg-muted border-border"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Button
                    key={c.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'border-border',
                      category === c.value
                        ? 'bg-muted text-foreground'
                        : 'bg-transparent text-muted-foreground'
                    )}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <StarRating rating={rating} onChange={setRating} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-notes">Notes (optional)</Label>
              <Textarea
                id="rec-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Best restaurant in the city..."
                className="bg-muted border-border resize-none"
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-link">Link (optional)</Label>
              <Input
                id="rec-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="bg-muted border-border"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || rating === 0 || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Saving...' : editRec ? 'Save Changes' : 'Add Recommendation'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
