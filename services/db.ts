import { supabase } from './supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ── Types mirroring the DB schema ─────────────────────────────────────────────
export interface DBCompany {
  id: string;
  name: string;
  segment: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  hours: string | null;
  about: string | null;
  created_at: string;
}

export interface DBUser {
  id: string;
  company_id: string | null;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export interface DBAgent {
  id: string;
  company_id: string;
  name: string | null;
  segment: string | null;
  tone: string | null;
  objective: string | null;
  required_questions: Array<{ label: string; key: string }>;
  human_handoff_rules: string | null;
  welcome_message: string | null;
  followup_message: string | null;
  closing_message: string | null;
  generated_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBProduct {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  price: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface DBFAQ {
  id: string;
  company_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface DBSeller {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  specialty: string | null;
  active: boolean;
  created_at: string;
}

export interface DBLead {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  budget: string | null;
  deadline: string | null;
  seller_id: string | null;
  status: 'novo' | 'atendimento' | 'quente' | 'perdido' | 'fechado';
  summary: string | null;
  last_interaction: string;
  created_at: string;
}

export interface DBConversation {
  id: string;
  company_id: string;
  lead_id: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  status: 'bot' | 'human' | 'closed';
  stage: string;
  turn_count: number;
  unread_count: number;
  last_message: string | null;
  last_message_at: string;
  tags: string[];
  collected_data: Record<string, unknown>;
  gemini_history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>;
  created_at: string;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  sender: 'cliente' | 'ia' | 'vendedor';
  content: string;
  from_me: boolean;
  is_bot: boolean;
  msg_type: string;
  msg_status: string;
  whatsapp_id: string | null;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const Auth = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ── Profile & Company ─────────────────────────────────────────────────────────
export const Profile = {
  async get(): Promise<DBUser | null> {
    const { data } = await supabase.from('users').select('*').single();
    return data;
  },

  async update(updates: Partial<DBUser>) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', (await supabase.auth.getUser()).data.user!.id).select().single();
    if (error) throw error;
    return data as DBUser;
  },

  async getCompany(): Promise<DBCompany | null> {
    const { data } = await supabase.from('companies').select('*').single();
    return data;
  },

  async createCompany(input: { name: string; segment: string; whatsapp: string; email: string; city: string }) {
    const { data: company, error: ce } = await supabase.from('companies').insert(input).select().single();
    if (ce) throw ce;

    const { error: ue } = await supabase.from('users')
      .update({ company_id: company.id })
      .eq('id', (await supabase.auth.getUser()).data.user!.id);
    if (ue) throw ue;

    return company as DBCompany;
  },

  async updateCompany(updates: Partial<DBCompany>) {
    const { data, error } = await supabase.from('companies').update(updates).eq('id', updates.id!).select().single();
    if (error) throw error;
    return data as DBCompany;
  },
};

// ── Agent Config ──────────────────────────────────────────────────────────────
export const AgentDB = {
  async get(): Promise<DBAgent | null> {
    const { data } = await supabase.from('agents').select('*').single();
    return data;
  },

  async upsert(input: Partial<DBAgent> & { company_id: string }) {
    const { data, error } = await supabase.from('agents')
      .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: 'company_id' })
      .select().single();
    if (error) throw error;
    return data as DBAgent;
  },

  async generatePrompt(agent: Partial<DBAgent>, company: Partial<DBCompany>, products: DBProduct[], faqs: DBFAQ[]): Promise<string> {
    const productList = products.map(p => `- ${p.name}${p.price ? ` (${p.price})` : ''}${p.description ? `: ${p.description}` : ''}`).join('\n');
    const faqList = faqs.map(f => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
    const questions = (agent.required_questions || []).map((q, i) => `${i + 1}. ${q.label}`).join('\n');

    const metaPrompt = `Crie um prompt de sistema completo para um assistente virtual de WhatsApp com as seguintes características:

EMPRESA: ${company.name || 'Empresa'}
SEGMENTO: ${company.segment || agent.segment || 'Geral'}
NOME DO ASSISTENTE: ${agent.name || 'Bia'}
TOM DE VOZ: ${agent.tone || 'Amigável e profissional'}
OBJETIVO PRINCIPAL: ${agent.objective || 'Qualificar leads e agendar reuniões'}

REGRAS DE TRANSFERÊNCIA PARA HUMANO:
${agent.human_handoff_rules || 'Quando o cliente pedir para falar com uma pessoa real ou solicitar negociação de preço'}

INFORMAÇÕES QUE PRECISA COLETAR DO CLIENTE:
${questions || '1. Nome\n2. Interesse\n3. Orçamento'}

${productList ? `PRODUTOS/SERVIÇOS:\n${productList}` : ''}
${faqList ? `PERGUNTAS FREQUENTES:\n${faqList}` : ''}

REGRAS GERAIS:
- Responda SEMPRE em português brasileiro
- Mantenha respostas curtas (máx 3-4 linhas por mensagem)
- Use emojis com moderação (1-2 por mensagem)
- Nunca invente informações - se não souber, ofereça transferir para humano
- Seja natural como uma conversa de WhatsApp

Retorne SOMENTE o prompt do sistema, sem explicações.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
      config: { temperature: 0.7, maxOutputTokens: 1024 },
    });

    return response.text?.trim() || '';
  },
};

// ── Products & FAQs ───────────────────────────────────────────────────────────
export const ProductsDB = {
  async list(): Promise<DBProduct[]> {
    const { data } = await supabase.from('products').select('*').eq('active', true).order('created_at');
    return data || [];
  },
  async upsert(p: Partial<DBProduct> & { company_id: string }) {
    const { data, error } = await supabase.from('products').upsert(p).select().single();
    if (error) throw error;
    return data as DBProduct;
  },
  async remove(id: string) {
    await supabase.from('products').update({ active: false }).eq('id', id);
  },
};

export const FAQsDB = {
  async list(): Promise<DBFAQ[]> {
    const { data } = await supabase.from('faqs').select('*').order('created_at');
    return data || [];
  },
  async upsert(f: Partial<DBFAQ> & { company_id: string }) {
    const { data, error } = await supabase.from('faqs').upsert(f).select().single();
    if (error) throw error;
    return data as DBFAQ;
  },
  async remove(id: string) {
    await supabase.from('faqs').delete().eq('id', id);
  },
};

export const SellersDB = {
  async list(): Promise<DBSeller[]> {
    const { data } = await supabase.from('sellers').select('*').order('name');
    return data || [];
  },
  async upsert(s: Partial<DBSeller> & { company_id: string }) {
    const { data, error } = await supabase.from('sellers').upsert(s).select().single();
    if (error) throw error;
    return data as DBSeller;
  },
};

// ── Conversations ─────────────────────────────────────────────────────────────
export const ConversationsDB = {
  async list(): Promise<DBConversation[]> {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    return (data || []) as DBConversation[];
  },

  async get(id: string): Promise<DBConversation | null> {
    const { data } = await supabase.from('conversations').select('*').eq('id', id).single();
    return data as DBConversation | null;
  },

  async getByPhone(companyId: string, phone: string): Promise<DBConversation | null> {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .eq('contact_phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as DBConversation | null;
  },

  async create(input: Partial<DBConversation> & { company_id: string; contact_phone: string }): Promise<DBConversation> {
    const { data, error } = await supabase.from('conversations').insert({
      ...input,
      status: input.status || 'bot',
      stage: input.stage || 'greeting',
      turn_count: 0,
      unread_count: 0,
      tags: [],
      collected_data: {},
      gemini_history: [],
    }).select().single();
    if (error) throw error;
    return data as DBConversation;
  },

  async update(id: string, updates: Partial<DBConversation>) {
    const { data, error } = await supabase.from('conversations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as DBConversation;
  },

  async markRead(id: string) {
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', id);
  },

  subscribeToAll(companyId: string, callback: (conv: DBConversation) => void) {
    return supabase
      .channel(`conversations:${companyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `company_id=eq.${companyId}`,
      }, payload => callback(payload.new as DBConversation))
      .subscribe();
  },
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const MessagesDB = {
  async list(conversationId: string): Promise<DBMessage[]> {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    return (data || []) as DBMessage[];
  },

  async send(convId: string, content: string, sender: DBMessage['sender'], isBot = false): Promise<DBMessage> {
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender,
      content,
      from_me: sender !== 'cliente',
      is_bot: isBot,
      msg_type: 'text',
      msg_status: 'sent',
    }).select().single();
    if (error) throw error;
    return data as DBMessage;
  },

  subscribeToConversation(convId: string, callback: (msg: DBMessage) => void) {
    return supabase
      .channel(`messages:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, payload => callback(payload.new as DBMessage))
      .subscribe();
  },
};

// ── Leads ─────────────────────────────────────────────────────────────────────
export const LeadsDB = {
  async list(): Promise<DBLead[]> {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    return (data || []) as DBLead[];
  },

  async create(input: Partial<DBLead> & { company_id: string; name: string }): Promise<DBLead> {
    const { data, error } = await supabase.from('leads').insert({
      ...input,
      status: 'novo',
      origin: 'whatsapp',
      last_interaction: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as DBLead;
  },

  async update(id: string, updates: Partial<DBLead>) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, last_interaction: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data as DBLead;
  },
};

// ── AI Agent Orchestrator ─────────────────────────────────────────────────────
export const AIAgent = {
  async processMessage(
    conv: DBConversation,
    userText: string,
    agent: DBAgent,
  ): Promise<string> {
    const systemPrompt = agent.generated_prompt || agent.objective || 'Você é um assistente virtual de WhatsApp. Seja simpático e objetivo.';

    const history = Array.isArray(conv.gemini_history) ? conv.gemini_history : [];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userText }] },
        ],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });
      return response.text?.trim() || 'Desculpe, tive um problema técnico.';
    } catch {
      return 'Desculpe, houve um erro. Tente novamente em instantes!';
    }
  },

  buildUpdatedHistory(
    history: DBConversation['gemini_history'],
    userText: string,
    botReply: string,
  ): DBConversation['gemini_history'] {
    const updated = [
      ...history,
      { role: 'user' as const, parts: [{ text: userText }] },
      { role: 'model' as const, parts: [{ text: botReply }] },
    ];
    return updated.length > 40 ? updated.slice(-40) : updated;
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const AnalyticsDB = {
  async getToday(companyId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('wa_analytics')
      .select('*')
      .eq('company_id', companyId)
      .eq('date', today)
      .maybeSingle();
    return data;
  },

  async increment(companyId: string, field: string, amount = 1) {
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('increment_analytics', {
      p_company_id: companyId,
      p_date: today,
      p_field: field,
      p_amount: amount,
    }).throwOnError();
  },
};
