'use client'

import { useState, useEffect, useMemo } from 'react'
import { WishlistItem, WishlistOccasion, FAMILY } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Plus,
  Gift,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AddItemDialog } from '@/components/wishlists/add-item-dialog'

const EMAIL_TO_NAME: Record<string, string> = {}
FAMILY.forEach((f) => { EMAIL_TO_NAME[f.email] = f.name })

const OCCASIONS: { value: WishlistOccasion | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'general', label: 'General' },
]

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'text-muted-foreground' },
  2: { label: 'Med', color: 'text-yellow-500' },
  3: { label: 'High', color: 'text-red-400' },
}

interface WishlistsClientProps {
  userEmail: string
  userName: string
}

export function WishlistsClient({ userEmail, userName }: WishlistsClientProps) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedOccasion, setSelectedOccasion] = useState<WishlistOccasion | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/wishlists')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data)
    } catch (error) {
      toast.error('Failed to load wishlists')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedUser && item.user_email !== selectedUser) return false
      if (selectedOccasion !== 'all' && item.occasion !== selectedOccasion) return false
      return true
    })
  }, [items, selectedUser, selectedOccasion])

  // Group by user
  const groupedItems = useMemo(() => {
    const groups: Record<string, WishlistItem[]> = {}
    for (const item of filteredItems) {
      if (!groups[item.user_email]) groups[item.user_email] = []
      groups[item.user_email].push(item)
    }
    return groups
  }, [filteredItems])

  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items) {
      counts[item.user_email] = (counts[item.user_email] || 0) + 1
    }
    return counts
  }, [items])

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        const res = await fetch(`/api/wishlists/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated = await res.json()
        setItems(items.map((i) => (i.id === updated.id ? updated : i)))
        toast.success('Item updated')
      } else {
        const res = await fetch('/api/wishlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create')
        const item = await res.json()
        setItems([item, ...items])
        toast.success('Item added')
      }
      setShowAdd(false)
      setEditingItem(null)
    } catch (error) {
      toast.error('Failed to save item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    try {
      const res = await fetch(`/api/wishlists/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(items.filter((i) => i.id !== id))
      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleClaim = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlists/${id}/claim`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to claim')
      }
      const updated = await res.json()
      setItems(items.map((i) => (i.id === id ? updated : i)))
      toast.success('Item claimed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim item')
    }
  }

  const handleUnclaim = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlists/${id}/claim`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to unclaim')
      const updated = await res.json()
      setItems(items.map((i) => (i.id === id ? updated : i)))
      toast.success('Claim removed')
    } catch (error) {
      toast.error('Failed to unclaim item')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Wishlists</h1>
          <p className="text-muted-foreground mt-1">Gift ideas and coordination</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setShowAdd(true) }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* User Filters */}
      <div className="flex flex-wrap gap-2">
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
          All
          <Badge variant="secondary" className="ml-2 bg-muted text-foreground/80 text-xs">
            {items.length}
          </Badge>
        </Button>
        {FAMILY.map((member) => (
          <Button
            key={member.email}
            variant="outline"
            size="sm"
            onClick={() => setSelectedUser(selectedUser === member.email ? null : member.email)}
            className={cn(
              'border-border',
              selectedUser === member.email
                ? 'bg-muted text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {member.name}
            <Badge variant="secondary" className="ml-2 bg-muted text-foreground/80 text-xs">
              {userCounts[member.email] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Occasion Filters */}
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((occ) => (
          <Button
            key={occ.value}
            variant="outline"
            size="sm"
            onClick={() => setSelectedOccasion(occ.value)}
            className={cn(
              'border-border',
              selectedOccasion === occ.value
                ? 'bg-muted text-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {occ.label}
          </Button>
        ))}
      </div>

      {/* Items grouped by user */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No wishlist items yet</p>
          <Button
            onClick={() => { setEditingItem(null); setShowAdd(true) }}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first item
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([email, userItems]) => (
            <div key={email}>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {EMAIL_TO_NAME[email] || email}
                {email === userEmail && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (your list)
                  </span>
                )}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {userItems.map((item) => {
                  const isOwner = item.user_email === userEmail
                  const isClaimed = !!item.claimed_by
                  const isClaimedByMe = item.claimed_by === userEmail
                  const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG[2]

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        'bg-card/50 border-border transition-colors',
                        isClaimed && !isOwner && 'opacity-60'
                      )}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground truncate">
                                {item.title}
                              </h3>
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-blue-400 shrink-0"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.price && (
                                <span className="text-sm text-muted-foreground">{item.price}</span>
                              )}
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', priorityConfig.color)}
                              >
                                {priorityConfig.label}
                              </Badge>
                              <Badge variant="secondary" className="text-xs text-muted-foreground capitalize">
                                {item.occasion}
                              </Badge>
                            </div>
                          </div>
                          {isOwner && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingItem(item); setShowAdd(true) }}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.notes}
                          </p>
                        )}

                        {/* Claim section */}
                        {isOwner ? (
                          isClaimed && (
                            <p className="text-xs text-green-500">
                              <Check className="h-3 w-3 inline mr-1" />
                              Someone has this covered
                            </p>
                          )
                        ) : (
                          <div>
                            {isClaimed ? (
                              isClaimedByMe ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnclaim(item.id)}
                                  className="text-green-500 hover:text-red-400 h-7 px-2 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Claimed by you (undo)
                                </Button>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  <Check className="h-3 w-3 inline mr-1" />
                                  Claimed by {EMAIL_TO_NAME[item.claimed_by!] || 'someone'}
                                </p>
                              )
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClaim(item.id)}
                                className="text-xs h-7 border-border text-muted-foreground hover:text-foreground"
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                Claim
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddItemDialog
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditingItem(null) }}
        onSave={handleSave}
        editItem={editingItem}
      />
    </div>
  )
}
