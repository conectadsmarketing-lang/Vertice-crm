
import React, { useState, useEffect } from 'react';
import { Property, Photo, PropertyStatus } from '../types';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  Plus, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface PropertyFormProps {
  propertyId: string | null;
  onCancel: () => void;
  onSave: () => void;
}

const PropertyFormView: React.FC<PropertyFormProps> = ({ propertyId, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'usuario_id'>>({
    titulo: '',
    valor: 0,
    bairro: '',
    cidade: '',
    tipo_imovel: 'Apartamento',
    metragem: 0,
    dormitorios: 0,
    banheiros: 0,
    vagas: 0,
    descricao: '',
    status: 'ativo'
  });

  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (propertyId) {
      const p = StorageService.getProperties().find(p => p.id === propertyId);
      if (p) {
        setFormData({
          titulo: p.titulo,
          valor: p.valor,
          bairro: p.bairro,
          cidade: p.cidade,
          tipo_imovel: p.tipo_imovel,
          metragem: p.metragem,
          dormitorios: p.dormitorios,
          banheiros: p.banheiros,
          vagas: p.vagas,
          descricao: p.descricao,
          status: p.status
        });
        setPhotos(StorageService.getPropertyPhotos(propertyId));
      }
    }
  }, [propertyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valor' || name === 'metragem' || name === 'dormitorios' || name === 'banheiros' || name === 'vagas' 
        ? Number(value) 
        : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixed: Cast the result of Array.from(files) to File[] to ensure 'file' has the correct type.
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          imovel_id: propertyId || 'temp',
          imagem: base64String,
          ordem: photos.length,
          principal: photos.length === 0
        };
        setPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length > 0 && !filtered.some(p => p.principal)) {
        filtered[0].principal = true;
      }
      return filtered;
    });
  };

  const setMainPhoto = (id: string) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      principal: p.id === id
    })));
  };

  const handleAiDescription = async () => {
    if (!formData.titulo || !formData.bairro) {
      alert("Preencha ao menos o título e bairro para gerar a descrição.");
      return;
    }
    setAiGenerating(true);
    const desc = await GeminiService.generatePropertyDescription({
      titulo: formData.titulo,
      bairro: formData.bairro,
      cidade: formData.cidade,
      metragem: formData.metragem,
      quartos: formData.dormitorios,
      valor: formData.valor
    });
    setFormData(prev => ({ ...prev, descricao: desc }));
    setAiGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = StorageService.getUser();
    const finalId = propertyId || Math.random().toString(36).substr(2, 9);
    
    const property: Property = {
      ...formData,
      id: finalId,
      usuario_id: user.id
    };

    StorageService.saveProperty(property);
    
    const finalPhotos = photos.map((p, idx) => ({
      ...p,
      imovel_id: finalId,
      ordem: idx
    }));
    StorageService.savePhotos(finalId, finalPhotos);

    setTimeout(() => {
      setLoading(false);
      onSave();
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-500 font-bold mb-6 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para a lista
      </button>

      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {propertyId ? 'Editar Imóvel' : 'Novo Imóvel'}
        </h1>
        <p className="text-slate-500 mt-1">Preencha os detalhes essenciais para o seu catálogo.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Título do Anúncio</label>
              <input 
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ex: Apartamento Moderno no Centro"
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Valor de Venda (R$)</label>
              <input 
                name="valor"
                type="number"
                required
                value={formData.valor}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Tipo de Imóvel</label>
              <select 
                name="tipo_imovel"
                value={formData.tipo_imovel}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
              >
                <option>Apartamento</option>
                <option>Casa</option>
                <option>Sobrado</option>
                <option>Terreno</option>
                <option>Comercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Bairro</label>
              <input 
                name="bairro"
                required
                value={formData.bairro}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Cidade</label>
              <input 
                name="cidade"
                required
                value={formData.cidade}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            Características
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Área (m²)</label>
              <input name="metragem" type="number" value={formData.metragem} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Dormitórios</label>
              <input name="dormitorios" type="number" value={formData.dormitorios} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Banheiros</label>
              <input name="banheiros" type="number" value={formData.banheiros} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Vagas</label>
              <input name="vagas" type="number" value={formData.vagas} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>
          </div>
        </section>

        {/* Descrição */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
              Descrição
            </h2>
            <button 
              type="button"
              onClick={handleAiDescription}
              disabled={aiGenerating}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-400" />}
              Gerar com IA
            </button>
          </div>
          <textarea 
            name="descricao"
            rows={6}
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder="Conte os detalhes do imóvel..."
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none"
          />
        </section>

        {/* Fotos */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span>
            Fotos
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <img src={photo.imagem} alt="Property" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setMainPhoto(photo.id)}
                    className={`p-2 rounded-lg transition-colors ${photo.principal ? 'bg-yellow-500 text-white' : 'bg-white text-slate-900 hover:bg-yellow-500 hover:text-white'}`}
                    title="Definir como principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => deletePhoto(photo.id)}
                    className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {photo.principal && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg tracking-widest">
                    Principal
                  </div>
                )}
              </div>
            ))}
            
            <label className="cursor-pointer aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all bg-slate-50 hover:bg-blue-50">
              <Plus className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Foto</span>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </section>

        {/* Status */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Status do Imóvel</h2>
            <p className="text-slate-500 text-sm">Imóveis inativos não aparecem no seu site público.</p>
          </div>
          <select 
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className={`px-6 py-3 rounded-2xl font-bold text-sm outline-none border-none ring-2 ${
              formData.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' : 'bg-slate-100 text-slate-500 ring-slate-200'
            }`}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </section>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 flex justify-center z-40 md:static md:bg-transparent md:border-none md:p-0">
          <div className="max-w-4xl w-full flex gap-4">
             <button 
              type="button"
              onClick={onCancel}
              className="flex-1 md:flex-none md:min-w-[150px] bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none md:min-w-[200px] flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Imóvel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyFormView;
