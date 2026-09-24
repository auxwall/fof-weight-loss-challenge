// Global in-memory broadcast bus for Server-Sent Events (SSE) across module boundaries
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

export function registerSSEClient(send: (data: string) => void): { id: number; unregister: () => void } {
  const clientId = globalForSSE.nextClientId || 1;
  globalForSSE.nextClientId = clientId + 1;

  if (!globalForSSE.sseClients) globalForSSE.sseClients = [];
  globalForSSE.sseClients.push({ id: clientId, send });

  return {
    id: clientId,
    unregister: () => {
      if (globalForSSE.sseClients) {
        globalForSSE.sseClients = globalForSSE.sseClients.filter((c) => c.id !== clientId);
      }
    },
  };
}
