'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trophy, Clock, TrendingUp } from 'lucide-react'
import { CATEGORIES, MEDALS, RANK_TITLES } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

interface Score {
  id: string
  score: number
  created_at: string
  proof_url?: string
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  category?: {
    slug: string
    name: string
    unit: string
    score_type: string
    icon: string
  }
}

interface LeaderboardProps {
  initialScores?: Record<string, Score[]>
  recentActivity?: Score[]
}

export function Leaderboard({ initialScores = {}, recentActivity = [] }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('overall')
  
  // Calculate overall rankings based on category placements
  const overallRankings = calculateOverallRankings(initialScores)

  return (
    <div className="space-y-8">
      {/* Overall Rankings */}
      <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Overall Rankings
          </CardTitle>
          <CardDescription>
            Based on placements across all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overallRankings.map((player, index) => (
              <Link 
                key={player.email} 
                href={`/profile/${encodeURIComponent(player.email)}`}
                className="block"
              >
                <Card className={`transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${
                  index === 0 ? 'border-yellow-500 bg-yellow-500/10' :
                  index === 1 ? 'border-gray-400 bg-gray-400/10' :
                  index === 2 ? 'border-orange-700 bg-orange-700/10' : ''
                }`}>
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{MEDALS[index]}</div>
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                        {player.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{RANK_TITLES[index]}</p>
                    <Badge variant="secondary" className="font-mono">
                      {player.points} pts
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Leaderboards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Category Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              {CATEGORIES.map(cat => (
                <TabsTrigger key={cat.slug} value={cat.slug} className="text-xs">
                  {cat.icon} {cat.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(category => (
              <TabsContent key={category.slug} value={category.slug}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{category.icon} {category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={category.external_url} target="_blank" rel="noopener noreferrer">
                      Take Test <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(initialScores[category.slug] || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No scores yet. Be the first to compete!
                    </p>
                  ) : (
                    (initialScores[category.slug] || []).map((score, index) => (
                      <div 
                        key={score.id}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          index === 0 ? 'bg-yellow-500/10' :
                          index === 1 ? 'bg-gray-400/10' :
                          index === 2 ? 'bg-orange-700/10' : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl w-8 text-center">
                          {MEDALS[index] || `#${index + 1}`}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={score.user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                            {score.user?.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{score.user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg font-mono">
                            {score.score}
                            <span className="text-sm text-muted-foreground ml-1">{category.unit}</span>
                          </p>
                          {score.proof_url && (
                            <a 
                              href={score.proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activity yet. Submit your first score!
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(score => (
                <div key={score.id} className="flex items-center gap-3 text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={score.user?.avatar_url} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                      {score.user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{score.user?.name}</span>
                  <span className="text-muted-foreground">scored</span>
                  <Badge variant="secondary" className="font-mono">
                    {score.score} {score.category?.unit}
                  </Badge>
                  <span className="text-muted-foreground">in</span>
                  <span>{score.category?.icon} {score.category?.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Calculate overall rankings based on points (4 for 1st, 3 for 2nd, 2 for 3rd, 1 for 4th)
function calculateOverallRankings(scoresByCategory: Record<string, Score[]>) {
  const pointsByPlayer: Record<string, { 
    name: string
    email: string
    avatar: string
    points: number 
  }> = {}

  // Initialize with allowed emails
  const allowedEmails = [
    { email: 'gbouslov@gmail.com', name: 'Gabe' },
    { email: 'dbouslov@gmail.com', name: 'Daniel' },
    { email: 'jbouslov@gmail.com', name: 'Jake' },
    { email: 'bouslovd@gmail.com', name: 'Dad' },
  ]

  allowedEmails.forEach(({ email, name }) => {
    pointsByPlayer[email] = { name, email, avatar: '', points: 0 }
  })

  // Award points for each category
  for (const scores of Object.values(scoresByCategory)) {
    scores.forEach((score, index) => {
      const email = score.user?.email
      if (email && pointsByPlayer[email]) {
        pointsByPlayer[email].points += Math.max(4 - index, 0)
        pointsByPlayer[email].avatar = score.user?.avatar_url || ''
        if (score.user?.name) {
          pointsByPlayer[email].name = score.user.name
        }
      }
    })
  }

  return Object.values(pointsByPlayer).sort((a, b) => b.points - a.points)
}
