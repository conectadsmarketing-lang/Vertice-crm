import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import type { WAStorageData, WAAgentConfig, WAInstance, WAAnalytics } from '../types/index.js';

const DATA_FILE = path.join(config.dataDir, 'whatsapp_agent.json');

const DEFAULT_AGENT_CONFIG: WAAgentConfig = {
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

Regras de ouro:
- Seja sempre simpática, profissional e objetiva
- Use emojis com moderação (1-2 por mensagem no máximo)
- Responda em português brasileiro
- Mantenha respostas curtas (máx 3-4 linhas)
- Nunca invente informações sobre imóveis
- Se não souber, ofereça transferir para corretor humano
- Colete: nome, interesse (compra/aluguel), tipo de imóvel, bairro/cidade, orçamento`,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5],
    outsideMessage:
      '⏰ Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Amanhã cedo retornaremos o contato! Deixe seu nome para já começarmos.',
  },
  handoffKeywords: ['humano', 'corretor', 'atendente', 'pessoa', 'falar com alguém', 'ligar'],
  handoffMessage:
    '👤 Entendido! Vou transferir você para um de nossos corretores agora. Em instantes alguém entrará em contato. Obrigada pela preferência! 😊',
  maxTurns: 20,
  captureLeads: true,
  knowledgeBase: '',
  language: 'pt-BR',
};

const DEFAULT_INSTANCE: WAInstance = {
  id: 'vertice-crm',
  name: 'VÉRTICE CRM',
  status: 'disconnected',
};

const DEFAULT_ANALYTICS: WAAnalytics = {
  totalMessages: 0,
  totalConversations: 0,
  botMessages: 0,
  humanMessages: 0,
  leadsCaptures: 0,
  conversationsToday: 0,
  newConversationsToday: 0,
  avgResponseTimeMs: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
};

function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

function load(): WAStorageData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      conversations: {},
      agentConfig: DEFAULT_AGENT_CONFIG,
      instance: DEFAULT_INSTANCE,
      analytics: DEFAULT_ANALYTICS,
    };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as WAStorageData;
  } catch {
    return {
      conversations: {},
      agentConfig: DEFAULT_AGENT_CONFIG,
      instance: DEFAULT_INSTANCE,
      analytics: DEFAULT_ANALYTICS,
    };
  }
}

function save(data: WAStorageData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const StorageService = {
  getData: load,

  getConversations() {
    return Object.values(load().conversations).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },

  getConversation(id: string) {
    return load().conversations[id] ?? null;
  },

  saveConversation(conv: WAStorageData['conversations'][string]) {
    const data = load();
    data.conversations[conv.id] = conv;
    save(data);
  },

  getAgentConfig(): WAAgentConfig {
    const data = load();
    return { ...DEFAULT_AGENT_CONFIG, ...data.agentConfig };
  },

  saveAgentConfig(cfg: WAAgentConfig) {
    const data = load();
    data.agentConfig = cfg;
    save(data);
  },

  getInstance(): WAInstance {
    const data = load();
    return { ...DEFAULT_INSTANCE, ...data.instance };
  },

  saveInstance(instance: WAInstance) {
    const data = load();
    data.instance = instance;
    save(data);
  },

  getAnalytics(): WAAnalytics {
    const data = load();
    const today = new Date().toISOString().split('T')[0];
    if (data.analytics.lastResetDate !== today) {
      data.analytics.conversationsToday = 0;
      data.analytics.newConversationsToday = 0;
      data.analytics.lastResetDate = today;
      save(data);
    }
    return { ...DEFAULT_ANALYTICS, ...data.analytics };
  },

  updateAnalytics(updates: Partial<WAAnalytics>) {
    const data = load();
    data.analytics = { ...DEFAULT_ANALYTICS, ...data.analytics, ...updates };
    save(data);
  },

  incrementAnalytics(field: keyof WAAnalytics, amount = 1) {
    const data = load();
    const analytics = { ...DEFAULT_ANALYTICS, ...data.analytics };
    const current = analytics[field];
    if (typeof current === 'number') {
      (analytics[field] as number) = current + amount;
    }
    data.analytics = analytics;
    save(data);
  },
};
