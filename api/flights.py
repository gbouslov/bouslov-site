"""
Vercel Python Serverless Function — Flight Search
Wraps google-flights-mcp tools as a REST endpoint.
Called internally by the Next.js chat API route.
"""

from http.server import BaseHTTPRequestHandler
import json
import asyncio
from google_flights_mcp.server import mcp


ALLOWED_TOOLS = {
    "search_flights",
    "get_cheapest_flights",
    "get_best_flights",
    "find_airports",
    "get_server_status",
}


async def call_flight_tool(tool_name: str, params: dict) -> str:
    """Call a google-flights-mcp tool directly, bypassing MCP protocol."""
    result = await mcp.call_tool(tool_name, params)
    # Extract text content from the ToolResult
    texts = []
    for content in result.content:
        if hasattr(content, "text"):
            texts.append(content.text)
    return "\n".join(texts)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))

            tool_name = body.get("tool")
            params = body.get("params", {})

            if tool_name not in ALLOWED_TOOLS:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Unknown tool: {tool_name}"}).encode())
                return

            # Run async tool call
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(call_flight_tool(tool_name, params))
            loop.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"result": result}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
