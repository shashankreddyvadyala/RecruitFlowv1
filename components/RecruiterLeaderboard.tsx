
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, RecruiterStats, Candidate, Activity } from '../types';
import { 
  Trophy, 
  Send, 
  Zap, 
  UserPlus, 
  Trash2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight, 
  TrendingUp, 
  CalendarDays, 
  Edit3, 
  Save,
  BarChart3,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  Timer,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Target,
  Layers,
  History,
  Briefcase,
  Users,
  Code2,
  Ban,
  Filter,
  MousePointer2,
  Cpu,
  FileText,
  Search,
  Download,
  AlertCircle,
  Clock,
  ArrowLeft,
  ChevronDown,
  User,
  MessageSquareText,
  MousePointerSquare,
  ShieldAlert,
  Fingerprint,
  Workflow,
  ExternalLink,
  MessageCircleCode,
  Scale,
  Mail,
  Bot
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ReportTab = 'overview' | 'talent' | 'market';

interface TeamManagementProps {
  onViewSubmissions?: (recruiterName: string) => void;
  onViewPipeline?: (recruiterName: string, status?: string) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ onViewSubmissions, onViewPipeline }) => {
  const { recruiterStats, userRole, addRecruiter, updateRecruiter, removeRecruiter, notify, activities, candidates } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<RecruiterStats | null>(null);
  const [selectedRecruiterReport, setSelectedRecruiterReport] = useState<RecruiterStats | null>(null);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [reportTab, setReportTab] = useState<ReportTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log Filtering State
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('All');

  const isOwner = userRole === UserRole.Owner;

  // Date Formatting Helper: MM-DD-YYYY
  const formatToMMDDYYYY = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const multipliers: Record<TimeRange, number> = {
    '1D': 0.1, '7D': 0.25, '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'ALL': 18
  };

  const calculatePerformanceScore = (stats: { placements: number, stageProgressions: number, applications: number }, range: TimeRange) => {
    const rawScore = (stats.placements * 50) + (stats.stageProgressions * 10) + (stats.applications * 2);
    const target = 1500 * multipliers[range];
    return Math.min(100, Math.round((rawScore / target) * 100));
  };

  const sortedRecruiters = useMemo(() => {
    const multiplier = multipliers[timeRange];
    return [...recruiterStats]
      .map(r => {
        const scaled = {
            ...r,
            placements: Math.round(r.placements * multiplier),
            applications: Math.round(r.applications * multiplier),
            stageProgressions: Math.round(r.stageProgressions * multiplier),
        };
        return { ...r, ...scaled, perfScore: calculatePerformanceScore(scaled, timeRange) };
      })
      .sort((a, b) => b.placements - a.placements); // Sorting by hires since score is removed
  }, [recruiterStats, timeRange]);

  const recruiterTalent = useMemo(() => {
    if (!selectedRecruiterReport) return [];
    return candidates.slice(0, 8).map((c, i) => ({
        ...c,
        status: i % 3 === 0 ? 'Interviewing' : i % 4 === 0 ? 'Rejected' : 'Applied',
        matchScore: 80 + Math.floor(Math.random() * 20),
        techStack: ['React', 'Node.js', 'AWS', 'PostgreSQL'].slice(0, 2 + (i % 3))
    }));
  }, [selectedRecruiterReport, candidates]);

  const filteredLogs = useMemo(() => {
    if (!selectedRecruiterReport) return [];
    const baseLogs = activities.filter(a => a.author.includes(selectedRecruiterReport.name.split(' ')[0]));
    
    const now = new Date();
    const filteredByTime = baseLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (timeRange) {
          case '1D': return diffDays <= 1;
          case '7D': return diffDays <= 7;
          case '1M': return diffDays <= 30;
          case '3M': return diffDays <= 90;
          case '6M': return diffDays <= 180;
          case '1Y': return diffDays <= 365;
          case 'ALL': return true;
          default: return true;
        }
    });

    return filteredByTime.filter(log => {
        const matchesSearch = log.subject.toLowerCase().includes(logSearch.toLowerCase()) || 
                             log.content.toLowerCase().includes(logSearch.toLowerCase());
        const matchesType = logTypeFilter === 'All' || log.type === logTypeFilter;
        return matchesSearch && matchesType;
    });
  }, [selectedRecruiterReport, activities, logSearch, logTypeFilter, timeRange]);

  const techGripData = [
    { name: 'React', val: 92, color: '#3b82f6' },
    { name: 'Python', val: 78, color: '#6366f1' },
    { name: 'Node.js', val: 65, color: '#10b981' },
    { name: 'AWS', val: 45, color: '#f59e0b' },
    { name: 'Go', val: 30, color: '#ef4444' },
  ];

  const handleAddRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setIsSubmitting(true);
    setTimeout(() => {
      addRecruiter({
        id: `rec_${Date.now()}`,
        name: newName,
        jobTitle: newRole || 'Technical Recruiter',
        avatarUrl: `https://picsum.photos/100/100?u=${encodeURIComponent(newName)}`,
        placements: 0, applications: 0, stageProgressions: 0, activityScore: 0, conversionRate: 0, activeJobs: 0
      });
      setIsSubmitting(false); setShowAddModal(false);
      notify("Recruiter Invited", `${newName} has been added to the team.`, "success");
    }, 800);
  };

  const handleDeleteRecruiter = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove recruiter ${name}? This action is permanent.`)) {
      removeRecruiter(id);
      notify("Recruiter Removed", `${name} was purged from agency cloud.`, "warning");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* LEADERBOARD HEADER */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck size={32} className="text-brand-600" />
              Recruiter Leaderboard
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
              Performance metrics: Hires • Movements • Submissions
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
            {isOwner && (
              <button onClick={() => setShowAddModal(true)} className="bg-brand-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/10 flex items-center gap-3">
                <UserPlus size={18} /> Provision Recruiter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recruiter</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Submission</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Pipeline Movement</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hires</th>
                {isOwner && <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecruiters.map((recruiter, idx) => (
                <tr key={recruiter.id} onClick={() => { setSelectedRecruiterReport(recruiter); setReportTab('overview'); }} className="hover:bg-brand-50/20 transition-all group cursor-pointer">
                  <td className="px-10 py-8 font-black text-slate-300 text-3xl tracking-tighter italic w-24">
                    {idx === 0 ? <span className="text-yellow-500 text-4xl italic">#1</span> : `#${idx + 1}`}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={recruiter.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-white shadow-xl object-cover group-hover:scale-105 transition-transform" alt="" />
                        {idx === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full border-2 border-white shadow-lg"><Trophy size={12} /></div>}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-1.5">{recruiter.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recruiter.jobTitle || 'Recruiter Node'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewSubmissions) onViewSubmissions(recruiter.name);
                      }}
                      className="flex flex-col items-center group/sub"
                    >
                       <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover/sub:text-brand-600 transition-colors underline decoration-slate-200 decoration-4 underline-offset-4 group-hover/sub:decoration-brand-500">{recruiter.applications}</span>
                       <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Submissions</p>
                    </button>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewPipeline) onViewPipeline(recruiter.name);
                      }}
                      className="flex flex-col items-center group/move"
                    >
                      <span className="text-2xl font-black tracking-tighter text-purple-600 group-hover/move:text-purple-700 transition-colors underline decoration-slate-200 decoration-4 underline-offset-4 group-hover/move:decoration-purple-400">{recruiter.stageProgressions}</span>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Movements</p>
                    </button>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewPipeline) onViewPipeline(recruiter.name, 'Hired');
                      }}
                      className="flex flex-col items-end group/hire"
                    >
                      <span className="text-3xl font-black text-emerald-600 tracking-tighter group-hover/hire:text-emerald-700 transition-colors underline decoration-slate-200 decoration-4 underline-offset-4 group-hover/hire:decoration-emerald-400">{recruiter.placements}</span>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Final Hires</p>
                    </button>
                  </td>
                  {isOwner && (
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); setEditingRecruiter(recruiter); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-brand-600 rounded-2xl shadow-sm transition-all hover:scale-110 active:scale-95" title="Edit Recruiter"><Edit3 size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRecruiter(e, recruiter.id, recruiter.name); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-2xl shadow-sm transition-all hover:scale-110 active:scale-95" title="Delete Recruiter"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTELLIGENCE REPORT DRAWER */}
      {selectedRecruiterReport && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedRecruiterReport(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* AUDIT LOG OVERLAY (FULL LOGS) */}
            {showFullLogs ? (
               <div className="absolute inset-0 z-[210] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-500">
                  <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-full bg-brand-600 opacity-10 blur-[60px] -mr-32"></div>
                      <div className="flex items-center gap-6 relative z-10">
                        <button onClick={() => setShowFullLogs(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Forensic Sync Ledger</h3>
                                <div className="px-3 py-1 bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-400">Time Window: {timeRange}</div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recruiter Identifier: {selectedRecruiterReport.name} • Protocol Level 4-A</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                         <button className="px-5 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-brand-600/20">
                             <Download size={16} /> Export Sync
                         </button>
                         <button onClick={() => setShowFullLogs(false)} className="p-3 bg-white/10 hover:bg-red-500 rounded-2xl transition-all border border-white/5">
                            <X size={20} />
                        </button>
                      </div>
                  </div>

                  <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                      <div className="flex gap-10">
                          <LogMetric label="Sync Density" value={`${filteredLogs.length}`} icon={<Fingerprint size={14}/>} />
                          <LogMetric label="Transmission Rate" value="94.2%" icon={<Send size={14}/>} />
                          <LogMetric label="Evaluation Bias" value="Neutral" icon={<Scale size={14}/>} />
                          <LogMetric label="Time To Sync" value="1.2s" icon={<Timer size={14}/>} />
                      </div>
                      
                      <div className="h-10 w-48 hidden md:block">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...Array(10)].map((_, i) => ({ v: Math.random() * 100 }))}>
                                <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 relative group w-full">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                          <input 
                            type="text" 
                            placeholder="Search by DNA Hash, Candidate Name, or Evaluation Reasoning..." 
                            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-sm transition-all"
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                          />
                      </div>
                      <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full no-scrollbar">
                        {['All', 'Email', 'JobShared', 'StatusChange', 'Note'].map(type => (
                            <button 
                                key={type} 
                                onClick={() => setLogTypeFilter(type)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${logTypeFilter === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                {type === 'JobShared' ? 'Submission' : type}
                            </button>
                        ))}
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                      {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                          <div key={log.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-brand-500 transition-all group/log relative overflow-hidden flex flex-col md:flex-row gap-10">
                              <div className="w-56 shrink-0 space-y-6">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover/log:scale-110 ${
                                          log.type === 'StatusChange' ? 'bg-emerald-500' :
                                          log.type === 'JobShared' ? 'bg-brand-600' : 'bg-slate-900'
                                      }`}>
                                          {log.type === 'Email' ? <Mail size={24} /> :
                                           log.type === 'StatusChange' ? <CheckCircle2 size={24} /> :
                                           log.type === 'JobShared' ? <Workflow size={24} /> : <FileText size={24} />}
                                      </div>
                                      <div>
                                          <p className="text-xl font-black text-slate-900 tracking-tighter">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                          {/* Standardized to MM-DD-YYYY */}
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatToMMDDYYYY(log.timestamp)}</p>
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border w-full ${
                                          log.type === 'JobShared' ? 'bg-brand-50 text-brand-600 border-brand-100' : 
                                          log.type === 'StatusChange' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          'bg-slate-50 text-slate-500 border-slate-200'
                                      }`}>
                                          <Zap size={12} className="fill-current" /> {log.type} Event
                                      </div>
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50/50 w-full text-slate-400">
                                          <ShieldCheck size={12} /> Encrypted Node
                                      </div>
                                  </div>
                              </div>

                              <div className="flex-1 min-w-0 space-y-6">
                                  <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2 group-hover/log:text-brand-600 transition-colors">{log.subject}</h4>
                                          <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                      <User size={14} className="text-slate-400" />
                                                  </div>
                                                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Candidate ID: TR-{log.entityId.slice(-6)}</span>
                                              </div>
                                              <div className="h-4 w-px bg-slate-200"></div>
                                              <div className="flex items-center gap-2">
                                                  <Target size={14} className="text-brand-400" />
                                                  <span className="text-[11px] font-black text-brand-600 uppercase tracking-widest">Mission Context: Node Sync</span>
                                              </div>
                                          </div>
                                      </div>
                                      <button className="p-3 bg-slate-50 hover:bg-brand-50 text-slate-300 hover:text-brand-600 rounded-2xl transition-all border border-transparent hover:border-brand-100">
                                          <ExternalLink size={18} />
                                      </button>
                                  </div>

                                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl relative shadow-inner group/reason">
                                      <div className="absolute top-4 right-4 text-slate-200 group-hover/reason:text-brand-200 transition-colors">
                                          <MessageCircleCode size={24} />
                                      </div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                          <Bot size={14} className="text-brand-500" /> Logic evaluation:
                                      </p>
                                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic pr-10">
                                          "{log.content}"
                                      </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                                      {['Evaluated Stack', 'High Precision', 'Verified DNA'].map(tag => (
                                          <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                              <Code2 size={10} /> {tag}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )) : (
                          <div className="py-40 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                              <AlertCircle size={80} className="text-slate-100 mx-auto mb-8" />
                              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">No activity segments captured</h3>
                              <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">System scan within the {timeRange} timeframe returned zero matching sync events. Adjust filters to broaden discovery.</p>
                          </div>
                      )}
                  </div>

                  <div className="p-8 border-t border-slate-200 bg-white">
                      <button onClick={() => setShowFullLogs(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                         Synchronize Full Audit History
                      </button>
                  </div>
               </div>
            ) : null}

            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <img src={selectedRecruiterReport.avatarUrl} className="w-20 h-20 rounded-[2rem] object-cover shadow-2xl border-4 border-white" />
                  <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedRecruiterReport.name}</h2>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Master Node</span>
                    </div>
                    <p className="text-brand-600 font-black text-[11px] uppercase tracking-widest mt-2">{selectedRecruiterReport.jobTitle} • Global Efficiency Metrics</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecruiterReport(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-10 border-b border-slate-200">
                  <ReportTabBtn active={reportTab === 'overview'} onClick={() => setReportTab('overview')} label="Intelligence Overview" icon={<BarChart3 size={16}/>} />
                  <ReportTabBtn active={reportTab === 'talent'} onClick={() => setReportTab('talent')} label="Managed Talent Portfolio" icon={<Users size={16}/>} />
                  <ReportTabBtn active={reportTab === 'market'} onClick={() => setReportTab('market')} label="Technology & Role Grip" icon={<Cpu size={16}/>} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-white">
              {reportTab === 'overview' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="grid grid-cols-4 gap-4">
                        <ReportStatNode icon={<Target size={16} />} label="Conversion" value={`${selectedRecruiterReport.conversionRate}%`} color="text-brand-600" />
                        <ReportStatNode icon={<Timer size={16} />} label="Velocity" value="12d" color="text-purple-600" />
                        <ReportStatNode icon={<Zap size={16} />} label="Sync Rate" value="High" color="text-emerald-600" />
                        <ReportStatNode icon={<Briefcase size={16} />} label="Missions" value={selectedRecruiterReport.activeJobs.toString()} color="text-slate-900" />
                    </div>

                    <section>
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <TrendingUp size={20} className="text-brand-600" /> Outcome Trajectory
                        </h4>
                        <div className="h-64 w-full bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 shadow-inner">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{ n: 'W1', v: 60 }, { n: 'W2', v: 75 }, { n: 'W3', v: 82 }, { n: 'W4', v: selectedRecruiterReport.perfScore }]}>
                                    <defs><linearGradient id="outcomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="n" hide /><YAxis hide domain={[0, 100]} />
                                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} labelStyle={{display: 'none'}} />
                                    <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={4} fill="url(#outcomeGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24"></div>
                        <div className="flex gap-6 items-center flex-1">
                            <div className="p-5 bg-white/5 border border-white/10 rounded-3xl shadow-sm text-brand-400">
                                <History size={32} />
                            </div>
                            <div>
                                <h5 className="text-xl font-black uppercase tracking-tight mb-2">Audit Synchronization</h5>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed italic pr-4">Review high-density activity logs and communication sequences between this recruiter and their talent graph.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowFullLogs(true)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 active:scale-95 whitespace-nowrap relative z-10">
                            Access Full Logs
                        </button>
                    </div>
                </div>
              )}

              {reportTab === 'talent' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><Users size={20} className="text-brand-600" /> Active Portfolio Ledger</h4>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">4 Interviewing</span>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {recruiterTalent.map((cand) => (
                            <div key={cand.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-brand-100 transition-all cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <img src={cand.avatarUrl} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white" />
                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center text-white text-[8px] font-black ${cand.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-brand-600'}`}>{cand.status[0]}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-black text-slate-900 uppercase tracking-tight text-base leading-none">{cand.firstName} {cand.lastName}</h5>
                                            <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{cand.matchScore}% Match</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {cand.techStack?.map(t => (
                                                <span key={t} className="text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-1.5 py-0.5 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Status Node</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${cand.status === 'Rejected' ? 'text-red-500' : 'text-slate-500'}`}>{cand.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {reportTab === 'market' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <section>
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><Code2 size={20} className="text-brand-600" /> Technology Grip Analysis</h4>
                        <div className="h-72 w-full bg-slate-950 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={techGripData} layout="vertical">
                                    <XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff'}} />
                                    <Bar dataKey="val" radius={[0, 12, 12, 0]} barSize={20}>{techGripData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-glow"><Target size={32} /></div>
                        <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Sector Specialization</h5>
                        <p className="text-xs text-slate-500 font-medium italic">High affinity detected for Cloud Infrastructure and Frontend UI Engineering roles.</p>
                    </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                <button onClick={() => setShowFullLogs(true)} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 transition-all active:scale-0.98 flex items-center justify-center gap-3">
                   <History size={18} /> Audit Sync Logs
                </button>
                <button onClick={() => setSelectedRecruiterReport(null)} className="px-8 py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg"><UserPlus size={20} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Provision Recruiter</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
             </div>
             <form onSubmit={handleAddRecruiter} className="p-8 space-y-6">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label><input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="e.g. Jordan Smith" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Role / Job Title</label><input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="e.g. Technical Sourcing Specialist" /></div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3">{isSubmitting ? 'Initializing...' : 'Confirm & Invite Recruiter'}</button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Modal (Simple version) */}
      {editingRecruiter && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Edit3 size={20} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Edit Recruiter</h3>
                </div>
                <button onClick={() => setEditingRecruiter(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={editingRecruiter.name} onChange={(e) => setEditingRecruiter({...editingRecruiter, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Role / Job Title</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={editingRecruiter.jobTitle || ''} onChange={(e) => setEditingRecruiter({...editingRecruiter, jobTitle: e.target.value})} />
                </div>
                <button onClick={() => { updateRecruiter(editingRecruiter.id, editingRecruiter); setEditingRecruiter(null); notify("Success", "Recruiter updated.", "success"); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3">Save Changes</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// COMPONENT HELPERS
const ReportTabBtn = ({ active, onClick, label, icon }: any) => (
    <button onClick={onClick} className={`pb-4 px-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
        {icon}{label}
    </button>
);

const ReportStatNode = ({ icon, label, value, color }: any) => (
    <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm group hover:shadow-md transition-all">
        <div className={`p-2 bg-slate-50 ${color} rounded-xl inline-flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
            {icon}
        </div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className={`text-xl font-black ${color} tracking-tighter`}>{value}</p>
    </div>
);

const LogMetric = ({ label, value, icon }: any) => (
    <div className="flex items-center gap-3">
        <div className="text-slate-300">{icon}</div>
        <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

export default TeamManagement;
