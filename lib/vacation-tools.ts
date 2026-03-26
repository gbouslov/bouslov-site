/**
 * Flight search tool definitions for Claude API + execution layer.
 * Tools match the google-flights-mcp interface.
 * Execution calls the Python serverless function at /api/flights.
 */

import type Anthropic from '@anthropic-ai/sdk'

// Tool definitions for Claude API
export const FLIGHT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_cheapest_flights',
    description: 'Find the cheapest flights for a route, sorted by price. Use this for initial price scouting across destinations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        origin: { type: 'string', description: 'Origin airport IATA code (e.g., ORD, JFK)' },
        destination: { type: 'string', description: 'Destination airport IATA code (e.g., BGI, NRT)' },
        departure_date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        max_results: { type: 'integer', description: 'Maximum results to return (1-20)', default: 5 },
      },
      required: ['origin', 'destination', 'departure_date'],
    },
  },
  {
    name: 'get_best_flights',
    description: "Get flights marked as 'best' by Google Flights algorithm. Better layover quality than cheapest. Use when you need flight details (times, airline, stops).",
    input_schema: {
      type: 'object' as const,
      properties: {
        origin: { type: 'string', description: 'Origin airport IATA code' },
        destination: { type: 'string', description: 'Destination airport IATA code' },
        departure_date: { type: 'string', description: 'Departure date YYYY-MM-DD' },
        max_results: { type: 'integer', description: 'Maximum results (1-20)', default: 5 },
      },
      required: ['origin', 'destination', 'departure_date'],
    },
  },
  {
    name: 'search_flights',
    description: 'Full flight search with round-trip support. Use for round-trip searches or when you need all options.',
    input_schema: {
      type: 'object' as const,
      properties: {
        origin: { type: 'string', description: 'Origin airport IATA code' },
        destination: { type: 'string', description: 'Destination airport IATA code' },
        departure_date: { type: 'string', description: 'Departure date YYYY-MM-DD' },
        return_date: { type: 'string', description: 'Return date YYYY-MM-DD (optional for one-way)' },
        max_results: { type: 'integer', description: 'Maximum results', default: 10 },
      },
      required: ['origin', 'destination', 'departure_date'],
    },
  },
  {
    name: 'find_airports',
    description: 'Find airports matching a search query. Use when unsure about an IATA code.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term (city name, airport name, or IATA code)' },
        limit: { type: 'integer', description: 'Max results (1-50)', default: 5 },
      },
      required: ['query'],
    },
  },
]

/**
 * Execute a flight tool by calling the Python serverless function.
 * In production (Vercel), calls /api/flights.
 * Falls back to localhost for local dev.
 */
export async function executeFlightTool(
  toolName: string,
  params: Record<string, unknown>,
  baseUrl?: string
): Promise<string> {
  const url = baseUrl
    ? `${baseUrl}/api/flights`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flights`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return `Error calling ${toolName}: ${error.error || response.statusText}`
    }

    const data = await response.json()
    return data.result || 'No results found'
  } catch (error) {
    return `Error calling ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
