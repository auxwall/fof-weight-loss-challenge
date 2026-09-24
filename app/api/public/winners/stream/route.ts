import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Global in-memory broadcast bus on globalThis so all API routes and webpack/turbo bundles share the exact same client list
type Client = {
  id: number;
  send: (data: string) => void;
};

const globalForSSE = globalThis as unknown as {
  sseClients?: Client[];
  nextClientId?: number;
};

if (!globalForSSE.sseClients) {
  globalForSSE.sseClients = [];
}
if (!globalForSSE.nextClientId) {
  globalForSSE.nextClientId = 1;
}

export function broadcastWinnersUpdate(payload?: any) {
  const clients = globalForSSE.sseClients || [];
  const message = JSON.stringify(payload || { timestamp: Date.now(), reload: true });
  const eventString = `data: ${message}\n\n`;
  for (const client of clients) {
    try {
      client.send(eventString);
    } catch {}
  }
}

export async function GET(req: NextRequest) {
  let clientId = (globalForSSE.nextClientId || 1);
  globalForSSE.nextClientId = clientId + 1;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {}
      };

      // Register client
      if (!globalForSSE.sseClients) globalForSSE.sseClients = [];
      globalForSSE.sseClients.push({ id: clientId, send });

      // Send initial connect ping
      send(`data: ${JSON.stringify({ type: "CONNECTED", clientId })}\n\n`);

      // Heartbeat every 20 seconds to keep connection alive indefinitely
      const heartbeat = setInterval(() => {
        send(`: heartbeat\n\n`);
      }, 20000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        if (globalForSSE.sseClients) {
          globalForSSE.sseClients = globalForSSE.sseClients.filter((c) => c.id !== clientId);
        }
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (globalForSSE.sseClients) {
        globalForSSE.sseClients = globalForSSE.sseClients.filter((c) => c.id !== clientId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
