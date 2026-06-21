export type WAMessageType = 'text' | 'image' | 'audio' | 'video' | 'document';
export type WAMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type WAConversationStatus = 'bot' | 'human' | 'closed';
export type WAConversationStage =
  | 'greeting'
  | 'qualifying'
  | 'showing_properties'
  | 'scheduling'
  | 'qualified'
  | 'closed';
export type WAInstanceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WAMessage {
  id: string;
  conversationId: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  isBot: boolean;
  type: WAMessageType;
  mediaUrl?: string;
  status: WAMessageStatus;
}

export interface WAConversationData {
  name?: string;
  interest?: string;
  budget?: string;
  timeline?: string;
  bedroomsDesired?: number;
  neighborhoodDesired?: string;
}

export interface WAConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  contactAvatar?: string;
  status: WAConversationStatus;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
  tags: string[];
  createdAt: number;
  stage: WAConversationStage;
  collectedData: WAConversationData;
  turnCount: number;
  leadId?: string;
  messages: WAMessage[];
  geminiHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}

export interface WABusinessHours {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
  outsideMessage: string;
}

export interface WAAgentConfig {
  enabled: boolean;
  name: string;
  greeting: string;
  systemPrompt: string;
  businessHours: WABusinessHours;
  handoffKeywords: string[];
  handoffMessage: string;
  maxTurns: number;
  captureLeads: boolean;
  knowledgeBase: string;
  language: string;
}

export interface WAInstance {
  id: string;
  name: string;
  status: WAInstanceStatus;
  phone?: string;
  qrCode?: string;
  connectedAt?: number;
  lastSeen?: number;
}

export interface WAStorageData {
  conversations: Record<string, WAConversation>;
  agentConfig: WAAgentConfig;
  instance: WAInstance;
  analytics: WAAnalytics;
}

export interface WAAnalytics {
  totalMessages: number;
  totalConversations: number;
  botMessages: number;
  humanMessages: number;
  leadsCaptures: number;
  conversationsToday: number;
  newConversationsToday: number;
  avgResponseTimeMs: number;
  lastResetDate: string;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: { caption?: string; url?: string };
      audioMessage?: { url?: string };
      videoMessage?: { caption?: string; url?: string };
      documentMessage?: { caption?: string; url?: string; fileName?: string };
    };
    messageType?: string;
    messageTimestamp?: number;
    pushName?: string;
    status?: string;
  };
}

export interface WSEvent {
  type:
    | 'new_message'
    | 'message_sent'
    | 'conversation_started'
    | 'conversation_updated'
    | 'instance_status'
    | 'qr_code'
    | 'analytics_update'
    | 'typing';
  payload: unknown;
}
