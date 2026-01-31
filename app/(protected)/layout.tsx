import { Sidebar } from '@/components/sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
