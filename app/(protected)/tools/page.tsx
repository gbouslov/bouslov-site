'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Plane, Loader2, ExternalLink, ChevronDown, ChevronRight, Search } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ToolCall {
  id: string
  tool: string
  input: Record<string, unknown>
  result?: string
}

interface DisplayItem {
  type: 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content?: string
  toolCall?: ToolCall
}

const SUGGESTED_PROMPTS = [
  'Find a 7-day trip to 2 new Caribbean countries in May under $1500',
  'Cheapest flights from ORD to anywhere new in June',
  'Search southern Caribbean cruises leaving mid-May',
  'Find a 2-week trip to SE Asia in July, budget $2000 flights',
]

export default function ToolsPage() {
  const [input, setInput] = useState('')
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayItems])

  const toggleTool = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    setInput('')
    setIsLoading(true)

    // Add user message to display
    setDisplayItems(prev => [...prev, { type: 'user', content: messageText }])

    // Build conversation history for API
    const newMessages = [...messages, { role: 'user' as const, content: messageText }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6))

              if (currentEvent === 'text') {
                assistantText += data.content
                // Update or add assistant message
                setDisplayItems(prev => {
                  const last = prev[prev.length - 1]
                  if (last?.type === 'assistant') {
                    return [...prev.slice(0, -1), { type: 'assistant', content: assistantText }]
                  }
                  return [...prev, { type: 'assistant', content: assistantText }]
                })
              } else if (currentEvent === 'tool_call') {
                setDisplayItems(prev => [
                  ...prev,
                  {
                    type: 'tool_call',
                    toolCall: { id: data.id, tool: data.tool, input: data.input },
                  },
                ])
              } else if (currentEvent === 'tool_result') {
                setDisplayItems(prev => {
                  return prev.map(item => {
                    if (item.type === 'tool_call' && item.toolCall?.id === data.id) {
                      return {
                        ...item,
                        type: 'tool_result' as const,
                        toolCall: { ...item.toolCall!, result: data.result },
                      }
                    }
                    return item
                  })
                })
                // Reset assistant text for next chunk
                assistantText = ''
              } else if (currentEvent === 'error') {
                setDisplayItems(prev => [
                  ...prev,
                  { type: 'assistant', content: `Error: ${data.message}` },
                ])
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = ''
          }
        }
      }

      // Add assistant's full response to conversation history
      if (assistantText) {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
      }
    } catch (error) {
      setDisplayItems(prev => [
        ...prev,
        {
          type: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="flex items-center gap-3 mb-2">
                <Plane className="w-6 h-6 text-muted-foreground" />
                <h1 className="text-xl font-semibold text-foreground">Vacation Planner</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Search flights, find new countries, plan trips
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayItems.map((item, i) => {
                if (item.type === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">
                        {item.content}
                      </div>
                    </div>
                  )
                }

                if (item.type === 'assistant') {
                  return (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[85%] text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {renderMarkdown(item.content || '')}
                      </div>
                    </div>
                  )
                }

                if (item.type === 'tool_call' || item.type === 'tool_result') {
                  const tc = item.toolCall!
                  const isExpanded = expandedTools.has(tc.id)
                  const isDone = item.type === 'tool_result'
                  return (
                    <div key={i} className="flex justify-start">
                      <button
                        onClick={() => toggleTool(tc.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:bg-accent transition-colors"
                      >
                        {isDone ? (
                          <Search className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        <span className="font-mono">
                          {formatToolName(tc.tool)}({formatToolInput(tc.input)})
                        </span>
                        {isDone && (
                          isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      {isExpanded && tc.result && (
                        <div className="mt-1 ml-4 p-2 rounded bg-muted/30 text-[11px] font-mono text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {tc.result}
                        </div>
                      )}
                    </div>
                  )
                }

                return null
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find me a trip..."
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Searches real-time Google Flights prices. Prices may change — verify via links before booking.
          </p>
        </div>
      </div>
    </div>
  )
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace('get ', '')
}

function formatToolInput(input: Record<string, unknown>): string {
  const parts = []
  if (input.origin) parts.push(`${input.origin}`)
  if (input.destination) parts.push(`${input.destination}`)
  if (input.departure_date) parts.push(`${input.departure_date}`)
  if (input.query) parts.push(`"${input.query}"`)
  return parts.join(' → ') || '...'
}

function renderMarkdown(text: string): React.ReactNode {
  // Simple markdown: bold, links, code
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    // Links
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          {linkMatch[1]}
          <ExternalLink className="w-3 h-3" />
        </a>
      )
    }
    // Bold
    const boldMatch = part.match(/\*\*(.*?)\*\*/)
    if (boldMatch) {
      return <strong key={i} className="font-semibold text-foreground">{boldMatch[1]}</strong>
    }
    // Code
    const codeMatch = part.match(/`(.*?)`/)
    if (codeMatch) {
      return <code key={i} className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{codeMatch[1]}</code>
    }
    return <span key={i}>{part}</span>
  })
}
