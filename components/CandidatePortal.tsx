
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
  Compass,
  DollarSign,
  Timer,
  Save,
  Globe,
  TrendingUp,
  BrainCircuit,
  Target,
  ArrowUpRight,
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
  Flame,
  Fingerprint,
  Languages,
  EyeOff,
  Trophy,
  Activity,
  Award,
  Medal,
  Gem,
  Rocket,
  Lock,
  ArrowLeft,
  Copy,
  Upload,
  Plus,
  Share2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';

interface CandidatePortalProps {
  onLogout: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify, candidates, updateCandidateProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'missions' | 'lab' | 'settings'>('dashboard');
  
  // Current Logged in candidate (simulated as c1 - Sarah Chen)
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  // Profile Edit States
  const [editSkills, setEditSkills] = useState(myData.skills.join(', '));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [resumeName, setResumeName] = useState(myData.resumeName || 'sarah_chen_resume_2024.pdf');

  // Tailoring Suite States
  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Gamification States
  const [streakCount, setStreakCount] = useState(12);
  const [xpPoints, setXpPoints] = useState(2450);
  const [optimizationScore, setOptimizationScore] = useState(68);
  const [isPassiveMode, setIsPassiveMode] = useState(false);
  const [hideSalary, setHideSalary] = useState(true);

