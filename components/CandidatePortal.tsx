
import React, { useState, useMemo, useRef } from 'react';
import { 
  User, 
  Briefcase, 
  // Fix: Alias Calendar as CalendarIcon and add missing Info, Save, ClipboardCheck icons
  Calendar as CalendarIcon, 
  LogOut, 
  Bell,
  Search,
  Video,
  MapPin,
  Globe,
  BrainCircuit,
  ArrowRight,
  ShieldCheck, 
  Sparkles,
  Layout,
  Send,
  Loader2,
  FileCheck,
  Layers,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  PhoneCall,
  Settings2,
  Undo2,
  Trophy,
  Award,
  Plus,
  Copy,
  FileText,
  AlertCircle,
  GraduationCap,
  Trash2,
  Upload,
  CheckCircle2,
  Eye,
  FileCode,
  Check,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Info,
  Save,
  ClipboardCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, Interview } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

type TimeRangeFilter = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ViewMode = 'Grid' | 'Agenda';

interface AdvancedFilters {
    type: string[];
    workMode: string[];
    experience: string[];
    salaryMin: string;
    postedDate: string;
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
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings' | 'calendar'>('dashboard');
  const [jobFilter, setJobFilter] = useState<'all' | 'recruiter' | 'ai'>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [appHistoryFilter, setAppHistoryFilter] = useState<TimeRangeFilter>('ALL');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    experience: [],
    salaryMin: '',
    postedDate: 'All'
  });

  // Calendar States
  const [viewMode, setViewMode] = useState<ViewMode>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');

  // Profile Management States
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: myData.firstName,
    lastName: myData.lastName,
    role: myData.role,
    bio: myData.aiSummary || '',
    isOpenToWork: myData.isOpenToWork || false
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isPreviewingResume, setIsPreviewingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myInterviews = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return interviews
      .filter(i => i.candidateId === myData.id)
      .filter(i => {
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;
        if (timeRange === 'ALL') return true;
        const startTime = new Date(i.startTime);
        const diffMs = startTime.getTime() - startOfToday.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
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

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

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
        if (category === 'postedDate') return { ...prev, postedDate: value };
        const current = prev[category] as string[];
        const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ type: [], workMode: [], experience: [], salaryMin: '', postedDate: 'All' });
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
        const matchesType = filters.type.length === 0 || filters.type.includes(job.type);
        const matchesWorkMode = filters.workMode.length === 0 || filters.workMode.some(m => job.location.toLowerCase().includes(m.toLowerCase()) || (m === 'Remote' && job.location.toLowerCase() === 'remote'));
        const matchesSeniority = filters.experience.length === 0 || filters.experience.some(e => job.title.toLowerCase().includes(e.toLowerCase()));
        let matchesSalary = true;
        if (filters.salaryMin) {
            const minVal = parseInt(filters.salaryMin.replace('k', '')) * 1000;
            const jobSalary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) : 0;
            matchesSalary = jobSalary >= minVal;
        }
        let matchesTemporal = true;
        if (filters.postedDate !== 'All') {
            if (filters.postedDate === '24h' && !job.postedAt.includes('h')) matchesTemporal = false;
            if (filters.postedDate === '7d' && job.postedAt.includes('m')) matchesTemporal = false;
        }
        return matchesSearch && matchesSource && matchesType && matchesWorkMode && matchesSeniority && matchesSalary && matchesTemporal;
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

  const hasActiveFilters = filters.type.length > 0 || filters.workMode.length > 0 || filters.experience.length > 0 || filters.salaryMin !== '' || filters.postedDate !== 'All';

  // --- Profile Logic ---
  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1200));
    updateCandidateProfile(myData.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        role: profileForm.role,
        aiSummary: profileForm.bio,
        isOpenToWork: profileForm.isOpenToWork
    });
    addActivity({
        id: `prof_sync_${Date.now()}`,
        type: 'ProfileUpdate',
        subject: 'Profile Synchronized',
        content: 'Candidate updated their market status and bio dossier.',
        timestamp: new Date().toISOString(),
        author: 'System',
        entityId: myData.id
    });
    setIsUpdating(false);
    setIsEditingProfile(false);
    notify("Identity Synced", "Your profile has been updated across the network.", "success");
  };

  const sortedResumes = useMemo(() => {
    if (!myData.resumes) return [];
    return [...myData.resumes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [myData.resumes]);

  const activeResume = sortedResumes.find(r => r.id === selectedResumeId);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const newResume: ResumeFile = {
        id: `res_${Date.now()}`,
        name: file.name,
        url: '#',
        updatedAt: new Date().toISOString(),
        type: file.name.toLowerCase().endsWith('pdf') ? 'PDF' : 'DOCX'
    };

    updateCandidateProfile(myData.id, {
        resumes: [newResume, ...(myData.resumes || [])]
    });

    addActivity({
        id: `res_up_${Date.now()}`,
        type: 'ResumeUpload',
        subject: 'Dossier Uploaded',
        content: `New document synchronized: ${file.name}`,
        timestamp: new Date().toISOString(),
        author: 'System',
        entityId: myData.id
    });

    setIsUpdating(false);
    notify("Document Synced", "New resume version added to your vault.", "success");
  };

  const handleDeleteResume = (id: string) => {
    if (window.confirm("Are you sure you want to remove this document version?")) {
        const updated = (myData.resumes || []).filter(r => r.id !== id);
        updateCandidateProfile(myData.id, { resumes: updated });
        if (selectedResumeId === id) setSelectedResumeId(null);
        notify("Version Removed", "Document successfully deleted.", "info");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* VERTICAL SIDEBAR */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col h-full border-r border-white/5 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-600 text-white font-black text-xl shadow-lg shrink-0">
            {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : branding.companyName[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate uppercase tracking-tight text-white">{branding.companyName}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Candidate</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
          <div className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Navigator</div>
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={20}/>} label="Overview" />
          <SidebarLink active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={20}/>} label="Job Board" />
          <SidebarLink active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={20}/>} label="My Activity" />
          {/* Fix: use CalendarIcon instead of Calendar */}
          <SidebarLink active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={20}/>} label="Calendar" badge={upcomingCount} />
          <SidebarLink active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<Sparkles size={20}/>} label="AI Lab" />
          <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={20}/>} label="My Profile" />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <img src={myData.avatarUrl} alt="Profile" className="w-8 h-8 rounded-lg object-cover" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-white">{myData.firstName} {myData.lastName}</p>
                <p className="text-[9px] text-slate-500 font-medium uppercase truncate leading-none mt-1">{myData.role}</p>
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/90">
            <h2 className="text-lg font-black text-slate-900 capitalize tracking-tighter uppercase">
              {activeTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                    <input type="text" placeholder="Global Search..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500 w-48 transition-all" />
                </div>
                <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors relative">
                    <Bell size={20} />
                    {upcomingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
          {activeTab === 'dashboard' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[360px]">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-8">
                                  <span className="bg-brand-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Live Connection</span>
                                  {myData.isOpenToWork && <span className="bg-emerald-500 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-glow">Identity Verified</span>}
                              </div>
                              <h1 className="text-6xl font-black mb-6 tracking-tight leading-[0.9] uppercase">Synchronizing, <br/>{myData.firstName}.</h1>
                              <p className="text-slate-400 text-xl font-medium max-w-md mt-6 leading-relaxed">
                                  Detected <span className="text-white font-bold">{sharedJobs.length + recommendedJobs.length}</span> optimized opportunities for your trajectory.
                              </p>
                          </div>
                          <div className="mt-12 flex flex-col sm:flex-row gap-4 relative z-10">
                              <button onClick={() => setActiveTab('jobs')} className="px-10 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-600/30 active:scale-95">
                                  <Search size={18} /> Explore Matches
                              </button>
                              <button onClick={() => setActiveTab('applications')} className="px-10 py-5 bg-white/10 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border border-white/20 hover:bg-white/20 transition-all active:scale-95">
                                  Neural Activity
                              </button>
                          </div>
                      </div>

                      <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-500 transition-all">
                          <div className="relative inline-flex mb-10">
                              <svg className="w-48 h-48 transform -rotate-90">
                                  <circle className="text-slate-50" strokeWidth="12" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                                  <circle className="text-brand-500 transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={502} strokeDashoffset={502 * (1 - profileCompleteness / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{profileCompleteness}%</span>
                              </div>
                          </div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.3em]">Profile Index</h4>
                          <p className="text-xs text-slate-500 font-medium px-4">Calibrate your profile to reach 95%+ match accuracy.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {sharedJobs.length > 0 && (
                        <div className="space-y-8">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><ShieldCheck size={24} /></div>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Handpicked Portfolios</h3>
                          </div>
                          <div className="space-y-4">
                              {sharedJobs.slice(0, 2).map(job => (
                                  <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} />
                              ))}
                          </div>
                        </div>
                    )}
                    <div className="space-y-8">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm"><BrainCircuit size={24} /></div>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Generated Feeds</h3>
                          </div>
                          <div className="space-y-4">
                              {recommendedJobs.slice(0, 2).map(job => (
                                  <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} />
                              ))}
                          </div>
                    </div>
                  </div>
              </div>
          )}

          {activeTab === 'jobs' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                          <div>
                              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Global Job Board</h2>
                              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Direct Neural Sync with Market Liquidity</p>
                          </div>
                          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${showAdvanced ? 'bg-brand-600 text-white shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200/20'}`}>
                              <Settings2 size={18} /> Advanced Configuration
                          </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 relative group">
                              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={24} />
                              <input 
                                  type="text" 
                                  placeholder="Search by mission, client, or tech DNA..." 
                                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all"
                                  value={jobSearch}
                                  onChange={e => setJobSearch(e.target.value)}
                              />
                          </div>
                          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200">
                              <FilterButton active={jobFilter === 'all'} onClick={() => setJobFilter('all')} label="All Nodes" />
                              <FilterButton active={jobFilter === 'recruiter'} onClick={() => setJobFilter('recruiter')} label="Handpicked" icon={<ShieldCheck size={14} />} />
                              <FilterButton active={jobFilter === 'ai'} onClick={() => setJobFilter('ai')} label="AI Feeds" icon={<Sparkles size={14} />} />
                          </div>
                      </div>

                      {showAdvanced && (
                          <div className="mt-10 pt-10 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10">
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Work Protocol</label>
                                      <div className="flex flex-wrap gap-2">
                                          {['Full-time', 'Contract', 'Freelance'].map(t => (
                                              <TagButton key={t} active={filters.type.includes(t)} onClick={() => toggleFilter('type', t)} label={t} />
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Environment</label>
                                      <div className="flex flex-wrap gap-2">
                                          {['Remote', 'Hybrid', 'On-site'].map(m => (
                                              <TagButton key={m} active={filters.workMode.includes(m)} onClick={() => toggleFilter('workMode', m)} label={m} />
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Seniority Tier</label>
                                      <div className="flex flex-wrap gap-2">
                                          {['Junior', 'Mid', 'Senior', 'Lead', 'Staff'].map(e => (
                                              <TagButton key={e} active={filters.experience.includes(e)} onClick={() => toggleFilter('experience', e)} label={e} />
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Salary Floor</label>
                                      <select value={filters.salaryMin} onChange={e => toggleFilter('salaryMin', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 shadow-inner">
                                          <option value="">Any Salary</option>
                                          <option value="100k">$100k+</option>
                                          <option value="150k">$150k+</option>
                                          <option value="200k">$200k+</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Time Range</label>
                                      <div className="flex flex-wrap gap-2">
                                          {['24h', '7d', 'All'].map(p => (
                                              <TagButton key={p} active={filters.postedDate === p} onClick={() => toggleFilter('postedDate', p)} label={p} />
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {hasActiveFilters && (
                      <div className="flex flex-wrap gap-3 px-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center mr-2">Active Protocols:</span>
                          {filters.type.map(t => <FilterChip key={t} label={t} onRemove={() => toggleFilter('type', t)} />)}
                          {filters.workMode.map(m => <FilterChip key={m} label={m} onRemove={() => toggleFilter('workMode', m)} />)}
                          {filters.experience.map(e => <FilterChip key={e} label={e} onRemove={() => toggleFilter('experience', e)} />)}
                          {filters.salaryMin && <FilterChip label={`Min ${filters.salaryMin}`} onRemove={() => toggleFilter('salaryMin', '')} />}
                          {filters.postedDate !== 'All' && <FilterChip label={filters.postedDate} onRemove={() => toggleFilter('postedDate', 'All')} />}
                          <button onClick={clearFilters} className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-auto hover:underline">Reset All</button>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {allJobs.length > 0 ? (
                          allJobs.map((job) => (
                              <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all flex flex-col group relative overflow-hidden">
                                  {job.source === 'recruiter' && <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-[1.5rem] text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10">Priority</div>}
                                  <div className="flex items-center gap-6 mb-10">
                                      <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center font-black text-3xl shadow-xl transition-transform group-hover:scale-105">{job.company[0]}</div>
                                      <div>
                                          <h4 className="text-xl font-black text-slate-900 leading-none mb-2 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{job.company}</h4>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} className="text-brand-500" /> {job.location}</p>
                                      </div>
                                  </div>
                                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex-1 tracking-tight leading-tight uppercase">{job.title}</h3>
                                  
                                  <div className="flex flex-wrap gap-2.5 mb-10">
                                      <span className="px-3 py-1.5 bg-slate-50 text-[9px] font-black uppercase text-slate-400 border border-slate-100 rounded-lg">{job.type}</span>
                                      <span className="px-3 py-1.5 bg-slate-50 text-[9px] font-black uppercase text-slate-400 border border-slate-100 rounded-lg">{job.postedAt}</span>
                                  </div>

                                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
                                      <div>
                                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Neural Rank</span>
                                          <span className={`text-lg font-black uppercase tracking-tighter ${job.matchScore >= 95 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
                                      </div>
                                      <button onClick={() => handleStartTailoring(job)} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl active:scale-95">Apply with AI</button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border border-slate-200 border-dashed">
                               <Search size={64} className="text-slate-100 mx-auto mb-8" />
                               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">No Matches Logged</h3>
                               <p className="text-slate-500 font-medium mt-3">Reset your neural nodes or broaden your search parameters.</p>
                               <button onClick={clearFilters} className="mt-10 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 transition-all active:scale-95">Synchronize All Nodes</button>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
               <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-12 relative z-10">
                     <div className="flex gap-10 items-center">
                        <div className="relative">
                          <img src={myData.avatarUrl} className="w-40 h-40 rounded-[3rem] object-cover border-8 border-slate-50 shadow-2xl transition-transform duration-700" alt="Avatar" />
                          <button className="absolute -bottom-3 -right-3 p-4 bg-brand-600 text-white rounded-2xl shadow-2xl shadow-brand-600/30 hover:bg-brand-700 transition-all active:scale-90">
                            <Plus size={24} />
                          </button>
                        </div>
                        <div className="flex-1">
                          {isEditingProfile ? (
                            <div className="space-y-4 max-w-sm">
                                <div className="flex gap-2">
                                    <input value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold" placeholder="First Name" />
                                    <input value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold" placeholder="Last Name" />
                                </div>
                                <input value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold" placeholder="Professional Role" />
                                <div className="flex gap-2">
                                    <button onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                        {/* Fix: use ClipboardCheck icon */}
                                        {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <ClipboardCheck size={14} />} Save Identity
                                    </button>
                                    <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                                </div>
                            </div>
                          ) : (
                            <>
                                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tight leading-none mb-6">{myData.firstName} {myData.lastName}</h2>
                                <div className="flex flex-wrap gap-4">
                                    <span className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">{myData.role}</span>
                                    <button 
                                        onClick={() => setProfileForm({...profileForm, isOpenToWork: !profileForm.isOpenToWork})}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2.5 transition-all ${
                                            profileForm.isOpenToWork 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-glow' 
                                            : 'bg-slate-50 text-slate-400 border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full ${profileForm.isOpenToWork ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div> 
                                        {profileForm.isOpenToWork ? 'Market Active' : 'Passive'}
                                    </button>
                                </div>
                            </>
                          )}
                        </div>
                     </div>
                     {!isEditingProfile && (
                         <button onClick={() => setIsEditingProfile(true)} className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl active:scale-95 shrink-0 flex items-center gap-2">
                             <Settings2 size={16} /> Modify Profile
                         </button>
                     )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
                     <div className="space-y-10">
                        <div className="space-y-4">
                            {/* Fix: use Info icon */}
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Info size={18} /> Professional Summary</h4>
                            <textarea 
                                value={profileForm.bio} 
                                onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                placeholder="Write your professional dossier summary here..."
                                className="w-full h-48 p-6 bg-slate-50 border-none rounded-[2rem] text-sm font-medium text-slate-600 leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                            {profileForm.bio !== (myData.aiSummary || '') && (
                                <button onClick={handleUpdateProfile} disabled={isUpdating} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                                    {/* Fix: use Save icon */}
                                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />} Update Bio Node
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><FileText size={18} /> Resume Vault</h4>
                                <input type="file" ref={fileInputRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.docx" />
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-brand-700 active:scale-95 transition-all">
                                    <Upload size={14} /> Synchronize Version
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {sortedResumes.length > 0 ? (
                                    sortedResumes.map((resume, idx) => (
                                        <div key={resume.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-brand-300 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${idx === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    <FileCode size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black uppercase tracking-tight text-slate-900">{resume.name}</p>
                                                        {idx === 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-lg">Market Current</span>}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Uploaded: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setSelectedResumeId(resume.id); setIsPreviewingResume(true); }} className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Preview Dossier"><Eye size={16} /></button>
                                                <button onClick={() => handleDeleteResume(resume.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete Version"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                                        <FileCheck size={40} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No professional dossiers detected.<br/>Upload your primary resume to start matching.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>

                     <div className="space-y-12">
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Briefcase size={18} /> Core Competencies</h4>
                            <div className="flex flex-wrap gap-3 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                               {myData.skills.map(s => (
                                 <span key={s.name} className="px-4 py-2 bg-white text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-tight border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex items-center gap-2 group/skill">
                                    {s.name} • {s.years}Y
                                    <button className="opacity-0 group-hover/skill:opacity-100 text-slate-300 hover:text-red-500"><X size={10} /></button>
                                 </span>
                               ))}
                               <button className="px-4 py-2 border border-slate-200 border-dashed text-slate-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-brand-500 hover:text-brand-600 transition-all flex items-center gap-2">
                                   <Plus size={14} /> Extend Node
                               </button>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><GraduationCap size={18} /> Education Dossier</h4>
                            <div className="space-y-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                              {myData.education?.map((edu, idx) => (
                                <div key={idx} className="border-l-4 border-brand-200 pl-6 group/edu relative">
                                  <button className="absolute top-0 right-0 opacity-0 group-hover/edu:opacity-100 text-slate-300 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover/edu:text-brand-600 transition-colors">{edu.degree}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{edu.institution} • {edu.year}</p>
                                </div>
                              ))}
                              <button className="w-full py-3 border border-slate-200 border-dashed text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-brand-500 hover:text-brand-600 transition-all flex items-center justify-center gap-2">
                                  <Plus size={16} /> Register Institution
                              </button>
                            </div>
                        </section>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <ProfileStatCard icon={<Trophy size={24}/>} label="Standardized Rank" value="94.2" sub="Global Avg: 68.1" />
                  <ProfileStatCard icon={<History size={24}/>} label="Sync Velocity" value="2.4h" sub="Elite Performance" />
                  <ProfileStatCard icon={<Award size={24}/>} label="Verification" value="PLATINUM" sub="KYC & Skills Validated" color="text-brand-600" />
               </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Session Calendar</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Active Selection Rounds & Availability Nodes</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
                      <Globe size={16} className="text-brand-600" />
                      <select 
                        value={displayTimezone}
                        onChange={(e) => setDisplayTimezone(e.target.value)}
                        className="text-[10px] font-black uppercase outline-none bg-transparent text-slate-700 tracking-widest cursor-pointer"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-4 rounded-[3rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
                  <button onClick={() => setViewMode('Grid')} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${viewMode === 'Grid' ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} title="Grid Node View">
                    <LayoutGrid size={20} />
                  </button>
                  <button onClick={() => setViewMode('Agenda')} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${viewMode === 'Agenda' ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} title="Agenda Node View">
                    <List size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-[1.5rem] shadow-inner">
                  {timeOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setTimeRange(opt.value)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${timeRange === opt.value ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {viewMode === 'Grid' && (
                  <div className="flex items-center gap-6">
                    <button onClick={prevMonth} className="p-3 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 rounded-2xl transition-all shadow-sm active:scale-95"><ChevronLeft size={24}/></button>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter w-56 text-center leading-none">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={nextMonth} className="p-3 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 rounded-2xl transition-all shadow-sm active:scale-95"><ChevronRight size={24}/></button>
                  </div>
                )}

                <div className="flex items-center gap-3 pr-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status:</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500 shadow-inner">
                    <option value="All">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {viewMode === 'Grid' ? (
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {DAYS.map(day => (
                      <div key={day} className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {daysInMonth.map((dayObj, idx) => {
                      const dayInterviews = dayObj.date 
                        ? myInterviews.filter(i => new Date(i.startTime).toDateString() === dayObj.date!.toDateString())
                        : [];
                      const isToday = dayObj.date?.toDateString() === new Date().toDateString();

                      return (
                        <div key={idx} className={`min-h-[160px] p-3 border-r border-b last:border-r-0 border-slate-100 flex flex-col gap-2 transition-colors ${!dayObj.day ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                          <span className={`text-[11px] font-black w-8 h-8 rounded-xl flex items-center justify-center mx-auto shadow-sm ${isToday ? 'bg-brand-600 text-white shadow-brand-600/30' : 'text-slate-300'}`}>
                            {dayObj.day}
                          </span>
                          <div className="flex-1 space-y-1.5 overflow-y-auto mt-2 px-1">
                            {dayInterviews.map(int => (
                              <div key={int.id} onClick={() => setSelectedInterview(int)} className={`p-2 rounded-xl text-[9px] font-black truncate cursor-pointer transition-all border shadow-sm ${int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-brand-50 text-brand-700 border-brand-100 hover:scale-[1.03] active:scale-95'}`}>
                                {formatTime(int.startTime, displayTimezone)} {int.jobTitle}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-10 max-w-4xl mx-auto pb-20">
                  {myInterviews.length > 0 ? (
                      myInterviews.map((int, idx) => {
                        const isFirstOfDate = idx === 0 || new Date(myInterviews[idx-1].startTime).toDateString() !== new Date(int.startTime).toDateString();
                        return (
                          <div key={int.id} className="animate-in slide-in-from-bottom-6 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
                            {isFirstOfDate && (
                                <div className="mt-16 mb-8 flex items-center gap-6">
                                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                      {formatDate(int.startTime, displayTimezone)}
                                  </h4>
                                  <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                            )}

                            <div onClick={() => setSelectedInterview(int)} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all cursor-pointer flex items-center gap-10 group relative overflow-hidden">
                                <div className="w-40 text-center border-r border-slate-100 pr-10 shrink-0">
                                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatTime(int.startTime, displayTimezone)}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mt-3 tracking-[0.2em]">Live Session</p>
                                </div>
                                <div className="flex-1 min-w-0 relative z-10">
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
                                        {int.status}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{int.type} Protocol</span>
                                  </div>
                                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{int.jobTitle}</h3>
                                  <p className="text-sm text-slate-500 font-medium mt-3 uppercase tracking-widest">Interviewer ID: {int.interviewerName}</p>
                                </div>
                                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                      <div className="py-48 text-center bg-white rounded-[4rem] border border-slate-200 border-dashed">
                          {/* Fix: use CalendarIcon icon */}
                          <CalendarIcon size={64} className="text-slate-100 mx-auto mb-8" />
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">No Sessions Orchestrated</h3>
                          <p className="text-slate-500 font-medium mt-3">Your selection calendar is currently offline.</p>
                      </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
              <div className="space-y-16 max-w-4xl mx-auto animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Neural Activity</h2>
                      <p className="text-slate-500 font-medium italic mt-3 text-lg">A cryptographically verifiable audit trail of your applications.</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm overflow-x-auto no-scrollbar">
                       {timeOptions.map((range) => (
                         <button key={range.value} onClick={() => setAppHistoryFilter(range.value)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${appHistoryFilter === range.value ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                           {range.label}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><History size={20} /> Verified Registry</h3>
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-200">{filteredApplicationHistory.length} Live Record(s)</span>
                      </div>

                      {filteredApplicationHistory.length > 0 ? (
                          <div className="grid gap-8">
                              {filteredApplicationHistory.map((app) => (
                                  <div key={app.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-2xl hover:border-brand-200 transition-all group">
                                      <div className="p-10">
                                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                                              <div className="flex items-center gap-8">
                                                  <div className="w-20 h-20 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-2xl transition-transform group-hover:scale-105">{app.company[0]}</div>
                                                  <div>
                                                      <div className="flex items-center gap-3 mb-2">
                                                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${app.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : app.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>{app.status}</span>
                                                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">{app.appliedDate}</span>
                                                      </div>
                                                      <h4 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{app.jobTitle}</h4>
                                                      <p className="text-[11px] font-bold text-brand-600 uppercase tracking-widest mt-2">{app.company}</p>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden">
                                              <div className="flex items-center gap-3 mb-4"><AlertCircle size={18} className="text-brand-600" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outcome Rationalization</span></div>
                                              <p className="text-sm text-slate-600 font-medium leading-relaxed italic">{app.notes}</p>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-40 bg-white rounded-[4rem] border border-slate-200 border-dashed">
                              <History size={64} className="text-slate-100 mx-auto mb-6" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8 leading-relaxed">No cryptographically verified records identified for this temporal range</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'lab' && (
            <div className="space-y-16 animate-in fade-in duration-500 max-w-5xl mx-auto">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 bg-brand-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-brand-100 group">
                  <Sparkles size={64} className="text-brand-600 animate-pulse group-hover:scale-110 transition-transform" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tight leading-none">AI Lab Studio</h2>
                <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg">Calibrate autonomous career agents and optimize your digital presence for top-tier intelligence pools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <LabCard icon={<BrainCircuit size={32} />} title="Session Simulator" desc="Train against personalized LLM instances tuned to your specific job target requirements." action="Initialize Simulation" color="bg-purple-50 text-purple-600" />
                <LabCard icon={<FileCheck size={32} />} title="Vector Optimizer" desc="Analyze your professional DNA against live market liquidity nodes for 95%+ matches." action="Run Neural Analysis" color="bg-emerald-50 text-emerald-600" />
              </div>

              <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl group">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[140px] opacity-20 -mr-48 -mt-48 transition-opacity group-hover:opacity-30"></div>
                 <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-4xl font-black uppercase tracking-tight leading-none">Autonomous Agent</h3>
                      <p className="text-slate-400 font-medium leading-relaxed text-lg">Enable our career agent to automatically triage opportunities and apply while your presence is offline.</p>
                      <div className="flex items-center gap-4 pt-6">
                        <div className="w-16 h-8 bg-slate-800 rounded-full relative p-1.5 cursor-pointer shadow-inner">
                          <div className="w-5 h-5 bg-white rounded-lg shadow-lg"></div>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Agent Status: Disabled</span>
                      </div>
                    </div>
                    <div className="w-64 h-64 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700">
                      <Rocket size={80} className="text-brand-400 animate-bounce" />
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Tailoring Modal */}
      {(selectedJobForTailoring || isTailoring) && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
                  <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
                              {isTailoring ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} className="text-brand-400" />}
                          </div>
                          <div>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Tailoring Studio</h3>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                  {isTailoring ? 'Analyzing Requirements Cluster...' : `Generating Dossier for ${selectedJobForTailoring?.company}`}
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedJobForTailoring(null)} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-3xl transition-all shadow-sm active:scale-90">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 space-y-12">
                      {isTailoring ? (
                          <div className="flex flex-col items-center justify-center py-24 text-center">
                              <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-8 animate-pulse border border-brand-100">
                                  <BrainCircuit size={48} className="text-brand-600" />
                              </div>
                              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Reconfiguring Persona</h4>
                              <p className="text-slate-500 text-lg max-w-md font-medium leading-relaxed italic">Gemini is synthesizing your career trajectory with this role's specific requirement nodes.</p>
                          </div>
                      ) : tailoredMaterials ? (
                          <div className="space-y-12">
                              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                  <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-24 -mt-24"></div>
                                  <div className="relative z-10">
                                      <h4 className="text-brand-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6">Neural Trajectory Summary</h4>
                                      <p className="text-lg font-medium leading-relaxed italic">{tailoredMaterials.tailoredResumeSummary}</p>
                                  </div>
                              </div>

                              <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                          <FileText size={18} className="text-brand-600" /> Target Cover Letter
                                      </h4>
                                      <button 
                                          onClick={() => {
                                              navigator.clipboard.writeText(tailoredMaterials.coverLetter);
                                              notify("Dossier Synced", "Cover letter copied to system clipboard.", "success");
                                          }}
                                          className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline flex items-center gap-2 group/copy"
                                      >
                                          <Copy size={14} className="group-hover/copy:scale-110 transition-transform" /> Copy Protocol
                                      </button>
                                  </div>
                                  <div className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap shadow-inner max-h-[360px] overflow-y-auto no-scrollbar border-l-8 border-l-brand-500">
                                      {tailoredMaterials.coverLetter}
                                  </div>
                              </div>
                          </div>
                      ) : null}
                  </div>

                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-6">
                      <button 
                          onClick={() => setSelectedJobForTailoring(null)}
                          className="px-10 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95"
                      >
                          Abort Mission
                      </button>
                      <button 
                          disabled={!tailoredMaterials || isTransmitting}
                          onClick={async () => {
                              setIsTransmitting(true);
                              await new Promise(r => setTimeout(r, 2000));
                              notify("Transmission Success", "Dossier synchronized with Recruiter node.", "success");
                              setIsTransmitting(false);
                              setSelectedJobForTailoring(null);
                          }}
                          className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-brand-600 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-4 group"
                      >
                          {isTransmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                          Execute Application Protocol
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Resume Preview Modal */}
      {isPreviewingResume && activeResume && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
                <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg">
                            <FileCode size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeResume.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dossier Preview Node</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsPreviewingResume(false)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm active:scale-90">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl p-12 w-full max-w-2xl min-h-[800px] border border-slate-200 font-serif relative overflow-hidden">
                        <div className="text-center pb-8 border-b border-slate-100">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{myData.firstName} {myData.lastName}</h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{myData.role}</p>
                        </div>
                        <div className="py-8 space-y-8">
                            <section>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Market Persona Summary</h2>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium italic">{myData.aiSummary || "Dossier profile incomplete."}</p>
                            </section>
                            <section>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Technical Proficiency</h2>
                                <div className="flex flex-wrap gap-2">
                                    {myData.skills.map(s => <span key={s.name} className="px-3 py-1 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded">{s.name}</span>)}
                                </div>
                            </section>
                            <div className="pt-24 text-center">
                                <p className="text-xs text-slate-300 uppercase font-black tracking-widest opacity-20">End of Preview Registry</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// COMPONENT HELPERS
const SidebarLink = ({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
      active 
        ? 'bg-brand-600 text-white shadow-2xl shadow-brand-600/30' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-4">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'} transition-colors`}>{icon}</span>
        <span className="font-black text-[10px] uppercase tracking-[0.15em]">{label}</span>
    </div>
    {badge ? <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg border border-red-400">{badge}</span> : null}
  </button>
);

const TagButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95 ${active ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
    >
        {label}
    </button>
);

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-2.5 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
        {label}
        <button onClick={onRemove} className="hover:text-red-500 transition-colors active:scale-75">
            <X size={14} />
        </button>
    </span>
);

const JobDashboardCard: React.FC<{ job: any; onApply: () => void }> = ({ job, onApply }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-500 transition-all flex items-center gap-8 group relative overflow-hidden">
         <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center font-black text-2xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">{job.company[0]}</div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-2">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{job.title}</h4>
                {job.source === 'recruiter' && <ShieldCheck size={16} className="text-emerald-500 shadow-sm" />}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-brand-500" /> {job.company} • {job.location}</p>
         </div>
         <button onClick={onApply} className="px-8 py-3 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm">View Node</button>
    </div>
);

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 ${active ? 'bg-white text-slate-900 shadow-xl border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
        {icon}
        {label}
    </button>
);

const ProfileStatCard = ({ icon, label, value, sub, color = "text-slate-900" }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:border-brand-200 transition-all">
     <div className="flex items-center justify-between mb-10">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner">{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</p>
     </div>
     <div>
        <h4 className={`text-4xl font-black tracking-tighter leading-none mb-3 ${color}`}>{value}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
     </div>
  </div>
);

const LabCard = ({ icon, title, desc, action, color }: any) => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-200 transition-all group">
    <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-none">{title}</h3>
    <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">{desc}</p>
    <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-2xl active:scale-95">{action}</button>
  </div>
);

const Rocket = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/>
        <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/>
    </svg>
);

export default CandidatePortal;
