
export type UserType = 'corretor' | 'imobiliaria';

export interface User {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  tipo: UserType;
  logo?: string;
}

export interface Photo {
  id: string;
  imovel_id: string;
  imagem: string;
  ordem: number;
  principal: boolean;
}

export type PropertyStatus = 'ativo' | 'inativo';

export interface Property {
  id: string;
  titulo: string;
  valor: number;
  bairro: string;
  cidade: string;
  tipo_imovel: string;
  metragem: number;
  dormitorios: number;
  banheiros: number;
  vagas: number;
  descricao: string;
  status: PropertyStatus;
  usuario_id: string;
}

export type LeadStatus = 'novo' | 'em atendimento' | 'visita' | 'proposta' | 'fechado' | 'perdido';
export type LeadOrigin = 'site' | 'whatsapp' | 'manual';

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  origem: LeadOrigin;
  imovel_id: string;
  status: LeadStatus;
  data_criacao: string;
}

export interface Task {
  id: string;
  lead_id: string;
  titulo: string;
  data: string;
  concluida: boolean;
}

export type AppView = 'admin' | 'public';
export type AdminSubView = 
  | 'dashboard' 
  | 'atendimento' 
  | 'clientes' 
  | 'funil' 
  | 'followups' 
  | 'properties' 
  | 'parceiros' 
  | 'relatorios' 
  | 'treinamento' 
  | 'destravador' 
  | 'checklist' 
  | 'settings'
  | 'property-form';
