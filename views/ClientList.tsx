
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Lead } from '../types';
import { Search, Plus, Users, Clock, MessageSquare, MoreHorizontal, Filter } from 'lucide-react';

const ClientListView: React.FC = () => {
  const [leads] = useState<Lead[]>(StorageService.getLeads());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');

  const filteredLeads = leads.filter(l => 
    (statusFilter === 'Todos os status' || l.status === statusFilter) &&
    (l.nome.toLowerCase().includes(search.toLowerCase()) || l.telefone.includes(search))
  );

  return (
    <div className="animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Clientes</h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie seus clientes e leads</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-2xl shadow-blue-600/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-[#1e293b] p-3 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            className="w-full pl-12 pr-4 py-3 bg-[#0f172a] rounded-2xl border border-slate-800 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select 
            className="w-full pl-10 pr-4 py-3 bg-[#0f172a] rounded-2xl border border-slate-800 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Todos os status</option>
            <option value="novo">Novo</option>
            <option value="em atendimento">Atendimento</option>
            <option value="visita">Visita</option>
            <option value="proposta">Proposta</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>
      </div>

      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{lead.nome}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{lead.telefone}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{lead.origem}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  lead.status === 'novo' ? 'bg-blue-600/10 text-blue-500 border-blue-600/20' :
                  lead.status === 'fechado' ? 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {lead.status}
                </div>
                <button className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1e293b] py-32 rounded-[2.5rem] border-2 border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Nenhum cliente cadastrado</h2>
          <p className="text-slate-500 font-medium">Clique em "Novo Cliente" para começar a sua base.</p>
        </div>
      )}
    </div>
  );
};

export default ClientListView;
