'use client'

import { useState, useEffect, useMemo } from 'react'
import { Recommendation, RecommendationCategory, FAMILY } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, ThumbsUp, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/recommendations/star-rating'
import { AddRecDialog } from '@/components/recommendations/add-rec-dialog'
import { RecDetailPanel } from '@/components/recommendations/rec-detail-panel'

const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#3b82f6',
  'dbouslov@gmail.com': '#10b981',
  'jbouslov@gmail.com': '#f59e0b',
  'bouslovd@gmail.com': '#ef4444',
  'bouslovb@gmail.com': '#8b5cf6',
  'lbouslov@gmail.com': '#ec4899',
}

const CATEGORIES: { value: RecommendationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'show', label: 'Show' },
  { value: 'movie', label: 'Movie' },
  { value: 'music', label: 'Music' },
  { value: 'book', label: 'Book' },
  { value: 'game', label: 'Game' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'other', label: 'Other' },
]

type SortOption = 'recent' | 'rating'

interface RecommendationsClientProps {
  userEmail: string
  userName: string
}

export function RecommendationsClient({ userEmail, userName }: RecommendationsClientProps) {
  const router = useRouter()
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [showAdd, setShowAdd] = useState(false)
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null)
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    fetchRecs()
  }, [])

  const fetchRecs = async () => {
    try {
      const res = await fetch('/api/recommendations')
      if (!res.ok) throw new Error('Failed to fetch')
      setRecs(await res.json())
    } catch (error) {
      toast.error('Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRecs = useMemo(() => {
    let result = [...recs]

    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category === selectedCategory)
    }
    if (selectedUser) {
      result = result.filter((r) => r.user_email === selectedUser)
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [recs, selectedCategory, selectedUser, sortBy])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: recs.length }
    for (const rec of recs) {
      counts[rec.category] = (counts[rec.category] || 0) + 1
    }
    return counts
  }, [recs])

  const handleSave = async (data: any) => {
    try {
      if (editingRec) {
        const res = await fetch(`/api/recommendations/${editingRec.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated = await res.json()
        setRecs(recs.map((r) => (r.id === updated.id ? updated : r)))
        toast.success('Updated')
      } else {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create')
        const rec = await res.json()
        setRecs([rec, ...recs])
        toast.success('Recommendation added')
      }
      setShowAdd(false)
      setEditingRec(null)
    } catch (error) {
      toast.error('Failed to save recommendation')
    }
  }

  const handleDelete = async (rec: Recommendation) => {
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setRecs(recs.filter((r) => r.id !== rec.id))
      setIsPanelOpen(false)
      setSelectedRec(null)
      toast.success('Deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleEdit = (rec: Recommendation) => {
    setEditingRec(rec)
    setIsPanelOpen(false)
    setShowAdd(true)
  }

  const handleCardClick = (rec: Recommendation) => {
    setSelectedRec(rec)
    setIsPanelOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Recommendations</h1>
          <p className="text-muted-foreground mt-1">Share and discover what the family loves</p>
        </div>
        <Button
          onClick={() => { setEditingRec(null); setShowAdd(true) }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rec
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant="outline"
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              'border-border capitalize',
              selectedCategory === cat.value
                ? 'bg-muted text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {cat.label}
            {categoryCounts[cat.value] !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-muted text-foreground/80 text-xs">
                {categoryCounts[cat.value] || 0}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* User + Sort Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedUser(null)}
          className={cn(
            'border-border',
            !selectedUser
              ? 'bg-muted text-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          Everyone
        </Button>
        {FAMILY.map((member) => (
          <Button
            key={member.email}
            variant="outline"
            size="sm"
            onClick={() => setSelectedUser(selectedUser === member.email ? null : member.email)}
            className={cn(
              'border-border gap-2',
              selectedUser === member.email
                ? 'bg-muted text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: USER_COLORS[member.email] }}
            />
            {member.name}
          </Button>
        ))}
        <div className="ml-auto flex border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy('recent')}
            className={cn(
              'rounded-none px-3 text-xs',
              sortBy === 'recent'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Recent
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy('rating')}
            className={cn(
              'rounded-none px-3 text-xs',
              sortBy === 'rating'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Top Rated
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredRecs.length === 0 ? (
        <div className="text-center py-12">
          <ThumbsUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No recommendations yet</p>
          <Button
            onClick={() => { setEditingRec(null); setShowAdd(true) }}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add the first one
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecs.map((rec) => (
            <Card
              key={rec.id}
              className="bg-card/50 border-border hover:border-border transition-colors cursor-pointer group"
              onClick={() => handleCardClick(rec)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground text-xs capitalize shrink-0"
                      >
                        {rec.category}
                      </Badge>
                      {rec.link && (
                        <a
                          href={rec.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-blue-400 shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground mt-2 line-clamp-1">
                      {rec.title}
                    </h3>
                  </div>
                </div>

                <StarRating rating={rec.rating} size="sm" />

                {rec.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{rec.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: USER_COLORS[rec.user_email] }}
                  />
                  <span className="text-xs text-muted-foreground">{rec.user_name}</span>
                  <span className="text-xs text-muted-foreground/60">·</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rec.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedRec && (
        <RecDetailPanel
          rec={selectedRec}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          userEmail={userEmail}
        />
      )}

      {/* Add/Edit Dialog */}
      <AddRecDialog
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditingRec(null) }}
        onSave={handleSave}
        editRec={editingRec}
      />
    </div>
  )
}
