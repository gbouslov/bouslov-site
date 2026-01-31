'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, Upload, Loader2, Trophy } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'

export function ScoreForm() {
  const router = useRouter()
  const [category, setCategory] = useState('')
  const [score, setScore] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCategory = CATEGORIES.find(c => c.slug === category)

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
          category,
          score: scoreNum,
          proof_url: proofUrl || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to submit score')
      }

      toast.success('Score submitted! 🎉')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Log Your Score
          </CardTitle>
          <CardDescription>
            Complete a test and record your achievement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* External Link */}
            {selectedCategory && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCategory.icon} {selectedCategory.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCategory.score_type === 'higher_better' 
                        ? '↑ Higher is better' 
                        : '↓ Lower is better'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={selectedCategory.external_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Take Test <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Score Input */}
            <div className="space-y-2">
              <Label htmlFor="score">
                Score * {selectedCategory && `(${selectedCategory.unit})`}
              </Label>
              <Input
                id="score"
                type="number"
                step="any"
                placeholder={selectedCategory ? `Enter your ${selectedCategory.unit}` : 'Enter your score'}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="font-mono text-lg"
              />
            </div>

            {/* Proof URL */}
            <div className="space-y-2">
              <Label htmlFor="proof">Proof URL (optional)</Label>
              <Input
                id="proof"
                type="url"
                placeholder="Link to screenshot or results page"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Share a link to your results for verification (e.g., screenshot URL, shared results page)
              </p>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
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
                  Submit Score
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Links</CardTitle>
          <CardDescription>Jump to any test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <Button key={cat.slug} variant="outline" size="sm" asChild>
                <a href={cat.external_url} target="_blank" rel="noopener noreferrer">
                  {cat.icon} {cat.name.split(' ')[0]}
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
