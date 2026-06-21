import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, Bot, UserCheck, Archive, Search, Plus, X,
  ChevronRight, Eye, EyeOff, Loader2, Check, CheckCheck, Phone,
  BarChart3, Settings, Activity, ToggleLeft, ToggleRight, Trash2,
  Zap, Clock, TrendingUp, Users, MessageSquare, Sparkles,
} from 'lucide-react';
import {
  ConversationsDB, MessagesDB, AgentDB, LeadsDB,
  AIAgent, ProductsDB, FAQsDB, Profile,
  type DBConversation, type DBMessage, type DBAgent, type DBProduct, type DBFAQ, type DBCompany,
} from '../services/db';
import { supabase } from '../services/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 24 && d.getDate() === now.getDate())
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function initials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function avatarColor(id: string) {
  const palette = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[h % palette.length];
}

const STATUS_LABEL: Record<DBConversation['status'], string> = { bot: 'Bot', human: 'Humano', closed: 'Encerrado' };
const STATUS_COLOR: Record<DBConversation['status'], string> = {
  bot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  human: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-700/50 text-slate-500 border-slate-700',
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const NavBtn: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void; badge?: number; title?: string }> = ({ icon, active, onClick, badge, title }) => (
  <button onClick={onClick} title={title}
    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
    {icon}
    {badge != null && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

const TypingDots: React.FC = () => (
  <div className="flex gap-1 items-center px-4 py-2 bg-[#1e293b] rounded-2xl rounded-bl-sm w-fit">
    {[0, 150, 300].map(d => (
      <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
    ))}
  </div>
);

const Bubble: React.FC<{ msg: DBMessage }> = ({ msg }) => {
  const out = msg.from_me;
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${out ? 'bg-[#2563eb] text-white rounded-br-sm' : 'bg-[#1e293b] text-slate-200 rounded-bl-sm'}`}>
        {msg.is_bot && out && (
          <span className="text-[10px] text-blue-300 font-bold flex items-center gap-1 mb-0.5">
            <Bot className="w-3 h-3" /> Bot
          </span>
        )}
        {msg.content}
        <div className={`flex items-center gap-1 mt-1 ${out ? 'justify-end' : ''}`}>
          <span className={`text-[10px] ${out ? 'text-blue-200' : 'text-slate-500'}`}>{formatTime(msg.created_at)}</span>
          {out && (
            msg.msg_status === 'read'
              ? <CheckCheck className="w-3 h-3 text-blue-200" />
              : <Check className="w-3 h-3 text-blue-200" />
          )}
        </div>
      </div>
    </div>
  );
};

const ConvItem: React.FC<{ conv: DBConversation; active: boolean; onClick: () => void }> = ({ conv, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 ${active ? 'bg-slate-800 border-l-2 border-l-blue-500' : ''}`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${avatarColor(conv.id)}`}>
      {initials(conv.contact_name || conv.contact_phone || '?')}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="font-semibold text-sm text-slate-100 truncate">{conv.contact_name || conv.contact_phone}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400 truncate">{conv.last_message || '...'}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {conv.unread_count > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${STATUS_COLOR[conv.status]}`}>
            {STATUS_LABEL[conv.status]}
          </span>
        </div>
      </div>
    </div>
  </button>
);

// ── Status dropdown ────────────────────────────────────────────────────────────
const StatusMenu: React.FC<{ status: DBConversation['status']; onChange: (s: DBConversation['status']) => void }> = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const opts: Array<{ v: DBConversation['status']; label: string; icon: React.ReactNode }> = [
    { v: 'bot', label: 'Bot', icon: <Bot className="w-3.5 h-3.5" /> },
    { v: 'human', label: 'Humano', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { v: 'closed', label: 'Encerrar', icon: <Archive className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${STATUS_COLOR[status]}`}>
        {STATUS_LABEL[status]} <ChevronRight className="w-3 h-3 rotate-90" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
          {opts.filter(o => o.v !== status).map(o => (
            <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700">
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Chat panel ─────────────────────────────────────────────────────────────────
const ChatPanel: React.FC<{
  conv: DBConversation;
  messages: DBMessage[];
  sending: boolean;
  botTyping: boolean;
  showInfo: boolean;
  onToggleInfo: () => void;
  onStatusChange: (s: DBConversation['status']) => void;
  onSend: (text: string) => Promise<void>;
}> = ({ conv, messages, sending, botTyping, showInfo, onToggleInfo, onStatusChange, onSend }) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botTyping]);

  const handleSend = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setDraft('');
    await onSend(t);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-slate-800">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(conv.id)}`}>
          {initials(conv.contact_name || conv.contact_phone || '?')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-sm">{conv.contact_name || 'Sem nome'}</p>
          <p className="text-[11px] text-slate-500">{conv.contact_phone}</p>
        </div>
        <StatusMenu status={conv.status} onChange={onStatusChange} />
        <button onClick={onToggleInfo}
          className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.map(m => <Bubble key={m.id} msg={m} />)}
        {botTyping && <div className="flex justify-start mb-1"><TypingDots /></div>}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-[#0f172a] border-t border-slate-800">
        {conv.status === 'closed'
          ? <div className="text-center text-slate-500 text-sm py-2">
              Conversa encerrada •{' '}
              <button className="text-blue-400 hover:underline" onClick={() => onStatusChange('bot')}>Reabrir</button>
            </div>
          : <div className="flex items-end gap-3">
              {conv.status === 'bot' && (
                <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold flex-shrink-0">
                  <Bot className="w-4 h-4" /> IA ativa
                </div>
              )}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={conv.status === 'bot' ? 'Bot respondendo automaticamente…' : 'Mensagem…'}
                className="flex-1 bg-[#1e293b] text-slate-200 text-sm rounded-xl px-4 py-3 resize-none outline-none border border-slate-700 focus:border-blue-500 transition-colors placeholder:text-slate-600 max-h-32"
                rows={1}
              />
              <button onClick={handleSend} disabled={!draft.trim() || sending}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>}
      </div>
    </div>
  );
};

// ── Contact info sidebar ────────────────────────────────────────────────────────
const ContactInfo: React.FC<{ conv: DBConversation }> = ({ conv }) => {
  const cd = conv.collected_data as Record<string, string>;
  return (
    <div className="w-72 flex-shrink-0 bg-[#0f172a] border-l border-slate-800 overflow-y-auto">
      <div className="p-5">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl mb-4 ${avatarColor(conv.id)}`}>
          {initials(conv.contact_name || '?')}
        </div>
        <h3 className="text-center font-bold text-slate-100 mb-0.5">{conv.contact_name || 'Sem nome'}</h3>
        <p className="text-center text-slate-500 text-xs mb-4">{conv.contact_phone}</p>
        <a href={`https://wa.me/${conv.contact_phone}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors mb-5">
          <Phone className="w-4 h-4" /> Abrir no WhatsApp
        </a>

        {Object.keys(cd).length > 0 && (
          <InfoSection title="Dados coletados">
            {Object.entries(cd).map(([k, v]) => v && <InfoRow key={k} label={k} value={String(v)} />)}
          </InfoSection>
        )}

        <InfoSection title="Conversa">
          <InfoRow label="Status" value={STATUS_LABEL[conv.status]} />
          <InfoRow label="Estágio" value={conv.stage} />
          <InfoRow label="Turnos bot" value={String(conv.turn_count)} />
          <InfoRow label="Criado" value={new Date(conv.created_at).toLocaleDateString('pt-BR')} />
        </InfoSection>

        {conv.tags?.length > 0 && (
          <InfoSection title="Tags">
            <div className="flex flex-wrap gap-1">
              {conv.tags.map(t => (
                <span key={t} className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </InfoSection>
        )}
      </div>
    </div>
  );
};

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{title}</p>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
    <span className="text-xs text-slate-500 capitalize">{label.replace(/_/g, ' ')}</span>
    <span className="text-xs text-slate-300 font-medium capitalize">{value}</span>
  </div>
);

// ── Analytics panel ────────────────────────────────────────────────────────────
const AnalyticsPanel: React.FC<{ conversations: DBConversation[] }> = ({ conversations }) => {
  const total = conversations.length;
  const bot = conversations.filter(c => c.status === 'bot').length;
  const human = conversations.filter(c => c.status === 'human').length;
  const closed = conversations.filter(c => c.status === 'closed').length;
  const unread = conversations.reduce((acc, c) => acc + c.unread_count, 0);
  const today = conversations.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length;

  const stats = [
    { label: 'Total de conversas', value: total, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Abertas hoje', value: today, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Com bot ativo', value: bot, icon: <Bot className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Com humano', value: human, icon: <UserCheck className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Encerradas', value: closed, icon: <Archive className="w-5 h-5" />, color: 'text-slate-400' },
    { label: 'Não lidas', value: unread, icon: <MessageSquare className="w-5 h-5" />, color: 'text-rose-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1628] p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Analytics</h2>
        <p className="text-slate-500 text-sm mb-6">Visão geral das conversas em tempo real</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-black text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 mb-5">
          <p className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Distribuição por status
          </p>
          {[
            { label: 'Bot', count: bot, color: 'bg-blue-500' },
            { label: 'Humano', count: human, color: 'bg-emerald-500' },
            { label: 'Encerrado', count: closed, color: 'bg-slate-600' },
          ].map(({ label, count, color }) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-300 font-bold">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
          <p className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Últimas conversas
          </p>
          {conversations.slice(0, 8).map(c => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${avatarColor(c.id)}`}>
                {initials(c.contact_name || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{c.contact_name || c.contact_phone}</p>
                <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLOR[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Settings panel ─────────────────────────────────────────────────────────────
const SettingsPanel: React.FC<{
  agent: DBAgent | null;
  company: DBCompany | null;
  companyId: string;
  onSaved: () => void;
}> = ({ agent: initialAgent, company, companyId, onSaved }) => {
  const [ag, setAg] = useState<Partial<DBAgent>>(initialAgent || {});
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [faqs, setFaqs] = useState<DBFAQ[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [tab, setTab] = useState<'agent' | 'catalog'>('agent');

  useEffect(() => {
    ProductsDB.list().then(setProducts);
    FAQsDB.list().then(setFaqs);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await AgentDB.upsert({ ...ag, company_id: companyId });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      onSaved();
    } finally { setSaving(false); }
  };

  const generatePrompt = async () => {
    setGenerating(true);
    const prompt = await AgentDB.generatePrompt(ag, company || {}, products, faqs);
    setAg(p => ({ ...p, generated_prompt: prompt }));
    setGenerating(false);
  };

  const TONES = ['Amigável', 'Profissional', 'Entusiasta', 'Formal', 'Descontraído'];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1628] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Configurações do Agente</h2>
            <p className="text-slate-500 text-sm mt-0.5">Personalize como o bot conversa com seus clientes</p>
          </div>
          <button onClick={save} disabled={saving}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['agent', 'catalog'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {t === 'agent' ? '🤖 Agente' : '📦 Catálogo'}
            </button>
          ))}
        </div>

        {tab === 'agent' && (
          <div className="space-y-5">
            {/* Status */}
            <SCard title="Status do Bot">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200 text-sm">Agente de IA ativo</p>
                  <p className="text-slate-500 text-xs mt-0.5">Bot responde automaticamente quando ativo</p>
                </div>
                <button onClick={() => setAg(p => ({ ...p }))}>
                  <ToggleRight className="w-8 h-8 text-blue-400" />
                </button>
              </div>
            </SCard>

            {/* Identity */}
            <SCard title="Identidade">
              <SLabel>Nome do assistente</SLabel>
              <input value={ag.name || ''} onChange={e => setAg(p => ({ ...p, name: e.target.value }))} className="input mb-4" placeholder="Vera, Bia, Sofia…" />
              <SLabel>Tom de voz</SLabel>
              <select value={ag.tone || 'Amigável'} onChange={e => setAg(p => ({ ...p, tone: e.target.value }))} className="input mb-4">
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
              <SLabel>Objetivo principal</SLabel>
              <textarea value={ag.objective || ''} onChange={e => setAg(p => ({ ...p, objective: e.target.value }))} className="input resize-none" rows={3} />
            </SCard>

            {/* Messages */}
            <SCard title="Mensagens">
              <SLabel>Boas-vindas</SLabel>
              <textarea value={ag.welcome_message || ''} onChange={e => setAg(p => ({ ...p, welcome_message: e.target.value }))} className="input resize-none mb-4" rows={3} />
              <SLabel>Mensagem de encerramento</SLabel>
              <textarea value={ag.closing_message || ''} onChange={e => setAg(p => ({ ...p, closing_message: e.target.value }))} className="input resize-none mb-4" rows={2} />
              <SLabel>Regras de transferência para humano</SLabel>
              <textarea value={ag.human_handoff_rules || ''} onChange={e => setAg(p => ({ ...p, human_handoff_rules: e.target.value }))} className="input resize-none" rows={3} />
            </SCard>

            {/* System prompt */}
            <SCard title="Prompt de IA">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowPrompt(s => !s)} className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold hover:text-blue-300">
                  {showPrompt ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPrompt ? 'Ocultar' : 'Ver'} prompt gerado
                </button>
                <button onClick={generatePrompt} disabled={generating} className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:text-emerald-300">
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerar com IA
                </button>
              </div>
              {showPrompt && (
                <textarea value={ag.generated_prompt || ''} onChange={e => setAg(p => ({ ...p, generated_prompt: e.target.value }))}
                  className="input resize-none text-xs font-mono" rows={12} placeholder="Clique em 'Regenerar com IA' para gerar automaticamente" />
              )}
            </SCard>
          </div>
        )}

        {tab === 'catalog' && (
          <div className="space-y-5">
            <SCard title="Produtos / Serviços">
              <div className="space-y-2 mb-3">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-900/50 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{p.name}</p>
                      {p.price && <p className="text-xs text-slate-500">{p.price}</p>}
                    </div>
                    <button onClick={() => ProductsDB.remove(p.id).then(() => ProductsDB.list().then(setProducts))}
                      className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const name = prompt('Nome do produto/serviço:');
                const price = prompt('Preço (ex: R$ 500/mês):');
                if (name) ProductsDB.upsert({ name, price: price || '', company_id: companyId, active: true }).then(() => ProductsDB.list().then(setProducts));
              }} className="flex items-center gap-2 text-blue-400 text-sm font-semibold hover:text-blue-300">
                <Plus className="w-4 h-4" /> Adicionar produto
              </button>
            </SCard>

            <SCard title="Perguntas Frequentes">
              <div className="space-y-2 mb-3">
                {faqs.map(f => (
                  <div key={f.id} className="bg-slate-900/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-300">{f.question}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{f.answer}</p>
                      </div>
                      <button onClick={() => FAQsDB.remove(f.id).then(() => FAQsDB.list().then(setFaqs))}
                        className="text-slate-600 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const q = prompt('Pergunta:');
                const a = prompt('Resposta:');
                if (q && a) FAQsDB.upsert({ question: q, answer: a, company_id: companyId }).then(() => FAQsDB.list().then(setFaqs));
              }} className="flex items-center gap-2 text-blue-400 text-sm font-semibold hover:text-blue-300">
                <Plus className="w-4 h-4" /> Adicionar FAQ
              </button>
            </SCard>
          </div>
        )}
      </div>
    </div>
  );
};

const SCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
    <p className="font-bold text-slate-200 text-sm mb-4">{title}</p>
    {children}
  </div>
);

const SLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-slate-400 mb-1.5">{children}</p>
);

// ── Simulate modal ─────────────────────────────────────────────────────────────
const SimulateModal: React.FC<{
  onClose: () => void;
  onSend: (phone: string, name: string, text: string) => Promise<void>;
}> = ({ onClose, onSend }) => {
  const [phone, setPhone] = useState(`551199${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSend(phone, name || phone, text);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" /> Simular mensagem recebida
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <SLabel>Número (com DDI)</SLabel>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input w-full" placeholder="5511912345678" />
          </div>
          <div>
            <SLabel>Nome do contato</SLabel>
            <input value={name} onChange={e => setName(e.target.value)} className="input w-full" placeholder="Maria Santos" />
          </div>
          <div>
            <SLabel>Mensagem</SLabel>
            <textarea value={text} onChange={e => setText(e.target.value)} className="input w-full resize-none" rows={3}
              placeholder="Olá, tenho interesse…" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm">Cancelar</button>
            <button onClick={go} disabled={loading || !text.trim()}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
type Panel = 'conversations' | 'analytics' | 'settings';

const WhatsAppSaas: React.FC = () => {
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [agent, setAgent] = useState<DBAgent | null>(null);
  const [company, setCompany] = useState<DBCompany | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [panel, setPanel] = useState<Panel>('conversations');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DBConversation['status'] | 'all'>('all');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const profile = await Profile.get();
      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);
      const [convs, ag, co] = await Promise.all([
        ConversationsDB.list(),
        AgentDB.get(),
        Profile.getCompany(),
      ]);
      setConversations(convs);
      setAgent(ag);
      setCompany(co);
    })();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const ch = ConversationsDB.subscribeToAll(companyId, updated => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        }
        return [updated, ...prev];
      });
    });
    return () => { supabase.removeChannel(ch); };
  }, [companyId]);

  // ── Load messages when conversation changes ────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    MessagesDB.list(selectedId).then(setMessages);
    ConversationsDB.markRead(selectedId);

    const ch = MessagesDB.subscribeToConversation(selectedId, newMsg => {
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      if (!newMsg.from_me) setBotTyping(false);
    });

    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  // ── Handle incoming simulated message ─────────────────────────────────────
  const handleSimulate = useCallback(async (phone: string, name: string, text: string) => {
    if (!companyId || !agent) return;

    let conv = await ConversationsDB.getByPhone(companyId, phone);
    if (!conv) {
      conv = await ConversationsDB.create({ company_id: companyId, contact_phone: phone, contact_name: name });
    }

    await MessagesDB.send(conv.id, text, 'cliente');
    await ConversationsDB.update(conv.id, {
      last_message: text,
      last_message_at: new Date().toISOString(),
      unread_count: (conv.unread_count || 0) + 1,
    });

    if (conv.status === 'bot') {
      setSelectedId(conv.id);
      setPanel('conversations');

      const replyText = conv.turn_count === 0
        ? (agent.welcome_message || 'Olá! Como posso ajudar?')
        : await AIAgent.processMessage(conv, text, agent);

      const updatedHistory = AIAgent.buildUpdatedHistory(conv.gemini_history || [], text, replyText);

      setBotTyping(true);
      setTimeout(async () => {
        await MessagesDB.send(conv!.id, replyText, 'ia', true);
        await ConversationsDB.update(conv!.id, {
          last_message: replyText,
          last_message_at: new Date().toISOString(),
          turn_count: (conv!.turn_count || 0) + 1,
          gemini_history: updatedHistory,
        });

        if (conv!.turn_count === 3 && agent.required_questions?.length) {
          const collectedData: Record<string, string> = { name, phone };
          await ConversationsDB.update(conv!.id, { collected_data: collectedData });
          if (!conv!.lead_id) {
            const lead = await LeadsDB.create({ company_id: companyId, name, phone, origin: 'whatsapp' });
            await ConversationsDB.update(conv!.id, { lead_id: lead.id });
          }
        }

        setBotTyping(false);
        setConversations(await ConversationsDB.list());
      }, 1200);
    }

    setConversations(await ConversationsDB.list());
    setSelectedId(conv.id);
  }, [companyId, agent]);

  // ── Send human message ─────────────────────────────────────────────────────
  const handleSend = useCallback(async (text: string) => {
    if (!selectedId || !companyId) return;
    setSending(true);
    await MessagesDB.send(selectedId, text, 'vendedor');
    await ConversationsDB.update(selectedId, {
      last_message: text,
      last_message_at: new Date().toISOString(),
    });
    setConversations(await ConversationsDB.list());
    setSending(false);
  }, [selectedId, companyId]);

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (status: DBConversation['status']) => {
    if (!selectedId) return;
    await ConversationsDB.update(selectedId, { status });
    setConversations(await ConversationsDB.list());
  }, [selectedId]);

  const filtered = conversations.filter(c => {
    const ms = search.toLowerCase();
    const matchSearch = (c.contact_name || '').toLowerCase().includes(ms) ||
      (c.contact_phone || '').includes(ms) ||
      (c.last_message || '').toLowerCase().includes(ms);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#020617] rounded-2xl overflow-hidden border border-slate-800">
      {/* ── Left icon nav ─────────────────────────── */}
      <div className="w-14 flex-shrink-0 bg-[#020617] border-r border-slate-800 flex flex-col items-center py-4 gap-2">
        <NavBtn icon={<MessageCircle className="w-5 h-5" />} active={panel === 'conversations'} onClick={() => setPanel('conversations')} badge={totalUnread} title="Conversas" />
        <NavBtn icon={<BarChart3 className="w-5 h-5" />} active={panel === 'analytics'} onClick={() => setPanel('analytics')} title="Analytics" />
        <NavBtn icon={<Settings className="w-5 h-5" />} active={panel === 'settings'} onClick={() => setPanel('settings')} title="Configurações" />
        <div className="mt-auto flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Supabase conectado" />
        </div>
      </div>

      {/* ── Conversation list ─────────────────────── */}
      {panel === 'conversations' && (
        <div className="w-80 flex-shrink-0 flex flex-col bg-[#0a1628] border-r border-slate-800">
          <div className="px-4 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-slate-100 text-sm">WhatsApp</h2>
                {totalUnread > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500">Realtime</span>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
                className="w-full bg-[#1e293b] text-sm text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none placeholder:text-slate-600" />
            </div>
            <div className="flex gap-1">
              {(['all', 'bot', 'human', 'closed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-1 transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                  {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0
              ? <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 py-10">
                  <MessageCircle className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Sem conversas</p>
                </div>
              : filtered.map(c => (
                  <ConvItem key={c.id} conv={c} active={c.id === selectedId}
                    onClick={async () => { setSelectedId(c.id); await ConversationsDB.markRead(c.id); }} />
                ))}
          </div>

          <div className="p-3 border-t border-slate-800">
            <button onClick={() => setShowSimulate(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Simular mensagem recebida
            </button>
          </div>
        </div>
      )}

      {/* ── Main area ─────────────────────────────── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {panel === 'conversations' && (
          selectedConv
            ? <>
                <div className="flex-1 flex flex-col min-w-0">
                  <ChatPanel
                    conv={selectedConv}
                    messages={messages}
                    sending={sending}
                    botTyping={botTyping && selectedConv.id === selectedId}
                    showInfo={showInfo}
                    onToggleInfo={() => setShowInfo(s => !s)}
                    onStatusChange={handleStatusChange}
                    onSend={handleSend}
                  />
                </div>
                {showInfo && <ContactInfo conv={selectedConv} />}
              </>
            : <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-emerald-500/40" />
                </div>
                <div className="text-center">
                  <h3 className="text-slate-400 font-bold text-lg">Agente WhatsApp com IA</h3>
                  <p className="text-slate-600 text-sm mt-1">Selecione uma conversa ou simule uma mensagem</p>
                </div>
                <button onClick={() => setShowSimulate(true)}
                  className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors">
                  <Plus className="w-4 h-4" /> Simular nova mensagem
                </button>
              </div>
        )}

        {panel === 'analytics' && <AnalyticsPanel conversations={conversations} />}

        {panel === 'settings' && (
          <SettingsPanel agent={agent} company={company} companyId={companyId}
            onSaved={() => AgentDB.get().then(setAgent)} />
        )}
      </div>

      {showSimulate && (
        <SimulateModal onClose={() => setShowSimulate(false)} onSend={handleSimulate} />
      )}
    </div>
  );
};

export default WhatsAppSaas;
