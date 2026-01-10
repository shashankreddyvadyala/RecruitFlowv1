
import React from 'react';
import { LayoutDashboard, Users, Briefcase, Bot, Settings, Search, Gem, Building, UsersRound, History, Calendar, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { userRole, branding, interviews } = useStore();
  const isOwner = userRole === UserRole.Owner;

  const upcomingInterviews = interviews.filter(i => {
    const diff = new Date(i.startTime).getTime() - Date.now();
    return i.status === 'Scheduled' && diff > 0 && diff < 3600000; // Next hour
  }).length;

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    ...(isOwner ? [{ id: 'agency-os', label: 'Operations', icon: <Building size={20} /> }] : []),
    ...(isOwner ? [{ id: 'team', label: 'Team', icon: <UsersRound size={20} /> }] : []),
    { id: 'calendar', label: 'Interviews', icon: <Calendar size={20} />, badge: upcomingInterviews },
    { id: 'job-search', label: 'Job Search', icon: <Search size={20} /> },
    { id: 'talent-market', label: 'Talent Market', icon: <Gem size={20} /> },
    { id: 'jobs', label: 'Pipeline', icon: <Briefcase size={20} /> },
    { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
    { id: 'ai-agents', label: 'AI Agents', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-950 text-white flex flex-col h-screen sticky top-0 z-50 font-sans border-r border-white/5">
      <div className="p-8 border-b border-white/5 flex items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-brand-600/40 bg-brand-600 overflow-hidden shrink-0 border border-white/10">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="L" className="w-full h-full object-contain" />
          ) : (
            branding.companyName[0]
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black truncate uppercase tracking-tighter text-white">
            {branding.companyName}
          </h1>
          <p className="text-[9px] text-brand-400 font-black tracking-widest uppercase">Autonomous OS</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4">
        <div className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 opacity-50">Main Deck</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              currentView === item.id 
                ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
                <span className={`${currentView === item.id ? 'text-brand-400' : 'text-slate-500 group-hover:text-brand-400'} transition-colors`}>
                    {item.icon}
                </span>
                <span className="font-bold text-[11px] uppercase tracking-[0.1em]">{item.label}</span>
            </div>
            {item.badge ? (
                <span className="bg-brand-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-brand-600/30">
                    {item.badge}
                </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
        <button onClick={() => onChangeView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            currentView === 'settings' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:text-white'
        }`}>
          <Settings size={18} />
          <span className="font-bold text-[11px] uppercase tracking-widest">System Params</span>
        </button>

        <div className="mt-4 p-4 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] border border-white/5 shadow-inner group">
          <div className="flex items-center gap-3 mb-3">
             <div className="relative">
                <img src="https://picsum.photos/40/40?u=me" alt="Profile" className="w-9 h-9 rounded-xl border border-white/10 shadow-lg" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-sm"></div>
             </div>
             <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-[11px] font-black truncate uppercase tracking-tight text-white">Alex Morgan</p>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">{userRole}</p>
             </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-brand-500 w-3/4 shadow-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
