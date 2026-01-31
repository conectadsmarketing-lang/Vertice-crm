
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Property, Photo } from '../types';
// Added Home and Image (as ImageIcon) to imports
import { Search, Plus, MapPin, Bed, Bath, Move, Eye, Edit2, Trash2, SlidersHorizontal, Home, Image as ImageIcon } from 'lucide-react';

interface PropertyListProps {
  onEditProperty: (id: string) => void;
  onNewProperty: () => void;
}

const PropertyListView: React.FC<PropertyListProps> = ({ onEditProperty, onNewProperty }) => {
  const [properties, setProperties] = useState<Property[]>(StorageService.getProperties());
  const [filter, setFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [search, setSearch] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      StorageService.deleteProperty(id);
      setProperties(StorageService.getProperties());
    }
  };

  const filteredProperties = properties
    .filter(p => filter === 'todos' || p.status === filter)
    .filter(p => 
      p.titulo.toLowerCase().includes(search.toLowerCase()) || 
      p.bairro.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meus Imóveis</h1>
          <p className="text-slate-500 mt-1">Gerencie seu catálogo de ofertas.</p>
        </div>
        <button 
          onClick={onNewProperty}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Novo
        </button>
      </header>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por título ou bairro..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto">
          {(['todos', 'ativo', 'inativo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map(property => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onEdit={() => onEditProperty(property.id)}
              onDelete={() => handleDelete(property.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white py-24 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Nenhum imóvel encontrado.</p>
        </div>
      )}
    </div>
  );
};

const PropertyCard: React.FC<{ property: Property; onEdit: () => void; onDelete: () => void }> = ({ property, onEdit, onDelete }) => {
  const photos = StorageService.getPropertyPhotos(property.id);
  const mainPhoto = photos.find(p => p.principal) || photos[0];

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm group hover:shadow-xl transition-all flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {mainPhoto ? (
          <img src={mainPhoto.imagem} alt={property.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
            property.status === 'ativo' ? 'bg-emerald-50 text-white' : 'bg-slate-500 text-white'
          }`}>
            {property.status}
          </span>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
            onClick={onEdit}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 truncate">{property.titulo}</h3>
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{property.bairro}, {property.cidade}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Valor</span>
            <span className="text-xl font-black text-blue-600">R$ {property.valor.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-50 mb-6">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{property.dormitorios}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{property.banheiros}</span>
          </div>
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{property.metragem}m²</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <button 
            onClick={onEdit}
            className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-sm font-bold active:scale-95 transition-all"
          >
            Editar Detalhes
          </button>
          <button 
            onClick={onDelete}
            className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyListView;
