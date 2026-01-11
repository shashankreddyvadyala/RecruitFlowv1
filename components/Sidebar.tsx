
import React from 'react';
import { LayoutDashboard, Users, Briefcase, Bot, Settings, Search, Gem, Building, UsersRound, Calendar } from 'lucide-react';
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
    return i.status === 'Scheduled' && diff > 0 && diff < 3600000;
  }).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ...(isOwner ? [{ id: 'agency-os', label: 'Performance', icon: <Building size={20} /> }] : []),
    ...(isOwner ? [{ id: 'team', label: 'My Team', icon: <UsersRound size={20} /> }] : []),
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} />, badge: upcomingInterviews },
    { id: 'job-search', label: 'Find Jobs', icon: <Search size={20} /> },
    { id: 'talent-market', label: 'Match Talent', icon: <Gem size={20} /> },
    { id: 'jobs', label: 'Job Orders', icon: <Briefcase size={20} /> },
    { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
    { id: 'ai-agents', label: 'AI Settings', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-950 text-white flex flex-col h-screen sticky top-0 z-50 border-r border-white/5">
      <div className="p-8 border-b border-white/5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-600 text-white font-black text-xl shadow-lg shrink-0">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="L" className="w-full h-full object-contain" />
          ) : (
            branding.companyName[0]
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold truncate uppercase tracking-tight text-white">
            {branding.companyName}
          </h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Platform</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
        <div className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
                <span className={`${currentView === item.id ? 'text-white' : 'text-slate-500'}`}>
                    {item.icon}
                </span>
                <span className="font-bold text-xs">{item.label}</span>
            </div>
            {item.badge ? (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button onClick={() => onChangeView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentView === 'settings' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'
        }`}>
          <Settings size={18} />
          <span className="font-bold text-xs">Settings</span>
        </button>

        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
             <img src="https://picsum.photos/40/40?u=me" alt="Profile" className="w-8 h-8 rounded-lg" />
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-white">Alex Morgan</p>
                <p className="text-[9px] text-slate-500 font-medium uppercase truncate">{userRole}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
