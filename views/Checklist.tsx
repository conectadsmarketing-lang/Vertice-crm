
import React, { useState } from 'react';
import { ClipboardList, CheckCircle, Circle, AlertCircle } from 'lucide-react';

const DOCUMENTS = [
  { id: 1, label: 'RG e CPF dos Vendedores', category: 'Vendedor' },
  { id: 2, label: 'Matrícula Atualizada do Imóvel', category: 'Imóvel' },
  { id: 3, label: 'Certidão Negativa de IPTU', category: 'Imóvel' },
  { id: 4, label: 'Comprovante de Estado Civil', category: 'Vendedor' },
  { id: 5, label: 'Certidão de Objeto e Pé', category: 'Vendedor' },
  { id: 6, label: 'Escritura do Imóvel', category: 'Imóvel' }
];

const ChecklistView: React.FC = () => {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggle = (id: number) => {
    setCompleted(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completed.length / DOCUMENTS.length) * 100);

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight">Checklist Documental</h1>
        <p className="text-slate-500 mt-1">Garantia jurídica para o fechamento da venda</p>
      </header>

      <div className="bg-[#1e293b] rounded-3xl p-8 border border-slate-800 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Progresso do Processo</p>
            <p className="text-3xl font-black text-white">{progress}%</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
             <div 
               className="absolute inset-0 border-4 border-blue-600 rounded-full transition-all duration-500" 
               style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
             />
             <ClipboardList className="w-6 h-6 text-slate-500" />
          </div>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {DOCUMENTS.map(doc => (
          <button 
            key={doc.id}
            onClick={() => toggle(doc.id)}
            className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${
              completed.includes(doc.id) 
                ? 'bg-emerald-600/5 border-emerald-500/30 text-emerald-500' 
                : 'bg-[#1e293b] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              {completed.includes(doc.id) ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6 text-slate-700" />}
              <div className="text-left">
                <p className={`font-bold ${completed.includes(doc.id) ? 'text-emerald-400' : 'text-white'}`}>{doc.label}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{doc.category}</p>
              </div>
            </div>
            {!completed.includes(doc.id) && <AlertCircle className="w-4 h-4 text-slate-700" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChecklistView;
