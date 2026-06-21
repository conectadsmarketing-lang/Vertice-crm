import { GoogleGenAI } from '@google/genai';
import type {
  WAConversation, WAMessage, WAAgentConfig, WAInstance, WAAnalytics, WAConversationData,
} from '../types';

// ── Gemini client ────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  CONVERSATIONS: 'wa_conversations',
  CONFIG: 'wa_agent_config',
  INSTANCE: 'wa_instance',
  ANALYTICS: 'wa_analytics',
} as const;

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: WAAgentConfig = {
  enabled: true,
  name: 'Vera',
  greeting:
    'Olá! 👋 Sou a *Vera*, assistente virtual da *VÉRTICE Imóveis*.\n\nPosso te ajudar a encontrar o imóvel dos seus sonhos! 🏠\n\nPara começar, me conta: qual é o seu nome?',
  systemPrompt: `Você é Vera, assistente virtual especializada em imóveis da VÉRTICE Imóveis.

Seu objetivo é:
1. Qualificar leads de forma amigável e natural
2. Entender o que o cliente busca (compra/aluguel, tipo, localização, orçamento)
3. Apresentar opções relevantes do catálogo
4. Agendar visitas com os corretores
5. Transferir para atendimento humano quando necessário

Regras:
- Seja sempre simpática, profissional e objetiva
- Use emojis com moderação (1-2 por mensagem no máximo)
- Responda em português brasileiro
- Mantenha respostas curtas (máx 3-4 linhas)
- Colete: nome, interesse (compra/aluguel), tipo de imóvel, bairro/cidade, orçamento`,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5],
    outsideMessage:
      '⏰ Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Amanhã cedo retornaremos! Deixe seu nome para começarmos.',
  },
  handoffKeywords: ['humano', 'corretor', 'atendente', 'pessoa real', 'falar com alguém'],
  handoffMessage:
    '👤 Vou transferir você para um de nossos corretores. Em instantes alguém entrará em contato. Obrigada! 😊',
  maxTurns: 20,
  captureLeads: true,
  knowledgeBase: '',
  language: 'pt-BR',
};

const DEFAULT_INSTANCE: WAInstance = {
  id: 'local',
  name: 'VÉRTICE CRM (Demo)',
  status: 'connected',
};

const DEFAULT_ANALYTICS: WAAnalytics = {
  totalMessages: 0,
  totalConversations: 0,
  botMessages: 0,
  humanMessages: 0,
  leadsCaptures: 0,
  conversationsToday: 0,
  newConversationsToday: 0,
  avgResponseTimeMs: 850,
  lastResetDate: new Date().toISOString().split('T')[0],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function now() { return Date.now(); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function loadConversations(): Record<string, WAConversation & { _history?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }> }> {
  const raw = localStorage.getItem(KEYS.CONVERSATIONS);
  return raw ? JSON.parse(raw) : {};
}

function saveConversations(data: ReturnType<typeof loadConversations>) {
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(data));
}

function loadConfig(): WAAgentConfig {
  const raw = localStorage.getItem(KEYS.CONFIG);
  return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
}

function loadAnalytics(): WAAnalytics {
  const raw = localStorage.getItem(KEYS.ANALYTICS);
  const stored = raw ? JSON.parse(raw) : DEFAULT_ANALYTICS;
  const today = new Date().toISOString().split('T')[0];
  if (stored.lastResetDate !== today) {
    stored.conversationsToday = 0;
    stored.newConversationsToday = 0;
    stored.lastResetDate = today;
    localStorage.setItem(KEYS.ANALYTICS, JSON.stringify(stored));
  }
  return stored;
}

function saveAnalytics(a: WAAnalytics) {
  localStorage.setItem(KEYS.ANALYTICS, JSON.stringify(a));
}

function incAnalytics(field: keyof WAAnalytics, amount = 1) {
  const a = loadAnalytics();
  const val = a[field];
  if (typeof val === 'number') (a[field] as number) = val + amount;
  saveAnalytics(a);
}

// ── Gemini AI ─────────────────────────────────────────────────────────────────
async function generateBotReply(
  config: WAAgentConfig,
  history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
  userMessage: string,
): Promise<string> {
  const systemInstruction = config.knowledgeBase
    ? `${config.systemPrompt}\n\n--- BASE DE CONHECIMENTO ---\n${config.knowledgeBase}`
    : config.systemPrompt;

  const contents = [
    ...history,
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: { systemInstruction, maxOutputTokens: 512, temperature: 0.7 },
  });

  return response.text?.trim() || 'Desculpe, tive um problema técnico. Tente novamente!';
}