  // Mocked Application Flow
  const [myApplications, setMyApplications] = useState([
    { id: 'ap1', role: 'Senior React Engineer', company: 'TechFlow Inc', status: 'Interview', date: '2 days ago', progress: 85, feedback: 'Technical score was exceptional (96/100).', steps: ['Applied', 'Viewed', 'AI Screened', 'Interview'] },
    { id: 'ap2', role: 'Staff Frontend Developer', company: 'CloudScale', status: 'AI Screened', date: '5 days ago', progress: 45, feedback: 'Moving to final round based on AI persona fit.', steps: ['Applied', 'Viewed', 'AI Screened'] },
    { id: 'ap3', role: 'Lead Architect', company: 'GlobalData', status: 'Applied', date: '1 week ago', progress: 15, feedback: 'Awaiting recruiter review.', steps: ['Applied'] },
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
              skills: editSkills.split(',').map(s => s.trim()).filter(s => s) 
          });
          setIsUpdatingProfile(false);
          notify("Profile Synchronized", "Your operative skills have been broadcasted to recruiters.", "success");
          setXpPoints(prev => prev + 50);
      }, 1000);
  };

  const handleSimulateResumeUpload = () => {
      const names = ['updated_cv_final.pdf', 'engineering_lead_dossier.pdf', 'resume_v2_2025.pdf'];
      const newName = names[Math.floor(Math.random() * names.length)];
      setResumeName(newName);
      updateCandidateProfile(myData.id, { 
          resumeName: newName,
          resumeUpdatedAt: new Date().toISOString()
      });
      notify("Dossier Uploaded", `New artifact ${newName} transmitted successfully.`, "success");
      setXpPoints(prev => prev + 100);
  };

  const handleGenerateTailoredDocs = async () => {
    if (!selectedJobForTailoring) return;
    setIsTailoring(true);
    try {
      const materials = await generateApplicationMaterials(myData, selectedJobForTailoring.title, selectedJobForTailoring.company);
      setTailoredMaterials(materials);
      setXpPoints(prev => prev + 150);
      notify("Optimization Complete", "AI has tailored your artifacts. +150 XP earned!", "success");
    } catch (e) {
      notify("Lab Error", "Failed to generate materials.", "error");
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
        feedback: 'Application successfully transmitted via AI Node.',
        steps: ['Applied']
      };
      setMyApplications([newApp, ...myApplications]);
      setXpPoints(prev => prev + 300);
      notify("Mission Deployed", "Application sent. +300 XP earned!", "success");
      setSelectedJobForTailoring(null);
      setActiveTab('applications');
    }, 2000);
  };

  const handleBatchApply = () => {
    notify("Batch Protocol Initiated", "AI Agents are tailoring 10 applications.", "info");
    setTimeout(() => {
      setXpPoints(prev => prev + 1000);
      notify("Batch Complete", "10 applications tailored and sent. +1000 XP!", "success");
    }, 4000);
  };

  const recommendedJobs = useMemo(() => externalJobs.slice(0, 5).map(j => ({
    ...j,
    matchScore: 85 + Math.floor(Math.random() * 14)
  })), [externalJobs]);

  const sharedJobs = useMemo(() => {
      if (!myData.sharedJobIds) return [];
      return externalJobs.filter(j => myData.sharedJobIds!.includes(j.id)).map(j => ({
          ...j,
          matchScore: 95 + Math.floor(Math.random() * 5)
      }));
  }, [myData.sharedJobIds, externalJobs]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-brand-100 selection:text-brand-900">
      <header className="bg-white border-b border-slate-200 h-24 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-slate-900/20 border-b-4 border-slate-700 hover:scale-105 transition-transform cursor-pointer">
                R
            </div>
            <div className="hidden sm:block">
                <span className="font-black text-lg lg:text-xl tracking-tighter text-slate-900 uppercase flex items-center gap-2">
                    {branding.companyName} <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-md italic font-black shadow-sm">ELITE</span>
                </span>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 lg:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                        <div className="h-full bg-brand-500 shadow-glow" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Lvl 14 • 120 XP to Rank up</span>
                </div>
            </div>
        </div>

        <nav className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner gap-1 mx-4">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutIcon size={14}/>} label="Radar" />
            <NavTab active={activeTab === 'missions'} onClick={() => setActiveTab('missions')} icon={<Target size={14}/>} label="Quests" />
            <NavTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={14}/>} label="Tracker" />
            <NavTab active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<BrainCircuit size={14}/>} label="Forge" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Fingerprint size={14}/>} label="Vault" />
        </nav>

        <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center gap-3 bg-brand-50 px-4 py-2.5 rounded-2xl border border-brand-100 text-brand-600 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <Gem size={16} className="fill-brand-200 animate-pulse" />
                <span className="text-sm font-black tracking-tight">{xpPoints.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-black text-slate-900 uppercase">{myData.firstName} {myData.lastName}</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald"></div> Top 1% Agent
                    </p>
                </div>
                <div className="relative group cursor-pointer">
                    <img src={myData.avatarUrl} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-2 border-white shadow-xl group-hover:scale-105 transition-transform" alt="Me" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-[12px] font-bold shadow-lg animate-bounce duration-1000">👑</div>
                </div>
                <button onClick={onLogout} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" aria-label="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-12 animate-in fade-in duration-500 scroll-smooth">
        {activeTab === 'dashboard' && (
            <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-[0_30px_100px_rgba(15,23,42,0.15)] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-4 leading-[0.9] text-balance">Master the <br/><span className="text-brand-400">Search Protocol</span>.</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed mt-6">
                                You have <span className="text-white font-bold underline decoration-brand-500 decoration-2 underline-offset-4">{sharedJobs.length > 0 ? `${sharedJobs.length} shared & 12 new` : '12 new high-match'} quests</span> available.
                            </p>
                        </div>
                        <div className="mt-12 flex flex-col sm:flex-row gap-4 relative z-10">
                            <button onClick={handleBatchApply} className="flex-1 px-8 py-4.5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-3">
                                <Zap size={18} fill="currentColor" /> Deploy Multi-Apply
                            </button>
                            <button onClick={() => setActiveTab('missions')} className="px-8 py-4.5 bg-white/10 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                                View Active Quests
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="relative z-10 text-center">
                            <div className="relative inline-flex mb-8">
                                <svg className="w-36 h-36 transform -rotate-90">
                                    <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="64" cx="72" cy="72" />
                                    <circle className="text-brand-500 transition-all duration-1000 ease-out shadow-glow" strokeWidth="10" strokeDasharray={402} strokeDashoffset={402 * (1 - optimizationScore / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="64" cx="72" cy="72" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{optimizationScore}%</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Efficiency</span>
                                </div>
                            </div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Dossier Resonance</h4>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">Update <b>"Skills"</b> in Vault to <br/> reach <span className="text-brand-600 font-black">82% Optimization</span>.</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                         <div className="absolute -right-8 -top-8 opacity-20 group-hover:scale-125 transition-transform duration-1000">
                             <Flame size={180} fill="white" />
                         </div>
                         <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl shadow-lg border border-white/20">
                                        <Flame size={20} className="fill-white" />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest">{streakCount} Day Hot Streak</span>
                                </div>
                                <h4 className="text-3xl font-black tracking-tighter uppercase leading-none text-balance">Fuel the Fire, <br/>{myData.firstName}.</h4>
                            </div>
                            <div className="bg-black/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/20 shadow-inner">
                                <p className="text-xs font-bold leading-relaxed">2x Recruiter Visibility Active</p>
                            </div>
                         </div>
                    </div>
                </div>

                {sharedJobs.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3 mb-8">
                             <Share2 className="text-brand-600" size={24} />
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Shared by your Recruiter</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {sharedJobs.map(job => (
                                <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-brand-200 shadow-xl hover:shadow-2xl hover:border-brand-500 transition-all group flex flex-col md:flex-row items-center gap-10">
                                     <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                        {job.company[0]}
                                     </div>
                                     <div className="flex-1 text-center md:text-left">
                                         <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none">{job.title}</h4>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{job.company} • Priority Selection</p>
                                         <button onClick={() => handleStartTailoring(job)} className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all">
                                             Initiate Forge
                                         </button>
                                     </div>
                                     <div className="text-emerald-500 font-black text-xl tracking-tighter text-right shrink-0">
                                         <Star size={18} className="fill-emerald-500 inline mr-2" />
                                         {job.matchScore}%
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'missions' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Quest Board</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">Deploy to missions with high matching resonance</p>
                    </div>
                    <button onClick={handleBatchApply} className="px-8 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                        <Layers size={18} /> Apply Top 5
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sharedJobs.map(job => (
                        <div key={`shared-${job.id}`} className="bg-brand-50/30 p-10 rounded-[3rem] border-2 border-brand-200 shadow-xl hover:shadow-2xl hover:border-brand-500 transition-all group relative overflow-hidden flex flex-col h-full ring-4 ring-brand-100/50">
                             <div className="absolute top-4 right-6 text-brand-600">
                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-brand-100 shadow-sm">
                                    <Share2 size={12} /> <span className="text-[8px] font-black uppercase tracking-widest">Priority Shared</span>
                                </div>
                             </div>
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-16 h-16 bg-brand-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-xl group-hover:scale-110 transition-transform">
                                    {job.company[0]}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{job.company}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recruiter Pick</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex-1 group-hover:text-brand-600 transition-colors leading-none">{job.title}</h3>
                            <button onClick={() => handleStartTailoring(job)} className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                                Initiate Forge <ArrowUpRight size={18} />
                            </button>
                        </div>
                    ))}
                    {recommendedJobs.map((job, idx) => (
                        <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-500 transition-all group relative overflow-hidden flex flex-col h-full">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-xl group-hover:scale-110 transition-transform">
                                    {job.company[0]}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{job.company}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Scouted {job.postedAt}</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex-1 group-hover:text-brand-600 transition-colors leading-none">{job.title}</h3>
                            <button onClick={() => handleStartTailoring(job)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                                Initiate Forge <ArrowUpRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Mission Tracker</h2>
                <div className="grid grid-cols-1 gap-10">
                    {myApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden group relative hover:shadow-2xl transition-all">
                            <div className="p-10 lg:p-14">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                                            {app.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 group-hover:text-brand-600 transition-colors">{app.role}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{app.company} • Deployed {app.date}</p>
                                        </div>
                                    </div>
                                    <button className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl">Mission Briefing</button>
                                </div>
                                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 flex items-start gap-6 shadow-2xl">
                                    <div className="p-4 bg-brand-600/20 rounded-[1.5rem] text-brand-400 border border-brand-500/30"><Info size={24} /></div>
                                    <div className="relative z-10 flex-1">
                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-2">Live Intel Log</p>
                                        <p className="text-base text-slate-100 font-medium leading-relaxed italic opacity-90">"{app.feedback}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'lab' && (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                    <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">The Forge</h2>
                    {selectedJobForTailoring && <button onClick={() => setSelectedJobForTailoring(null)} className="px-8 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                        <ArrowLeft size={18}/> Back to Quests
                    </button>}
                </div>
                {selectedJobForTailoring ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1">
                            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center font-black text-3xl border border-white/10">
                                        {selectedJobForTailoring.company[0]}
                                    </div>
                                    <p className="font-black text-2xl uppercase tracking-tighter leading-none">{selectedJobForTailoring.title}</p>
                                </div>
                                <button disabled={isTailoring} onClick={handleGenerateTailoredDocs} className="w-full py-5.5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-4">
                                    {isTailoring ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                                    Run Forge Protocol
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            {tailoredMaterials && (
                                <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10">
                                    <div className="bg-slate-50 p-10 rounded-[2.5rem] text-base text-slate-600 font-medium leading-[1.8] whitespace-pre-wrap">
                                        {tailoredMaterials.coverLetter}
                                    </div>
                                    <button onClick={handleTransmitApplication} disabled={isTransmitting} className="mt-10 w-full py-6 bg-brand-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4">
                                        {isTransmitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                                        Transmit Application
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[4rem] border border-slate-100 border-dashed">
                        <Rocket size={48} className="text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Forge Ready</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mt-2">Select a mission from the board to tailor artifacts.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="flex items-end justify-between px-4">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">The Vault</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">Update your operational dossier & artifacts</p>
                    </div>
                    <ShieldCheck size={56} className="text-brand-600 opacity-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-10 group hover:shadow-2xl transition-all">
                        <h4 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 leading-none text-slate-900">
                            <Fingerprint size={32} className="text-brand-600" />
                            Operative Dossier
                        </h4>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Skill Stack</label>
                                <input 
                                    type="text"
                                    value={editSkills}
                                    onChange={(e) => setEditSkills(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 shadow-inner"
                                    placeholder="React, TypeScript, Node.js..."
                                />
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">* Comma separated. AI will auto-enrich matching resonance.</p>
                            </div>

                            <button 
                                onClick={handleUpdateProfile}
                                disabled={isUpdatingProfile}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Synchronize Skills
                            </button>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col h-full border-b-8 border-brand-600">
                             <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none translate-x-20 translate-y-20"></div>
                             <h4 className="text-brand-400 font-black text-[11px] uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                                <FileText size={18} /> Resume Artifact
                             </h4>
                             
                             <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-400">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black uppercase tracking-tight truncate">{resumeName}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Artifact Active</p>
                                    </div>
                                </div>
                             </div>

                             <div className="flex-1"></div>
                             
                             <button 
                                onClick={handleSimulateResumeUpload}
                                className="w-full py-6 bg-white text-slate-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                             >
                                <Upload size={18} /> Upload New Artifact
                             </button>
                         </div>

                         <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4"><EyeOff size={24} className="text-slate-400" /> Privacy Node</h4>
                            <div className="space-y-5">
                                <VaultToggleSimple label="Ghost Node Mode" active={isPassiveMode} />
                                <VaultToggleSimple label="Redact Financials" active={hideSalary} />
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      <footer className="py-16 border-t border-slate-200 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 bg-white">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Operative Hub Build v4.2.0-STABLE</p>
          <div className="flex items-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-brand-600 transition-colors">Privacy Protocols</a>
              <a href="#" className="hover:text-brand-600 transition-colors">Mission Terms</a>
              <a href="#" className="hover:text-brand-600 transition-colors">Report Signal Error</a>
          </div>
      </footer>
    </div>
  );
};

const NavTab = ({ active, onClick, icon, label, className = "" }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, className?: string }) => (
    <button 
        onClick={onClick}
        className={`px-4 lg:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative overflow-hidden ${active ? 'bg-white text-slate-900 shadow-xl border border-slate-200 scale-105 z-10' : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'} ${className}`}
    >
        {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-brand-600 rounded-full animate-in slide-in-from-bottom-1 duration-500 shadow-glow"></div>}
        <span className={`${active ? 'text-brand-600' : ''} transition-colors`}>{icon}</span> 
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const BadgeCard = ({ icon, label, sub, date, active }: { icon: React.ReactNode, label: string, sub: string, date: string, active: boolean }) => (
    <div className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center text-center group ${active ? 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-brand-300' : 'bg-slate-50 border-slate-100 opacity-60 grayscale cursor-not-allowed'}`}>
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform ${active ? 'bg-slate-50' : 'bg-slate-100'}`}>
            <div className={`${active ? 'scale-125' : 'scale-100'}`}>{icon}</div>
        </div>
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em] mb-2">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-2">{sub}</p>
    </div>
);

const ComparisonBar = ({ label, percentage, rank }: { label: string, percentage: number, rank: string }) => (
    <div className="space-y-3 group/bar">
        <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/bar:text-slate-900 transition-colors">{label}</span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${percentage > 80 ? 'text-emerald-600' : 'text-slate-400'}`}>{rank}</span>
        </div>
        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 group-hover:border-slate-200 transition-colors">
            <div className={`h-full shadow-glow transition-all duration-1500 ${percentage > 80 ? 'bg-emerald-500' : 'bg-brand-400'}`} style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
);

const VaultToggleSimple = ({ label, active }: { label: string, active: boolean }) => (
    <div className="flex items-center justify-between group/t">
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] group-hover/t:text-slate-950 transition-colors">{label}</span>
        <button 
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-slate-200'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-6' : ''}`} />
        </button>
    </div>
);

const PipelineItem = ({ label, active }: { label: string, active: boolean }) => (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${active ? 'bg-emerald-500 border-emerald-500 text-white shadow-glow-emerald' : 'bg-white border-slate-100 shadow-inner'}`}>
            {active ? <CheckCircle size={18} fill="white" color="transparent" /> : <div className="w-2 h-2 rounded-full bg-slate-100" />}
        </div>
    </div>
);

const LayoutIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);

export default CandidatePortal;
