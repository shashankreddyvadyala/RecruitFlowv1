
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
  DollarSign,
  ClipboardList,
  Shield,
  ZapIcon,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, Interview, WorkExperience } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

interface AdvancedFilters {
  type: string[];
  workMode: string[];
  experience: string[];
  salaryMin: string;
  postedDate: string;
  visaSponsorship: string;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings' | 'calendar'>('dashboard');
  const [jobSearch, setJobSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  
  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    experience: [],
    salaryMin: 'All',
    postedDate: 'All',
    visaSponsorship: 'All'
  });
  
  // Profile Context
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];
  
  // Local States
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
    linkedin: myData.socialLinks?.linkedin || '',
    github: myData.socialLinks?.github || '',
    portfolio: myData.socialLinks?.portfolio || ''
  });

  // Date Formatting Helper: MM-DD-YYYY
  const formatToMMDDYYYY = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 1000));
    updateCandidateProfile(myData.id, {
        ...profileForm,
        socialLinks: { linkedin: profileForm.linkedin, github: profileForm.github, portfolio: profileForm.portfolio }
    });
    setIsUpdating(false);
    setIsEditingProfile(false);
    setIsEditingAlignment(false);
    notify("Updated", "Profile DNA synchronized.", "success");
  };

  const recruiterHandpickedJobs = useMemo(() => {
    if (!myData.sharedJobIds) return [];
    return externalJobs.filter(j => myData.sharedJobIds!.includes(j.id)).slice(0, 3);
  }, [myData.sharedJobIds, externalJobs]);

  const aiSuggestedJobs = useMemo(() => {
    // Exclude jobs already shared by recruiter to keep suggestions fresh
    const pool = externalJobs.filter(j => !myData.sharedJobIds?.includes(j.id));
    return pool.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 3);
  }, [externalJobs, myData.sharedJobIds]);

  const filteredJobs = useMemo(() => {
    return externalJobs.filter(job => {
      // Basic Search
      const matchesSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
                           job.company.toLowerCase().includes(jobSearch.toLowerCase());
      const matchesLocation = job.location.toLowerCase().includes(locationSearch.toLowerCase());
      
      if (!matchesSearch || !matchesLocation) return false;

      // Advanced Filters
      if (filters.type.length > 0 && !filters.type.includes(job.type)) return false;
      
      if (filters.workMode.length > 0) {
        const jobLoc = job.location.toLowerCase();
        const matchesMode = filters.workMode.some(m => 
          jobLoc.includes(m.toLowerCase()) || (m === 'Remote' && jobLoc === 'remote')
        );
        if (!matchesMode) return false;
      }

      if (filters.visaSponsorship !== 'All') {
        const offers = filters.visaSponsorship === 'Offers';
        if (job.visaSponsorship !== offers) return false;
      }

      if (filters.salaryMin !== 'All') {
        const minVal = parseInt(filters.salaryMin.replace('k', '')) * 1000;
        const jobSalaryRaw = job.salary ? job.salary.replace(/[^0-9]/g, '') : '0';
        const jobSalary = parseInt(jobSalaryRaw) || 0;
        if (jobSalary < minVal) return false;
      }

      if (filters.postedDate !== 'All') {
        if (filters.postedDate === '24h' && !job.postedAt.includes('h')) return false;
        if (filters.postedDate === '7d' && job.postedAt.includes('m')) return false; 
      }

      return true;
    });
  }, [externalJobs, jobSearch, locationSearch, filters]);

  const toggleFilter = (category: keyof AdvancedFilters, value: string) => {
    setFilters(prev => {
        if (category === 'postedDate' || category === 'salaryMin' || category === 'visaSponsorship') {
            return { ...prev, [category]: value };
        }

        const current = prev[category] as string[];
        const updated = current.includes(value) 
            ? current.filter(v => v !== value)
            : [...current, value];
        return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
        type: [],
        workMode: [],
        experience: [],
        salaryMin: 'All',
        postedDate: 'All',
        visaSponsorship: 'All'
    });
    setJobSearch('');
    setLocationSearch('');
  };

  const hasActiveFilters = filters.type.length > 0 || filters.workMode.length > 0 || filters.salaryMin !== 'All' || filters.postedDate !== 'All' || filters.visaSponsorship !== 'All';

  const upcomingInterviews = interviews.filter(i => i.candidateId === myData.id && i.status === 'Scheduled');

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);

  const handleStartTailoring = async (job: any) => {
    setSelectedJobForTailoring(job);
    setIsTailoring(true);
    try {
      const mat = await generateApplicationMaterials(myData, job.title, job.company);
      setTailoredMaterials(mat);
    } catch (e) {
      notify("Error", "Synthesis failed.", "error");
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className="w-64 bg-slate-950 text-white flex flex-col h-full border-r border-white/5 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-600 text-white font-black text-lg shadow-lg shrink-0">
            {branding.companyName[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold truncate uppercase tracking-widest text-white">{branding.companyName}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-4">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={18}/>} label="Overview" />
          <SidebarLink active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={18}/>} label="Find Jobs" />
          <SidebarLink active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={18}/>} label="My Activity" />
          <SidebarLink active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={18}/>} label="Interviews" badge={upcomingInterviews.length} />
          <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={18}/>} label="Profile" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 transition-all font-bold text-[10px] uppercase tracking-widest">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-8 sticky top-0 z-40">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {activeTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-brand-600 relative"><Bell size={18} /></button>
                <img src={myData.avatarUrl} className="h-7 w-7 rounded-full object-cover border border-slate-200" />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Welcome back, {myData.firstName}.</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-md">Your profile is 85% complete. Update your availability to boost matching scores.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                           <Star size={20} className="text-brand-500" /> Recommended Roles
                         </h3>
                      </div>
                      
                      <div className="space-y-6">
                          {/* RECRUITER PICKED */}
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 px-1">
                                <Shield size={14} className="text-brand-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recruiter Endorsed</span>
                             </div>
                             {recruiterHandpickedJobs.length > 0 ? recruiterHandpickedJobs.map(job => (
                                <JobSummaryCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} tag="Top Pick" />
                             )) : (
                                <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 border-dashed text-slate-400 text-[10px] font-bold uppercase">No specific node sharing detected</div>
                             )}
                          </div>

                          {/* AI SUGGESTED */}
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 px-1">
                                <Sparkles size={14} className="text-purple-600" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Matching Nodes</span>
                             </div>
                             {aiSuggestedJobs.map(job => (
                                <JobSummaryCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} tag="AI Match" isAI />
                             ))}
                          </div>

                          <button 
                            onClick={() => setActiveTab('jobs')}
                            className="w-full py-4 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                          >
                             See more opportunities <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                      </div>
                  </div>
                  <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><CalendarIcon size={20} className="text-purple-500" /> Upcoming Sessions</h3>
                        <div className="space-y-3">
                            {upcomingInterviews.length > 0 ? upcomingInterviews.map(int => (
                                <div key={int.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Video size={20}/></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{int.jobTitle}</h4>
                                            {/* Fix: Standardized to MM-DD-YYYY */}
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatToMMDDYYYY(int.startTime)} • {new Date(int.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-black text-brand-600 uppercase underline decoration-2">Join</button>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 border-dashed text-slate-400 text-xs font-medium italic">No scheduled interviews.</div>
                            )}
                        </div>
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatusCard label="Active Applications" value={myData.applicationHistory?.filter(a => a.status === 'In Progress' || a.status === 'Active').length || 0} icon={<Rocket size={18}/>} color="text-brand-600" />
                    <StatusCard label="Interviews" value={upcomingInterviews.length} icon={<Video size={18}/>} color="text-purple-600" />
                    <StatusCard label="Offers" value={myData.applicationHistory?.filter(a => a.status === 'Offer').length || 0} icon={<Award size={18}/>} color="text-emerald-600" />
                    <StatusCard label="Archived" value={myData.applicationHistory?.filter(a => a.status === 'Rejected' || a.status === 'Hired').length || 0} icon={<Archive size={18}/>} color="text-slate-400" />
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList size={18} className="text-brand-600" /> Application History
                        </h3>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-slate-900 transition-all">All History</button>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                        {myData.applicationHistory && myData.applicationHistory.length > 0 ? (
                            myData.applicationHistory.map(app => (
                                <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">{app.company[0]}</div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900">{app.jobTitle}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{app.company}</span>
                                                    <span className="text-slate-300">•</span>
                                                    {/* Fix: Standardized to MM-DD-YYYY */}
                                                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1"><Clock size={10}/> Applied {formatToMMDDYYYY(app.appliedDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current State</p>
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${
                                                    app.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    app.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    app.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                    {app.status}
                                                </div>
                                            </div>
                                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={18} /></button>
                                        </div>
                                    </div>
                                    {app.notes && (
                                        <div className="mt-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                            "{app.notes}"
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center text-slate-400">
                                <Rocket size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No activity nodes detected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
                {/* MARKET EXPLORER HEADER */}
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Explorer</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Live Global Job Feed Synchronization</p>
                        </div>
                        <div className="flex items-center gap-3">
                           {hasActiveFilters && (
                              <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">
                                <Undo2 size={14} /> Reset Configuration
                              </button>
                           )}
                           <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvanced ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                              <Settings2 size={16} /> Advanced Filters
                           </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-[2] relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by role or company..." 
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" 
                                value={jobSearch} 
                                onChange={e => setJobSearch(e.target.value)} 
                            />
                        </div>
                        <div className="flex-1 relative group">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Location..." 
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" 
                                value={locationSearch} 
                                onChange={e => setLocationSearch(e.target.value)} 
                            />
                        </div>
                        <button onClick={() => setShowAdvanced(false)} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                            <Search size={18} /> Search
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <ZapIcon size={12} className="text-brand-500" /> Work Protocol
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Full-time', 'Contract', 'Freelance'].map(t => (
                                            <TagButton key={t} active={filters.type.includes(t)} onClick={() => toggleFilter('type', t)} label={t} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <Globe size={12} className="text-brand-500" /> Environment
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Remote', 'Hybrid', 'On-site'].map(m => (
                                            <TagButton key={m} active={filters.workMode.includes(m)} onClick={() => toggleFilter('workMode', m)} label={m} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <DollarSign size={12} className="text-brand-500" /> Salary Node
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', '100k', '120k', '150k', '200k'].map(s => (
                                            <TagButton key={s} active={filters.salaryMin === s} onClick={() => toggleFilter('salaryMin', s)} label={s === 'All' ? 'All ranges' : `${s}+`} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <Clock size={12} className="text-brand-500" /> Fresh Posting
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', '24h', '7d'].map(p => (
                                            <TagButton key={p} active={filters.postedDate === p} onClick={() => toggleFilter('postedDate', p)} label={p === 'All' ? 'Any time' : `< ${p}`} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <ShieldCheck size={12} className="text-emerald-500" /> Visa Protocol
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ label: 'Sponsorship Only', value: 'Offers' }, { label: 'All Protocols', value: 'All' }].map(v => (
                                            <TagButton key={v.value} active={filters.visaSponsorship === v.value} onClick={() => toggleFilter('visaSponsorship', v.value)} label={v.label} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <Award size={12} className="text-purple-500" /> Experience
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Junior', 'Mid', 'Senior', 'Staff'].map(e => (
                                            <TagButton key={e} active={filters.experience.includes(e)} onClick={() => toggleFilter('experience', e)} label={e} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* JOBS LIST (RECRUITER STYLE) */}
                <div className="grid gap-6">
                    {filteredJobs.length > 0 ? filteredJobs.map(job => (
                        <div key={job.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 transition-all group hover:shadow-2xl hover:border-brand-500 cursor-pointer relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    {job.company[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors">{job.title}</h3>
                                            {job.visaSponsorship && (
                                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                    <ShieldCheck size={10} /> Sponsorship Node
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{job.postedAt} • {job.source}</span>
                                    </div>
                                    <p className="text-brand-600 font-black text-[11px] uppercase tracking-widest mb-4">{job.company}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <InfoTag icon={<MapPin size={12}/>} text={job.location} />
                                        <InfoTag icon={<DollarSign size={12}/>} text={job.salary || '$140k+'} />
                                        <InfoTag icon={<Globe size={12}/>} text={job.type} />
                                    </div>
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-4">
                                    <div className="text-right">
                                        <span className={`text-sm font-black tracking-tighter ${job.matchScore! >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>
                                            {job.matchScore || 0}% Match
                                        </span>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Neural Rank</p>
                                    </div>
                                    <button onClick={() => handleStartTailoring(job)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-brand-600 transition-all opacity-0 group-hover:opacity-100 transition-opacity">
                                        Tailor Profile <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                             <Search size={56} className="text-slate-100 mx-auto mb-6" />
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No opportunities detected</h3>
                             <p className="text-slate-400 mt-2 font-medium italic">Adjust your search parameters or advanced settings.</p>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-10">
                    <img src={myData.avatarUrl} className="w-32 h-32 rounded-[2rem] object-cover shadow-lg border-2 border-white" />
                    <div className="flex-1">
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{myData.firstName} {myData.lastName}</h2>
                        <div className="flex gap-3">
                            <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">{myData.role}</span>
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest">Active Seek Node</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2"><User size={14}/> Identity Settings</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">First Name</label>
                                <input value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Job Title</label>
                                <input value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner" />
                            </div>
                            <button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14}/>} Update Identity
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl space-y-6 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[60px] opacity-10 -mr-16 -mb-16"></div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2 relative z-10"><Target size={14}/> Market Calibration</h4>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Salary Floor</label>
                                <input value={profileForm.salaryExpectation} onChange={e => setProfileForm({...profileForm, salaryExpectation: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-brand-500 outline-none" placeholder="$150k+" />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Visa Policy</label>
                                <select value={profileForm.workAuthorization} onChange={e => setProfileForm({...profileForm, workAuthorization: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-brand-500 outline-none appearance-none cursor-pointer">
                                    <option className="bg-slate-900" value="Not Required">Native / Authorized</option>
                                    <option className="bg-slate-900" value="Requires Sponsorship">Requires Sponsorship</option>
                                </select>
                            </div>
                            <button onClick={handleUpdateProfile} className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-50 transition-all">Sync Alignment</button>
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* TAILORING DRAWER MODAL */}
      {(selectedJobForTailoring || isTailoring) && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                  <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                              {isTailoring ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="text-brand-400" />}
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">AI Persona Sync</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedJobForTailoring?.title} @ {selectedJobForTailoring?.company}</p>
                          </div>
                      </div>
                      <button onClick={() => { setSelectedJobForTailoring(null); setTailoredMaterials(null); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl shadow-sm active:scale-90 transition-all">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8">
                      {isTailoring ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 animate-pulse border border-brand-100">
                                  <BrainCircuit size={40} className="text-brand-600" />
                              </div>
                              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Analyzing DNA Mismatch</h4>
                              <p className="text-slate-500 text-sm max-w-xs font-medium leading-relaxed italic">Synthesizing a tailored cover letter and summary node for this specific opportunity.</p>
                          </div>
                      ) : tailoredMaterials ? (
                          <div className="space-y-8">
                              <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16"></div>
                                  <div className="relative z-10">
                                      <h4 className="text-brand-400 text-[9px] font-black uppercase tracking-[0.3em] mb-4">Neural Trajectory Summary</h4>
                                      <p className="text-base font-medium leading-relaxed italic">{tailoredMaterials.tailoredResumeSummary}</p>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><FileText size={16} /> Tailored Submission</h4>
                                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap shadow-inner max-h-[300px] overflow-y-auto no-scrollbar">
                                      {tailoredMaterials.coverLetter}
                                  </div>
                              </div>
                          </div>
                      ) : null}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100">
                      <button 
                          disabled={!tailoredMaterials}
                          onClick={() => {
                              notify("Success", "Application synchronized with Recruiter.", "success");
                              setSelectedJobForTailoring(null);
                          }}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-brand-600 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                      >
                          <Send size={16} /> Finalize application
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
    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all group ${
      active 
        ? 'bg-brand-600 text-white shadow-xl' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'} transition-colors`}>{icon}</span>
        <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    </div>
    {badge ? <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-red-400">{badge}</span> : null}
  </button>
);

const TagButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${active ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
      {label}
  </button>
);

const InfoTag: React.FC<{ icon: any; text: string; highlighted?: boolean }> = ({ icon, text, highlighted }) => (
    <span className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${highlighted ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
      {icon} {text}
    </span>
);

const JobSummaryCard: React.FC<{ job: any; onApply: () => void; tag?: string; isAI?: boolean }> = ({ job, onApply, tag, isAI }) => (
    <div className={`bg-white p-5 rounded-2xl border ${isAI ? 'border-purple-100' : 'border-slate-100'} shadow-sm hover:shadow-lg transition-all flex items-center gap-5 group relative overflow-hidden`}>
         <div className={`w-12 h-12 ${isAI ? 'bg-purple-900' : 'bg-slate-900'} text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
            {job.company[0]}
         </div>
         <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">{job.title}</h4>
                {tag && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isAI ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-brand-50 text-brand-600 border border-brand-100'}`}>
                        {tag}
                    </span>
                )}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{job.company} • {job.location}</p>
         </div>
         <div className="flex flex-col items-end gap-2 pl-4">
            <span className={`text-[11px] font-black tracking-tighter ${job.matchScore! >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>{job.matchScore}%</span>
            <button onClick={onApply} className="p-2.5 bg-slate-50 text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"><ArrowRight size={16}/></button>
         </div>
    </div>
);

const StatusCard = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) => (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

export default CandidatePortal;
