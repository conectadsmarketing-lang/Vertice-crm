
import { Property, Lead, Photo, User } from '../types';

const KEYS = {
  USER: 'vertice_user',
  PROPERTIES: 'vertice_properties',
  PHOTOS: 'vertice_photos',
  LEADS: 'vertice_leads',
};

// Initial Data Simulation
const DEFAULT_USER: User = {
  id: 'u1',
  nome: 'Ricardo Imóveis',
  email: 'contato@ricardoimoveis.com.br',
  whatsapp: '5511999999999',
  tipo: 'corretor',
};

export const StorageService = {
  getUser: (): User => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : DEFAULT_USER;
  },

  getProperties: (): Property[] => {
    const data = localStorage.getItem(KEYS.PROPERTIES);
    return data ? JSON.parse(data) : [];
  },

  saveProperty: (property: Property) => {
    const properties = StorageService.getProperties();
    const index = properties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.push(property);
    }
    localStorage.setItem(KEYS.PROPERTIES, JSON.stringify(properties));
  },

  deleteProperty: (id: string) => {
    const properties = StorageService.getProperties().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PROPERTIES, JSON.stringify(properties));
    // Also delete photos
    const photos = StorageService.getPhotos().filter(f => f.imovel_id !== id);
    localStorage.setItem(KEYS.PHOTOS, JSON.stringify(photos));
  },

  getPhotos: (): Photo[] => {
    const data = localStorage.getItem(KEYS.PHOTOS);
    return data ? JSON.parse(data) : [];
  },

  getPropertyPhotos: (propertyId: string): Photo[] => {
    return StorageService.getPhotos()
      .filter(f => f.imovel_id === propertyId)
      .sort((a, b) => a.ordem - b.ordem);
  },

  savePhotos: (propertyId: string, photos: Photo[]) => {
    const allPhotos = StorageService.getPhotos().filter(f => f.imovel_id !== propertyId);
    localStorage.setItem(KEYS.PHOTOS, JSON.stringify([...allPhotos, ...photos]));
  },

  getLeads: (): Lead[] => {
    const data = localStorage.getItem(KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  },

  saveLead: (lead: Lead) => {
    const leads = StorageService.getLeads();
    leads.unshift(lead); // Newest first
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  },

  updateLeadStatus: (leadId: string, status: Lead['status']) => {
    const leads = StorageService.getLeads();
    const index = leads.findIndex(l => l.id === leadId);
    if (index >= 0) {
      leads[index].status = status;
      localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
    }
  },
};
