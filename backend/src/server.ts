import http from 'http';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { config } from './config.js';
import { initWebSocket } from './websocket/index.js';

import webhookRouter from './routes/webhook.js';
import conversationsRouter from './routes/conversations.js';
import agentRouter from './routes/agent.js';
import instanceRouter from './routes/instance.js';

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

// ── Request logger ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.post('/webhook', webhookRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/instance', instanceRouter);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── WebSocket ───────────────────────────────────────────────────────────────
initWebSocket(server);

// ── Start ───────────────────────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`\n🤖 VÉRTICE WhatsApp AI Agent Backend`);
  console.log(`   HTTP  : http://localhost:${config.port}`);
  console.log(`   WS    : ws://localhost:${config.port}/ws`);
  console.log(`   Health: http://localhost:${config.port}/health\n`);
});

export default app;
