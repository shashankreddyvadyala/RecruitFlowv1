
import React, { useState, useMemo, useRef } from 'react';
import { 
  User, 
  Briefcase, 
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
  ClipboardCheck,
  Linkedin,
  Github,
  Link as LinkIcon,
  Phone,
  Mail,
  Building2,
  Clock,
  Target,
  Zap,
  Edit3,
  Rocket,
  Cpu,
  BarChart3,
  Star,
  Archive,
  Ban,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Scale,
  ShieldAlert,
  // Added missing DollarSign icon
  DollarSign
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, Interview, WorkExperience } from '../types';

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
  const [locationSearch, setLocationSearch] = useState('');
  const [appHistoryFilter, setAppHistoryFilter] = useState<TimeRangeFilter>('ALL');
  
  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    experience: [],
    salaryMin: '',
    postedDate: 'All'
  });

  // States
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');

  const timeOptions: { label: string; value: TimeRangeFilter }[] = [
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: 'ALL', value: 'ALL' },
  ];

  // Profile Management States
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAlignment, setIsEditingAlignment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: myData.firstName,
    lastName: myData.lastName,
    role: myData.role,
    email: myData.email,
    phone: myData.phone || '',
    bio: myData.aiSummary || '',
    isOpenToWork: myData.isOpenToWork || false,
    salaryExpectation: myData.salaryExpectation || '',
    workMode: myData.workMode || 'Remote',
    noticePeriod: myData.noticePeriod || '2 Weeks',
    relocationWillingness: myData.relocationWillingness || 'None',
    workAuthorization: myData.workAuthorization || 'Not Required',
    industryPreference: myData.industryPreference || ['FinTech', 'SaaS'],
    linkedin: myData.socialLinks?.linkedin || '',
    github: myData.socialLinks?.github || '',
    portfolio: myData.socialLinks?.portfolio || ''
  });

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1000));
    
    updateCandidateProfile(myData.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        role: profileForm.role,
        email: profileForm.email,
        phone: profileForm.phone,
        aiSummary: profileForm.bio,
        isOpenToWork: profileForm.isOpenToWork,
        salaryExpectation: profileForm.salaryExpectation,
        workMode: profileForm.workMode,
        noticePeriod: profileForm.noticePeriod,
        relocationWillingness: profileForm.relocationWillingness as any,
        workAuthorization: profileForm.workAuthorization,
        socialLinks: {
            linkedin: profileForm.linkedin,
            github: profileForm.github,
            portfolio: profileForm.portfolio
        }
    });

    addActivity({
        id: `sync_${Date.now()}`,
        type: 'ProfileUpdate',
        subject: 'Identity Calibration Complete',
        content: `Node synchronized: Visa status (${profileForm.workAuthorization}), Compensation Floor (${profileForm.salaryExpectation}).`,
        timestamp: new Date().toISOString(),
        author: 'Candidate Portal',
        entityId: myData.id
    });

    setIsUpdating(false);
    setIsEditingProfile(false);
    setIsEditingAlignment(false);
    notify("Network Synced", "Recruiter nodes and AI agents have been updated with your new calibration.", "success");
  };

  const profileCompleteness = useMemo(() => {
    let score = 30;
    if (myData.aiSummary) score += 15;
    if (myData.resumes && myData.resumes.length > 0) score += 15;
    if (myData.workHistory && myData.workHistory.length > 0) score += 15;
    if (myData.education && myData.education.length > 0) score += 15;
    if (myData.socialLinks?.linkedin) score += 10;
    return Math.min(100, score);
  }, [myData]);

  const sharedJobs = useMemo(() => {
    if (!myData.sharedJobIds) return [];
    return externalJobs
      .filter(j => myData.sharedJobIds!.includes(j.id))
      .filter(j => !myData.rejectedJobIds?.includes(j.id))
      .map(j => ({ ...j, matchScore: 96, source: 'recruiter' as const }));
  }, [myData.sharedJobIds, myData.rejectedJobIds, externalJobs]);

  const recommendedJobs = useMemo(() => {
    return externalJobs
      .filter(j => !myData.sharedJobIds?.includes(j.id))
      .filter(j => !myData.rejectedJobIds?.includes(j.id))
      .map(j => ({ ...j, matchScore: 88, source: 'ai' as const }));
  }, [externalJobs, myData.sharedJobIds, myData.rejectedJobIds]);

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
      notify("Error", "Synthesis failed. Check API Key.", "error");
    } finally {
      setIsTailoring(false);
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
          <SidebarLink active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={20}/>} label="Calendar" badge={upcomingCount} />
          <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={20}/>} label="My Profile" />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
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
              {activeTab === 'settings' ? 'Identity Management' : activeTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors relative">
                    <Bell size={20} />
                    {upcomingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={myData.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[340px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <span className="bg-brand-600 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 inline-block">Active Network</span>
                            <h1 className="text-6xl font-black mb-6 tracking-tight leading-[0.9] uppercase">Synchronizing, <br/>{myData.firstName}.</h1>
                            <p className="text-slate-400 text-xl font-medium max-w-md mt-6 leading-relaxed">
                                AI has detected <span className="text-white font-bold">{sharedJobs.length + recommendedJobs.length}</span> opportunities aligned with your Reported DNA.
                            </p>
                        </div>
                        <div className="mt-12 flex gap-4 relative z-10">
                            <button onClick={() => setActiveTab('jobs')} className="px-10 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all shadow-2xl active:scale-95">Explore Nodes</button>
                            <button onClick={() => setActiveTab('settings')} className="px-10 py-5 bg-white/10 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border border-white/20 hover:bg-white/20 transition-all active:scale-95">Calibrate DNA</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-500 transition-all">
                        <div className="relative inline-flex mb-10">
                            <svg className="w-44 h-44 transform -rotate-90">
                                <circle className="text-slate-50" strokeWidth="12" stroke="currentColor" fill="transparent" r="75" cx="88" cy="88" />
                                <circle className="text-brand-500 transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={471} strokeDashoffset={471 * (1 - profileCompleteness / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="75" cx="88" cy="88" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{profileCompleteness}%</span>
                            </div>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.3em]">Profile Index</h4>
                        <p className="text-xs text-slate-500 font-medium">Update your <b>Market Alignment</b> to hit 95%+ resonance.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recruiter Picks</h3>
                      </div>
                      <div className="space-y-4">
                          {sharedJobs.slice(0, 2).map(job => (
                              <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} />
                          ))}
                      </div>
                  </div>
                  <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><BrainCircuit size={24} /></div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Predicted Feeds</h3>
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

          {activeTab === 'settings' && (
            <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
               {/* Identity Header */}
               <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative z-10">
                     <div className="flex gap-10 items-center">
                        <div className="relative">
                          <img src={myData.avatarUrl} className="w-40 h-40 rounded-[3rem] object-cover border-4 border-white shadow-2xl" alt="Avatar" />
                          <button className="absolute -bottom-2 -right-2 p-3 bg-brand-600 text-white rounded-2xl shadow-xl hover:bg-brand-700 transition-all active:scale-90">
                            <Edit3 size={18} />
                          </button>
                        </div>
                        <div className="flex-1">
                          {isEditingProfile ? (
                            <div className="space-y-4 max-w-lg">
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold shadow-inner" placeholder="First" />
                                    <input value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold shadow-inner" placeholder="Last" />
                                </div>
                                <input value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold shadow-inner" placeholder="Role Title" />
                                <div className="flex gap-3">
                                    <button onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />} Sync Identity
                                    </button>
                                    <button onClick={() => setIsEditingProfile(false)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                                </div>
                            </div>
                          ) : (
                            <>
                                <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tight leading-none mb-6">{myData.firstName} {myData.lastName}</h2>
                                <div className="flex flex-wrap gap-4 items-center">
                                    <span className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">{myData.role}</span>
                                    <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2.5 ${myData.isOpenToWork ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-glow' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        <div className={`w-2 h-2 rounded-full ${myData.isOpenToWork ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div> 
                                        {myData.isOpenToWork ? 'Market Active' : 'Passive Protocol'}
                                    </div>
                                </div>
                            </>
                          )}
                        </div>
                     </div>
                     {!isEditingProfile && (
                        <button onClick={() => setIsEditingProfile(true)} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 shadow-xl transition-all active:scale-95 flex items-center gap-3">
                            <Settings2 size={18} /> Modify DNA
                        </button>
                     )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 border-t border-slate-100 mt-12">
                     {/* Bio & Mission */}
                     <div className="lg:col-span-8 space-y-12">
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Info size={18} /> Professional Mission</h4>
                            <div className="relative">
                                <textarea 
                                    value={profileForm.bio} 
                                    onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                    placeholder="Enter your professional elevator pitch..."
                                    className="w-full h-44 p-8 bg-slate-50 border-none rounded-[2.5rem] text-sm font-medium text-slate-600 leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                                />
                                {profileForm.bio !== myData.aiSummary && (
                                    <button onClick={handleUpdateProfile} disabled={isUpdating} className="absolute bottom-4 right-4 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-brand-600 transition-all">
                                        <Save size={14}/> Sync Mission
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Professional Chronology */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><History size={18} /> Chronology</h4>
                                <button className="p-2 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all"><Plus size={20}/></button>
                            </div>
                            <div className="space-y-6">
                                {myData.workHistory?.map((exp) => (
                                    <div key={exp.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-6">
                                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">{exp.company[0]}</div>
                                                <div>
                                                    <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{exp.title}</h5>
                                                    <p className="text-brand-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                                        <Building2 size={12}/> {exp.company} • {exp.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Clock size={12} /> {exp.startDate} — {exp.current ? 'PRESENT' : exp.endDate}
                                        </p>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>

                     {/* Market Alignment Column */}
                     <div className="lg:col-span-4 space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Scale size={18} /> Market Alignment</h4>
                                {!isEditingAlignment ? (
                                    <button onClick={() => setIsEditingAlignment(true)} className="p-2 text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-all">
                                        <Edit3 size={16} />
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateProfile} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"><Check size={16}/></button>
                                        <button onClick={() => setIsEditingAlignment(false)} className="p-2 text-slate-400 bg-slate-100 rounded-xl hover:bg-slate-200"><X size={16}/></button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden space-y-8">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                                
                                <div className="relative z-10 space-y-8">
                                    {/* Salary */}
                                    <div className="group">
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3">Target Compensation Segment</label>
                                        {isEditingAlignment ? (
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                                <input value={profileForm.salaryExpectation} onChange={e => setProfileForm({...profileForm, salaryExpectation: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none" placeholder="$150k+" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <p className="text-2xl font-black tracking-tighter uppercase">{myData.salaryExpectation || 'Unconfigured'}</p>
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[7px] font-black rounded uppercase border border-emerald-500/20">Market Optimal</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Visa Sponsorship - OPEN TO EDIT */}
                                    <div>
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3">Visa Sponsorship</label>
                                        {isEditingAlignment ? (
                                            <div className="relative">
                                                <select 
                                                    value={profileForm.workAuthorization} 
                                                    onChange={e => setProfileForm({...profileForm, workAuthorization: e.target.value})} 
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                                                >
                                                    <option className="bg-slate-900" value="Not Required">Native / No Sponsorship</option>
                                                    <option className="bg-slate-900" value="Requires Sponsorship">Requires Sponsorship (H1B/L1)</option>
                                                    <option className="bg-slate-900" value="Transfer Only">Visa Transfer Required</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                                            </div>
                                        ) : (
                                            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border ${myData.workAuthorization === 'Requires Sponsorship' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-brand-500/10 border-brand-500/20 text-brand-400'}`}>
                                                {myData.workAuthorization === 'Requires Sponsorship' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{myData.workAuthorization || 'Native Authorized'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notice Period */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3">Notice Node</label>
                                            {isEditingAlignment ? (
                                                <select value={profileForm.noticePeriod} onChange={e => setProfileForm({...profileForm, noticePeriod: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none appearance-none">
                                                    <option className="bg-slate-900">Immediate</option>
                                                    <option className="bg-slate-900">2 Weeks</option>
                                                    <option className="bg-slate-900">1 Month</option>
                                                    <option className="bg-slate-900">Negotiable</option>
                                                </select>
                                            ) : (
                                                <p className="text-sm font-black uppercase tracking-tight text-slate-100">{myData.noticePeriod || '2 Weeks'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-3">Mobility</label>
                                            {isEditingAlignment ? (
                                                <select value={profileForm.relocationWillingness} onChange={e => setProfileForm({...profileForm, relocationWillingness: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none appearance-none">
                                                    <option className="bg-slate-900" value="None">Locked</option>
                                                    <option className="bg-slate-900" value="Local">Local Only</option>
                                                    <option className="bg-slate-900" value="Regional">Regional</option>
                                                    <option className="bg-slate-900" value="International">Global</option>
                                                </select>
                                            ) : (
                                                <p className="text-sm font-black uppercase tracking-tight text-slate-100">{myData.relocationWillingness || 'None'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Synchronized</span>
                                    </div>
                                    {isEditingAlignment && (
                                        <button onClick={handleUpdateProfile} className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-400 hover:text-white transition-colors">Apply Calibration</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Skills Matrix */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Zap size={18} /> Competency Matrix</h4>
                                <button className="p-2 text-brand-600 bg-brand-50 rounded-xl"><Plus size={16}/></button>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {myData.skills?.map(skill => (
                                    <div key={skill.name} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-tight border border-slate-100 shadow-sm hover:border-brand-300 transition-all group/skill">
                                        <span>{skill.name}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-brand-600">{skill.years}Y</span>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Job Discovery</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Live Recruiter Coordination</p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-[2] relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input type="text" placeholder="Search by mission or stack..." className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" value={jobSearch} onChange={e => setJobSearch(e.target.value)} />
                        </div>
                        <div className="flex-1 relative group">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input type="text" placeholder="Location..." className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {externalJobs.map((job) => (
                        <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all flex flex-col group relative overflow-hidden">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center font-black text-3xl shadow-xl transition-transform group-hover:scale-105">{job.company[0]}</div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 leading-none mb-2 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{job.company}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} className="text-brand-500" /> {job.location}</p>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-10 flex-1 tracking-tight leading-tight uppercase">{job.title}</h3>
                            <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
                                <div>
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Neural Rank</span>
                                    <span className="text-lg font-black uppercase tracking-tighter text-brand-600">92% Match</span>
                                </div>
                                <button onClick={() => handleStartTailoring(job)} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl active:scale-95">Apply with AI</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Tailoring Modal */}
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
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{selectedJobForTailoring?.title} @ {selectedJobForTailoring?.company}</p>
                          </div>
                      </div>
                      <button onClick={() => { setSelectedJobForTailoring(null); setTailoredMaterials(null); }} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-3xl transition-all shadow-sm active:scale-90">
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
                              <p className="text-slate-500 text-lg max-w-md font-medium leading-relaxed italic">Gemini is synthesizing your DNA with this role's target requirement nodes.</p>
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
                                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">Target Cover Letter</h4>
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
                          disabled={!tailoredMaterials || isTransmitting}
                          onClick={async () => {
                              setIsTransmitting(true);
                              await new Promise(r => setTimeout(r, 2000));
                              notify("Transmission Success", "Dossier synchronized with Recruiter node.", "success");
                              setIsTransmitting(false);
                              setSelectedJobForTailoring(null);
                          }}
                          className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-brand-600 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-4"
                      >
                          {isTransmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                          Execute Application Protocol
                      </button>
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

export default CandidatePortal;
