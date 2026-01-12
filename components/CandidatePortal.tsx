
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
  Eye
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';
import { Education, Skill, ResumeFile, ExternalJob } from '../types';

interface CandidatePortalProps {
  onLogout: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile, addActivity } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings'>('dashboard');
  const [jobFilter, setJobFilter] = useState<'all' | 'recruiter' | 'ai'>('all');
  const [jobSearch, setJobSearch] = useState('');
  
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  const [editSkills, setEditSkills] = useState<Skill[]>(myData.skills || []);
  const [editExperience, setEditExperience] = useState(myData.yearsOfExperience?.toString() || '0');
  const [editEducation, setEditEducation] = useState<Education[]>(myData.education || []);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const [profileCompleteness, setProfileCompleteness] = useState(68);
  const [isPassiveMode, setIsPassiveMode] = useState(false);
  const [isOpenToWork, setIsOpenToWork] = useState(myData.isOpenToWork || false);
  
  // Resume Preview State
  const [previewResume, setPreviewResume] = useState<ResumeFile | null>(null);

  const sortedResumes = useMemo(() => {
    if (!myData.resumes) return [];
    return [...myData.resumes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [myData.resumes]);

  const [myApplications, setMyApplications] = useState([
    { id: 'ap1', role: 'Senior React Engineer', company: 'TechFlow Inc', status: 'Interview', date: '2 days ago', progress: 85, feedback: 'Technical score was exceptional (96/100).', steps: ['Applied', 'Viewed', 'Screened', 'Interview'] },
    { id: 'ap2', role: 'Staff Frontend Developer', company: 'CloudScale', status: 'Screened', date: '5 days ago', progress: 45, feedback: 'Moving to final round based on profile match.', steps: ['Applied', 'Viewed', 'Screened'] },
    { id: 'ap3', role: 'Lead Architect', company: 'GlobalData', status: 'Applied', date: '1 week ago', progress: 15, feedback: 'Awaiting review.', steps: ['Applied'] },
  ]);

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
          
          // Log Activity for Recruiter
          addActivity({
            id: `act_prof_${Date.now()}`,
            type: 'ProfileUpdate',
            subject: 'Candidate Profile Updated',
            content: `${myData.firstName} updated their tech stack and professional experience in the portal.`,
            timestamp: new Date().toISOString(),
            author: myData.firstName,
            entityId: myData.id
          });

          notify("Profile Synchronized", "Your latest credentials have been transmitted to the agency.", "success");
          setIsUpdatingProfile(false);
      }, 800);
  };

  const handleToggleOpenToWork = (val: boolean) => {
    setIsOpenToWork(val);
    updateCandidateProfile(myData.id, { isOpenToWork: val });
    
    addActivity({
      id: `act_otw_${Date.now()}`,
      type: 'ProfileUpdate',
      subject: val ? 'Open to Work Enabled' : 'Open to Work Disabled',
      content: `${myData.firstName} is ${val ? 'now' : 'no longer'} actively seeking new opportunities. Match priority ${val ? 'increased' : 'returned to normal'}.`,
      timestamp: new Date().toISOString(),
      author: myData.firstName,
      entityId: myData.id
    });

    notify(
        val ? "Priority Active" : "Status Updated", 
        val ? "AI agents will now prioritize your dossier for new job matches." : "Your availability status has been updated.", 
        "success"
    );
  };

  const addSkillNode = () => {
    setEditSkills([...editSkills, { name: '', years: 0 }]);
  };

  const removeSkillNode = (i: number) => {
    const updated = [...editSkills];
    updated.splice(i, 1);
    setEditSkills(updated);
  };

  const updateSkillNode = (i: number, field: keyof Skill, val: any) => {
    const updated = [...editSkills];
    updated[i] = { ...updated[i], [field]: val };
    setEditSkills(updated);
  };

  const addEduNode = () => {
    setEditEducation([...editEducation, { institution: '', degree: '', year: '' }]);
  };

  const removeEduNode = (i: number) => {
    const updated = [...editEducation];
    updated.splice(i, 1);
    setEditEducation(updated);
  };

  const updateEduNode = (i: number, field: keyof Education, val: string) => {
    const updated = [...editEducation];
    updated[i] = { ...updated[i], [field]: val };
    setEditEducation(updated);
  };

  const handleSimulateResumeUpload = () => {
      const names = ['resume_v2.pdf', 'engineering_cv.pdf', 'latest_cv_2025.pdf', 'technical_lead_cv.pdf'];
      const newName = names[Math.floor(Math.random() * names.length)];
      
      const newResume: ResumeFile = {
          id: `res_${Date.now()}`,
          name: newName,
          url: '#',
          updatedAt: new Date().toISOString(),
          type: 'PDF'
      };

      const currentResumes = myData.resumes || [];
      updateCandidateProfile(myData.id, { 
          resumes: [...currentResumes, newResume]
      });

      // Log Activity for Recruiter
      addActivity({
        id: `act_res_${Date.now()}`,
        type: 'ResumeUpload',
        subject: 'New Artifact Ingested',
        content: `${myData.firstName} uploaded a new version of their CV: ${newName}.`,
        timestamp: new Date().toISOString(),
        author: myData.firstName,
        entityId: myData.id
      });

      notify("Resume Uploaded", `${newName} has been added to your vault.`, "success");
  };

  const handleGenerateTailoredDocs = async () => {
    if (!selectedJobForTailoring) return;
    setIsTailoring(true);
    try {
      const materials = await generateApplicationMaterials(myData, selectedJobForTailoring.title, selectedJobForTailoring.company);
      setTailoredMaterials(materials);
      notify("Ready", "AI has customized your resume and cover letter.", "success");
    } catch (e) {
      notify("Error", "Failed to tailor materials.", "error");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleTransmitApplication = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      const newApp = {
        id: `ap_${Date.now()}`,
        role: selectedJobForTailoring.title,
        company: selectedJobForTailoring.company,
        status: 'Applied',
        date: 'Just now',
        progress: 10,
        feedback: 'Your application has been submitted.',
        steps: ['Applied']
      };
      setMyApplications([newApp, ...myApplications]);

      // Log Activity for Recruiter
      addActivity({
        id: `act_app_${Date.now()}`,
        type: 'JobApplication',
        subject: 'New Job Application',
        content: `${myData.firstName} applied for ${selectedJobForTailoring.title} at ${selectedJobForTailoring.company} via the portal.`,
        timestamp: new Date().toISOString(),
        author: myData.firstName,
        entityId: myData.id
      });

      notify("Application Transmitted", "Your mission request has been logged and sent to hiring nodes.", "success");
      setSelectedJobForTailoring(null);
      setActiveTab('applications');
    }, 1500);
  };

  const sharedJobs = useMemo(() => {
      if (!myData.sharedJobIds) return [];
      return externalJobs
        .filter(j => myData.sharedJobIds!.includes(j.id))
        .map(j => ({
            ...j,
            matchScore: 95 + Math.floor(Math.random() * 5),
            source: 'recruiter' as const
        }));
  }, [myData.sharedJobIds, externalJobs]);

  const recommendedJobs = useMemo(() => {
    return externalJobs
      .filter(j => !myData.sharedJobIds?.includes(j.id))
      .slice(0, 8)
      .map(j => ({
        ...j,
        matchScore: 85 + Math.floor(Math.random() * 10),
        source: 'ai' as const
      }));
  }, [externalJobs, myData.sharedJobIds]);

  const allJobs = useMemo(() => {
    const combined = [...sharedJobs, ...recommendedJobs];
    return combined.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
                             job.company.toLowerCase().includes(jobSearch.toLowerCase());
        const matchesFilter = jobFilter === 'all' || job.source === jobFilter;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [sharedJobs, recommendedJobs, jobSearch, jobFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                R
            </div>
            <div className="hidden sm:block">
                <span className="font-bold text-lg text-slate-900 uppercase tracking-tighter">
                    {branding.companyName} <span className="text-[10px] text-slate-400 font-bold ml-2 tracking-widest">Portal</span>
                </span>
            </div>
        </div>

        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 mx-4">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={14}/>} label="Overview" />
            <NavTab active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={14}/>} label="Job Board" />
            <NavTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={14}/>} label="Applications" />
            <NavTab active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<Sparkles size={14}/>} label="AI Lab" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={14}/>} label="Profile" />
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
                                <span className="bg-brand-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Active Candidate Portal</span>
                                {isOpenToWork && <span className="bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-glow">Active Priority</span>}
                            </div>
                            <h1 className="text-5xl font-black mb-4 tracking-tight leading-none uppercase">Hello, <br/>{myData.firstName}.</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-md mt-6 leading-relaxed">
                                We've matched your profile with <span className="text-white font-bold">{sharedJobs.length + recommendedJobs.length}</span> new opportunities today. {sharedJobs.length > 0 ? "Your recruiter has hand-picked jobs for you." : ""}
                            </p>
                        </div>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 relative z-10">
                            <button onClick={() => setActiveTab('jobs')} className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-600/20">
                                <Search size={18} /> Explore Matches
                            </button>
                            <button onClick={() => setActiveTab('applications')} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all">
                                View Submissions
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
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Dossier Integrity</h4>
                        <p className="text-xs text-slate-500 px-4 font-medium">Add academic records or skills to reach 100% resonance score.</p>
                        <button onClick={() => setActiveTab('settings')} className="mt-6 text-xs font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest flex items-center gap-2">
                            Update Dossier <ArrowRight size={14} />
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
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recruiter Picks</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sharedJobs.length} Handpicked</span>
                        </div>
                        <div className="space-y-4">
                            {sharedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} />
                            ))}
                            {sharedJobs.length > 2 && (
                                <button onClick={() => { setActiveTab('jobs'); setJobFilter('recruiter'); }} className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                                    View All Handpicked Opportunities
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
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Predictions</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Matches</span>
                        </div>
                        <div className="space-y-4">
                            {recommendedJobs.slice(0, 2).map(job => (
                                <JobDashboardCard key={job.id} job={job} onApply={() => handleStartTailoring(job)} />
                            ))}
                             <button onClick={() => { setActiveTab('jobs'); setJobFilter('ai'); }} className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                                Discover All AI Recommendations
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
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Opportunity Board</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic">Discover roles matched by human intelligence and neural networks.</p>
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Search by role or company..."
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
                                        <Trophy size={10} /> Recruiter Selected
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

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Resonance Score</span>
                                        <span className={`text-sm font-black uppercase ${job.matchScore >= 95 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
                                    </div>
                                    <button 
                                        onClick={() => handleStartTailoring(job)}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                             <Search size={48} className="text-slate-200 mx-auto mb-6" />
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No opportunities match your filter</h3>
                             <p className="text-slate-500 font-medium mt-2">Try adjusting your keywords or clearing the source filter.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Transmission History</h2>
                <p className="text-slate-500 font-medium italic -mt-6">Track the status of your active application sequences across global nodes.</p>
                <div className="space-y-4">
                    {myApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:scale-110 transition-transform">
                                        {app.company[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight">{app.role}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{app.company} • Submitted {app.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Protocol</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                                            app.status === 'Interview' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            app.status === 'Screened' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-100">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'lab' && (
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Neural Application Lab</h2>
                    {selectedJobForTailoring && <button onClick={() => setSelectedJobForTailoring(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ArrowLeft size={14}/> Back to Explorer
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
                                <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium italic opacity-80">Customizing artifacts for this node to increase resonance score based on your specific skills.</p>
                                <button disabled={isTailoring} onClick={handleGenerateTailoredDocs} className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-3">
                                    {isTailoring ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    Generate Custom Dossier
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
                                        <BrainCircuit size={16} className="text-purple-600" /> Neural Synthesis Cover Letter
                                    </h4>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-10 border border-slate-100 font-serif shadow-inner">
                                        {tailoredMaterials.coverLetter}
                                    </div>
                                    <button onClick={handleTransmitApplication} disabled={isTransmitting} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all">
                                        {isTransmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        Transmit to Hiring Node
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                        <Sparkles size={40} />
                                    </div>
                                    <p className="text-sm text-slate-400 font-black uppercase tracking-[0.2em]">Select a target and click "Generate" to begin synthesis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 border-dashed group hover:border-brand-500 transition-all cursor-pointer" onClick={() => setActiveTab('jobs')}>
                        <Rocket size={56} className="text-slate-200 mx-auto mb-8 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500" />
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Launch Sequence Ready</h3>
                        <p className="text-slate-400 font-medium mt-3 uppercase tracking-widest text-[10px]">Select a mission target from the Job Board to personalize your artifacts.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Dossier Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                        <h4 className="text-lg font-black flex items-center gap-4 text-slate-900 uppercase tracking-tight">
                            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                                <User size={24} />
                            </div>
                            Personal Core
                        </h4>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Technical Arsenal</label>
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
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Industry Tenure (Years)</label>
                                    <input 
                                        type="number"
                                        value={editExperience}
                                        onChange={(e) => setEditExperience(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-black text-slate-900 shadow-inner"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Records</label>
                                        <button onClick={addEduNode} className="text-[10px] font-black text-brand-600 flex items-center gap-1 hover:underline uppercase tracking-widest">
                                            <Plus size={14}/> Add Record
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {editEducation.map((edu, idx) => (
                                            <div key={idx} className="p-6 bg-slate-50 border-none rounded-2xl space-y-4 relative shadow-inner animate-in fade-in duration-300">
                                                <button onClick={() => removeEduNode(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16}/>
                                                </button>
                                                <input 
                                                    placeholder="Degree Title"
                                                    value={edu.degree}
                                                    onChange={e => updateEduNode(idx, 'degree', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input 
                                                        placeholder="Institution"
                                                        value={edu.institution}
                                                        onChange={e => updateEduNode(idx, 'institution', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
                                                    />
                                                    <input 
                                                        placeholder="Year"
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
                                Sync Dossier Changes
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-24 -mt-24"></div>
                             <h4 className="text-brand-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <FileCheck size={20} /> Artifact Vault
                             </h4>
                             <div className="space-y-4 mb-10">
                                {sortedResumes.length > 0 ? (
                                    sortedResumes.map((resume, idx) => (
                                        <div key={resume.id} className={`p-5 rounded-2xl border transition-all flex justify-between items-center group/item ${idx === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black truncate text-white uppercase tracking-tight">{resume.name}</p>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Uploaded {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                                {idx === 0 && <span className="inline-block mt-2 bg-brand-600 text-white text-[8px] font-black px-2.5 py-1 rounded uppercase tracking-[0.2em] shadow-lg">Primary</span>}
                                            </div>
                                            <button 
                                                onClick={() => setPreviewResume(resume)}
                                                className="p-3 bg-white/10 text-white rounded-xl hover:bg-brand-600 transition-all opacity-0 group-hover/item:opacity-100"
                                                title="Preview Document"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-30">
                                        <FileText size={32} className="mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No artifacts found</p>
                                    </div>
                                )}
                             </div>
                             <div className="mt-auto">
                                <button onClick={handleSimulateResumeUpload} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                                    <Upload size={18} /> Ingest New Artifact
                                </button>
                             </div>
                         </div>

                         <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                            <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                    <ShieldCheck size={20} />
                                </div>
                                Protocol Status
                            </h4>
                            <div className="space-y-6">
                                {/* Open to Work Toggle */}
                                <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                            <Star size={12} className="fill-emerald-500" /> Open to Work
                                        </span>
                                        <span className="text-[9px] text-emerald-600 font-medium mt-1">Priority AI matching for your dossier</span>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleOpenToWork(!isOpenToWork)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isOpenToWork ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${isOpenToWork ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Neural Discovery</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-1">Allow AI agents to match your dossier</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsPassiveMode(!isPassiveMode)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isPassiveMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${isPassiveMode ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Resume Preview Modal */}
      {previewResume && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setPreviewResume(null)}></div>
            <div className="relative w-full max-w-4xl h-[90vh] bg-slate-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Modal Header */}
                <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{previewResume.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ingested Artifact • v2.0</p>
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

                {/* Modal Content - High Fidelity Simulation */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-slate-100 flex justify-center">
                    <div className="bg-white w-full max-w-[800px] shadow-xl p-16 font-serif relative overflow-hidden border border-slate-200 rounded-sm">
                        {/* High-end Watermark */}
                        <div className="absolute top-10 right-10 opacity-10 pointer-events-none transform rotate-12">
                             <div className="w-24 h-24 bg-brand-600 rounded-full blur-2xl"></div>
                        </div>

                        {/* Resume Layout */}
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
                                    Highly analytical and results-oriented {myData.role} with over {myData.yearsOfExperience} years of experience in architecting scalable digital ecosystems. Proven track record of leading high-performance engineering teams to deliver modular, low-latency applications within hyper-growth environments. Expert in React, Node.js, and Cloud Infrastructure orchestration.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Core Competencies</h2>
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
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Experience Portfolio</h2>
                                <div className="space-y-10">
                                    <div className="relative pl-6 border-l-2 border-slate-900">
                                        <div className="absolute -left-[7px] top-0 w-3 h-3 bg-slate-900 rounded-full"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-sm uppercase text-slate-900">Lead Systems Engineer</h3>
                                            <span className="text-[10px] font-black text-slate-400">2021 — PRESENT</span>
                                        </div>
                                        <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">TechStream Global Node</p>
                                        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                                            <li>Orchestrated the migration of legacy monolith to a microservices-based distributed architecture, improving throughput by 40%.</li>
                                            <li>Developed automated CI/CD pipelines that reduced deployment latency by 65% across 12 global regions.</li>
                                            <li>Led a cross-functional team of 15 engineers through 4 major product cycles, achieving a 98% uptime SLA.</li>
                                        </ul>
                                    </div>

                                    <div className="relative pl-6 border-l-2 border-slate-200">
                                        <div className="absolute -left-[7px] top-0 w-3 h-3 bg-slate-200 rounded-full"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-sm uppercase text-slate-900">Senior Full-Stack Developer</h3>
                                            <span className="text-[10px] font-black text-slate-400">2018 — 2021</span>
                                        </div>
                                        <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">InnovaSoft Systems</p>
                                        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                                            <li>Pioneered the implementation of real-time collaboration features using WebSockets and state-machine logic.</li>
                                            <li>Optimized SQL query performance by 50% through advanced indexing and query restructuring.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-6 border-b border-slate-100 pb-2">Academic Credentials</h2>
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

                        {/* Document Footer */}
                        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Digitally Verified Artifact • RecruitFlow Intelligence Node</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <footer className="py-12 border-t border-slate-200 px-6 lg:px-12 flex items-center justify-between bg-white mt-auto">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">RecruitFlow-v2.5.0-CANDIDATE_NODE</p>
          <div className="flex items-center gap-8 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
              <a href="#" className="hover:text-brand-600 transition-all">Privacy Protocol</a>
              <a href="#" className="hover:text-brand-600 transition-all">System Terms</a>
          </div>
      </footer>
    </div>
  );
};

// Fix: Using React.FC to properly handle React internal props like 'key'
const JobDashboardCard: React.FC<{ job: any; onApply: () => void }> = ({ job, onApply }) => (
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
             <button onClick={onApply} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-md">
                 Apply Now
             </button>
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

const NavTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all ${active ? 'bg-white text-slate-900 shadow-xl border border-slate-200 ring-4 ring-black/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'}`}
    >
        <span className={`${active ? 'text-brand-600' : ''}`}>{icon}</span> 
        <span className="hidden sm:inline">{label}</span>
    </button>
);

export default CandidatePortal;
