
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
  CalendarCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, ExternalJob, Candidate, CandidateApplication, Interview } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

type TimeRangeFilter = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
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
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity, respondToJobFeedback, addInterview } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings' | 'calendar'>('dashboard');
  const [jobFilter, setJobFilter] = useState<'all' | 'recruiter' | 'ai'>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [appHistoryFilter, setAppHistoryFilter] = useState<TimeRangeFilter>('ALL');
  
  // Calendar States
  const [viewMode, setViewMode] = useState<ViewMode>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  // For scheduling: Filter jobs shared with the candidate
  const myOpportunities = useMemo(() => {
    return externalJobs.filter(j => myData.sharedJobIds?.includes(j.id));
  }, [externalJobs, myData.sharedJobIds]);

  const [newInt, setNewInt] = useState({
    jobId: '',
    type: 'Technical' as Interview['type'],
    date: '',
    time: '',
    notes: ''
  });

  const myInterviews = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return interviews
      .filter(i => i.candidateId === myData.id)
      .filter(i => {
        // Status Filter
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;

        // Time Range Filter
        if (timeRange === 'ALL') return true;

        const startTime = new Date(i.startTime);
        const diffMs = startTime.getTime() - startOfToday.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (timeRange) {
          case '1D': return diffDays >= 0 && diffDays < 1;
          case '7D': return diffDays >= 0 && diffDays < 7;
          case '1M': return diffDays >= 0 && diffDays < 30;
          case '3M': return diffDays >= 0 && diffDays < 90;
          case '6M': return diffDays >= 0 && diffDays < 180;
          case '1Y': return diffDays >= 0 && diffDays < 365;
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

  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const job = externalJobs.find(j => j.id === newInt.jobId);
    
    if (!job || !newInt.date || !newInt.time) {
        notify("Required Fields", "Please select an opportunity and time.", "error");
        return;
    }

    const start = new Date(`${newInt.date}T${newInt.time}`);
    const end = new Date(start.getTime() + 45 * 60 * 1000);

    const interview: Interview = {
      id: `int_cand_${Date.now()}`,
      candidateId: myData.id,
      candidateName: `${myData.firstName} ${myData.lastName}`,
      jobId: job.id,
      jobTitle: job.title,
      interviewerName: 'Agency Coordinator',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: 'https://meet.google.com/abc-def-ghi',
      status: 'Scheduled',
      type: newInt.type,
      notes: newInt.notes,
      candidateTimezone: displayTimezone
    };

    addInterview(interview);
    setShowScheduleModal(false);
    
    addActivity({
      id: `act_cand_sched_${Date.now()}`,
      type: 'Meeting',
      subject: 'Interview Proposed',
      content: `${myData.firstName} scheduled a new session for the ${job.title} round.`,
      timestamp: new Date().toISOString(),
      author: myData.firstName,
      entityId: myData.id
    });

    notify("Session Provisioned", `Your selection round for ${job.title} has been synchronized.`, "success");

    setNewInt({ 
      jobId: '',
      type: 'Technical', 
      date: '', 
      time: '', 
      notes: ''
    });
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
        case '1D':
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

  const timeOptions: { label: string, value: TimeRangeFilter }[] = [
    { label: '1D', value: '1D' }, 
    { label: '7D', value: '7D' }, 
    { label: '1M', value: '1M' }, 
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' }, 
    { label: '1Y', value: '1Y' }, 
    { label: 'ALL', value: 'ALL' },
  ];

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
                        <p className="text-xs text-slate-500 font-medium">Complete your record to boost match accuracy.</p>
                    </div>
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

                        <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2">
                            <Plus size={16} /> Provision Session
                        </button>

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

                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                       {timeOptions.map((opt) => (
                         <button
                           key={opt.value}
                           onClick={() => setTimeRange(opt.value)}
                           className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                             timeRange === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                           }`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {viewMode === 'Grid' ? (
                            <>
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight w-48 text-center">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
                            </>
                        ) : (
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight ml-4">Timeline View</h3>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="All">All</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {viewMode === 'Grid' ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
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
                                                        int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-brand-50 text-brand-700 border-brand-100 hover:scale-[1.02]'
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
                                                <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Session Time</p>
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
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{int.type} Selection Round</span>
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
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No sessions found</h3>
                                <p className="text-slate-500 font-medium mt-2">When a recruiter schedules a session, it will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
        
        {/* Provision Session Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <CalendarCheck size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Provision Session</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Sourced Selection Round</p>
                      </div>
                  </div>
                  <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                      <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleCreateInterview} className="p-8 space-y-6">
                  <div className="space-y-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Opportunity</label>
                          <select required value={newInt.jobId} onChange={e => setNewInt({...newInt, jobId: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner">
                              <option value="">Select Opportunity...</option>
                              {myOpportunities.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Session Type</label>
                          <select required value={newInt.type} onChange={e => setNewInt({...newInt, type: e.target.value as any})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner">
                              <option value="Technical">Technical Round</option>
                              <option value="Culture">Cultural Fit</option>
                              <option value="Screening">Initial Screening</option>
                          </select>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Session Date</label>
                          <input type="date" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newInt.date} onChange={e => setNewInt({...newInt, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Time</label>
                          <input type="time" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newInt.time} onChange={e => setNewInt({...newInt, time: e.target.value})} />
                      </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pre-Session Notes (Visible to Recruiter)</label>
                     <textarea 
                      value={newInt.notes}
                      onChange={e => setNewInt({...newInt, notes: e.target.value})}
                      placeholder="Provide availability context or questions for the recruiter..."
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner resize-none h-24"
                     />
                  </div>

                  <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-center gap-3">
                      <Sparkles size={18} className="text-brand-600" />
                      <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide leading-relaxed">
                          Tip: Scheduling this round will notify your Lead Talent Partner and sync with the Agency Grid instantly.
                      </p>
                  </div>

                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                      Propose Round & Sync Across Portals
                  </button>
               </form>
            </div>
          </div>
        )}

        {/* Interview Detail Drawer */}
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
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <button onClick={() => setSelectedInterview(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                      Return to Calendar
                  </button>
              </div>
            </div>
          </div>
        )}
      </main>
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
