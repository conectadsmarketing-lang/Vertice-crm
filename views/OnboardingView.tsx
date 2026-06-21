import React, { useState } from 'react';
import {
  Building2, MessageCircle, Package, Check, ChevronRight, Loader2,
  Plus, Trash2, Bot, Sparkles,
} from 'lucide-react';
import { Profile, AgentDB, ProductsDB, FAQsDB, type DBCompany, type DBAgent, type DBProduct, type DBFAQ } from '../services/db';

interface Props {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

const TONES = ['Amigável', 'Profissional', 'Entusiasta', 'Formal', 'Descontraído'];
const SEGMENTS = ['Imóveis', 'Saúde', 'Educação', 'Varejo', 'Serviços', 'Tecnologia', 'Alimentação', 'Outro'];
const HAND_OFF_DEFAULTS = [
  'Quando o cliente pedir para falar com uma pessoa real',
  'Quando o cliente solicitar desconto ou negociação',
  'Quando a dúvida for técnica e complexa',
  'Quando o cliente demonstrar insatisfação',
].join('\n');

const DEFAULT_QUESTIONS = [
  { label: 'Nome do cliente', key: 'name' },
  { label: 'Principal interesse', key: 'interest' },
  { label: 'Orçamento disponível', key: 'budget' },
];

const OnboardingView: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('');

  // Step 1 – Company
  const [company, setCompany] = useState({
    name: '', segment: 'Imóveis', whatsapp: '', email: '', city: '',
  });