// ── Seed mock conversations ───────────────────────────────────────────────────
function seedIfEmpty() {
  const data = loadConversations();
  if (Object.keys(data).length > 0) return;

  const mockConvs: WAConversation[] = [
    {
      id: '5511912340001',
      contactName: 'Ana Silva',
      contactPhone: '5511912340001',
      status: 'bot',
      lastMessage: 'Estou buscando um apartamento de 2 quartos no Itaim',
      lastMessageAt: now() - 5 * 60_000,
      unreadCount: 2,
      tags: ['lead-quente'],
      createdAt: now() - 15 * 60_000,
      stage: 'qualifying',
      collectedData: { name: 'Ana Silva', interest: 'compra' },
      turnCount: 3,
      messages: [
        { id: 'msg1', conversationId: '5511912340001', body: 'Olá! Gostaria de saber mais sobre apartamentos', timestamp: now() - 15 * 60_000, fromMe: false, isBot: false, type: 'text', status: 'read' },
        { id: 'msg2', conversationId: '5511912340001', body: 'Olá! 👋 Sou a Vera, assistente da VÉRTICE Imóveis. Como posso ajudar? Qual é o seu nome?', timestamp: now() - 14 * 60_000, fromMe: true, isBot: true, type: 'text', status: 'read' },
        { id: 'msg3', conversationId: '5511912340001', body: 'Sou Ana! Estou buscando um apartamento de 2 quartos no Itaim', timestamp: now() - 5 * 60_000, fromMe: false, isBot: false, type: 'text', status: 'delivered' },
      ],
    },
    {
      id: '5511923450002',
      contactName: 'Carlos Menezes',
      contactPhone: '5511923450002',
      status: 'human',
      lastMessage: 'Quando posso visitar o imóvel na Av. Paulista?',
      lastMessageAt: now() - 35 * 60_000,
      unreadCount: 0,
      tags: ['visita-agendada'],
      createdAt: now() - 2 * 3600_000,
      stage: 'scheduling',
      collectedData: { name: 'Carlos Menezes', interest: 'compra', budget: 'R$ 800.000', neighborhoodDesired: 'Paulista' },
      turnCount: 8,
      messages: [
        { id: 'msg4', conversationId: '5511923450002', body: 'Boa tarde, tenho interesse em imóveis na Paulista', timestamp: now() - 2 * 3600_000, fromMe: false, isBot: false, type: 'text', status: 'read' },
        { id: 'msg5', conversationId: '5511923450002', body: 'Boa tarde, Carlos! Temos ótimas opções na Paulista. Qual seu orçamento?', timestamp: now() - 2 * 3600_000 + 30_000, fromMe: true, isBot: true, type: 'text', status: 'read' },
        { id: 'msg6', conversationId: '5511923450002', body: 'Quando posso visitar o imóvel na Av. Paulista?', timestamp: now() - 35 * 60_000, fromMe: false, isBot: false, type: 'text', status: 'read' },
      ],
    },
    {
      id: '5511934560003',
      contactName: 'Mariana Costa',
      contactPhone: '5511934560003',
      status: 'closed',
      lastMessage: 'Muito obrigada pelo atendimento!',
      lastMessageAt: now() - 2 * 3600_000,
      unreadCount: 0,
      tags: ['fechado'],
      createdAt: now() - 24 * 3600_000,
      stage: 'closed',
      collectedData: { name: 'Mariana Costa', interest: 'aluguel', budget: 'R$ 3.500/mês' },
      turnCount: 12,
      messages: [
        { id: 'msg7', conversationId: '5511934560003', body: 'Muito obrigada pelo atendimento!', timestamp: now() - 2 * 3600_000, fromMe: false, isBot: false, type: 'text', status: 'read' },
      ],
    },
  ];

  const stored: ReturnType<typeof loadConversations> = {};
  mockConvs.forEach(c => { stored[c.id] = { ...c, _history: [] }; });
  saveConversations(stored);

  const a = loadAnalytics();
  a.totalMessages = 12; a.totalConversations = 3; a.botMessages = 8;
  a.humanMessages = 4; a.leadsCaptures = 2; a.conversationsToday = 2;
  a.newConversationsToday = 1; a.avgResponseTimeMs = 920;
  saveAnalytics(a);
}

