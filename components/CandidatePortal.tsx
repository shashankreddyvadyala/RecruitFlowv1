
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
  PhoneCall
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, ExternalJob, Candidate, CandidateApplication, Interview } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

type TimeRangeFilter = 'TODAY' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ViewMode = 'Grid' | 'Agenda';

const TIMEZONES = [
  { label: 'My Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: 'UTC', value: 'UTC' },
  { label: 'Pacific Time', value: 'America/Los_Angeles' },
  { label: 'Eastern Time', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity, respondToJobFeedback } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings' | 'calendar'>('dashboard');
  const [jobFilter, setJobFilter] = useState<'all' | 'recruiter' | 'ai'>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [appHistoryFilter, setAppHistoryFilter] = useState<TimeRangeFilter>('ALL');
  
  // Calendar States
  const [viewMode, setViewMode] = useState<ViewMode>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  const myInterviews = useMemo(() => {
    return interviews
      .filter(i => i.candidateId === myData.id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, myData.id]);

  const upcomingCount = myInterviews.filter(i => i.status === 'Scheduled' && new Date(i.startTime) > new Date()).length;

  const [editSkills, setEditSkills] = useState<Skill[]>(myData.skills || []);
  const [editExperience, setEditExperience] = useState(myData.yearsOfExperience?.toString() || '0');
  const [editEducation, setEditEducation] = useState<Education[]>(myData.education || []);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const [profileCompleteness, setProfileCompleteness] = useState(68);
  const [isOpenToWork, setIsOpenToWork] = useState(myData.isOpenToWork || false);
  
  const [previewResume, setPreviewResume] = useState<ResumeFile | null>(null);

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, date: new Date(year, month, i) });
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const formatTime = (isoString: string, tz: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz,
            hour12: true
          }).format(new Date(isoString));
    } catch { return "N/A"; }
  };

  const formatDate = (isoString: string, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: tz
    }).format(new Date(isoString));
  };

  const addSkillNode = () => {
    setEditSkills([...editSkills, { name: '', years: 0 }]);
  };

  const updateSkillNode = (idx: number, field: keyof Skill, value: any) => {
    const updated = [...editSkills];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditSkills(updated);
  };

  const removeSkillNode = (idx: number) => {
    setEditSkills(editSkills.filter((_, i) => i !== idx));
  };

  const addEduNode = () => {
    setEditEducation([...editEducation, { degree: '', institution: '', year: '' }]);
  };

  const removeEduNode = (idx: number) => {
    setEditEducation(editEducation.filter((_, i) => i !== idx));
  };

  const updateEduNode = (idx: number, field: keyof Education, value: string) => {
    const updated = [...editEducation];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditEducation(updated);
  };

  const handleGenerateTailoredDocs = async () => {
    if (!selectedJobForTailoring) return;
    setIsTailoring(true);
    try {
      const mat = await generateApplicationMaterials(myData, selectedJobForTailoring.title, selectedJobForTailoring.company);
      setTailoredMaterials(mat);
      notify("Success", "Personalized application materials generated.", "success");
    } catch (e) {
      console.error(e);
      notify("Error", "Failed to generate materials.", "error");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleTransmitApplication = async () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setSelectedJobForTailoring(null);
      setTailoredMaterials(null);
      setActiveTab('applications');
      notify("Application Sent", "Your application has been submitted to the employer.", "success");
    }, 1500);
  };

  const handleSimulateResumeUpload = () => {
    notify("Upload", "Select a file to update your resume.", "info");
  };

  const sortedResumes = useMemo(() => {
    if (!myData.resumes) return [];
    return [...myData.resumes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [myData.resumes]);

  const handleStartTailoring = (job: any) => {
    setSelectedJobForTailoring(job);
    setActiveTab('lab');
    setTailoredMaterials(null);
  };

  const handleUpdateProfile = () => {
      setIsUpdatingProfile(true);
      setTimeout(() => {
          updateCandidateProfile(myData.id, { 
              skills: editSkills,
              yearsOfExperience: parseInt(editExperience),
              education: editEducation
          });
          
          addActivity({
            id: `act_prof_${Date.now()}`,
            type: 'ProfileUpdate',
            subject: 'Profile Updated',
            content: `${myData.firstName} updated their profile details.`,
            timestamp: new Date().toISOString(),
            author: myData.firstName,
            entityId: myData.id
          });

          notify("Profile Updated", "Your changes have been saved.", "success");
          setIsUpdatingProfile(false);
      }, 800);
  };

  const handleToggleOpenToWork = (val: boolean) => {
    setIsOpenToWork(val);
    updateCandidateProfile(myData.id, { isOpenToWork: val });
    
    addActivity({
      id: `act_otw_${Date.now()}`,
      type: 'ProfileUpdate',
      subject: val ? 'Open to Work Enabled' : 'Passive Status Enabled',
      content: `${myData.firstName} is ${val ? 'now Open to Work' : 'now browsing Passively'}.`,
      timestamp: new Date().toISOString(),
      author: myData.firstName,
      entityId: myData.id
    });

    notify(
        "Status Updated", 
        val ? "Recruiters will now see you are Open to Work." : "Your status has been set to Passive.", 
        "success"
    );
  };

  const handleJobFeedback = (jobId: string, feedback: 'like' | 'reject') => {
      respondToJobFeedback(myData.id, jobId, feedback);
      if (feedback === 'like') {
          notify("Saved", "The recruiter has been notified of your interest.", "success");
      } else {
          notify("Removed", "We won't show you this job again.", "info");
      }
  };

  const sharedJobs = useMemo(() => {
      if (!myData.sharedJobIds) return [];
      return externalJobs
        .filter(j => myData.sharedJobIds!.includes(j.id))
        .filter(j => !myData.rejectedJobIds?.includes(j.id))
        .map(j => ({
            ...j,
            matchScore: 95 + Math.floor(Math.random() * 5),
            source: 'recruiter' as const,
            isLiked: myData.likedJobIds?.includes(j.id)
        }));
  }, [myData.sharedJobIds, myData.likedJobIds, myData.rejectedJobIds, externalJobs]);

  const recommendedJobs = useMemo(() => {
    return externalJobs
      .filter(j => !myData.sharedJobIds?.includes(j.id))
      .filter(j => !myData.rejectedJobIds?.includes(j.id))
      .slice(0, 8)
      .map(j => ({
        ...j,
        matchScore: 85 + Math.floor(Math.random() * 10),
        source: 'ai' as const,
        isLiked: myData.likedJobIds?.includes(j.id)
      }));
  }, [externalJobs, myData.sharedJobIds, myData.likedJobIds, myData.rejectedJobIds]);

  const allJobs = useMemo(() => {
    const combined = [...sharedJobs, ...recommendedJobs];
    return combined.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
                             job.company.toLowerCase().includes(jobSearch.toLowerCase());
        const matchesFilter = jobFilter === 'all' || job.source === jobFilter;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [sharedJobs, recommendedJobs, jobSearch, jobFilter]);

  const filteredApplicationHistory = useMemo(() => {
    if (!myData.applicationHistory) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return myData.applicationHistory.filter(app => {
      if (appHistoryFilter === 'ALL') return true;
      
      const appDate = new Date(app.outcomeDate || app.appliedDate);
      const diffMs = now.getTime() - appDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      switch (appHistoryFilter) {
        case 'TODAY':
          return appDate >= today;
        case '7D':
          return diffDays <= 7;
        case '1M':
          return diffDays <= 30;
        case '3M':
          return diffDays <= 90;
        case '6M':
          return diffDays <= 180;
        case '1Y':
          return diffDays <= 365;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.outcomeDate || b.appliedDate).getTime() - new Date(a.outcomeDate || a.appliedDate).getTime());
  }, [myData.applicationHistory, appHistoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                R
            </div>
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
                                {isOpenToWork ? (
                                  <span className="bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-glow">Open to Work</span>
                                ) : (
                                  <span className="bg-slate-700 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Passive</span>
                                )}
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
                        <p className="text-xs text-slate-500 px-4 font-medium">Add more details to your education or skills to improve your match score.</p>
                        <button onClick={() => setActiveTab('settings')} className="mt-6 text-xs font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest flex items-center gap-2">
                            Edit Profile <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {sharedJobs.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Handpicked for You</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sharedJobs.length} Job(s)</span>
                        </div>
                        <div className="space-y-4">
                            {sharedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} onFeedback={(f) => handleJobFeedback(job.id, f)} />
                            ))}
                            {sharedJobs.length > 2 && (
                                <button onClick={() => { setActiveTab('jobs'); setJobFilter('recruiter'); }} className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                                    View All Handpicked Jobs
                                </button>
                            )}
                        </div>
                      </div>
                   )}

                   <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <BrainCircuit size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Recommended</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Matches</span>
                        </div>
                        <div className="space-y-4">
                            {recommendedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} onFeedback={(f) => handleJobFeedback(job.id, f)} />
                            ))}
                             <button onClick={() => { setActiveTab('jobs'); setJobFilter('ai'); }} className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                                View All AI Recommendations
                            </button>
                        </div>
                   </div>
                </div>
            </div>
        )}

        {activeTab === 'jobs' && (
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Job Board</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic">Explore handpicked and AI-matched jobs for your profile.</p>
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Search by title or company..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                                    value={jobSearch}
                                    onChange={e => setJobSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                                <FilterButton active={jobFilter === 'all'} onClick={() => setJobFilter('all')} label="All" />
                                <FilterButton active={jobFilter === 'recruiter'} onClick={() => setJobFilter('recruiter')} label="Handpicked" icon={<ShieldCheck size={14} />} />
                                <FilterButton active={jobFilter === 'ai'} onClick={() => setJobFilter('ai')} label="AI Matches" icon={<Sparkles size={14} />} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allJobs.length > 0 ? (
                        allJobs.map((job) => (
                            <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all flex flex-col h-full group relative overflow-hidden">
                                {job.source === 'recruiter' && (
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                        <Trophy size={10} /> Saved for You
                                    </div>
                                )}
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                        {job.company[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{job.company}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> {job.location}</p>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-8 flex-1 tracking-tight leading-tight uppercase">{job.title}</h3>
                                
                                <div className="flex items-center gap-2 mb-8">
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">Full-time</span>
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">$160k - $210k</span>
                                </div>

                                <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Match Score</span>
                                            <span className={`text-sm font-black uppercase ${job.matchScore >= 95 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
                                        </div>
                                        {job.isLiked ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                                <CheckCircle2 size={12} /> Interested
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleJobFeedback(job.id, 'reject')}
                                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                                                    title="Not Interested"
                                                >
                                                    <ThumbsDown size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleJobFeedback(job.id, 'like')}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                    title="Interested"
                                                >
                                                    <ThumbsUp size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleStartTailoring(job)}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                                    >
                                        Apply with AI Lab
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                             <Search size={48} className="text-slate-200 mx-auto mb-6" />
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No jobs match your filter</h3>
                             <p className="text-slate-500 font-medium mt-2">Try adjusting your search or clearing filters.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-12 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">My Activity</h2>
                    <p className="text-slate-500 font-medium italic mt-1">Full audit trail of your applications and verified outcomes.</p>
                  </div>
                  
                  {/* Time Range Filter Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto max-w-full no-scrollbar">
                     {(['TODAY', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRangeFilter[]).map((range) => (
                       <button
                         key={range}
                         onClick={() => setAppHistoryFilter(range)}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                           appHistoryFilter === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                         }`}
                       >
                         {range}
                       </button>
                     ))}
                  </div>
                </div>

                {/* Historical Outcome Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                           <History size={16} /> Historical Dossier & Outcomes
                        </h3>
                        <div className="flex items-center gap-3">
                           <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 uppercase tracking-widest">{filteredApplicationHistory.length} Record(s)</span>
                           <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">Verified by Agency</span>
                        </div>
                    </div>

                    {filteredApplicationHistory.length > 0 ? (
                        <div className="grid gap-6">
                            {filteredApplicationHistory.map((app) => (
                                <div key={app.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                                                    {app.company[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                            app.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            app.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                            app.status === 'Withdrawn' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-brand-50 text-brand-600 border border-brand-100'
                                                        }`}>
                                                            {app.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-200">•</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.outcomeDate || app.appliedDate}</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight">{app.jobTitle}</h4>
                                                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-2">{app.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-100">
                                                    <Briefcase size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                                <AlertCircle size={14} className="text-brand-600" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outcome Rationale & Notes</span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic relative z-10">
                                                {app.notes}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                            <History size={48} className="text-slate-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No verified historical records found for this period</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'calendar' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Interview Calendar</h2>
                        <p className="text-slate-500 font-medium italic mt-1">Manage your upcoming meetings and selection rounds.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <Globe size={14} className="text-slate-400" />
                            <select 
                                value={displayTimezone}
                                onChange={(e) => setDisplayTimezone(e.target.value)}
                                className="text-[10px] font-black uppercase outline-none bg-transparent text-slate-700"
                            >
                                {TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button 
                                onClick={() => setViewMode('Grid')} 
                                className={`p-2 rounded-lg transition-all ${viewMode === 'Grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('Agenda')} 
                                className={`p-2 rounded-lg transition-all ${viewMode === 'Agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Agenda View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'Grid' ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                            {DAYS.map(day => (
                                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {daysInMonth.map((dayObj, idx) => {
                                const dayInterviews = dayObj.date 
                                    ? myInterviews.filter(i => new Date(i.startTime).toDateString() === dayObj.date!.toDateString())
                                    : [];
                                const isToday = dayObj.date?.toDateString() === new Date().toDateString();

                                return (
                                    <div key={idx} className={`min-h-[140px] p-2 border-r border-b last:border-r-0 border-slate-100 flex flex-col gap-1 transition-colors ${!dayObj.day ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                                        <span className={`text-[10px] font-black ${isToday ? 'bg-brand-600 text-white w-6 h-6 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-brand-600/20' : 'text-slate-300'}`}>
                                            {dayObj.day}
                                        </span>
                                        <div className="flex-1 space-y-1 overflow-y-auto mt-2 px-1">
                                            {dayInterviews.map(int => (
                                                <div 
                                                    key={int.id}
                                                    onClick={() => setSelectedInterview(int)}
                                                    className={`p-1.5 rounded-lg text-[9px] font-black truncate cursor-pointer transition-all border ${
                                                        int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-brand-50 text-brand-700 border-brand-100 hover:scale-[1.02]'
                                                    }`}
                                                >
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
                    <div className="space-y-6 max-w-4xl mx-auto pb-20">
                        {myInterviews.length > 0 ? (
                            myInterviews.map((int, idx) => {
                                const isFirstOfDate = idx === 0 || new Date(myInterviews[idx-1].startTime).toDateString() !== new Date(int.startTime).toDateString();
                                return (
                                    <div key={int.id} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                        {isFirstOfDate && (
                                            <div className="mt-12 mb-6 flex items-center gap-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                                    {formatDate(int.startTime, displayTimezone)}
                                                </h4>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>
                                        )}

                                        <div 
                                            onClick={() => setSelectedInterview(int)}
                                            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all cursor-pointer flex items-center gap-8 group"
                                        >
                                            <div className="w-32 text-center border-r border-slate-100 pr-8">
                                                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatTime(int.startTime, displayTimezone)}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Local Session</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                        int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-brand-50 text-brand-600 border-brand-100 shadow-sm shadow-brand-500/10'
                                                    }`}>
                                                        {int.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-200">•</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{int.type} Interview</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{int.jobTitle}</h3>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Interviewer: {int.interviewerName}</p>
                                            </div>
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                <Calendar size={56} className="text-slate-100 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No interviews found</h3>
                                <p className="text-slate-500 font-medium mt-2">When a recruiter schedules a session, it will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'lab' && (
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">AI Application Lab</h2>
                    {selectedJobForTailoring && <button onClick={() => setSelectedJobForTailoring(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ArrowLeft size={14}/> Back to Jobs
                    </button>}
                </div>
                {selectedJobForTailoring ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/10">
                                        {selectedJobForTailoring.company[0]}
                                    </div>
                                    <p className="font-black text-lg leading-tight uppercase tracking-tight">{selectedJobForTailoring.title}</p>
                                </div>
                                <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium italic opacity-80">Using AI to tailor your resume and cover letter for this specific role.</p>
                                <button disabled={isTailoring} onClick={handleGenerateTailoredDocs} className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-3">
                                    {isTailoring ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    Generate Tailored Docs
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            {tailoredMaterials ? (
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 animate-in zoom-in-95 duration-500 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-purple-600" /> AI-Generated Cover Letter
                                    </h4>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-10 border border-slate-100 font-serif shadow-inner">
                                        {tailoredMaterials.coverLetter}
                                    </div>
                                    <button onClick={handleTransmitApplication} disabled={isTransmitting} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all">
                                        {isTransmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        Submit Application
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                        <Sparkles size={40} />
                                    </div>
                                    <p className="text-sm text-slate-400 font-black uppercase tracking-[0.2em]">Select a job and click "Generate" to see the magic.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 border-dashed group hover:border-brand-500 transition-all cursor-pointer" onClick={() => setActiveTab('jobs')}>
                        <Rocket size={56} className="text-slate-200 mx-auto mb-8 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500" />
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ready to Apply?</h3>
                        <p className="text-slate-400 font-medium mt-3 uppercase tracking-widest text-[10px]">Pick a job from the board to start tailoring your application.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">My Profile Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                        <h4 className="text-lg font-black flex items-center gap-4 text-slate-900 uppercase tracking-tight">
                            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                                <User size={24} />
                            </div>
                            Core Information
                        </h4>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Skills</label>
                                    <button onClick={addSkillNode} className="text-[10px] font-black text-brand-600 flex items-center gap-1 hover:underline uppercase tracking-widest">
                                        <Plus size={14}/> Add Skill
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {editSkills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center gap-3 animate-in fade-in duration-300">
                                            <input 
                                                type="text"
                                                value={skill.name}
                                                onChange={(e) => updateSkillNode(idx, 'name', e.target.value)}
                                                className="flex-1 px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold text-slate-900 shadow-inner"
                                                placeholder="e.g. React"
                                            />
                                            <input 
                                                type="number"
                                                value={skill.years}
                                                onChange={(e) => updateSkillNode(idx, 'years', parseInt(e.target.value))}
                                                className="w-20 px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold text-slate-900 shadow-inner"
                                                placeholder="Y"
                                            />
                                            <button onClick={() => removeSkillNode(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Work Experience (Years)</label>
                                    <input 
                                        type="number"
                                        value={editExperience}
                                        onChange={(e) => setEditExperience(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-black text-slate-900 shadow-inner"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Education History</label>
                                        <button onClick={addEduNode} className="text-[10px] font-black text-brand-600 flex items-center gap-1 hover:underline uppercase tracking-widest">
                                            <Plus size={14}/> Add School
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {editEducation.map((edu, idx) => (
                                            <div key={idx} className="p-6 bg-slate-50 border-none rounded-2xl space-y-4 relative shadow-inner animate-in fade-in duration-300">
                                                <button onClick={() => removeEduNode(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16}/>
                                                </button>
                                                <input 
                                                    placeholder="Degree (e.g. MS in Computer Science)"
                                                    value={edu.degree}
                                                    onChange={e => updateEduNode(idx, 'degree', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input 
                                                        placeholder="University Name"
                                                        value={edu.institution}
                                                        onChange={e => updateEduNode(idx, 'institution', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
                                                    />
                                                    <input 
                                                        placeholder="Year Graduated"
                                                        value={edu.year}
                                                        onChange={e => updateEduNode(idx, 'year', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleUpdateProfile}
                                disabled={isUpdatingProfile}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Save Profile Changes
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-24 -mt-24"></div>
                             <h4 className="text-brand-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <FileCheck size={20} /> My Documents
                             </h4>
                             <div className="space-y-4 mb-10">
                                {sortedResumes.length > 0 ? (
                                    sortedResumes.map((resume, idx) => (
                                        <div key={resume.id} className={`p-5 rounded-2xl border transition-all flex justify-between items-center group/item ${idx === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black truncate text-white uppercase tracking-tight">{resume.name}</p>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Added {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                                {idx === 0 && <span className="inline-block mt-2 bg-brand-600 text-white text-[8px] font-black px-2.5 py-1 rounded uppercase tracking-[0.2em] shadow-lg">Current</span>}
                                            </div>
                                            <button 
                                                onClick={() => setPreviewResume(resume)}
                                                className="p-3 bg-white/10 text-white rounded-xl hover:bg-brand-600 transition-all opacity-0 group-hover/item:opacity-100"
                                                title="Preview Resume"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <FileText size={32} className="mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No resumes uploaded</p>
                                    </div>
                                )}
                             </div>
                             <div className="mt-auto">
                                <button onClick={() => handleSimulateResumeUpload} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                                    <Upload size={18} /> Upload New Resume
                                </button>
                             </div>
                         </div>

                         <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                            <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                    <ShieldCheck size={20} />
                                </div>
                                Availability Status
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                            <Star size={12} className="fill-emerald-500" /> Open to Work
                                        </span>
                                        <span className="text-[9px] text-emerald-600 font-medium mt-1">Get prioritized for matching roles</span>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleOpenToWork(true)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isOpenToWork ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${isOpenToWork ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Passive</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-1">Only show roles for specific tech stack</span>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleOpenToWork(false)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${!isOpenToWork ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${!isOpenToWork ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Session Detail Drawer (Calendar) */}
      {selectedInterview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-md flex items-center justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedInterview(null)}></div>
          <div className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        {selectedInterview.location ? <Video size={24}/> : <PhoneCall size={24}/>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{selectedInterview.candidateName}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedInterview.type} Selection Round</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedInterview(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                    <X size={24} />
                 </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Time</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{formatTime(selectedInterview.startTime, displayTimezone)}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Calendar Date</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{new Date(selectedInterview.startTime).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedInterview.location && (
                 <a href={selectedInterview.location} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-600/20">
                    <Video size={20} /> Join Secure Meeting Room
                 </a>
              )}

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Info size={14} className="text-brand-600" /> Preparation Notes
                 </h4>
                 <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed italic shadow-inner">
                    {selectedInterview.notes || "No additional preparation notes provided by the recruiter."}
                 </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                 <h4 className="text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Role Insight</h4>
                 <p className="text-lg font-black uppercase tracking-tight leading-tight">{selectedInterview.jobTitle}</p>
                 <p className="text-slate-400 text-xs mt-3 font-medium">Please ensure your camera and microphone are calibrated 5 minutes prior to the session start time.</p>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setSelectedInterview(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Return to Calendar
                </button>
            </div>
          </div>
        </div>
      )}

      {previewResume && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setPreviewResume(null)}></div>
            <div className="relative w-full max-w-4xl h-[90vh] bg-slate-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{previewResume.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Uploaded Document • v2.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 hidden sm:block">Last Modified: {new Date(previewResume.updatedAt).toLocaleString()}</span>
                        <button 
                            onClick={() => setPreviewResume(null)}
                            className="p-3 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-slate-100 flex justify-center">
                    <div className="bg-white w-full max-w-[800px] shadow-xl p-16 font-serif relative overflow-hidden border border-slate-200 rounded-sm">
                        <div className="absolute top-10 right-10 opacity-10 pointer-events-none transform rotate-12">
                             <div className="w-24 h-24 bg-brand-600 rounded-full blur-2xl"></div>
                        </div>

                        <div className="border-b-2 border-slate-900 pb-10 mb-10 text-center">
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">{myData.firstName} {myData.lastName}</h1>
                            <div className="flex justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest italic">
                                <span>{myData.role}</span>
                                <span>•</span>
                                <span>{myData.email}</span>
                                <span>•</span>
                                <span>San Francisco, CA</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12 text-left">
                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Professional Summary</h2>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    Highly analytical and results-oriented {myData.role} with over {myData.yearsOfExperience} years of experience in architecting scalable systems.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Core Skills</h2>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-12">
                                    {myData.skills.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-tight">
                                            <span>{s.name}</span>
                                            <span className="text-slate-400 font-medium italic">{s.years} Years</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Experience</h2>
                                <div className="space-y-10">
                                    <div className="relative pl-6 border-l-2 border-slate-900">
                                        <div className="absolute -left-[7px] top-0 w-3 h-3 bg-slate-900 rounded-full"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-sm uppercase text-slate-900">Lead Systems Engineer</h3>
                                            <span className="text-[10px] font-black text-slate-400">2021 — PRESENT</span>
                                        </div>
                                        <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">TechStream Global</p>
                                        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                                            <li>Orchestrated the migration of legacy monolith to a microservices-based distributed architecture.</li>
                                            <li>Developed automated CI/CD pipelines that reduced deployment latency by 65%.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Education</h2>
                                <div className="space-y-4">
                                    {myData.education?.map((edu, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center text-xs font-black text-slate-900 uppercase">
                                                <span>{edu.degree}</span>
                                                <span className="text-slate-400">{edu.year}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{edu.institution}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Digitally Verified Resume • RecruitFlow Intelligence</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <footer className="py-12 border-t border-slate-200 px-6 lg:px-12 flex items-center justify-between bg-white mt-auto">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">RecruitFlow-v2.6.0-PORTAL</p>
          <div className="flex items-center gap-8 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
              <a href="#" className="hover:text-brand-600 transition-all">Privacy Policy</a>
              <a href="#" className="hover:text-brand-600 transition-all">Terms of Use</a>
          </div>
      </footer>
    </div>
  );
};

const JobDashboardCard: React.FC<{ job: any; onApply: () => void; onFeedback?: (feedback: 'like' | 'reject') => void }> = ({ job, onApply, onFeedback }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all flex flex-col md:flex-row items-center gap-6 group relative overflow-hidden">
         {job.source === 'recruiter' && (
            <div className="absolute top-0 right-0 p-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
         )}
         <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
            {job.company[0]}
         </div>
         <div className="flex-1 text-center md:text-left min-w-0">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{job.title}</h4>
                {job.source === 'recruiter' && <ShieldCheck size={14} className="text-emerald-500" title="Handpicked by Recruiter" />}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.company} • {job.location}</p>
         </div>
         <div className="flex flex-col items-center md:items-end shrink-0 gap-3">
             <span className={`text-[11px] font-black uppercase tracking-tighter ${job.matchScore >= 95 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
             
             <div className="flex items-center gap-2">
                {job.isLiked ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">
                        Interested
                    </span>
                ) : (
                    <>
                        {onFeedback && (
                            <div className="flex items-center gap-1 mr-2">
                                <button 
                                    onClick={() => onFeedback('reject')}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                                    title="Not Interested"
                                >
                                    <ThumbsDown size={14} />
                                </button>
                                <button 
                                    onClick={() => onFeedback('like')}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                    title="Interested"
                                >
                                    <ThumbsUp size={14} />
                                </button>
                            </div>
                        )}
                        <button onClick={onApply} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-md">
                            Details
                        </button>
                    </>
                )}
             </div>
         </div>
    </div>
);

const FilterButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
    >
        {icon}
        {label}
    </button>
);

const NavTab = ({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) => (
    <button 
        onClick={onClick}
        className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all relative ${active ? 'bg-white text-slate-900 shadow-xl border border-slate-200 ring-4 ring-black/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'}`}
    >
        <span className={`${active ? 'text-brand-600' : ''}`}>{icon}</span> 
        <span className="hidden sm:inline">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {badge}
            </span>
        )}
    </button>
);

export default CandidatePortal;
