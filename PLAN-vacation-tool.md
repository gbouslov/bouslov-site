# Plan: Vacation Planning Tool on bouslov.com

## Overview

Add a `/tools` route to bouslov.com that lets any authenticated Bouslov family member chat with Claude to find vacation flights. Claude uses the find-vacation skill logic, calls google-flights tools to search prices, filters against countries already visited, and returns structured itinerary recommendations with booking links.

## Architecture Decision: Python Microservice + Anthropic TS SDK

### Why not all-in-one on Vercel?
- google-flights-mcp is Python — can't run directly in Vercel Edge/Serverless
- A full search involves 10-50 flight API calls (3-5s each) = 30-250s total
- Vercel Pro timeout is 60s, even streaming

### Why not Claude Agent SDK?
- Agent SDK is Python-only — bouslov.com is TypeScript/Next.js
- Would require a separate Python service anyway
- The raw Anthropic TS SDK handles agentic tool loops fine

### The Architecture

```
┌─────────────────────────────────────────────────────┐
│  bouslov.com (Vercel)                               │
│                                                     │
│  /tools page ──→ /api/tools/chat (streaming)        │
│                    │                                 │
│                    ├── Loads visited countries (Supabase)
│                    ├── Builds system prompt (skill context)
│                    ├── Calls Claude API (Anthropic TS SDK)
│                    │     │                           │
│                    │     ├── Claude returns tool_use │
│                    │     ├── Server calls Flight API │
│                    │     ├── Sends tool_result back  │
│                    │     └── Loops until done         │
│                    │                                 │
│                    └── Streams response to frontend  │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Flight Search API (Railway/Fly.io)                 │
│                                                     │
│  FastAPI + google-flights-mcp                       │
│  POST /search    → search_flights()                 │
│  POST /cheapest  → get_cheapest_flights()           │
│  POST /best      → get_best_flights()               │
│  POST /airports  → find_airports()                  │
│                                                     │
│  No auth needed (internal only, rate-limited)       │
│  No MCP protocol — direct Python function calls     │
└─────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: Flight Search API Microservice
**Goal:** Standalone Python API that wraps google-flights-mcp tools as REST endpoints.

**Files:**
```
flight-api/
├── main.py           # FastAPI app with 4 endpoints
├── requirements.txt  # fastapi, uvicorn, google-flights-mcp
├── Dockerfile        # For Railway deployment
└── railway.json      # Railway config
```

**Endpoints:**
- `POST /search` — `search_flights(origin, destination, departure_date, ...)`
- `POST /cheapest` — `get_cheapest_flights(origin, destination, departure_date, ...)`
- `POST /best` — `get_best_flights(origin, destination, departure_date, ...)`
- `POST /airports` — `find_airports(query, limit)`
- `GET /health` — Status check

**Key design:**
- Calls `mcp.call_tool()` directly (bypasses MCP stdio protocol)
- Returns parsed JSON, not emoji-formatted strings
- Rate-limited (10 req/min per IP)
- CORS locked to bouslov.com
- Deployed on Railway free tier (always-on)

**Verification:** `curl -X POST https://flights.bouslov.com/cheapest -d '{"origin":"ORD","destination":"BGI","departure_date":"2026-05-15"}'` returns JSON flight data.

---

### Phase 2: Claude Chat API Route
**Goal:** Next.js API route that manages the Claude ↔ flight-tool agentic loop.

**Files:**
```
app/api/tools/chat/route.ts    # Streaming API route
lib/vacation-agent.ts          # Anthropic SDK + tool loop logic
lib/vacation-tools.ts          # Tool definitions + execution (calls Flight API)
lib/vacation-prompt.ts         # System prompt builder (skill context + visited countries)
```

**Flow:**
1. Frontend sends `{ message, conversationHistory }` to `/api/tools/chat`
2. Route loads user's visited countries from Supabase
3. Builds system prompt from find-vacation skill context + dynamic country list
4. Calls Claude API with streaming enabled
5. When Claude returns `tool_use`:
   - Execute by calling Flight Search API
   - Append `tool_result` to conversation
   - Call Claude again (loop)
6. Stream text responses and tool call status to frontend via SSE

**Tool definitions (for Claude API):**
```typescript
const tools = [
  {
    name: "search_flights",
    description: "Search for flights between two airports",
    input_schema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Origin IATA code" },
        destination: { type: "string", description: "Destination IATA code" },
        departure_date: { type: "string", description: "YYYY-MM-DD" },
        max_results: { type: "integer", default: 5 },
      },
      required: ["origin", "destination", "departure_date"]
    }
  },
  // ... get_cheapest_flights, get_best_flights, find_airports
]
```

