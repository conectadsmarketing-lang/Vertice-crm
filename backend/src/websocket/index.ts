import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { WSEvent } from '../types/index.js';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: import('http').Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'connected', payload: { ts: Date.now() } }));

    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', err => console.error('[WS] Error:', err));
  });

  console.log('[WS] WebSocket server ready at /ws');
}

export function broadcast(event: WSEvent) {
  if (!wss) return;
  const data = JSON.stringify(event);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
