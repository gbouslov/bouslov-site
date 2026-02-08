'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ExternalLink,
  Upload,
  Loader2,
  Trophy,
  Keyboard,
  Zap,
  Brain,
  Target,
  Crosshair,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Puzzle,
  Globe,
  Map,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Category } from '@/lib/supabase'

const ICON_MAP: Record<string, React.ReactNode> = {
  Keyboard: <Keyboard className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Crosshair: <Crosshair className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Puzzle: <Puzzle className="h-4 w-4" />,
}

function getIcon(iconName: string): React.ReactNode {
  return ICON_MAP[iconName] || <Trophy className="h-4 w-4" />
}

interface ScoreFormProps {
  categories: Category[]
}

export function ScoreForm({ categories }: ScoreFormProps) {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [score, setScore] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter out API-synced and travel categories
  const manualCategories = categories.filter(
    c => !c.api_source && !c.slug.includes('countries') && !c.slug.includes('states')
  )

  const selectedCategory = manualCategories.find(c => c.slug === category)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || !score) {
      toast.error('Please fill in all required fields')
      return
    }

    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum)) {
      toast.error('Please enter a valid number')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_slug: category,
          value: scoreNum,
          proof_url: proofUrl || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to submit score')
      }

      toast.success('Score submitted!')
      router.push('/leaderboard')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-amber-400" />
            Log Score
          </CardTitle>
          <CardDescription className="text-muted-foreground">Record your achievement</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground/80">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-border bg-muted/50 text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {manualCategories.map(cat => (
                    <SelectItem
                      key={cat.slug}
                      value={cat.slug}
                      className="text-foreground/80 focus:bg-muted focus:text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        {getIcon(cat.icon)}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* External Link */}
            {selectedCategory && (
              <div className="p-4 rounded-lg border border-border bg-card/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground/80 flex items-center gap-2">
                      {getIcon(selectedCategory.icon)}
                      {selectedCategory.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                      {selectedCategory.higher_is_better ? (
                        <>
                          <ArrowUp className="h-3 w-3" /> Higher is better
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3" /> Lower is better
                        </>
                      )}
                    </p>
                  </div>
                  {selectedCategory.external_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-border bg-transparent hover:bg-muted text-foreground/80"
                    >
                      <a
                        href={selectedCategory.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Test <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Score Input */}
            <div className="space-y-2">
              <Label htmlFor="score" className="text-foreground/80">
                Score{' '}
                {selectedCategory && (
                  <span className="text-muted-foreground">({selectedCategory.unit})</span>
                )}
              </Label>
              <Input
                id="score"
                type="number"
                step="any"
                placeholder={selectedCategory ? `Enter ${selectedCategory.unit}` : 'Enter score'}
                value={score}
                onChange={e => setScore(e.target.value)}
                className="font-mono text-lg border-border bg-muted/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Proof URL */}
            <div className="space-y-2">
              <Label htmlFor="proof" className="text-foreground/80">
                Proof URL <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                id="proof"
                type="url"
                placeholder="Link to screenshot or results"
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground/60">Screenshot or results page URL for verification</p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mt-6 border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {manualCategories
              .filter(cat => cat.external_url && !cat.external_url.startsWith('/'))
              .map(cat => (
                <Button
                  key={cat.slug}
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-border bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground/80"
                >
                  <a href={cat.external_url!} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-1.5">
                      {getIcon(cat.icon)}
                      {cat.name.split(' ')[0]}
                    </span>
                  </a>
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
