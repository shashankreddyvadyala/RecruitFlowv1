
import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  User, 
  Search, 
  Filter, 
  Bot, 
  ArrowUpRight, 
  Clock,
  History,
  Zap,
  MoreVertical,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Activity } from '../types';

const AgencyActivityLog: React.FC = () => {
  const { activities, candidates } = useStore();
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      case 'Email': return <Mail size={16} />;
      case 'Call': return <Phone size={16} />;
      case 'Meeting': return <Calendar size={16} />;
      case 'Note': return <FileText size={16} />;
      case 'StageChange': return <CheckCircle2 size={16} />;
      default: return <User size={16} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-500';
      case 'Call': return 'bg-purple-500';
      case 'Meeting': return 'bg-orange-500';
      case 'Note': return 'bg-slate-500';
      case 'StageChange': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const filteredActivities = activities
    .filter(act => filterType === 'All' || act.type === filterType)
    .filter(act => 
        act.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        act.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getCandidateName = (id: string) => {
    const cand = candidates.find(c => c.id === id);
    return cand ? `${cand.firstName} ${cand.lastName}` : 'Unknown Candidate';
  };

  const activityTypes = ['All', 'Email', 'Call', 'Meeting', 'Note', 'StageChange'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
             <History size={32} className="text-brand-600" />
             Activity History
          </h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time recruitment activity log</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
                <p className="text-xl font-black text-slate-900">{activities.length}</p>
            </div>
            <div className="bg-brand-600 px-6 py-3 rounded-2xl shadow-xl shadow-brand-600/20 text-white">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Recruiter Actions</p>
                <p className="text-xl font-black">{activities.filter(a => !a.author.toLowerCase().includes('bot') && !a.author.toLowerCase().includes('ai')).length}</p>
            </div>
            <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/20 text-white">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">AI Actions</p>
                <p className="text-xl font-black">{activities.filter(a => a.author.toLowerCase().includes('bot') || a.author.toLowerCase().includes('ai')).length}</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
                type="text"
                placeholder="Search history..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {activityTypes.map(type => (
                <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                        filterType === type 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      <div className="relative space-y-6 pb-20">
        <div className="absolute left-[47px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>

        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, idx) => (
            <div key={activity.id} className="relative flex gap-8 group animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
               <div className="w-24 pt-2 text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                    {new Date(activity.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
               </div>

               <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 ${getColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>
                  {(activity.author.toLowerCase().includes('bot') || activity.author.toLowerCase().includes('ai')) && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 text-white rounded-lg flex items-center justify-center border-2 border-white shadow-sm" title="AI Action">
                       <Zap size={10} className="fill-brand-400 text-brand-400" />
                    </div>
                  )}
               </div>

               <div className="flex-1 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-100 transition-all group/card">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border border-slate-200">
                                {activity.type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                                <User size={12} className="text-brand-600" /> {activity.author}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">{activity.subject}</h4>
                     </div>
                     <button className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
                        <MoreVertical size={18} />
                     </button>
                  </div>
                  
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                    {activity.content}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                           <BriefcaseIcon size={14} />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Candidate</p>
                           <p className="text-xs font-black text-slate-900 tracking-tight uppercase">{getCandidateName(activity.entityId)}</p>
                        </div>
                     </div>
                     <button className="flex items-center gap-1 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:gap-2 transition-all">
                        View Profile <ArrowUpRight size={14} />
                     </button>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Clock size={32} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">No events found</h3>
             <p className="text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyActivityLog;
