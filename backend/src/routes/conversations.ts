import { Router } from 'express';
import { StorageService } from '../services/storage.js';
import { AgentService } from '../services/agent.js';
import { broadcast } from '../websocket/index.js';

const router = Router();

// List all conversations
router.get('/', (_req, res) => {
  const conversations = StorageService.getConversations().map(c => ({
    ...c,
    messages: undefined,
    geminiHistory: undefined,
  }));
  res.json(conversations);
});

// Get conversation with messages
router.get('/:id', (req, res) => {
  const conv = StorageService.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const { geminiHistory: _gh, ...safe } = conv;
  res.json(safe);
});

// Send message (human agent)
router.post('/:id/send', async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const msg = await AgentService.sendHumanMessage(req.params.id, text.trim());
  if (!msg) return res.status(404).json({ error: 'Conversation not found' });

  res.json(msg);
});

// Update conversation status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body as { status: 'bot' | 'human' | 'closed' };
  const conv = StorageService.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });

  conv.status = status;
  StorageService.saveConversation(conv);
  broadcast({ type: 'conversation_updated', payload: { ...conv, geminiHistory: undefined } });

  res.json({ ok: true, status });
});

// Update tags
router.patch('/:id/tags', (req, res) => {
  const { tags } = req.body as { tags: string[] };
  const conv = StorageService.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });

  conv.tags = tags;
  StorageService.saveConversation(conv);
  res.json({ ok: true, tags });
});

// Mark conversation as read
router.post('/:id/read', (req, res) => {
  const conv = StorageService.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });

  conv.unreadCount = 0;
  StorageService.saveConversation(conv);
  res.json({ ok: true });
});

// Archive / delete
router.delete('/:id', (req, res) => {
  const conv = StorageService.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });

  conv.status = 'closed';
  StorageService.saveConversation(conv);
  broadcast({ type: 'conversation_updated', payload: { ...conv, geminiHistory: undefined } });
  res.json({ ok: true });
});

export default router;
