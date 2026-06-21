
import React, { useState } from 'react';
import { AppView, AdminSubView, User } from './types';
import { StorageService } from './services/storage';
import {
  LayoutDashboard,
  Home as HomeIcon,
  Users,
  Globe,
  LogOut,
  Menu,
  X,
  Plus,
  PhoneCall,
  BarChart3,
  CalendarCheck,
  Handshake,
  BookOpen,
  Zap,
  ClipboardList,
  Settings as SettingsIcon,
  Trello,
  MessageCircle,
} from 'lucide-react';

// Views
import DashboardView from './views/Dashboard';
import PropertyListView from './views/PropertyList';
import PropertyFormView from './views/PropertyForm';
import ClientListView from './views/ClientList';
import PublicSiteView from './views/PublicSite';
import SalesFunnelView from './views/SalesFunnel';
import SalesUnlockerView from './views/SalesUnlocker';
import ChecklistView from './views/Checklist';
import WhatsAppAgentView from './views/WhatsAppAgent';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('admin');
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const [user] = useState<User>(StorageService.getUser());

  const navigateToPropertyForm = (id: string | null = null) => {
    setEditingPropertyId(id);
    setAdminSubView('property-form');
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (adminSubView) {
      case 'dashboard': return <DashboardView onNavigateProperties={() => setAdminSubView('properties')} onNavigateLeads={() => setAdminSubView('clientes')} onNewProperty={() => navigateToPropertyForm()} />;
      case 'clientes': return <ClientListView />;
      case 'properties': return <PropertyListView onEditProperty={navigateToPropertyForm} onNewProperty={() => navigateToPropertyForm()} />;
      case 'property-form': return <PropertyFormView propertyId={editingPropertyId} onCancel={() => setAdminSubView('properties')} onSave={() => setAdminSubView('properties')} />;
      case 'funil': return <SalesFunnelView />;
      case 'destravador': return <SalesUnlockerView />;
      case 'checklist': return <ChecklistView />;
      case 'whatsapp-agent': return <WhatsAppAgentView />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <SettingsIcon className="w-12 h-12 mb-4 opacity-20" />
          <h2 className="text-xl font-bold">Módulo em Desenvolvimento</h2>
          <p>Esta funcionalidade estará disponível em breve.</p>
          <button onClick={() => setAdminSubView('dashboard')} className="mt-4 text-blue-400 font-bold hover:underline">Voltar ao Início</button>
        </div>
      );
    }
  };

  if (view === 'public') {
    return <PublicSiteView propertyId={selectedPropertyId} onBack={() => setView('admin')} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#1e293b] border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xl italic">V</span>
          </div>
          <span className="font-bold text-lg tracking-tight">VÉRTICE</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-slate-400" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50 w-72 bg-[#020617] border-r border-slate-800 p-4 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="text-white font-black text-2xl italic">V</span>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tighter leading-tight text-white">VÉRTICE</h1>
            <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest">CRM Imobiliário</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar pr-1">
          <SidebarGroup label="Operação">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={adminSubView === 'dashboard'} onClick={() => setAdminSubView('dashboard')} />
            <SidebarItem icon={<PhoneCall />} label="Atendimento Hoje" active={adminSubView === 'atendimento'} onClick={() => setAdminSubView('atendimento')} />
            <SidebarItem icon={<Users />} label="Clientes" active={adminSubView === 'clientes'} onClick={() => setAdminSubView('clientes')} />
            <SidebarItem icon={<Trello />} label="Funil de Vendas" active={adminSubView === 'funil'} onClick={() => setAdminSubView('funil')} />
            <SidebarItem icon={<CalendarCheck />} label="Follow-ups" active={adminSubView === 'followups'} onClick={() => setAdminSubView('followups')} />
          </SidebarGroup>

          <SidebarGroup label="Gestão">
            <SidebarItem icon={<HomeIcon />} label="Imóveis" active={adminSubView === 'properties' || adminSubView === 'property-form'} onClick={() => setAdminSubView('properties')} />
            <SidebarItem icon={<Handshake />} label="Parceiros" active={adminSubView === 'parceiros'} onClick={() => setAdminSubView('parceiros')} />
            <SidebarItem icon={<BarChart3 />} label="Relatórios" active={adminSubView === 'relatorios'} onClick={() => setAdminSubView('relatorios')} />
          </SidebarGroup>

          <SidebarGroup label="IA & Automação">
            <SidebarItem
              icon={<MessageCircle className="text-emerald-400" />}
              label="Agente WhatsApp"
              active={adminSubView === 'whatsapp-agent'}
              onClick={() => { setAdminSubView('whatsapp-agent'); setSidebarOpen(false); }}
            />
            <SidebarItem icon={<Zap className="text-yellow-400" />} label="Destravador de Vendas" active={adminSubView === 'destravador'} onClick={() => setAdminSubView('destravador')} />
          </SidebarGroup>

          <SidebarGroup label="Crescimento">
            <SidebarItem icon={<BookOpen />} label="Treinamento" active={adminSubView === 'treinamento'} onClick={() => setAdminSubView('treinamento')} />
            <SidebarItem icon={<ClipboardList />} label="Checklist de Documentos" active={adminSubView === 'checklist'} onClick={() => setAdminSubView('checklist')} />
          </SidebarGroup>

          <div className="pt-4 border-t border-slate-800">
            <SidebarItem icon={<Globe className="text-emerald-400" />} label="Meu Site" active={false} onClick={() => setView('public')} />
            <SidebarItem icon={<SettingsIcon />} label="Configurações" active={adminSubView === 'settings'} onClick={() => setAdminSubView('settings')} />
          </div>
        </nav>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700">
              {user.nome.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{user.nome}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{user.tipo}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors w-full px-4 py-2 text-sm font-bold">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const SidebarGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-6">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-4 mb-2">{label}</p>
    {children}
  </div>
);

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
    `}
  >
    <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`}>
      {icon}
    </span>
    <span className="font-semibold text-sm tracking-tight">{label}</span>
  </button>
);

export default App;
