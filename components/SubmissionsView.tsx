
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Activity, Candidate } from '../types';
import { 
  Send, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Briefcase, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowLeft, 
  Download, 
  History,
  ShieldCheck,
  Target,
  MoreVertical,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const SubmissionsView: React.FC = () => {
  const { activities, candidates, notify } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredSubmissions = useMemo(() => {
    const now = new Date();
    // Filter for 'JobShared' (Transmissions) or 'Email' type activities that represent submissions
    const submissionLogs = activities.filter(a => a.type === 'JobShared' || a.type === 'Email');

    return submissionLogs.filter(log => {
      // 1. Time Filter
      const logDate = new Date(log.timestamp);
      const diffMs = now.getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let matchesTime = true;
      switch (timeRange) {
        case '1D': matchesTime = diffDays <= 1; break;
        case '7D': matchesTime = diffDays <= 7; break;
        case '1M': matchesTime = diffDays <= 30; break;
        case '3M': matchesTime = diffDays <= 90; break;
        case '6M': matchesTime = diffDays <= 180; break;
        case '1Y': matchesTime = diffDays <= 365; break;
        case 'ALL': matchesTime = true; break;
      }

      // 2. Search Filter
      const matchesSearch = log.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           log.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.content.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTime && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, timeRange, searchQuery]);

  const getCandidate = (id: string) => candidates.find(c => c.id === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <Send size={32} className="text-brand-600" />
              Submission Ledger
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
              Forensic application tracking • {filteredSubmissions.length} active transmissions
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {(['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((opt) => (
                    <button 
                      key={opt} 
                      onClick={() => setTimeRange(opt)} 
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === opt ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {opt}
                    </button>
                ))}
            </div>
            <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 rounded-xl transition-all shadow-sm">
                <Download size={18} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Filter by candidate, recruiter, or mission profile..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <select className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500 shadow-inner">
                    <option>All Types</option>
                    <option>Direct Share</option>
                    <option>AI Outreach</option>
                </select>
            </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmission Node</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate Target</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recruiter / Author</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((log) => {
                const cand = getCandidate(log.entityId);
                return (
                  <tr key={log.id} className="hover:bg-brand-50/20 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <History size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight text-sm mb-1">{log.subject}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {cand ? (
                        <div className="flex items-center gap-3">
                          <img src={cand.avatarUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm" />
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{cand.firstName} {cand.lastName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cand.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Unknown Node</span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.author}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex flex-col items-end gap-1">
                          <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            log.type === 'JobShared' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'
                          }`}>
                            {log.type === 'JobShared' ? 'Synced' : 'Transmitted'}
                          </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSubmissions.length === 0 && (
            <div className="py-32 text-center">
                <AlertCircle size={56} className="text-slate-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No submissions captured</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Zero synchronization events detected in the {timeRange} window.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsView;
