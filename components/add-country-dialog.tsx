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
          className="gap-2 border-border bg-transparent hover:bg-muted hover:border-border text-foreground/80"
        >
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add a country you've visited</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/80"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
            {filteredCountries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
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
                        ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                        : "hover:bg-muted text-foreground/80 hover:text-foreground"
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
