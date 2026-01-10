
import React from 'react';
import { LayoutDashboard, Users, Briefcase, Bot, Settings, Search, Gem, Building, WalletCards, UsersRound } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { userRole, branding } = useStore();
  const isOwner = userRole === UserRole.Owner;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'crm', label: 'CRM & Deals', icon: <WalletCards size={20} /> },
    { id: 'agency-os', label: 'Agency Operations', icon: <Building size={20} /> },
    ...(isOwner ? [{ id: 'team', label: 'Team Tracker', icon: <UsersRound size={20} /> }] : []),
    { id: 'job-search', label: 'Job Search', icon: <Search size={20} /> },
    { id: 'talent-market', label: 'Talent Market', icon: <Gem size={20} /> },
    { id: 'jobs', label: 'Jobs & Pipeline', icon: <Briefcase size={20} /> },
    { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
    { id: 'ai-agents', label: 'AI Agents', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 z-50">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-600/20" style={{ backgroundColor: branding.primaryColor }}>
          {branding.companyName[0]}
        </div>
        <div>
          <h1 className="text-sm font-black truncate max-w-[140px] uppercase tracking-tighter">
            {branding.companyName}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest">OS v2.0</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id ? 'bg-brand-600 text-white translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            style={currentView === item.id ? { backgroundColor: branding.primaryColor } : {}}
          >
            {item.icon}
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={() => onChangeView('settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white">
          <Settings size={20} />
          <span className="font-semibold text-sm">Settings</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-3 mt-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <img src="https://picsum.photos/40/40?u=me" alt="Profile" className="w-8 h-8 rounded-full" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">Alex Morgan</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
