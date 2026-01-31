
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Lead, Property } from '../types';
import { MessageCircle, Phone, Clock, MapPin, SlidersHorizontal, ChevronRight, CheckCircle, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/gemini';

const LeadListView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(StorageService.getLeads());
  const [properties] = useState<Property[]>(StorageService.getProperties());
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: Lead['status']) => {
    StorageService.updateLeadStatus(id, newStatus);
    setLeads(StorageService.getLeads());
  };

  const getPropertyTitle = (id: string) => {
    return properties.find(p => p.id === id)?.titulo || 'Imóvel Excluído';
  };

  const handleContactSuggestion = async (lead: Lead) => {
    setLoadingAi(lead.id);
    const propertyTitle = getPropertyTitle(lead.imovel_id);
    const suggestion = await GeminiService.suggestWhatsAppMessage(lead.nome, propertyTitle);
    setLoadingAi(null);
    
    const whatsappUrl = `https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(suggestion)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leads</h1>
        <p className="text-slate-500 mt-1">Seus novos contatos e potenciais clientes.</p>
      </header>

      {leads.length > 0 ? (
        <div className="space-y-4">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-blue-200 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  lead.status === 'novo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {lead.status === 'novo' ? <Clock className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-900">{lead.nome}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                      {lead.origem}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {lead.telefone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Interesse: <span className="font-bold text-slate-700 max-w-[150px] truncate">{getPropertyTitle(lead.imovel_id)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                  {(['novo', 'em atendimento', 'visita', 'fechado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(lead.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        lead.status === s 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {s === 'em atendimento' ? 'Atend.' : s === 'fechado' ? 'Vend.' : s}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => handleContactSuggestion(lead)}
                  disabled={!!loadingAi}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loadingAi === lead.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-200" />
                      Abordar via WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white py-24 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Sua lista de leads está vazia.</p>
        </div>
      )}
    </div>
  );
};

export default LeadListView;
