import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  FileText, 
  LogOut, 
  Bell,
  Search,
  Zap,
  Star,
  Video,
  ExternalLink,
  MapPin,
  MessageSquare,
  DollarSign,
  Timer,
  Save,
  Globe,
  TrendingUp,
  BrainCircuit,
  Target,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck, 
  ChevronDown,
  Info, 
  Sparkles,
  Layout,
  Send,
  Loader2,
  FileCheck,
  BarChart4,
  Layers,
  X,
  Fingerprint,
  Languages,
  EyeOff,
  Activity as ActivityIcon,
  Award,
  Rocket,
  Lock,
  ArrowLeft,
  Copy,
  Upload,
  Plus,
  Share2,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Trophy,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  History,
  ChevronLeft,
  List,
  LayoutGrid,
  PhoneCall,
  CalendarCheck,
  Settings2,
  Undo2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, ExternalJob, Candidate, CandidateApplication, Interview } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

type TimeRangeFilter = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ViewMode = 'Grid' | 'Agenda';

interface AdvancedFilters {
    type: string[];
    workMode: string[];
    salaryMin: string;
}

const TIMEZONES = [
  { label: 'My Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: 'UTC', value: 'UTC' },
  { label: 'Pacific Time', value: 'America/Los_Angeles' },
  { label: 'Eastern Time', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity, respondToJobFeedback, addInterview } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings' | 'calendar'>('dashboard');
  const [jobFilter, setJobFilter] = useState<'all' | 'recruiter' | 'ai'>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [appHistoryFilter, setAppHistoryFilter] = useState<TimeRangeFilter>('ALL');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    salaryMin: ''
  });

  // Calendar States
  const [viewMode, setViewMode] = useState<ViewMode>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  const myInterviews = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return interviews
      .filter(i => i.candidateId === myData.id)
      .filter(i => {
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;
        if (timeRange === 'ALL') return true;
        const startTime = new Date(i.startTime);
        const diffDays = (startTime.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24);
        switch (timeRange) {
          case '1D': return diffDays >= 0 && diffDays < 1;
          case '7D': return diffDays >= 0 && diffDays < 7;
          case '1M': return diffDays >= 0 && diffDays < 30;
          default: return true;
        }
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, myData.id, statusFilter, timeRange]);

  const upcomingCount = interviews.filter(i => i.candidateId === myData.id && i.status === 'Scheduled' && new Date(i.startTime) > new Date()).length;

  const [editSkills, setEditSkills] = useState<Skill[]>(myData.skills || []);
  const [editExperience, setEditExperience] = useState(myData.yearsOfExperience?.toString() || '0');
  const [editEducation, setEditEducation] = useState<Education[]>(myData.education || []);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Fix: Added missing handleStartTailoring function to trigger AI generation of application materials
  const handleStartTailoring = async (job: any) => {
    setSelectedJobForTailoring(job);
    setIsTailoring(true);
    setTailoredMaterials(null);
    try {
      const mat = await generateApplicationMaterials(myData, job.title, job.company);
      setTailoredMaterials(mat);
      notify("AI Ready", "Tailored materials generated for this role.", "success");
    } catch (e) {
      console.error(e);
      notify("Error", "Failed to tailor materials. Check API Key.", "error");
    } finally {
      setIsTailoring(false);
    }
  };

  const profileCompleteness = 74;
  const [isOpenToWork, setIsOpenToWork] = useState(myData.isOpenToWork || false);
  
  const [previewResume, setPreviewResume] = useState<ResumeFile | null>(null);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, date: null });
    for (let i = 1; i <= lastDate; i++) days.push({ day: i, date: new Date(year, month, i) });
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const formatTime = (isoString: string, tz: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: true }).format(new Date(isoString));
    } catch { return "N/A"; }
  };

  const formatDate = (isoString: string, tz: string) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz }).format(new Date(isoString));
  };

  const toggleFilter = (category: keyof AdvancedFilters, value: string) => {
    setFilters(prev => {
        if (category === 'salaryMin') return { ...prev, salaryMin: value };
        const current = prev[category] as string[];
        const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ type: [], workMode: [], salaryMin: '' });
    setJobSearch('');
    setJobFilter('all');
  };

  const sharedJobs = useMemo(() => {
      if (!myData.sharedJobIds) return [];
      return externalJobs
        .filter(j => myData.sharedJobIds!.includes(j.id))
        .filter(j => !myData.rejectedJobIds?.includes(j.id))
        .map(j => ({ ...j, matchScore: 96, source: 'recruiter' as const, isLiked: myData.likedJobIds?.includes(j.id) }));
  }, [myData.sharedJobIds, myData.likedJobIds, myData.rejectedJobIds, externalJobs]);

  const recommendedJobs = useMemo(() => {
    return externalJobs
      .filter(j => !myData.sharedJobIds?.includes(j.id))
      .filter(j => !myData.rejectedJobIds?.includes(j.id))
      .map(j => ({ ...j, matchScore: 88, source: 'ai' as const, isLiked: myData.likedJobIds?.includes(j.id) }));
  }, [externalJobs, myData.sharedJobIds, myData.likedJobIds, myData.rejectedJobIds]);

  const allJobs = useMemo(() => {
    const combined = [...sharedJobs, ...recommendedJobs];
    return combined.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) || job.company.toLowerCase().includes(jobSearch.toLowerCase());
        const matchesSource = jobFilter === 'all' || job.source === jobFilter;
        
        // Advanced Filters
        const matchesType = filters.type.length === 0 || filters.type.includes(job.type);
        const matchesWorkMode = filters.workMode.length === 0 || filters.workMode.some(m => job.location.toLowerCase().includes(m.toLowerCase()) || (m === 'Remote' && job.location.toLowerCase() === 'remote'));
        
        let matchesSalary = true;
        if (filters.salaryMin) {
            const minVal = parseInt(filters.salaryMin.replace('k', '')) * 1000;
            const jobSalary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) : 0;
            matchesSalary = jobSalary >= minVal;
        }

        return matchesSearch && matchesSource && matchesType && matchesWorkMode && matchesSalary;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [sharedJobs, recommendedJobs, jobSearch, jobFilter, filters]);

  const filteredApplicationHistory = useMemo(() => {
    if (!myData.applicationHistory) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return myData.applicationHistory.filter(app => {
      if (appHistoryFilter === 'ALL') return true;
      const appDate = new Date(app.outcomeDate || app.appliedDate);
      const diffMs = now.getTime() - appDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      switch (appHistoryFilter) {
        case '1D': return appDate >= startOfToday;
        case '7D': return diffDays <= 7;
        case '1M': return diffDays <= 30;
        case '3M': return diffDays <= 90;
        default: return true;
      }
    }).sort((a, b) => new Date(b.outcomeDate || b.appliedDate).getTime() - new Date(a.outcomeDate || a.appliedDate).getTime());
  }, [myData.applicationHistory, appHistoryFilter]);

  const timeOptions: { label: string, value: TimeRangeFilter }[] = [
    { label: '1D', value: '1D' }, 
    { label: '7D', value: '7D' }, 
    { label: '1M', value: '1M' }, 
    { label: '3M', value: '3M' },
    { label: 'ALL', value: 'ALL' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">R</div>
            <div className="hidden sm:block">
                <span className="font-bold text-lg text-slate-900 uppercase tracking-tighter">
                    {branding.companyName} <span className="text-[10px] text-slate-400 font-bold ml-2 tracking-widest">Candidate Portal</span>
                </span>
            </div>
        </div>

        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 mx-4">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={14}/>} label="Overview" />
            <NavTab active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={14}/>} label="Job Board" />
            <NavTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={14}/>} label="My Activity" />
            <NavTab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={14}/>} label="Calendar" badge={upcomingCount} />
            <NavTab active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<Sparkles size={14}/>} label="AI Lab" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={14}/>} label="My Profile" />
        </nav>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-slate-900">{myData.firstName} {myData.lastName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{myData.role}</p>
                </div>
                <img src={myData.avatarUrl} className="w-10 h-10 rounded-xl border border-slate-200 object-cover" alt="Profile" />
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-10">
        {activeTab === 'dashboard' && (
            <div className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[340px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="bg-brand-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Verified Profile</span>
                                {isOpenToWork && <span className="bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-glow">Open to Work</span>}
                            </div>
                            <h1 className="text-5xl font-black mb-4 tracking-tight leading-none uppercase">Welcome, <br/>{myData.firstName}.</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-md mt-6 leading-relaxed">
                                We've found <span className="text-white font-bold">{sharedJobs.length + recommendedJobs.length}</span> new jobs that match your profile today.
                            </p>
                        </div>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 relative z-10">
                            <button onClick={() => setActiveTab('jobs')} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-600/20">
                                <Search size={18} /> View Job Matches
                            </button>
                            <button onClick={() => setActiveTab('applications')} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all">
                                View History
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-500 transition-all">
                        <div className="relative inline-flex mb-8">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle className="text-slate-50" strokeWidth="10" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                                <circle className="text-brand-500 transition-all duration-1000 ease-out" strokeWidth="10" strokeDasharray={440} strokeDashoffset={440 * (1 - profileCompleteness / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{profileCompleteness}%</span>
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Profile Strength</h4>
                        <p className="text-xs text-slate-500 font-medium">Complete your profile to increase your match accuracy.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {sharedJobs.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Handpicked for You</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {sharedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} onFeedback={() => {}} />
                            ))}
                        </div>
                      </div>
                   )}
                   <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><BrainCircuit size={20} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Recommended</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {recommendedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} onFeedback={() => {}} />
                            ))}
                        </div>
                   </div>
                </div>
            </div>
        )}

        {activeTab === 'jobs' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Job Board</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Direct Market Synchronization</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvanced ? 'bg-brand-600 text-white shadow-xl' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                <Settings2 size={16} /> Advanced Configuration
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by role, company, or tech stack..." 
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
                                value={jobSearch}
                                onChange={e => setJobSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                            <FilterButton active={jobFilter === 'all'} onClick={() => setJobFilter('all')} label="All" />
                            <FilterButton active={jobFilter === 'recruiter'} onClick={() => setJobFilter('recruiter')} label="Handpicked" icon={<ShieldCheck size={14} />} />
                            <FilterButton active={jobFilter === 'ai'} onClick={() => setJobFilter('ai')} label="AI" icon={<Sparkles size={14} />} />
                        </div>
                    </div>

                    {showAdvanced && (
                        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Protocol</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Full-time', 'Contract', 'Freelance'].map(t => (
                                        <TagButton key={t} active={filters.type.includes(t)} onClick={() => toggleFilter('type', t)} label={t} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Environment</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Remote', 'Hybrid', 'On-site'].map(m => (
                                        <TagButton key={m} active={filters.workMode.includes(m)} onClick={() => toggleFilter('workMode', m)} label={m} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Min. Compensation</label>
                                <select value={filters.salaryMin} onChange={e => toggleFilter('salaryMin', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none shadow-inner">
                                    <option value="">Any Salary</option>
                                    <option value="100k">$100k+</option>
                                    <option value="150k">$150k+</option>
                                    <option value="200k">$200k+</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allJobs.length > 0 ? (
                        allJobs.map((job) => (
                            <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all flex flex-col group relative overflow-hidden">
                                {job.source === 'recruiter' && <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest">Handpicked</div>}
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">{job.company[0]}</div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{job.company}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> {job.location}</p>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex-1 tracking-tight leading-tight uppercase">{job.title}</h3>
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                    <div>
                                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block">Neural Score</span>
                                        <span className={`text-sm font-black uppercase ${job.matchScore >= 95 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
                                    </div>
                                    <button onClick={() => handleStartTailoring(job)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg active:scale-95">Apply with AI</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                             <Search size={56} className="text-slate-100 mx-auto mb-6" />
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No jobs detected</h3>
                             <p className="text-slate-500 font-medium mt-2">Adjust your parameters or clear filters to reset the scanner.</p>
                             <button onClick={clearFilters} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Reset All Nodes</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">My Activity</h2>
                    <p className="text-slate-500 font-medium italic mt-1">A verifiable audit trail of your application nodes and outcomes.</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                     {timeOptions.map((range) => (
                       <button key={range.value} onClick={() => setAppHistoryFilter(range.value)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${appHistoryFilter === range.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                         {range.label}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><History size={16} /> Verified Dossier Registry</h3>
                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest border border-slate-200">{filteredApplicationHistory.length} Record(s)</span>
                    </div>

                    {filteredApplicationHistory.length > 0 ? (
                        <div className="grid gap-6">
                            {filteredApplicationHistory.map((app) => (
                                <div key={app.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition-transform">{app.company[0]}</div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${app.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : app.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>{app.status}</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{app.appliedDate}</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight">{app.jobTitle}</h4>
                                                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-2">{app.company}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="flex items-center gap-2 mb-3"><AlertCircle size={14} className="text-brand-600" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rationalization & Notes</span></div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">{app.notes}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                            <History size={48} className="text-slate-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No verified records found for this temporal range</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Fix: Added Tailoring Modal to display AI results */}
        {(selectedJobForTailoring || isTailoring) && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                {isTailoring ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="text-brand-400" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Tailoring Studio</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {isTailoring ? 'Generating Optimized Materials...' : `Materials for ${selectedJobForTailoring?.company}`}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedJobForTailoring(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {isTailoring ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <BrainCircuit size={40} className="text-brand-600" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Analyzing Job DNA</h4>
                                <p className="text-slate-500 text-sm max-w-xs font-medium">Gemini is rewriting your cover letter and summary to perfectly align with this role's requirements.</p>
                            </div>
                        ) : tailoredMaterials ? (
                            <div className="space-y-8">
                                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <h4 className="text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Neural Summary</h4>
                                        <p className="text-sm font-medium leading-relaxed italic">{tailoredMaterials.tailoredResumeSummary}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <FileText size={14} className="text-brand-600" /> Optimized Cover Letter
                                        </h4>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(tailoredMaterials.coverLetter);
                                                notify("Copied", "Cover letter copied to clipboard.", "success");
                                            }}
                                            className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                                        >
                                            <Copy size={12} /> Copy to Clipboard
                                        </button>
                                    </div>
                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap shadow-inner max-h-[300px] overflow-y-auto">
                                        {tailoredMaterials.coverLetter}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for AI generation...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                        <button 
                            onClick={() => setSelectedJobForTailoring(null)}
                            className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={!tailoredMaterials || isTransmitting}
                            onClick={async () => {
                                setIsTransmitting(true);
                                await new Promise(r => setTimeout(r, 1500));
                                notify("Application Sent", "Your tailored application has been transmitted to the recruiter.", "success");
                                setIsTransmitting(false);
                                setSelectedJobForTailoring(null);
                            }}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-brand-600 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                            {isTransmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Transmit Application
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

const TagButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${active ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
    >
        {label}
    </button>
);

const JobDashboardCard: React.FC<{ job: any; onApply: () => void; onFeedback?: (feedback: 'like' | 'reject') => void }> = ({ job, onApply }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all flex items-center gap-6 group relative">
         <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">{job.company[0]}</div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{job.title}</h4>
                {job.source === 'recruiter' && <ShieldCheck size={14} className="text-emerald-500" />}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.company} • {job.location}</p>
         </div>
         <button onClick={onApply} className="px-5 py-2 bg-slate-50 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">View</button>
    </div>
);

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
        {icon}
        {label}
    </button>
);

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }> = ({ active, onClick, icon, label, badge }) => (
    <button onClick={onClick} className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all relative ${active ? 'bg-white text-slate-900 shadow-xl border border-slate-200' : 'text-slate-400 hover:text-slate-700'}`}>
        <span className={`${active ? 'text-brand-600' : ''}`}>{icon}</span> 
        <span className="hidden sm:inline">{label}</span>
        {badge !== undefined && badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">{badge}</span>}
    </button>
);

export default CandidatePortal;