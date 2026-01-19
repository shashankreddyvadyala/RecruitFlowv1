
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Activity, Candidate, ApplicationHistory, ExternalJob } from '../types';
import ActivityTimeline from './ActivityTimeline';
import { 
  Send, 
  Zap, 
  Search, 
  Download, 
  History, 
  Workflow, 
  Timer, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  ChevronRight,
  User,
  Clock,
  Briefcase,
  X,
  FileText,
  MapPin,
  DollarSign,
  Globe,
  Layout,
  Users,
  ArrowRight,
  CheckCircle2,
  Award,
  Star,
  Mail,
  ShieldAlert,
  Scale,
  ChevronDown,
  ChevronUp,
  Cpu,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ViewTab = 'submissions' | 'pipeline';

interface TransmissionCenterProps {
  initialTab?: ViewTab;
  initialRecruiterFilter?: string | null;
}

interface PipelineNode {
    candidate: Candidate;
    application: ApplicationHistory;
}

interface SubmissionNode {
    id: string;
    candidate: Candidate;
    job: ExternalJob;
    recruiter: string;
    timestamp: string;
    type: string;
}

const TransmissionCenter: React.FC<TransmissionCenterProps> = ({ initialTab = 'submissions', initialRecruiterFilter }) => {
  const { activities, candidates, externalJobs, recruiterStats } = useStore();
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer States
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidateTimelineId, setSelectedCandidateTimelineId] = useState<string | null>(null);
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);

  // Apply initial filter if passed from team view
  useEffect(() => {
    setActiveTab(initialTab);
    if (initialRecruiterFilter) {
      setSearchQuery(initialRecruiterFilter);
    }
  }, [initialTab, initialRecruiterFilter]);

  // Date Formatting Helper: MM-DD-YYYY
  const formatToMMDDYYYY = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  // --- DATA PROCESSING: SUBMISSIONS ---
  const resolvedSubmissions = useMemo(() => {
    const nodes: SubmissionNode[] = [];
    
    candidates.forEach(cand => {
        if (cand.sharedJobIds) {
            cand.sharedJobIds.forEach(jobId => {
                const job = externalJobs.find(j => j.id === jobId);
                if (job) {
                    const sharedActivity = activities.find(a => a.entityId === cand.id && a.type === 'JobShared');
                    nodes.push({
                        id: `${cand.id}-${job.id}`,
                        candidate: cand,
                        job: job,
                        recruiter: sharedActivity?.author || cand.assignedRecruiter || 'System Bot',
                        timestamp: sharedActivity?.timestamp || cand.lastActivity || new Date().toISOString(),
                        type: 'Transmission'
                    });
                }
            });
        }
    });

    return nodes.filter(node => {
        const now = new Date();
        const nodeDate = new Date(node.timestamp);
        const diffDays = (now.getTime() - nodeDate.getTime()) / (1000 * 60 * 60 * 24);
        
        let matchesTime = true;
        if (timeRange !== 'ALL') {
            switch (timeRange) {
                case '1D': matchesTime = diffDays <= 1; break;
                case '7D': matchesTime = diffDays <= 7; break;
                case '1M': matchesTime = diffDays <= 30; break;
                case '3M': matchesTime = diffDays <= 90; break;
                case '6M': matchesTime = diffDays <= 180; break;
                case '1Y': matchesTime = diffDays <= 365; break;
            }
        }

        const searchStr = searchQuery.toLowerCase();
        const matchesSearch = 
            node.candidate.firstName.toLowerCase().includes(searchStr) || 
            node.candidate.lastName.toLowerCase().includes(searchStr) ||
            node.job.title.toLowerCase().includes(searchStr) ||
            node.job.company.toLowerCase().includes(searchStr) ||
            node.recruiter.toLowerCase().includes(searchStr);

        return matchesTime && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [candidates, externalJobs, activities, timeRange, searchQuery]);

  // --- DATA PROCESSING: PIPELINE ---
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const nodes: PipelineNode[] = [];
    candidates.forEach(c => {
        if (c.applicationHistory) {
            c.applicationHistory.forEach(app => {
                nodes.push({ candidate: c, application: app });
            });
        }
    });
    
    return nodes.filter(node => {
      const moveDate = new Date(node.application.appliedDate);
      const diffDays = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);

      let matchesTime = true;
      if (timeRange !== 'ALL') {
        switch (timeRange) {
          case '1D': matchesTime = diffDays <= 1; break;
          case '7D': matchesTime = diffDays <= 7; break;
          case '1M': matchesTime = diffDays <= 30; break;
          case '3M': matchesTime = diffDays <= 90; break;
          case '6M': matchesTime = diffDays <= 180; break;
          case '1Y': matchesTime = diffDays <= 365; break;
        }
      }

      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        node.candidate.firstName.toLowerCase().includes(searchStr) || 
        node.candidate.lastName.toLowerCase().includes(searchStr) ||
        node.application.jobTitle.toLowerCase().includes(searchStr) ||
        node.application.company.toLowerCase().includes(searchStr) ||
        node.application.status.toLowerCase().includes(searchStr) || // Included status matching
        (node.candidate.assignedRecruiter && node.candidate.assignedRecruiter.toLowerCase().includes(searchStr));

      return matchesTime && matchesSearch;
    }).sort((a, b) => new Date(b.application.appliedDate).getTime() - new Date(a.application.appliedDate).getTime());
  }, [candidates, timeRange, searchQuery]);

  const getRecruiterAvatar = (name?: string) => {
    if (!name) return null;
    const rec = recruiterStats.find(r => r.name === name);
    return rec?.avatarUrl || `https://picsum.photos/40/40?u=${encodeURIComponent(name)}`;
  };

  const activeJob = useMemo(() => externalJobs.find(j => j.id === selectedJobId), [selectedJobId, externalJobs]);
  const activeTimelineCandidate = useMemo(() => candidates.find(c => c.id === selectedCandidateTimelineId), [selectedCandidateTimelineId, candidates]);
  const candidateActivities = useMemo(() => activities.filter(a => a.entityId === selectedCandidateTimelineId), [selectedCandidateTimelineId, activities]);
  
  // Find all talent applied to this job for the drawer
  const talentForActiveJob = useMemo(() => {
    if (!selectedJobId || !activeJob) return [];
    
    return candidates.filter(c => 
        c.sharedJobIds?.includes(selectedJobId) || 
        c.applicationHistory?.some(app => app.jobTitle === activeJob.title && app.company === activeJob.company)
    ).map(c => {
        const app = c.applicationHistory?.find(a => a.jobTitle === activeJob.title);
        return {
            candidate: c,
            status: app?.status || 'Shared',
            date: app?.appliedDate || c.lastActivity || 'Recent'
        };
    });
  }, [selectedJobId, activeJob, candidates]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      {/* GLOBAL CONTROL PLANE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              {activeTab === 'submissions' ? <Send size={32} className="text-brand-600" /> : <Zap size={32} className="text-purple-600" />}
              Submission & Pipeline
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
              Forensic Operational Hub • {activeTab === 'submissions' ? resolvedSubmissions.length : filteredMovements.length} Active Nodes
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

        {/* TAB SWITCHER */}
        <div className="flex bg-white border-b border-slate-100">
           <button 
             onClick={() => setActiveTab('submissions')}
             className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'submissions' ? 'text-brand-600 border-brand-600 bg-brand-50/20' : 'text-slate-400 border-transparent hover:bg-slate-50'}`}
           >
             <span className="flex items-center gap-2">Submissions <Send size={14} /></span>
           </button>
           <button 
             onClick={() => setActiveTab('pipeline')}
             className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'pipeline' ? 'text-purple-600 border-purple-600 bg-purple-50/20' : 'text-slate-400 border-transparent hover:bg-slate-50'}`}
           >
             <span className="flex items-center gap-2">Pipeline Movements <Zap size={14} /></span>
           </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'submissions' ? "Search candidates, recruiters, or mission profiles..." : "Search candidates, roles, or client entities..."}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Clear Filters
              </button>
            )}
        </div>

        {/* LEDGER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {activeTab === 'submissions' ? 'CANDIDATE TARGET' : 'CANDIDATE TARGET'}
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  MISSION / JOB INFO
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  RECRUITER
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                  {activeTab === 'submissions' ? 'Event Status' : 'Current Stage'}
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'submissions' ? (
                resolvedSubmissions.map((node) => {
                  return (
                    <tr key={node.id} className="hover:bg-brand-50/20 transition-all group">
                      <td className="px-10 py-6">
                        <button onClick={() => setSelectedCandidateTimelineId(node.candidate.id)} className="flex items-center gap-3 text-left">
                          <img src={node.candidate.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-brand-600 transition-colors">{node.candidate.firstName} {node.candidate.lastName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{node.candidate.role}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-10 py-6">
                        <button 
                            onClick={() => setSelectedJobId(node.job.id)}
                            className="text-left group/btn"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform shrink-0">
                                    <Layout size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 uppercase tracking-tight text-xs mb-0.5 group-hover/btn:text-brand-600 transition-colors truncate">{node.job.title}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{node.job.company}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            <MapPin size={8} className="text-brand-500" /> {node.job.location}
                                        </span>
                                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            <Globe size={8} className="text-brand-500" /> {node.job.type}
                                        </span>
                                        {node.job.salary && (
                                            <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                <DollarSign size={8} /> {node.job.salary}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-3">
                            <img src={getRecruiterAvatar(node.recruiter) || `https://picsum.photos/40/40?u=${node.id}`} className="w-6 h-6 rounded-lg border border-slate-200 object-cover" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{node.recruiter}</span>
                         </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-brand-100 bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-widest">
                             <CheckCircle2 size={10} /> {node.type}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <p className="text-xs font-black text-slate-900 tracking-tight">{formatToMMDDYYYY(node.timestamp)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(node.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredMovements.map((node, idx) => {
                  const matchedJob = externalJobs.find(ej => 
                    ej.title.toLowerCase().trim() === node.application.jobTitle.toLowerCase().trim() && 
                    ej.company.toLowerCase().trim() === node.application.company.toLowerCase().trim()
                  );
                  return (
                    <tr key={`${node.candidate.id}-${idx}`} className="hover:bg-purple-50/20 transition-all group">
                      <td className="px-10 py-6">
                        <button onClick={() => setSelectedCandidateTimelineId(node.candidate.id)} className="flex items-center gap-3 text-left">
                          <img src={node.candidate.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-purple-600 transition-colors">{node.candidate.firstName} {node.candidate.lastName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{node.candidate.role}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-10 py-6">
                          <button 
                              onClick={() => {
                                  if (matchedJob) setSelectedJobId(matchedJob.id);
                              }}
                              className="text-left group/btn"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform shrink-0">
                                      <Zap size={18} />
                                  </div>
                                  <div className="min-w-0">
                                      <p className="font-black text-slate-900 uppercase tracking-tight text-xs mb-0.5 group-hover/btn:text-brand-600 transition-colors truncate">{node.application.jobTitle}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{node.application.company}</p>
                                      <div className="flex flex-wrap gap-2">
                                          <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                              <MapPin size={8} className="text-brand-500" /> {matchedJob?.location || 'Remote/Global'}
                                          </span>
                                          <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                              <Globe size={8} className="text-brand-500" /> {matchedJob?.type || 'Full-time'}
                                          </span>
                                          {(matchedJob?.salary || 'Market Rate') && (
                                              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                  <DollarSign size={8} /> {matchedJob?.salary || '$140k - $210k'}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </button>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                            <img src={getRecruiterAvatar(node.candidate.assignedRecruiter) || `https://picsum.photos/40/40?u=${node.candidate.id}`} className="w-6 h-6 rounded-lg border border-slate-200 object-cover" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{node.candidate.assignedRecruiter || 'Unassigned'}</span>
                        </div>
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
                        <p className="text-xs font-black text-slate-900 tracking-tight">{formatToMMDDYYYY(node.application.appliedDate)}</p>
                        <button onClick={() => setSelectedCandidateTimelineId(node.candidate.id)} className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:underline mt-1">View Timeline</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {((activeTab === 'submissions' && resolvedSubmissions.length === 0) || (activeTab === 'pipeline' && filteredMovements.length === 0)) && (
            <div className="py-32 text-center">
                <AlertCircle size={56} className="text-slate-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No data captured</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Adjust filters for the {timeRange} window.</p>
            </div>
          )}
        </div>
      </div>

      {/* JOB INTELLIGENCE DRAWER */}
      {activeJob && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => { setSelectedJobId(null); setIsBriefExpanded(false); }}></div>
          <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl">
                  {activeJob.company[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{activeJob.title}</h2>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{activeJob.company}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeJob.location}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedJobId(null); setIsBriefExpanded(false); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Layers size={18} className="text-brand-600" /> Mission Intelligence
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <DrawerInfoCard icon={<Globe size={16}/>} label="Work Protocol" value={activeJob.type} />
                      <DrawerInfoCard icon={<DollarSign size={16}/>} label="Compensation" value={activeJob.salary || '$140k - $210k Target'} />
                      <DrawerInfoCard icon={<MapPin size={16}/>} label="Deployment" value={activeJob.location} />
                      <DrawerInfoCard icon={<Clock size={16}/>} label="Market Entry" value={activeJob.postedAt} />
                      <DrawerInfoCard icon={<ShieldCheck size={16}/>} label="Visa Policy" value={activeJob.visaSponsorship ? 'Sponsorship Enabled' : 'Native Candidates Only'} />
                      <DrawerInfoCard icon={<Cpu size={16}/>} label="Source Node" value={activeJob.source} />
                  </div>
              </section>

              <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <FileText size={18} className="text-brand-600" /> Mission Brief
                    </h4>
                    <button 
                        onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                        className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                    >
                        {isBriefExpanded ? <><ChevronUp size={14}/> View Less</> : <><ChevronDown size={14}/> View Full Requirement</>}
                    </button>
                  </div>
                  
                  <div className={`bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 relative overflow-hidden shadow-inner ${isBriefExpanded ? 'max-h-[1000px]' : 'max-h-[200px]'}`}>
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                            "Live detection for a high-priority {activeJob.title} mission at {activeJob.company}. The target node is responsible for architecting scalable frontend environments and optimizing latency across distributed clusters."
                        </p>
                        
                        {isBriefExpanded && (
                            <div className="pt-6 border-t border-slate-200 mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <Terminal size={14} className="text-brand-500" /> Technical Specification
                                    </h4>
                                    <ul className="grid grid-cols-1 gap-2">
                                        {['Advanced React & Next.js orchestration', 'Cloud-native infrastructure (AWS/Vercel)', 'Real-time state synchronization nodes', 'High-fidelity UI/UX component systems'].map((spec, i) => (
                                            <li key={i} className="flex items-start gap-3 text-xs text-slate-500 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                                                {spec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-500" /> Role Responsibilities
                                    </h5>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Candidate must drive technical vision for the {activeJob.company} core product line. This includes leading code reviews, implementing autonomous CI/CD pipelines, and collaborating with cross-functional nodes for rapid deployment cycles in the {activeJob.location} region.
                                    </p>
                                </div>
                                
                                <div className="p-4 bg-white/50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recruiter Note:</p>
                                    <p className="text-xs text-slate-600 font-medium mt-1">"Market resonance for this role is currently high. Priority given to staff-level engineering profiles with proven scale experience."</p>
                                </div>
                            </div>
                        )}
                      </div>
                      
                      {!isBriefExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                      )}
                  </div>
              </section>

              <section>
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Users size={18} className="text-brand-600" /> Collective Submissions
                    </h4>
                    <span className="bg-brand-50 text-brand-600 text-[10px] font-black px-3 py-1 rounded-full border border-brand-100 uppercase tracking-widest">
                        {talentForActiveJob.length} Total Applied
                    </span>
                  </div>

                  <div className="space-y-4">
                      {talentForActiveJob.length > 0 ? talentForActiveJob.map(({ candidate, status, date }) => (
                          <div key={candidate.id} onClick={() => { setSelectedJobId(null); setSelectedCandidateTimelineId(candidate.id); setIsBriefExpanded(false); }} className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-brand-100 transition-all cursor-pointer">
                              <div className="flex items-center gap-6">
                                  <img src={candidate.avatarUrl} className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white" />
                                  <div>
                                      <p className="font-black text-slate-900 uppercase tracking-tight text-base leading-none mb-1 group-hover:text-brand-600 transition-colors">
                                          {candidate.firstName} {candidate.lastName}
                                      </p>
                                      <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{candidate.assignedRecruiter || 'Unassigned'}</span>
                                          <span className="text-slate-200">•</span>
                                          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{candidate.matchScore}% Match</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mb-1 ${
                                      status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                      'bg-brand-50 text-brand-600 border-brand-100'
                                  }`}>
                                      {status}
                                  </div>
                                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Actioned: {formatToMMDDYYYY(date)}</p>
                              </div>
                          </div>
                      )) : (
                          <div className="p-20 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                              <Target size={40} className="text-slate-100 mx-auto mb-4" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No submission nodes detected for this role.</p>
                          </div>
                      )}
                  </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-3">
                    View Complete Job Listing <ArrowRight size={16} />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE INFO & TIMELINE DRAWER */}
      {activeTimelineCandidate && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedCandidateTimelineId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="relative">
                    <img src={activeTimelineCandidate.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-white shadow-2xl" />
                    {activeTimelineCandidate.isOpenToWork && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white"><Star size={10} className="fill-white text-white"/></div>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{activeTimelineCandidate.firstName} {activeTimelineCandidate.lastName}</h2>
                  <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black bg-brand-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">{activeTimelineCandidate.matchScore}% Resonance</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeTimelineCandidate.role}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCandidateTimelineId(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              {/* ALIGNMENT DATA */}
              <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Target size={18} className="text-brand-600" /> Market Alignment Node
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <DrawerInfoCard icon={<DollarSign size={16}/>} label="Comp Expectation" value={activeTimelineCandidate.salaryExpectation || '$150k+ Floor'} />
                      <DrawerInfoCard icon={<Globe size={16}/>} label="Work Mode" value={activeTimelineCandidate.workMode || 'Remote Preferred'} />
                      <DrawerInfoCard icon={<Award size={16}/>} label="Market Seniority" value={`${activeTimelineCandidate.skills?.[0]?.years || 5}+ Years`} />
                      <DrawerInfoCard icon={<ShieldCheck size={16}/>} label="Work Auth" value={activeTimelineCandidate.workAuthorization || 'Authorized'} />
                  </div>
              </section>

              {/* TIMELINE */}
              <section>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                      <History size={18} className="text-brand-600" /> Operational Sync History
                  </h4>
                  <ActivityTimeline activities={candidateActivities} />
              </section>

              {/* AI SUMMARY BRIEF */}
              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                      <h4 className="text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                          <Zap size={14} /> AI Resonance Synthesis
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                          "Candidate shows high affinity for distributed architectural nodes. Recent {candidateActivities.length} sync events indicate strong engagement with current mission payload."
                      </p>
                  </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
                <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-3">
                    View Full Intelligence Profile <ArrowRight size={16} />
                </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PERFORMANCE INSIGHT FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard label="Sync Velocity" value="1.4 Days" trend="+12%" icon={<TrendingUp size={18}/>} color="text-purple-600" />
          <InsightCard label="Submission Rate" value="94.2%" trend="Stable" icon={<ShieldCheck size={18}/>} color="text-brand-600" />
          <InsightCard label="Success Ratio" value="1:12" trend="+4%" icon={<Target size={18}/>} color="text-emerald-600" />
      </div>
    </div>
  );
};

const DrawerInfoCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 mb-2">
            {icon}
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</span>
        </div>
        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{value}</p>
    </div>
);

const InsightCard = ({ label, value, trend, icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
            </div>
        </div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
    </div>
);

export default TransmissionCenter;
