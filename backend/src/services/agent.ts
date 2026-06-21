import { v4 as uuid } from 'uuid';
import { StorageService } from './storage.js';
import { GeminiService } from './gemini.js';
import { WhatsAppService } from './whatsapp.js';
import { broadcast } from '../websocket/index.js';
import type { WAConversation, WAMessage, EvolutionWebhookPayload } from '../types/index.js';

function isWithinBusinessHours(hours: WAConversation['stage'] extends string ? ReturnType<typeof StorageService.getAgentConfig>['businessHours'] : never): boolean {
  const cfg = StorageService.getAgentConfig().businessHours;
  if (!cfg.enabled) return true;

  const now = new Date();
  const day = now.getDay();
  if (!cfg.days.includes(day)) return false;

  const [startH, startM] = cfg.start.split(':').map(Number);
  const [endH, endM] = cfg.end.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return nowMin >= startMin && nowMin <= endMin;
}

function extractMessageText(payload: EvolutionWebhookPayload): string | null {
  const msg = payload.data?.message;
  if (!msg) return null;
  return (
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    msg.videoMessage?.caption ??
    msg.documentMessage?.caption ??
    null
  );
}

function getOrCreateConversation(phone: string, pushName: string): WAConversation {
  const existing = StorageService.getConversation(phone);
  if (existing) return existing;

  const now = Date.now();
  const conv: WAConversation = {
    id: phone,
    contactName: pushName || phone,
    contactPhone: phone,
    status: 'bot',
    lastMessage: '',
    lastMessageAt: now,
    unreadCount: 0,
    tags: [],
    createdAt: now,
    stage: 'greeting',
    collectedData: {},
    turnCount: 0,
    messages: [],
    geminiHistory: [],
  };

  StorageService.incrementAnalytics('totalConversations');
  StorageService.incrementAnalytics('conversationsToday');
  StorageService.incrementAnalytics('newConversationsToday');
  return conv;
}

