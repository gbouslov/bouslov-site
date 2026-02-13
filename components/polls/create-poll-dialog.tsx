'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreatePollDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (question: string, options: string[]) => void
}

export function CreatePollDialog({ isOpen, onClose, onCreate }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) return

    setIsSubmitting(true)
    try {
      await onCreate(question, options.filter((o) => o.trim()))
      setQuestion('')
      setOptions(['', ''])
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)))
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-popover border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Create Poll</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should we do for dinner?"
                className="bg-muted border-border"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="bg-muted border-border flex-1"
                      maxLength={200}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="text-muted-foreground hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add option
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !question.trim() ||
                  options.filter((o) => o.trim()).length < 2 ||
                  isSubmitting
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
