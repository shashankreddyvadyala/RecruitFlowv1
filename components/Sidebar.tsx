
import React from 'react';
import { LayoutDashboard, Users, Briefcase, Bot, Settings, Search, Gem, Building, UsersRound, History, Calendar } from 'lucide-react';
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
    ...(isOwner ? [{ id: 'agency-os', label: 'Operations', icon: <Building size={20} /> }] : []),
    ...(isOwner ? [{ id: 'team', label: 'Team Tracker', icon: <UsersRound size={20} /> }] : []),
    ...(isOwner ? [{ id: 'activity-log', label: 'Activity Log', icon: <History size={20} /> }] : []),
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'job-search', label: 'Job Search', icon: <Search size={20} /> },
    { id: 'talent-market', label: 'Talent Market', icon: <Gem size={20} /> },
    { id: 'jobs', label: 'Jobs & Pipeline', icon: <Briefcase size={20} /> },
    { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
    { id: 'ai-agents', label: 'AI Agents', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 z-50 font-sans">
      <div className="p-8 border-b border-slate-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-600/20 bg-brand-600 overflow-hidden shrink-0">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="L" className="w-full h-full object-contain" />
          ) : (
            branding.companyName[0]
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black truncate uppercase tracking-tighter">
            {branding.companyName}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">OS v2.0</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
              currentView === item.id ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={() => onChangeView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            currentView === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}>
          <Settings size={20} />
          <span className="font-bold text-xs uppercase tracking-widest">Settings</span>
        </button>
        <div className="flex items-center gap-3 p-4 mt-4 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
          <img src="https://picsum.photos/40/40?u=me" alt="Profile" className="w-8 h-8 rounded-xl" />
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-xs font-black truncate uppercase tracking-tight">Alex Morgan</p>
            <p className="text-[9px] text-brand-400 font-black uppercase tracking-widest truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