  // Step 2 – Agent
  const [agent, setAgent] = useState<Partial<DBAgent>>({
    name: 'Vera',
    tone: 'Amigável',
    objective: 'Qualificar leads que chegam pelo WhatsApp, coletar informações de interesse e agendar visitas com nossos consultores.',
    human_handoff_rules: HAND_OFF_DEFAULTS,
    welcome_message: 'Olá! 👋 Sou a *Vera*, assistente virtual. Como posso te ajudar hoje?',
    required_questions: DEFAULT_QUESTIONS,
  });
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  // Step 3 – Products & FAQs
  const [products, setProducts] = useState<Partial<DBProduct>[]>([]);
  const [faqs, setFaqs] = useState<Partial<DBFAQ>[]>([
    { question: 'Qual o horário de atendimento?', answer: 'Atendemos de segunda a sexta, das 9h às 18h.' },
  ]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const c = await Profile.createCompany(company as Parameters<typeof Profile.createCompany>[0]);
      setCompanyId(c.id);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar empresa');
    } finally { setLoading(false); }
  };

  const handleGeneratePrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const c: Partial<DBCompany> = { name: company.name, segment: company.segment };
      const prompt = await AgentDB.generatePrompt(agent, c, products as DBProduct[], faqs as DBFAQ[]);
      setAgent(prev => ({ ...prev, generated_prompt: prompt }));
    } catch { /* ignore */ }
    setGeneratingPrompt(false);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (!agent.generated_prompt) await handleGeneratePrompt();
      await AgentDB.upsert({ ...agent, company_id: companyId });
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar agente');
    } finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    setLoading(true); setError('');
    try {
      for (const p of products.filter(p => p.name)) {
        await ProductsDB.upsert({ ...p, company_id: companyId } as DBProduct & { company_id: string });
      }
      for (const f of faqs.filter(f => f.question && f.answer)) {
        await FAQsDB.upsert({ ...f, company_id: companyId } as DBFAQ & { company_id: string });
      }
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados');
    } finally { setLoading(false); }
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setAgent(prev => ({
      ...prev,
      required_questions: [...(prev.required_questions || []), { label: newQuestion.trim(), key: newQuestion.toLowerCase().replace(/\s+/g, '_') }],
    }));
    setNewQuestion('');
  };

  const removeQuestion = (idx: number) => {
    setAgent(prev => ({ ...prev, required_questions: (prev.required_questions || []).filter((_, i) => i !== idx) }));
  };

  const steps = [
    { n: 1 as Step, label: 'Empresa', icon: <Building2 className="w-4 h-4" /> },
    { n: 2 as Step, label: 'Agente IA', icon: <Bot className="w-4 h-4" /> },
    { n: 3 as Step, label: 'Catálogo', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-start p-4 pt-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg italic">V</span>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">VÉRTICE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Configurar seu agente</h1>
          <p className="text-slate-500 text-sm mt-1">3 passos para ter seu bot de IA no WhatsApp</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                s.n === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : s.n < step ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-600'
              }`}>
                {s.n < step ? <Check className="w-4 h-4" /> : s.icon}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${s.n < step ? 'bg-emerald-600/40' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Step 1: Company ─────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Sobre sua empresa
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <OLabel>Nome da empresa *</OLabel>
                <OInput value={company.name} onChange={v => setCompany(p => ({ ...p, name: v }))} placeholder="Ex: Imobiliária Santos" required />
              </div>
              <div>
                <OLabel>Segmento</OLabel>
                <select
                  value={company.segment}
                  onChange={e => setCompany(p => ({ ...p, segment: e.target.value }))}
                  className="input"
                >
                  {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <OLabel>Cidade</OLabel>
                <OInput value={company.city} onChange={v => setCompany(p => ({ ...p, city: v }))} placeholder="São Paulo, SP" />
              </div>
              <div>
                <OLabel>WhatsApp da empresa</OLabel>
                <OInput value={company.whatsapp} onChange={v => setCompany(p => ({ ...p, whatsapp: v }))} placeholder="5511999999999" />
              </div>
              <div>
                <OLabel>E-mail de contato</OLabel>
                <OInput value={company.email} onChange={v => setCompany(p => ({ ...p, email: v }))} placeholder="contato@empresa.com" type="email" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" disabled={loading || !company.name}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Agent ─────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" /> Configurar agente de IA
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <OLabel>Nome do assistente</OLabel>
                <OInput value={agent.name || ''} onChange={v => setAgent(p => ({ ...p, name: v }))} placeholder="Ex: Vera, Bia, Alex" />
              </div>
              <div>
                <OLabel>Tom de voz</OLabel>
                <select value={agent.tone || 'Amigável'} onChange={e => setAgent(p => ({ ...p, tone: e.target.value }))} className="input">
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <OLabel>Objetivo principal do agente</OLabel>
                <textarea value={agent.objective || ''} onChange={e => setAgent(p => ({ ...p, objective: e.target.value }))}
                  className="input resize-none" rows={3} placeholder="Ex: Qualificar leads que chegam pelo WhatsApp e agendar reuniões com os consultores" />
              </div>
              <div className="col-span-2">
                <OLabel>Mensagem de boas-vindas</OLabel>
                <textarea value={agent.welcome_message || ''} onChange={e => setAgent(p => ({ ...p, welcome_message: e.target.value }))}
                  className="input resize-none" rows={2} placeholder="Olá! 👋 Sou a Vera..." />
              </div>
              <div className="col-span-2">
                <OLabel>Quando transferir para humano?</OLabel>
                <textarea value={agent.human_handoff_rules || ''} onChange={e => setAgent(p => ({ ...p, human_handoff_rules: e.target.value }))}
                  className="input resize-none" rows={3} />
              </div>
            </div>

            {/* Required Questions */}
            <div className="mt-4">
              <OLabel>Informações a coletar do cliente</OLabel>
              <div className="space-y-2 mb-2">
                {(agent.required_questions || []).map((q, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
                    <span className="flex-1 text-sm text-slate-300">{q.label}</span>
                    <button type="button" onClick={() => removeQuestion(i)} className="text-slate-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                  placeholder="Nova pergunta (ex: Prazo para comprar)" className="input flex-1 text-sm" />
                <button type="button" onClick={addQuestion} className="btn-sm"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Generate Prompt */}
            <div className="mt-5 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Prompt gerado por IA
                </p>
                <button type="button" onClick={handleGeneratePrompt} disabled={generatingPrompt}
                  className="text-xs text-blue-400 font-semibold hover:text-blue-300 flex items-center gap-1">
                  {generatingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Gerar / Regenerar
                </button>
              </div>
              {agent.generated_prompt
                ? <p className="text-xs text-slate-500 line-clamp-3">{agent.generated_prompt}</p>
                : <p className="text-xs text-slate-700">Clique em "Gerar" para criar o prompt automaticamente com IA</p>}
            </div>

            <div className="flex justify-between mt-6">
              <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 text-sm font-semibold">
                ← Voltar
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Products & FAQs ─────────────────────────────── */}
        {step === 3 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Produtos & Perguntas frequentes
            </h2>
            <p className="text-slate-500 text-sm mb-5">Opcional — o bot usará essas informações para responder clientes</p>

            {/* Products */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <OLabel>Produtos / Serviços</OLabel>
                <button type="button" onClick={() => setProducts(p => [...p, { name: '', price: '', description: '', active: true }])}
                  className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {products.map((p, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <OInput value={p.name || ''} onChange={v => setProducts(arr => arr.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Nome do produto" className="flex-1" />
                  <OInput value={p.price || ''} onChange={v => setProducts(arr => arr.map((x, j) => j === i ? { ...x, price: v } : x))} placeholder="R$ preço" className="w-28" />
                  <button type="button" onClick={() => setProducts(arr => arr.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {products.length === 0 && <p className="text-slate-700 text-xs">Nenhum produto adicionado</p>}
            </div>

            {/* FAQs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <OLabel>Perguntas frequentes</OLabel>
                <button type="button" onClick={() => setFaqs(f => [...f, { question: '', answer: '' }])}
                  className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {faqs.map((f, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 mb-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <OInput value={f.question || ''} onChange={v => setFaqs(arr => arr.map((x, j) => j === i ? { ...x, question: v } : x))} placeholder="Pergunta" />
                      <textarea value={f.answer || ''} onChange={e => setFaqs(arr => arr.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))}
                        placeholder="Resposta" className="input resize-none text-xs" rows={2} />
                    </div>
                    <button type="button" onClick={() => setFaqs(arr => arr.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-300 text-sm font-semibold">
                ← Voltar
              </button>
              <button onClick={handleStep3} disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Concluir configuração
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-slate-400 mb-1.5">{children}</p>
);

const OInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}> = ({ value, onChange, placeholder, type = 'text', required, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    className={`input ${className}`}
  />
);

export default OnboardingView;
