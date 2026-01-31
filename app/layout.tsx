import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bouslov Bros | Family Competition Leaderboard',
  description: 'The ultimate family competition leaderboard. Track scores across typing, chess, reaction time, and more!',
  openGraph: {
    title: 'Bouslov Bros | Family Competition Leaderboard',
    description: 'The ultimate family competition leaderboard',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <Nav />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
