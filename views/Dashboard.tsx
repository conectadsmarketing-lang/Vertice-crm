
import React from 'react';
import { StorageService } from '../services/storage';
import { Home, Users, Plus, TrendingUp, Sparkles, Zap, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  onNavigateProperties: () => void;
  onNavigateLeads: () => void;
  onNewProperty: () => void;
}

const DashboardView: React.FC<DashboardProps> = ({ 
  onNavigateProperties, 
  onNavigateLeads,
  onNewProperty 
}) => {
  const properties = StorageService.getProperties();
  const activeProperties = properties.filter(p => p.status === 'ativo').length;
  const leads = StorageService.getLeads();
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">VÉRTICE</h1>
          <p className="text-slate-500 mt-1 font-medium">Sua operação centralizada e inteligente.</p>
        </div>
        <button 
          onClick={onNewProperty}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Imóvel
        </button>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <StatCard 
          icon={<Home className="text-blue-500" />} 
          label="Total Imóveis" 
          value={properties.length} 
          onClick={onNavigateProperties}
        />
        <StatCard 
          icon={<TrendingUp className="text-emerald-500" />} 
          label="Em Destaque" 
          value={activeProperties} 
          onClick={onNavigateProperties}
        />
        <StatCard 
          icon={<Users className="text-purple-500" />} 
          label="Total Leads" 
          value={leads.length} 
          onClick={onNavigateLeads}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Leads */}
        <section className="lg:col-span-3 bg-[#1e293b] rounded-[2.5rem] p-8 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-xl text-white">Últimos Atendimentos</h2>
            <button onClick={onNavigateLeads} className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Ver todos</button>
          </div>
          {recentLeads.length > 0 ? (
            <div className="space-y-4">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-5 bg-[#0f172a] border border-slate-800 rounded-3xl group hover:border-slate-700 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                      {lead.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{lead.nome}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{lead.origem}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full border border-blue-600/20">
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <Users className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-600 font-medium">Nenhum lead novo por aqui.</p>
            </div>
          )}
        </section>

        {/* AI Unlocker Prompt Card */}
        <section className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/10 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <Zap className="w-48 h-48 text-white rotate-12" />
          </div>
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight">Venda mais com IA</h2>
            <p className="text-blue-100 font-medium text-lg leading-relaxed mb-10">Use o Destravador de Vendas para criar scripts e superar qualquer objeção.</p>
          </div>
          <button 
            className="w-full bg-white text-blue-700 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 active:scale-95 group"
          >
            Acessar Destravador
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; onClick: () => void }> = ({ icon, label, value, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-[#1e293b] p-8 rounded-[2rem] border border-slate-800 shadow-sm flex items-center gap-6 text-left transition-all hover:border-slate-700 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/10 rounded-full -translate-y-1/2 translate-x-1/2" />
    <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-center group-hover:bg-slate-800 transition-colors [&>svg]:w-7 [&>svg]:h-7">
      {icon}
    </div>
    <div className="relative">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
    </div>
  </button>
);

export default DashboardView;
