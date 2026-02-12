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
import { Plus, Search, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AddCountryDialogProps {
  existingCountries: string[]
  onAdd: (countryCode: string, countryName: string) => Promise<void>
}

export function AddCountryDialog({ existingCountries, onAdd }: AddCountryDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase()
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const toggleCountry = (country: { code: string; name: string }) => {
    if (existingCountries.includes(country.code)) return
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(country.code)) {
        next.delete(country.code)
      } else {
        next.set(country.code, country.name)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return

    setLoading(true)
    let added = 0
    let failed = 0

    for (const [code, name] of selected) {
      try {
        await onAdd(code, name)
        added++
      } catch {
        failed++
      }
    }

    if (added > 0) {
      toast.success(`Added ${added} ${added === 1 ? 'country' : 'countries'}`)
    }
    if (failed > 0) {
      toast.error(`Failed to add ${failed} ${failed === 1 ? 'country' : 'countries'}`)
    }

    setSelected(new Map())
    setSearch('')
    setOpen(false)
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelected(new Map())
      setSearch('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-border bg-transparent hover:bg-muted hover:border-border text-foreground/80"
        >
          <Plus className="h-4 w-4" />
          Add Countries
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add countries you've visited</DialogTitle>
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

          {/* Selected chips */}
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => toggleCountry({ code, name })}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground/80 text-xs font-medium hover:bg-muted/80 transition-colors"
                >
                  {name}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
            {filteredCountries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No countries found
              </p>
            ) : (
              filteredCountries.map((country) => {
                const isVisited = existingCountries.includes(country.code)
                const isSelected = selected.has(country.code)
                return (
                  <button
                    key={country.code}
                    onClick={() => toggleCountry(country)}
                    disabled={isVisited || loading}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                      isVisited
                        ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                        : isSelected
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted text-foreground/80 hover:text-foreground"
                    )}
                  >
                    <span className="text-sm font-medium">{country.name}</span>
                    {isVisited && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {isSelected && (
                      <div className="h-4 w-4 rounded border-2 border-foreground bg-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 text-background" />
                      </div>
                    )}
                    {!isVisited && !isSelected && (
                      <div className="h-4 w-4 rounded border-2 border-muted-foreground/40" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Submit button */}
          {selected.size > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selected.size} ${selected.size === 1 ? 'country' : 'countries'}`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
