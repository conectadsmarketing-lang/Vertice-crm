
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Lead } from '../types';
import { Users, ChevronRight, DollarSign, Zap } from 'lucide-react';

const STAGES = [
  { id: 'novo', label: 'Lead' },
  { id: 'em atendimento', label: 'Atendimento' },
  { id: 'visita', label: 'Visita' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'fechado', label: 'Fechamento' }
];

const SalesFunnelView: React.FC = () => {
  const [leads] = useState<Lead[]>(StorageService.getLeads());

  return (
    <div className="animate-fadeIn">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight">Funil de Vendas</h1>
        <p className="text-slate-500 mt-1">Visualize o progresso das suas negociações</p>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          return (
            <div key={stage.id} className="min-w-[300px] flex-1">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                   <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">{stage.label}</h3>
                   <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">{stageLeads.length}</span>
                </div>
              </div>
              
              <div className="space-y-3 bg-slate-900/50 p-3 rounded-3xl min-h-[500px] border border-slate-800/50">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="bg-[#1e293b] p-4 rounded-2xl border border-slate-800 shadow-sm hover:border-blue-500/50 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-white text-sm group-hover:text-blue-400">{lead.nome}</p>
                      <Zap className="w-3 h-3 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      <Users className="w-3 h-3" />
                      {lead.origem}
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                   <div className="h-20 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center">
                     <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Vazio</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesFunnelView;
