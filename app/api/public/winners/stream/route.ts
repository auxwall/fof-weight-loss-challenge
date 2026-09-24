import { NextRequest } from "next/server";
import { registerSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let unregisterClient: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {}
      };

      const client = registerSSEClient(send);
      unregisterClient = client.unregister;

      // Send initial connect ping
      send(`data: ${JSON.stringify({ type: "CONNECTED", clientId: client.id })}\n\n`);

      // Heartbeat every 20 seconds to keep connection alive indefinitely
      const heartbeat = setInterval(() => {
        send(`: heartbeat\n\n`);
      }, 20000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        if (unregisterClient) unregisterClient();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (unregisterClient) unregisterClient();
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
