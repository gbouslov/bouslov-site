import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { FLIGHT_TOOLS, executeFlightTool } from '@/lib/vacation-tools'
import { buildVacationSystemPrompt } from '@/lib/vacation-prompt'

export const maxDuration = 300 // 5 min for Vercel Pro

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'messages array required' }, { status: 400 })
  }

  const userName = session.user.name || session.user.email.split('@')[0]
  const systemPrompt = buildVacationSystemPrompt(userName)

  // Build the base URL for internal API calls
  const baseUrl = process.env.VERCEL
    ? 'https://bouslov.com'
    : 'http://localhost:3000'

  // Streaming SSE response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Agentic tool loop — keep calling Claude until it stops using tools
        let conversationMessages = [...messages]
        let iterations = 0
        const maxIterations = 20 // safety limit

        while (iterations < maxIterations) {
          iterations++

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            tools: FLIGHT_TOOLS,
            messages: conversationMessages,
          })

          // Process response content blocks
          let hasToolUse = false
          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const block of response.content) {
            if (block.type === 'text') {
              send('text', { content: block.text })
            } else if (block.type === 'tool_use') {
              hasToolUse = true
              send('tool_call', {
                id: block.id,
                tool: block.name,
                input: block.input,
              })

              // Execute the tool
              const result = await executeFlightTool(
                block.name,
                block.input as Record<string, unknown>,
                baseUrl
              )

              send('tool_result', {
                id: block.id,
                tool: block.name,
                result: result.substring(0, 500) + (result.length > 500 ? '...' : ''),
              })

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: result,
              })
            }
          }

          // If Claude used tools, add the exchange and loop
          if (hasToolUse) {
            conversationMessages = [
              ...conversationMessages,
              { role: 'assistant' as const, content: response.content },
              { role: 'user' as const, content: toolResults },
            ]
            continue
          }

          // No tool use — Claude is done
          break
        }

        send('done', {})
        controller.close()
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
