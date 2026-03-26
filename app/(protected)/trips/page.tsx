'use client'

import dynamic from 'next/dynamic'

const TripsClient = dynamic(() => import('./trips-client').then(mod => mod.TripsClient), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-border border-t-slate-400 rounded-full animate-spin" />
    </div>
  ),
})

export default function TripsPage() {
  return <TripsClient />
}