// ── Public API ────────────────────────────────────────────────────────────────
export const WAAgentService = {
  init() { seedIfEmpty(); },

  getConversations(): WAConversation[] {
    return Object.values(loadConversations())
      .map(({ _history: _h, ...c }) => c as WAConversation)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },

  getConversation(id: string): WAConversation | null {
    const all = loadConversations();
    const c = all[id];
    if (!c) return null;
    const { _history: _h, ...conv } = c;
    return conv as WAConversation;
  },

  getAgentConfig(): WAAgentConfig { return loadConfig(); },

  saveAgentConfig(cfg: WAAgentConfig) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(cfg));
  },

  getInstance(): WAInstance {
    const raw = localStorage.getItem(KEYS.INSTANCE);
    return raw ? { ...DEFAULT_INSTANCE, ...JSON.parse(raw) } : DEFAULT_INSTANCE;
  },

  getAnalytics(): WAAnalytics { return loadAnalytics(); },

  markRead(id: string) {
    const all = loadConversations();
    if (all[id]) { all[id].unreadCount = 0; saveConversations(all); }
  },

  setStatus(id: string, status: WAConversation['status']) {
    const all = loadConversations();
    if (all[id]) { all[id].status = status; saveConversations(all); }
  },

  // Simulate receiving a WhatsApp message from contact (demo/test)
  async simulateIncoming(phone: string, contactName: string, text: string): Promise<{ userMsg: WAMessage; botMsg: WAMessage | null }> {
    const all = loadConversations();
    const config = loadConfig();
    const ts = now();

    if (!all[phone]) {
      all[phone] = {
        id: phone,
        contactName,
        contactPhone: phone,
        status: 'bot',
        lastMessage: text,
        lastMessageAt: ts,
        unreadCount: 1,
        tags: [],
        createdAt: ts,
        stage: 'greeting',
        collectedData: {},
        turnCount: 0,
        messages: [],
        _history: [],
      };
      incAnalytics('totalConversations');
      incAnalytics('conversationsToday');
      incAnalytics('newConversationsToday');
    }

    const conv = all[phone];
    const userMsg: WAMessage = {
      id: uid(),
      conversationId: phone,
      body: text,
      timestamp: ts,
      fromMe: false,
      isBot: false,
      type: 'text',
      status: 'delivered',
    };
    conv.messages.push(userMsg);
    conv.lastMessage = text;
    conv.lastMessageAt = ts;
    conv.unreadCount += 1;
    incAnalytics('totalMessages');
    saveConversations(all);

    let botMsg: WAMessage | null = null;

    if (conv.status === 'bot' && config.enabled) {
      let replyText: string;

      // Check handoff keywords
      const lower = text.toLowerCase();
      const wantsHuman = config.handoffKeywords.some(kw => lower.includes(kw.toLowerCase()));

      if (wantsHuman) {
        replyText = config.handoffMessage;
        conv.status = 'human';
      } else if (conv.turnCount === 0) {
        replyText = config.greeting;
      } else if (conv.turnCount >= config.maxTurns) {
        replyText = '🙋 Vou conectar você com um especialista agora!';
        conv.status = 'human';
      } else {
        try {
          const history = conv._history || [];
          replyText = await generateBotReply(config, history, text);
          conv._history = conv._history || [];
          conv._history.push(
            { role: 'user', parts: [{ text }] },
            { role: 'model', parts: [{ text: replyText }] },
          );
          if (conv._history.length > 40) conv._history = conv._history.slice(-40);
        } catch {
          replyText = 'Desculpe, tive um problema. Tente novamente em instantes!';
        }
      }

      conv.turnCount += 1;

      botMsg = {
        id: uid(),
        conversationId: phone,
        body: replyText,
        timestamp: now() + 500,
        fromMe: true,
        isBot: true,
        type: 'text',
        status: 'sent',
      };
      conv.messages.push(botMsg);
      conv.lastMessage = replyText;
      conv.lastMessageAt = botMsg.timestamp;
      incAnalytics('botMessages');
      incAnalytics('totalMessages');
    }

    saveConversations(all);
    return { userMsg, botMsg };
  },

  // Send a message from the human agent
  async sendHumanMessage(conversationId: string, text: string): Promise<WAMessage> {
    const all = loadConversations();
    const conv = all[conversationId];
    if (!conv) throw new Error('Conversation not found');

    const msg: WAMessage = {
      id: uid(),
      conversationId,
      body: text,
      timestamp: now(),
      fromMe: true,
      isBot: false,
      type: 'text',
      status: 'sent',
    };
    conv.messages.push(msg);
    conv.lastMessage = text;
    conv.lastMessageAt = msg.timestamp;
    incAnalytics('humanMessages');
    incAnalytics('totalMessages');
    saveConversations(all);
    return msg;
  },

  async testBotReply(message: string): Promise<string> {
    const config = loadConfig();
    return generateBotReply(config, [], message);
  },

  extractData(id: string): WAConversationData {
    const all = loadConversations();
    return all[id]?.collectedData ?? {};
  },
};
