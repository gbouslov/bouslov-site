'use client'

import { useState, useEffect } from 'react'
import { WishlistItem, WishlistOccasion } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    link?: string
    price?: string
    notes?: string
    priority: number
    occasion: WishlistOccasion
  }) => void
  editItem: WishlistItem | null
}

const PRIORITIES = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Med' },
  { value: 3, label: 'High' },
]

const OCCASIONS: { value: WishlistOccasion; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'holiday', label: 'Holiday' },
]

export function AddItemDialog({ isOpen, onClose, onSave, editItem }: AddItemDialogProps) {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState(2)
  const [occasion, setOccasion] = useState<WishlistOccasion>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title)
      setLink(editItem.link || '')
      setPrice(editItem.price || '')
      setNotes(editItem.notes || '')
      setPriority(editItem.priority)
      setOccasion(editItem.occasion)
    } else {
      setTitle('')
      setLink('')
      setPrice('')
      setNotes('')
      setPriority(2)
      setOccasion('general')
    }
  }, [editItem, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSave({
        title: title.trim(),
        link: link.trim() || undefined,
        price: price.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
        occasion,
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
              {editItem ? 'Edit Item' : 'Add Wishlist Item'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AirPods Pro"
                className="bg-muted border-border"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$249"
                className="bg-muted border-border"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Space Black, size M..."
                className="bg-muted border-border resize-none"
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 border-border',
                      priority === p.value
                        ? 'bg-muted text-foreground'
                        : 'bg-transparent text-muted-foreground'
                    )}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Occasion</Label>
              <div className="flex gap-2">
                {OCCASIONS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOccasion(o.value)}
                    className={cn(
                      'flex-1 border-border',
                      occasion === o.value
                        ? 'bg-muted text-foreground'
                        : 'bg-transparent text-muted-foreground'
                    )}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