**Streaming format (SSE):**
```
event: text
data: {"content": "Searching flights from ORD to BGI..."}

event: tool_call
data: {"tool": "get_cheapest_flights", "input": {"origin": "ORD", "destination": "BGI", "departure_date": "2026-05-15"}}

event: tool_result
data: {"tool": "get_cheapest_flights", "result": "...flight data..."}

event: text
data: {"content": "Found 5 options. The cheapest is $269 on American..."}

event: done
data: {}
```

**Verification:** Send a chat message, see Claude search flights, get structured results back.

---

### Phase 3: Frontend Chat UI
**Goal:** Chat interface at /tools that renders messages, tool activity, and structured flight results.

**Files:**
```
app/(protected)/tools/page.tsx         # Auth-gated page
app/(protected)/tools/tools-client.tsx # Chat UI
components/vacation-chat.tsx           # Chat message renderer
components/flight-card.tsx             # Structured flight result card
components/tool-activity.tsx           # "Searching flights..." indicator
```

**UI design:**
- Full-height layout, sidebar + main area (consistent with /trips)
- Chat input at bottom (like Linear's command bar)
- Messages render as cards:
  - **User messages:** Right-aligned, simple text
  - **Assistant text:** Left-aligned, markdown rendered
  - **Tool calls:** Collapsed "Searching ORD → BGI..." with expand to see raw data
  - **Flight results:** Structured cards with price, times, airline, booking link
- Suggested prompts: "Find me a Caribbean trip...", "Search flights ORD to..."
- Conversation persists in component state (not Supabase yet)

**Key components:**
- `FlightCard` — Reusable card showing route, price, times, airline, booking link
- `ToolActivity` — Animated indicator showing what Claude is doing
- `VacationChat` — Main chat renderer with message types

**Verification:** Type "find me a 7-day trip to 2 new Caribbean countries in May under $1500" and get a full itinerary response with flight cards.

---

### Phase 4: Polish & Integration
**Goal:** Wire into existing bouslov.com features.

**Tasks:**
- Add "Tools" to sidebar nav (between Trips and Pins)
- Load visited countries dynamically from Supabase (not hardcoded)
- Add "Save as Trip" button that creates a trip in the /trips globe view
- Add cost tracking (each search costs ~$0.02-0.10 in Claude API + $0 for flights scraping)
- Error handling for Flight API downtime
- Rate limiting per user (10 searches/hour)
- Mobile responsive chat UI

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| Claude API (Sonnet) | ~$0.02-0.10 per search (3-15 tool calls) |
| Claude API (Opus) | ~$0.10-0.50 per search |
| Flight Search API (Railway) | Free tier (500 hours/month) |
| google-flights scraping | Free (no API key) |
| Vercel hosting | Already covered |
| **Per search** | **~$0.05-0.15** |
| **100 searches/month** | **~$5-15** |

Recommendation: Use Sonnet for initial search/routing, Opus only for complex synthesis. Most searches will cost under $0.10.

## Environment Variables Needed

```
ANTHROPIC_API_KEY=sk-ant-...         # Claude API
FLIGHT_API_URL=https://flights-api.up.railway.app  # Flight microservice
FLIGHT_API_SECRET=...                # Internal auth token
```

## Timeline Estimate

| Phase | Effort | Depends On |
|-------|--------|-----------|
| Phase 1: Flight API | 2-3 hours | Nothing |
| Phase 2: Chat API Route | 3-4 hours | Phase 1 |
| Phase 3: Frontend UI | 3-4 hours | Phase 2 |
| Phase 4: Polish | 2-3 hours | Phase 3 |
| **Total** | **10-14 hours** | |

## Open Questions Resolved

1. **Claude Agent SDK vs raw SDK?** → Raw Anthropic TS SDK. Agent SDK is Python-only and adds complexity without benefit here.

2. **MCP tool bridging?** → Skip MCP protocol entirely. Call `mcp.call_tool()` directly in Python. Wrap in FastAPI REST endpoints. TypeScript calls REST, not MCP.

3. **Streaming vs non-streaming?** → Streaming via SSE. Essential for UX since searches take 30-120s. User sees progress ("Searching ORD→BGI... found 5 options. Now checking return...").

4. **Long-running searches?** → Flight API handles the slow part (3-5s per scrape). Claude API calls are fast (<2s). The streaming SSE connection stays alive on Vercel. Total search time 30-120s is fine with streaming.

5. **Save results?** → Phase 4. Not needed for MVP. Add "Save as Trip" later that writes to trip-data.ts or a Supabase trips table.

6. **Cost management?** → Rate limit at 10 searches/hour per user. Log all searches to Supabase for monitoring. Use Sonnet by default, Opus optional.
