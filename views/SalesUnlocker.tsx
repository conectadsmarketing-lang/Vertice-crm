
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { Zap, Sparkles, MessageSquare, ShieldAlert, Target, Loader2, Send } from 'lucide-react';

const SalesUnlockerView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const handleAsk = async (prompt: string) => {
    setLoading(true);
    setAnswer(null);
    // Note: Reusing GeminiService or direct AI call
    // Simplified simulation of "Destravador" logic
    try {
       const res = await GeminiService.suggestWhatsAppMessage("Cliente", prompt);
       setAnswer(res);
    } catch (e) {
       setAnswer("Não consegui processar agora. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20 rotate-3">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Destravador de Vendas</h1>
        <p className="text-slate-500 mt-2 text-lg">Use IA para vencer objeções e fechar negócios mais rápido.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StrategyCard icon={<ShieldAlert />} label="Vencer Objeções" desc="Como responder quando o cliente diz que 'está caro'." onClick={() => setQuestion('O cliente disse que o imóvel está caro para o bairro. Como respondo?')} />
        <StrategyCard icon={<MessageSquare />} label="Script de Impacto" desc="Crie abordagens que prendem a atenção no primeiro 'oi'." onClick={() => setQuestion('Crie um script de primeiro contato para um lead que veio pelo site.')} />
        <StrategyCard icon={<Target />} label="Gatilhos Mentais" desc="Dicas de urgência e escassez para o momento certo." onClick={() => setQuestion('Como usar o gatilho da escassez em um imóvel que tem muita procura?')} />
      </div>

      <div className="bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
        <div className="relative mb-6">
          <Sparkles className="absolute left-6 top-6 w-6 h-6 text-blue-500" />
          <textarea 
            className="w-full bg-[#0f172a] border border-slate-800 rounded-3xl p-6 pl-16 text-white text-lg min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-medium"
            placeholder="Qual o desafio da sua venda hoje? Digite aqui..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button 
            onClick={() => handleAsk(question)}
            disabled={loading || !question}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-xl transition-all active:scale-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>

        {answer && (
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-blue-500/20 animate-slideUp">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Sugestão Vértice IA</span>
             </div>
             <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">
                {answer}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StrategyCard: React.FC<{ icon: React.ReactNode; label: string; desc: string; onClick: () => void }> = ({ icon, label, desc, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800 text-left hover:border-blue-500/50 hover:bg-slate-800/30 transition-all group"
  >
    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-bold text-white mb-2">{label}</h3>
    <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
  </button>
);

export default SalesUnlockerView;
