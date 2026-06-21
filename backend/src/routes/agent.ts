import { Router } from 'express';
import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';
import type { WAAgentConfig } from '../types/index.js';

const router = Router();

router.get('/config', (_req, res) => {
  res.json(StorageService.getAgentConfig());
});

router.put('/config', (req, res) => {
  const cfg = req.body as WAAgentConfig;
  StorageService.saveAgentConfig(cfg);
  res.json({ ok: true, config: cfg });
});

router.post('/test', async (req, res) => {
  const { message } = req.body as { message: string };
  if (!message) return res.status(400).json({ error: 'message required' });

  const cfg = StorageService.getAgentConfig();
  const reply = await GeminiService.generateReply(cfg.systemPrompt, [], message, cfg.knowledgeBase);
  res.json({ reply });
});

router.get('/analytics', (_req, res) => {
  res.json(StorageService.getAnalytics());
});

export default router;