export const AgentService = {
  async processIncoming(payload: EvolutionWebhookPayload): Promise<void> {
    const { key, pushName, messageTimestamp } = payload.data;

    // Ignore group messages and own messages
    if (WhatsAppService.isGroup(key.remoteJid) || key.fromMe) return;

    const phone = WhatsAppService.formatPhone(key.remoteJid);
    const text = extractMessageText(payload);
    if (!text) return;

    const config = StorageService.getAgentConfig();
    const conv = getOrCreateConversation(phone, pushName || phone);

    // Store user message
    const userMsg: WAMessage = {
      id: key.id,
      conversationId: phone,
      body: text,
      timestamp: (messageTimestamp || Date.now() / 1000) * 1000,
      fromMe: false,
      isBot: false,
      type: 'text',
      status: 'delivered',
    };

    conv.messages.push(userMsg);
    conv.lastMessage = text;
    conv.lastMessageAt = userMsg.timestamp;
    conv.unreadCount += 1;

    StorageService.incrementAnalytics('totalMessages');
    StorageService.saveConversation(conv);

    broadcast({ type: 'new_message', payload: { conversationId: phone, message: userMsg, conversation: conv } });

    // Don't auto-reply if human is handling or conversation closed
    if (conv.status !== 'bot' || !config.enabled) {
      return;
    }

    // Business hours check
    const withinHours = isWithinBusinessHours(config.businessHours as Parameters<typeof isWithinBusinessHours>[0]);
    if (!withinHours) {
      await AgentService.sendBotMessage(conv, config.businessHours.outsideMessage);
      return;
    }

    // Handoff keywords check
    const lowerText = text.toLowerCase();
    const wantsHuman = config.handoffKeywords.some(kw => lowerText.includes(kw.toLowerCase()));
    if (wantsHuman) {
      await AgentService.sendBotMessage(conv, config.handoffMessage);
      conv.status = 'human';
      StorageService.saveConversation(conv);
      broadcast({ type: 'conversation_updated', payload: conv });
      return;
    }

    // Max turns check
    if (conv.turnCount >= config.maxTurns) {
      await AgentService.sendBotMessage(
        conv,
        '🙋 Vou conectar você com um de nossos especialistas para continuar o atendimento!',
      );
      conv.status = 'human';
      StorageService.saveConversation(conv);
      broadcast({ type: 'conversation_updated', payload: conv });
      return;
    }

    // First message: send greeting
    if (conv.turnCount === 0) {
      await AgentService.sendBotMessage(conv, config.greeting);
      conv.turnCount += 1;
      StorageService.saveConversation(conv);
      return;
    }

    // Generate AI reply
    const startTime = Date.now();
    const reply = await GeminiService.generateReply(
      config.systemPrompt,
      conv.geminiHistory,
      text,
      config.knowledgeBase,
    );

    // Update history for multi-turn
    conv.geminiHistory.push(
      { role: 'user', parts: [{ text }] },
      { role: 'model', parts: [{ text: reply }] },
    );

    // Keep history manageable (last 20 turns)
    if (conv.geminiHistory.length > 40) {
      conv.geminiHistory = conv.geminiHistory.slice(-40);
    }

    conv.turnCount += 1;

    // Extract lead data from full conversation after 3+ turns
    if (config.captureLeads && conv.turnCount === 4) {
      const convText = conv.messages.map(m => `${m.fromMe ? 'Bot' : 'Cliente'}: ${m.body}`).join('\n');
      const extracted = await GeminiService.extractLeadData(convText);
      if (extracted.name) {
        conv.collectedData = { ...conv.collectedData, ...extracted };
        if (extracted.name) conv.contactName = extracted.name;
        StorageService.incrementAnalytics('leadsCaptures');
      }
    }

    await AgentService.sendBotMessage(conv, reply);

    const elapsed = Date.now() - startTime;
    const analytics = StorageService.getAnalytics();
    const avgPrev = analytics.avgResponseTimeMs || 0;
    const newAvg = Math.round((avgPrev * 0.8 + elapsed * 0.2));
    StorageService.updateAnalytics({ avgResponseTimeMs: newAvg });

    StorageService.saveConversation(conv);
  },

  async sendBotMessage(conv: WAConversation, text: string): Promise<void> {
    const sent = await WhatsAppService.sendText(conv.contactPhone, text);

    const botMsg: WAMessage = {
      id: uuid(),
      conversationId: conv.id,
      body: text,
      timestamp: Date.now(),
      fromMe: true,
      isBot: true,
      type: 'text',
      status: sent ? 'sent' : 'failed',
    };

    conv.messages.push(botMsg);
    conv.lastMessage = text;
    conv.lastMessageAt = botMsg.timestamp;

    StorageService.incrementAnalytics('botMessages');
    StorageService.incrementAnalytics('totalMessages');
    StorageService.saveConversation(conv);

    broadcast({ type: 'message_sent', payload: { conversationId: conv.id, message: botMsg } });
  },

  async sendHumanMessage(conversationId: string, text: string): Promise<WAMessage | null> {
    const conv = StorageService.getConversation(conversationId);
    if (!conv) return null;

    const sent = await WhatsAppService.sendText(conv.contactPhone, text);

    const msg: WAMessage = {
      id: uuid(),
      conversationId: conv.id,
      body: text,
      timestamp: Date.now(),
      fromMe: true,
      isBot: false,
      type: 'text',
      status: sent ? 'sent' : 'failed',
    };

    conv.messages.push(msg);
    conv.lastMessage = text;
    conv.lastMessageAt = msg.timestamp;

    StorageService.incrementAnalytics('humanMessages');
    StorageService.incrementAnalytics('totalMessages');
    StorageService.saveConversation(conv);

    broadcast({ type: 'message_sent', payload: { conversationId: conv.id, message: msg } });

    return msg;
  },
};
