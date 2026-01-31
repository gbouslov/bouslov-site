'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { COUNTRIES } from '@/lib/countries'
import { Plus, Search, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AddCountryDialogProps {
  existingCountries: string[]
  onAdd: (countryCode: string, countryName: string) => Promise<void>
}

export function AddCountryDialog({ existingCountries, onAdd }: AddCountryDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase()
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const handleSelect = async (country: { code: string; name: string }) => {
    if (existingCountries.includes(country.code)) {
      toast.error('You have already added this country')
      return
    }

    setLoading(true)
    try {
      await onAdd(country.code, country.name)
      toast.success(`Added ${country.name}`)
      setOpen(false)
      setSearch('')
    } catch (error) {
      toast.error('Failed to add country')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300"
        >
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add a country you've visited</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
            {filteredCountries.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">
                No countries found
              </p>
            ) : (
              filteredCountries.map((country) => {
                const isVisited = existingCountries.includes(country.code)
                return (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    disabled={isVisited || loading}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                      isVisited
                        ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                        : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
                    )}
                  >
                    <span className="text-sm font-medium">{country.name}</span>
                    {isVisited && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
