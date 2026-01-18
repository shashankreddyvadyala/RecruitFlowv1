
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Candidate, ApplicationHistory } from '../types';
import { 
  Zap, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Briefcase, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  History,
  ShieldCheck,
  Target,
  AlertCircle,
  TrendingUp,
  Workflow,
  Timer
} from 'lucide-react';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface PipelineNode {
    candidate: Candidate;
    application: ApplicationHistory;
}

const PipelineView: React.FC = () => {
  const { candidates, notify } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [searchQuery, setSearchQuery] = useState('');

  const allMovements = useMemo(() => {
    const nodes: PipelineNode[] = [];
    candidates.forEach(c => {
        if (c.applicationHistory) {
            c.applicationHistory.forEach(app => {
                nodes.push({ candidate: c, application: app });
            });
        }
    });
    return nodes;
  }, [candidates]);

  const filteredMovements = useMemo(() => {
    const now = new Date();
    
    return allMovements.filter(node => {
      // 1. Time Filter
      const moveDate = new Date(node.application.appliedDate);
      const diffMs = now.getTime() - moveDate.getTime();
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
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        node.candidate.firstName.toLowerCase().includes(searchStr) || 
        node.candidate.lastName.toLowerCase().includes(searchStr) ||
        node.application.jobTitle.toLowerCase().includes(searchStr) ||
        node.application.company.toLowerCase().includes(searchStr);

      return matchesTime && matchesSearch;
    }).sort((a, b) => new Date(b.application.appliedDate).getTime() - new Date(a.application.appliedDate).getTime());
  }, [allMovements, timeRange, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <Zap size={32} className="text-purple-600" />
              Operational Pipeline
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
              Velocity Index: {filteredMovements.length} Active Stage Progressions Detected
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

        {/* SEARCH BAR */}
        <div className="p-6 bg-white border-b border-slate-100">
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by candidate name, job title, or client entity..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold shadow-inner transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* PIPELINE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Node</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Entity</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Current Stage</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((node, idx) => (
                <tr key={`${node.candidate.id}-${idx}`} className="hover:bg-purple-50/20 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={node.candidate.avatarUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 text-white rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                            <Workflow size={10} />
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm mb-0.5">{node.candidate.firstName} {node.candidate.lastName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{node.candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                     <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{node.application.jobTitle}</p>
                     <p className="text-[9px] text-brand-600 font-black uppercase tracking-widest mt-1">{node.application.company}</p>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        node.application.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        node.application.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-purple-50 text-purple-600 border-purple-100 shadow-sm'
                    }`}>
                        <Timer size={12} /> {node.application.status}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-xs font-black text-slate-900 tracking-tight">{node.application.appliedDate}</p>
                      <button className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:underline mt-1 flex items-center gap-1">
                          View History <ChevronRight size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMovements.length === 0 && (
            <div className="py-32 text-center">
                <AlertCircle size={56} className="text-slate-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No pipeline movements captured</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Zero stage transitions detected in the {timeRange} window.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* PERFORMANCE INSIGHT FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard label="Sync Velocity" value="1.4 Days" trend="+12%" icon={<TrendingUp size={18}/>} />
          <InsightCard label="Average Resonance" value="88.4%" trend="Stable" icon={<ShieldCheck size={18}/>} />
          <InsightCard label="Success Ratio" value="1:12" trend="+4%" icon={<Target size={18}/>} />
      </div>
    </div>
  );
};

const InsightCard = ({ label, value, trend, icon }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
            </div>
        </div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
    </div>
);

export default PipelineView;
