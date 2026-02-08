import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Github, Crown, Globe, Keyboard, Brain, BookOpen, Gamepad2, Code, SquareAsterisk } from 'lucide-react'

export default async function QuicklinksPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const devLinks = [
    {
      name: 'GitHub Repo',
      url: 'https://github.com/gbouslov/bouslov-site',
      description: 'Source code for this site',
      icon: Github,
    },
    {
      name: 'Chessvia',
      url: 'https://chessvia.ai',
      description: 'Chess coaching platform',
      icon: Crown,
    },
  ]

  const gameLinks = [
    {
      name: 'GeoGuessr',
      url: 'https://www.geoguessr.com',
      description: 'Explore the world through Street View',
      icon: Globe,
    },
    {
      name: 'Chess.com Bughouse',
      url: 'https://www.chess.com/play/online/doubles-bughouse',
      description: 'Play doubles bughouse together',
      icon: Crown,
    },
    {
      name: 'MonkeyType',
      url: 'https://monkeytype.com',
      description: 'Typing speed test',
      icon: Keyboard,
    },
    {
      name: 'HumanBenchmark',
      url: 'https://humanbenchmark.com',
      description: 'Reaction time, memory, and more',
      icon: Brain,
    },
    {
      name: 'The Wiki Game',
      url: 'https://www.thewikigame.com',
      description: 'Navigate Wikipedia from start to finish',
      icon: BookOpen,
    },
    {
      name: 'Woogles.io',
      url: 'https://woogles.io',
      description: 'Free Scrabble - modern, open-source, multiplayer',
      icon: SquareAsterisk,
    },
    {
      name: 'Internet Scrabble Club',
      url: 'https://www.isc.ro',
      description: 'Classic Scrabble - 600+ players online',
      icon: SquareAsterisk,
    },
    {
      name: 'PlayScrabble (Official)',
      url: 'https://playscrabble.com',
      description: 'Official Hasbro Scrabble - play with friends',
      icon: SquareAsterisk,
    },
    {
      name: 'Lexulous',
      url: 'https://www.lexulous.com',
      description: 'Free word game - multiplayer or vs AI',
      icon: SquareAsterisk,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Quicklinks
        </h1>
        <p className="text-muted-foreground">
          Resources and games for the family
        </p>
      </div>

      {/* Dev / Resources */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Code className="h-5 w-5 text-blue-400" />
            Dev / Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {devLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card/30 hover:border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      {link.name}
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-muted-foreground" />
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Games */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Gamepad2 className="h-5 w-5 text-green-400" />
            Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {gameLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card/30 hover:border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      {link.name}
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-muted-foreground" />
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
