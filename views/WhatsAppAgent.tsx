import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, MessageCircle, Users, Settings, Send, Phone, Check, CheckCheck,
  Clock, Search, X, RefreshCw, Wifi, WifiOff, Loader2, ChevronRight,
  Tag, UserCheck, UserX, Archive, Zap, Bell, TrendingUp, MessageSquare,
  AlertCircle, ToggleLeft, ToggleRight, Plus, Trash2, Eye, EyeOff,
  BarChart3, Activity,
} from 'lucide-react';
import type {
  WAConversation, WAMessage, WAAgentConfig, WAInstance, WAAnalytics,
  WAConversationStatus,
} from '../types';
import { WAAgentService } from '../services/whatsappAgent';

// ── Types ─────────────────────────────────────────────────────────────────────
type Panel = 'conversations' | 'settings' | 'analytics';

// ── Utility helpers ───────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function avatarColor(id: string): string {
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600',
    'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-orange-600',
  ];
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

const STATUS_LABEL: Record<WAConversationStatus, string> = {
  bot: 'Bot', human: 'Humano', closed: 'Encerrado',
};

const STATUS_COLOR: Record<WAConversationStatus, string> = {
  bot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  human: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-700/50 text-slate-500 border-slate-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: WAInstance['status'] }> = ({ status }) => {
  const map: Record<WAInstance['status'], string> = {
    connected: 'bg-emerald-500 animate-pulse',
    connecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-slate-600',
    error: 'bg-red-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${map[status]}`} />;
};

const TypingIndicator: React.FC = () => (
  <div className="flex gap-1 items-center px-4 py-2 bg-[#1e293b] rounded-2xl rounded-bl-sm w-fit">
    {[0, 150, 300].map(delay => (
      <span
        key={delay}
        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const MessageBubble: React.FC<{ msg: WAMessage }> = ({ msg }) => {
  const isOut = msg.fromMe;
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isOut
            ? 'bg-[#2563eb] text-white rounded-br-sm'
            : 'bg-[#1e293b] text-slate-200 rounded-bl-sm'
        }`}
      >
        {msg.isBot && !isOut === false && (
          <span className="text-[10px] text-blue-300 font-bold block mb-0.5 flex items-center gap-1">
            <Bot className="w-3 h-3" /> Bot
          </span>
        )}
        {msg.body}
        <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOut ? 'text-blue-200' : 'text-slate-500'}`}>
            {formatTime(msg.timestamp)}
          </span>
          {isOut && (
            <span className="text-[10px] text-blue-200">
              {msg.status === 'read' ? <CheckCheck className="w-3 h-3 inline" /> :
               msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 inline text-slate-400" /> :
               <Check className="w-3 h-3 inline" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Conversation List Item ────────────────────────────────────────────────────
const ConvItem: React.FC<{
  conv: WAConversation;
  active: boolean;
  onClick: () => void;
}> = ({ conv, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 ${
      active ? 'bg-slate-800 border-l-2 border-l-blue-500' : ''
    }`}
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${avatarColor(conv.id)}`}>
      {initials(conv.contactName)}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="font-semibold text-sm text-slate-100 truncate">{conv.contactName}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">{formatTime(conv.lastMessageAt)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400 truncate">{conv.lastMessage || '...'}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {conv.unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
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

// ── Chat Panel ────────────────────────────────────────────────────────────────
const ChatPanel: React.FC<{
  conv: WAConversation;
  onStatusChange: (status: WAConversationStatus) => void;
  onSendMessage: (text: string) => Promise<void>;
  sending: boolean;
  botTyping: boolean;
  showInfo: boolean;
  onToggleInfo: () => void;
}> = ({ conv, onStatusChange, onSendMessage, sending, botTyping, showInfo, onToggleInfo }) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conv.messages, botTyping]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    await onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-slate-800">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(conv.id)}`}>
          {initials(conv.contactName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-sm">{conv.contactName}</p>
          <p className="text-[11px] text-slate-500">{conv.contactPhone}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadgeButton status={conv.status} onChange={onStatusChange} />
          <button
            onClick={onToggleInfo}
            className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Informações do contato"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {conv.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Sem mensagens ainda</p>
          </div>
        ) : (
          conv.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {botTyping && (
          <div className="flex justify-start mb-1">
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#0f172a] border-t border-slate-800">
        {conv.status === 'closed' ? (
          <div className="text-center text-slate-500 text-sm py-2">
            Conversa encerrada •{' '}
            <button className="text-blue-400 hover:underline" onClick={() => onStatusChange('bot')}>
              Reabrir
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            {conv.status === 'bot' && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold flex-shrink-0">
                <Bot className="w-4 h-4" /> IA ativa
              </div>
            )}
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={conv.status === 'bot' ? 'Bot está respondendo automaticamente…' : 'Digite sua mensagem…'}
              className="flex-1 bg-[#1e293b] text-slate-200 text-sm rounded-xl px-4 py-3 resize-none outline-none border border-slate-700 focus:border-blue-500 transition-colors placeholder:text-slate-600 max-h-32"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadgeButton: React.FC<{
  status: WAConversationStatus;
  onChange: (s: WAConversationStatus) => void;
}> = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const options: Array<{ value: WAConversationStatus; label: string; icon: React.ReactNode }> = [
    { value: 'bot', label: 'Bot', icon: <Bot className="w-3.5 h-3.5" /> },
    { value: 'human', label: 'Humano', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { value: 'closed', label: 'Encerrar', icon: <Archive className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${STATUS_COLOR[status]} transition-colors`}
      >
        {STATUS_LABEL[status]} <ChevronRight className="w-3 h-3 rotate-90" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
          {options.filter(o => o.value !== status).map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Contact Info Side Panel ────────────────────────────────────────────────────
const ContactInfo: React.FC<{ conv: WAConversation }> = ({ conv }) => (
  <div className="w-72 flex-shrink-0 bg-[#0f172a] border-l border-slate-800 overflow-y-auto">
    <div className="p-5">
      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl mb-4 ${avatarColor(conv.id)}`}>
        {initials(conv.contactName)}
      </div>
      <h3 className="text-center font-bold text-slate-100 mb-0.5">{conv.contactName}</h3>
      <p className="text-center text-slate-500 text-xs mb-4">{conv.contactPhone}</p>

      <a
        href={`https://wa.me/${conv.contactPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors mb-5"
      >
        <Phone className="w-4 h-4" /> Abrir no WhatsApp
      </a>

      <Section title="Dados coletados">
        {conv.collectedData && Object.keys(conv.collectedData).length > 0 ? (
          <div className="space-y-2">
            {conv.collectedData.name && <DataRow label="Nome" value={conv.collectedData.name} />}
            {conv.collectedData.interest && <DataRow label="Interesse" value={conv.collectedData.interest} />}
            {conv.collectedData.budget && <DataRow label="Orçamento" value={conv.collectedData.budget} />}
            {conv.collectedData.timeline && <DataRow label="Prazo" value={conv.collectedData.timeline} />}
            {conv.collectedData.neighborhoodDesired && <DataRow label="Região" value={conv.collectedData.neighborhoodDesired} />}
            {conv.collectedData.bedroomsDesired && <DataRow label="Quartos" value={String(conv.collectedData.bedroomsDesired)} />}
          </div>
        ) : (
          <p className="text-slate-600 text-xs">Nenhum dado coletado ainda</p>
        )}
      </Section>

      <Section title="Conversa">
        <DataRow label="Status" value={STATUS_LABEL[conv.status]} />
        <DataRow label="Mensagens" value={String(conv.messages.length)} />
        <DataRow label="Turnos do bot" value={String(conv.turnCount)} />
        <DataRow label="Estágio" value={conv.stage} />
        <DataRow label="Início" value={new Date(conv.createdAt).toLocaleDateString('pt-BR')} />
      </Section>

      {conv.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1">
            {conv.tags.map(t => (
              <span key={t} className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{title}</p>
    {children}
  </div>
);

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-xs text-slate-300 font-medium capitalize">{value}</span>
  </div>
);

// ── Settings Panel ────────────────────────────────────────────────────────────
const SettingsPanel: React.FC<{
  config: WAAgentConfig;
  onSave: (cfg: WAAgentConfig) => void;
  onTest: (msg: string) => Promise<string>;
}> = ({ config, onSave, onTest }) => {
  const [cfg, setCfg] = useState<WAAgentConfig>(config);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [testReply, setTestReply] = useState('');
  const [testing, setTesting] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const update = <K extends keyof WAAgentConfig>(key: K, value: WAAgentConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    const reply = await onTest(testMsg);
    setTestReply(reply);
    setTesting(false);
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    update('handoffKeywords', [...cfg.handoffKeywords, newKeyword.trim()]);
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) =>
    update('handoffKeywords', cfg.handoffKeywords.filter(k => k !== kw));

  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const toggleDay = (d: number) => {
    const days = cfg.businessHours.days.includes(d)
      ? cfg.businessHours.days.filter(x => x !== d)
      : [...cfg.businessHours.days, d];
    update('businessHours', { ...cfg.businessHours, days });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1628] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Configurações do Agente</h2>
            <p className="text-slate-500 text-sm mt-0.5">Personalize o comportamento do bot de IA</p>
          </div>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saved ? '✓ Salvo!' : 'Salvar configurações'}
          </button>
        </div>

        {/* Status toggle */}
        <Card title="Status do Agente" icon={<Bot className="w-4 h-4" />}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-200 text-sm">Agente de IA ativo</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {cfg.enabled ? 'Bot respondendo automaticamente' : 'Apenas atendimento humano'}
              </p>
            </div>
            <button onClick={() => update('enabled', !cfg.enabled)} className="flex-shrink-0">
              {cfg.enabled
                ? <ToggleRight className="w-8 h-8 text-blue-400" />
                : <ToggleLeft className="w-8 h-8 text-slate-600" />}
            </button>
          </div>
        </Card>

        {/* Identity */}
        <Card title="Identidade do Bot" icon={<Zap className="w-4 h-4" />}>
          <Label>Nome do assistente</Label>
          <input
            value={cfg.name}
            onChange={e => update('name', e.target.value)}
            className="input"
            placeholder="Ex: Vera, Alex, Sofia…"
          />
          <Label className="mt-4">Mensagem de boas-vindas</Label>
          <textarea
            value={cfg.greeting}
            onChange={e => update('greeting', e.target.value)}
            className="input resize-none"
            rows={4}
            placeholder="Primeira mensagem enviada quando um novo contato aparecer"
          />
        </Card>

        {/* System Prompt */}
        <Card title="Prompt do Sistema (IA)" icon={<Bot className="w-4 h-4" />}>
          <button
            onClick={() => setShowSystemPrompt(s => !s)}
            className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-3 hover:text-blue-300"
          >
            {showSystemPrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSystemPrompt ? 'Ocultar' : 'Mostrar'} prompt do sistema
          </button>
          {showSystemPrompt && (
            <textarea
              value={cfg.systemPrompt}
              onChange={e => update('systemPrompt', e.target.value)}
              className="input resize-none font-mono text-xs"
              rows={10}
            />
          )}
          <Label className="mt-4">Base de conhecimento (imóveis, FAQs, etc.)</Label>
          <textarea
            value={cfg.knowledgeBase}
            onChange={e => update('knowledgeBase', e.target.value)}
            className="input resize-none text-xs"
            rows={5}
            placeholder="Liste aqui informações sobre seus imóveis, preços, diferenciais, perguntas frequentes…"
          />
        </Card>

        {/* Business Hours */}
        <Card title="Horário de Atendimento" icon={<Clock className="w-4 h-4" />}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-300">Restringir horário de resposta</p>
            <button onClick={() => update('businessHours', { ...cfg.businessHours, enabled: !cfg.businessHours.enabled })}>
              {cfg.businessHours.enabled
                ? <ToggleRight className="w-7 h-7 text-blue-400" />
                : <ToggleLeft className="w-7 h-7 text-slate-600" />}
            </button>
          </div>
          {cfg.businessHours.enabled && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <Label>Início</Label>
                  <input type="time" value={cfg.businessHours.start}
                    onChange={e => update('businessHours', { ...cfg.businessHours, start: e.target.value })}
                    className="input" />
                </div>
                <div className="flex-1">
                  <Label>Fim</Label>
                  <input type="time" value={cfg.businessHours.end}
                    onChange={e => update('businessHours', { ...cfg.businessHours, end: e.target.value })}
                    className="input" />
                </div>
              </div>
              <Label>Dias da semana</Label>
              <div className="flex gap-2 flex-wrap mb-4">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      cfg.businessHours.days.includes(i)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <Label>Mensagem fora do horário</Label>
              <textarea
                value={cfg.businessHours.outsideMessage}
                onChange={e => update('businessHours', { ...cfg.businessHours, outsideMessage: e.target.value })}
                className="input resize-none"
                rows={3}
              />
            </>
          )}
        </Card>

        {/* Handoff */}
        <Card title="Transferência para Humano" icon={<UserCheck className="w-4 h-4" />}>
          <Label>Palavras-chave que acionam transferência</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {cfg.handoffKeywords.map(kw => (
              <span key={kw} className="flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="Nova palavra-chave…"
              className="input flex-1"
            />
            <button onClick={addKeyword} className="btn-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Label>Mensagem de transferência</Label>
          <textarea
            value={cfg.handoffMessage}
            onChange={e => update('handoffMessage', e.target.value)}
            className="input resize-none"
            rows={3}
          />
          <Label className="mt-4">Máx. turnos do bot antes de transferir</Label>
          <input
            type="number"
            value={cfg.maxTurns}
            onChange={e => update('maxTurns', parseInt(e.target.value) || 20)}
            className="input w-24"
            min={1}
            max={100}
          />
        </Card>

        {/* Test */}
        <Card title="Testar Agente" icon={<Zap className="w-4 h-4" />}>
          <p className="text-slate-500 text-xs mb-3">Simule uma conversa para ver como o agente responde</p>
          <div className="flex gap-2 mb-3">
            <input
              value={testMsg}
              onChange={e => setTestMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTest()}
              placeholder="Ex: Quero comprar um apartamento no Itaim"
              className="input flex-1"
            />
            <button onClick={handleTest} disabled={testing || !testMsg.trim()} className="btn-sm">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {testReply && (
            <div className="bg-[#1e293b] rounded-xl p-4 text-sm text-slate-200 whitespace-pre-wrap border border-slate-700">
              <p className="text-[10px] font-bold text-blue-400 mb-2 flex items-center gap-1"><Bot className="w-3 h-3" /> Resposta do agente</p>
              {testReply}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm mb-4">
      <span className="text-blue-400">{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-xs font-semibold text-slate-400 mb-1.5 ${className}`}>{children}</p>
);

const NavBtn: React.FC<{
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
  title?: string;
}> = ({ icon, active, onClick, badge, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
    }`}
  >
    {icon}
    {badge != null && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

// ── Analytics Panel ───────────────────────────────────────────────────────────
const AnalyticsPanel: React.FC<{ analytics: WAAnalytics; conversations: WAConversation[] }> = ({
  analytics, conversations,
}) => {
  const stats = [
    { label: 'Mensagens total', value: analytics.totalMessages, icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Conversas hoje', value: analytics.conversationsToday, icon: <Users className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Leads capturados', value: analytics.leadsCaptures, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Respostas do bot', value: analytics.botMessages, icon: <Bot className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Respostas humanas', value: analytics.humanMessages, icon: <UserCheck className="w-5 h-5" />, color: 'text-cyan-400' },
    { label: 'Tempo médio (s)', value: (analytics.avgResponseTimeMs / 1000).toFixed(1), icon: <Clock className="w-5 h-5" />, color: 'text-rose-400' },
  ];

  const byStatus = {
    bot: conversations.filter(c => c.status === 'bot').length,
    human: conversations.filter(c => c.status === 'human').length,
    closed: conversations.filter(c => c.status === 'closed').length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1628] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Analytics</h2>
          <p className="text-slate-500 text-sm mt-0.5">Desempenho do agente em tempo real</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-black text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 mb-6">
          <p className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Status das Conversas
          </p>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => {
              const total = conversations.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                bot: 'bg-blue-500', human: 'bg-emerald-500', closed: 'bg-slate-600',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 capitalize">{STATUS_LABEL[status as WAConversationStatus]}</span>
                    <span className="text-slate-300 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
          <p className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Últimas conversas
          </p>
          {conversations.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${avatarColor(c.id)}`}>
                {initials(c.contactName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{c.contactName}</p>
                <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
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

// ── Simulate Incoming Message Modal ──────────────────────────────────────────
const SimulateModal: React.FC<{
  onClose: () => void;
  onSimulate: (phone: string, name: string, text: string) => Promise<void>;
}> = ({ onClose, onSimulate }) => {
  const [phone, setPhone] = useState(`551199${Math.floor(Math.random() * 9000000 + 1000000)}`);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onSimulate(phone, name || phone, text);
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
            <Label>Número do WhatsApp (com DDI)</Label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="input w-full" placeholder="5511912345678" />
          </div>
          <div>
            <Label>Nome do contato</Label>
            <input value={name} onChange={e => setName(e.target.value)} className="input w-full" placeholder="Nome do cliente" />
          </div>
          <div>
            <Label>Mensagem</Label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="input w-full resize-none"
              rows={3}
              placeholder="Olá, tenho interesse em apartamentos…"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm">Cancelar</button>
            <button onClick={handle} disabled={loading || !text.trim()} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const WhatsAppAgent: React.FC = () => {
  const [conversations, setConversations] = useState<WAConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>('conversations');
  const [config, setConfig] = useState<WAAgentConfig>(WAAgentService.getAgentConfig());
  const [instance, setInstance] = useState<WAInstance>(WAAgentService.getInstance());
  const [analytics, setAnalytics] = useState<WAAnalytics>(WAAgentService.getAnalytics());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WAConversationStatus | 'all'>('all');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  const load = useCallback(() => {
    setConversations(WAAgentService.getConversations());
    setAnalytics(WAAgentService.getAnalytics());
  }, []);

  useEffect(() => {
    WAAgentService.init();
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = conversations.filter(c => {
    const matchSearch = c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPhone.includes(search) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    WAAgentService.markRead(id);
    load();
  };

  const handleStatusChange = (status: WAConversationStatus) => {
    if (!selectedId) return;
    WAAgentService.setStatus(selectedId, status);
    load();
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedId) return;
    setSending(true);
    await WAAgentService.sendHumanMessage(selectedId, text);
    load();
    setSending(false);
  };

  const handleSaveConfig = (cfg: WAAgentConfig) => {
    WAAgentService.saveAgentConfig(cfg);
    setConfig(cfg);
  };

  const handleSimulate = async (phone: string, name: string, text: string) => {
    setBotTyping(true);
    const { botMsg } = await WAAgentService.simulateIncoming(phone, name, text);
    if (botMsg) {
      setTimeout(() => setBotTyping(false), 800);
    } else {
      setBotTyping(false);
    }
    load();
    setSelectedId(phone);
    setActivePanel('conversations');
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#020617] rounded-2xl overflow-hidden border border-slate-800">
      {/* Left Sidebar: Navigation */}
      <div className="w-14 flex-shrink-0 bg-[#020617] border-r border-slate-800 flex flex-col items-center py-4 gap-2">
        <NavBtn
          icon={<MessageCircle className="w-5 h-5" />}
          active={activePanel === 'conversations'}
          onClick={() => setActivePanel('conversations')}
          badge={totalUnread}
          title="Conversas"
        />
        <NavBtn
          icon={<BarChart3 className="w-5 h-5" />}
          active={activePanel === 'analytics'}
          onClick={() => setActivePanel('analytics')}
          title="Analytics"
        />
        <NavBtn
          icon={<Settings className="w-5 h-5" />}
          active={activePanel === 'settings'}
          onClick={() => setActivePanel('settings')}
          title="Configurações"
        />
        <div className="mt-auto">
          <div className="flex flex-col items-center gap-1" title={`Status: ${instance.status}`}>
            <StatusDot status={instance.status} />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {activePanel === 'conversations' && (
        <div className="w-80 flex-shrink-0 flex flex-col bg-[#0a1628] border-r border-slate-800">
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="font-bold text-slate-100 text-sm">WhatsApp</h2>
                {totalUnread > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={instance.status} />
                <span className="text-[10px] text-slate-500">{instance.status === 'connected' ? 'Conectado' : instance.status}</span>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversas…"
                className="w-full bg-[#1e293b] text-sm text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'bot', 'human', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex-1 ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 py-10">
                <MessageCircle className="w-10 h-10 opacity-20" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filtered.map(c => (
                <ConvItem
                  key={c.id}
                  conv={c}
                  active={c.id === selectedId}
                  onClick={() => handleSelectConv(c.id)}
                />
              ))
            )}
          </div>

          {/* Simulate button */}
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={() => setShowSimulate(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Simular mensagem recebida
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {activePanel === 'conversations' && (
          selectedConv ? (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <ChatPanel
                  conv={selectedConv}
                  onStatusChange={handleStatusChange}
                  onSendMessage={handleSendMessage}
                  sending={sending}
                  botTyping={botTyping && selectedConv.id === selectedId}
                  showInfo={showInfo}
                  onToggleInfo={() => setShowInfo(s => !s)}
                />
              </div>
              {showInfo && <ContactInfo conv={selectedConv} />}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-emerald-500/40" />
              </div>
              <div className="text-center">
                <h3 className="text-slate-400 font-bold text-lg">Agente WhatsApp com IA</h3>
                <p className="text-slate-600 text-sm mt-1">Selecione uma conversa para começar</p>
              </div>
              <button
                onClick={() => setShowSimulate(true)}
                className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-600/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Simular nova mensagem
              </button>
            </div>
          )
        )}

        {activePanel === 'settings' && (
          <SettingsPanel
            config={config}
            onSave={handleSaveConfig}
            onTest={WAAgentService.testBotReply}
          />
        )}

        {activePanel === 'analytics' && (
          <AnalyticsPanel analytics={analytics} conversations={conversations} />
        )}
      </div>

      {showSimulate && (
        <SimulateModal
          onClose={() => setShowSimulate(false)}
          onSimulate={handleSimulate}
        />
      )}
    </div>
  );
};

export default WhatsAppAgent;
