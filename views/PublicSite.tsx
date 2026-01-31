
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Property, Photo, User, Lead } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Move, 
  MessageCircle, 
  Share2, 
  Search, 
  Menu, 
  X, 
  Calendar,
  ChevronRight,
  Home
} from 'lucide-react';

interface PublicSiteProps {
  propertyId: string | null;
  onBack: () => void;
}

const PublicSiteView: React.FC<PublicSiteProps> = ({ propertyId, onBack }) => {
  const [user] = useState<User>(StorageService.getUser());
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [search, setSearch] = useState('');
  const [leadForm, setLeadForm] = useState({ nome: '', telefone: '' });
  const [showFormSuccess, setShowFormSuccess] = useState(false);

  useEffect(() => {
    const all = StorageService.getProperties().filter(p => p.status === 'ativo');
    setProperties(all);

    if (propertyId) {
      const found = all.find(p => p.id === propertyId);
      if (found) setSelectedProperty(found);
    }
  }, [propertyId]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      nome: leadForm.nome,
      telefone: leadForm.telefone,
      origem: 'site',
      imovel_id: selectedProperty.id,
      status: 'novo',
      data_criacao: new Date().toISOString()
    };

    StorageService.saveLead(newLead);
    setShowFormSuccess(true);
    setLeadForm({ nome: '', telefone: '' });
    setTimeout(() => setShowFormSuccess(false), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado!');
  };

  const filtered = properties.filter(p => 
    p.titulo.toLowerCase().includes(search.toLowerCase()) || 
    p.bairro.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans">
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-black italic">V</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight uppercase">{user.nome}</span>
            </div>
          </div>
          <button 
            onClick={() => window.open(`https://wa.me/${user.whatsapp}`, '_blank')}
            className="hidden md:flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:shadow-lg transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button onClick={onBack} className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-3 h-3" />
            Sair do Preview
          </button>
        </div>
      </header>

      {selectedProperty ? (
        // Property Details Page
        <div className="max-w-6xl mx-auto animate-fadeIn">
          <div className="px-4 py-6">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="flex items-center gap-2 text-slate-500 font-bold mb-6 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Ver outros imóveis
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {/* Photos */}
                <PropertyGallery propertyId={selectedProperty.id} />

                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedProperty.titulo}
                  </h1>
                  <div className="flex items-center gap-1 text-slate-500 text-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {selectedProperty.bairro}, {selectedProperty.cidade}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 py-6 border-y border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Quartos</p>
                      <p className="text-lg font-black">{selectedProperty.dormitorios}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                      <Bath className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Banheiros</p>
                      <p className="text-lg font-black">{selectedProperty.banheiros}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                      <Move className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Área</p>
                      <p className="text-lg font-black">{selectedProperty.metragem}m²</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Descrição do Imóvel</h2>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                    {selectedProperty.descricao}
                  </div>
                </div>
              </div>

              {/* Sticky Sidebar */}
              <div className="relative">
                <div className="sticky top-28 space-y-6">
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl shadow-slate-900/20">
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Valor de Oportunidade</p>
                    <p className="text-4xl font-black mb-8 tracking-tight">R$ {selectedProperty.valor.toLocaleString('pt-BR')}</p>
                    
                    <button 
                      onClick={() => window.open(`https://wa.me/${user.whatsapp}?text=Oi! Gostaria de saber mais sobre: ${selectedProperty.titulo}`, '_blank')}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 mb-4"
                    >
                      <MessageCircle className="w-6 h-6" />
                      Chamar no WhatsApp
                    </button>
                    
                    <button 
                      onClick={copyLink}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      Copiar Link
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Agendar Visita</h3>
                    {showFormSuccess ? (
                      <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-bold">
                        Contato enviado! Responderemos em breve.
                      </div>
                    ) : (
                      <form onSubmit={handleLeadSubmit} className="space-y-4">
                        <input 
                          placeholder="Seu Nome" 
                          required
                          className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={leadForm.nome}
                          onChange={e => setLeadForm(prev => ({ ...prev, nome: e.target.value }))}
                        />
                        <input 
                          placeholder="Telefone / WhatsApp" 
                          required
                          className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={leadForm.telefone}
                          onChange={e => setLeadForm(prev => ({ ...prev, telefone: e.target.value }))}
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Solicitar Visita
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Catalog Page
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
              Encontre o seu <br /><span className="text-blue-600">novo lar.</span>
            </h1>
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Busque por bairro ou título..." 
                className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-full shadow-2xl shadow-slate-200/50 outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(p => (
              <PropertyCardPublic key={p.id} property={p} onClick={() => setSelectedProperty(p)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-24 text-center text-slate-400 font-medium">
                Nenhum imóvel disponível no momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Public Footer */}
      <footer className="bg-slate-50 border-t mt-20 py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
            <span className="text-white font-black text-3xl italic">V</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">{user.nome}</h2>
          <p className="text-slate-500 max-w-sm mb-10">
            Acompanhando você em cada passo da sua nova conquista. Atendimento profissional e direto.
          </p>
          <div className="flex gap-4">
            <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-slate-900/10">Site Vértice</button>
            <button 
              onClick={() => window.open(`https://wa.me/${user.whatsapp}`, '_blank')}
              className="bg-white border text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors"
            >
              Falar agora
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const PropertyGallery: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const photos = StorageService.getPropertyPhotos(propertyId);
  const [active, setActive] = useState(0);

  if (photos.length === 0) return <div className="aspect-video bg-slate-100 rounded-3xl" />;

  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 shadow-inner">
        <img src={photos[active].imagem} alt="Gallery" className="w-full h-full object-cover animate-fadeIn" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {photos.map((p, idx) => (
          <button 
            key={p.id} 
            onClick={() => setActive(idx)}
            className={`shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${active === idx ? 'border-blue-600 shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={p.imagem} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

const PropertyCardPublic: React.FC<{ property: Property; onClick: () => void }> = ({ property, onClick }) => {
  const photos = StorageService.getPropertyPhotos(property.id);
  const main = photos.find(p => p.principal) || photos[0];

  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-slate-200 group-hover:shadow-blue-500/10 transition-all duration-500">
        {main ? (
          <img src={main.imagem} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Home className="w-12 h-12 text-slate-200" />
          </div>
        )}
        <div className="absolute top-6 left-6">
          <span className="bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-2xl text-xs font-black tracking-widest uppercase shadow-sm">
            {property.tipo_imovel}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent flex flex-col justify-end p-8 text-white">
          <p className="text-3xl font-black mb-1">R$ {property.valor.toLocaleString('pt-BR')}</p>
          <p className="text-white/70 font-bold uppercase tracking-widest text-[10px]">{property.bairro}, {property.cidade}</p>
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors px-2">{property.titulo}</h3>
      <div className="flex items-center gap-4 mt-3 px-2 text-slate-400 font-bold text-sm">
        <span className="flex items-center gap-1.5"><Bed className="w-4 h-4" />{property.dormitorios}</span>
        <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" />{property.banheiros}</span>
        <span className="flex items-center gap-1.5"><Move className="w-4 h-4" />{property.metragem}m²</span>
      </div>
    </div>
  );
};

export default PublicSiteView;
