
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
  /* Added missing Copy icon */
  Copy
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateApplicationMaterials } from '../services/geminiService';

interface CandidatePortalProps {
  onLogout: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews, notify } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'missions' | 'lab' | 'settings'>('dashboard');
  
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

  const myInterviews = useMemo(() => interviews
    .filter(i => i.candidateName.includes('Sarah') || i.candidateId === 'c1')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()), [interviews]);

  const recommendedJobs = useMemo(() => externalJobs.slice(0, 5).map(j => ({
    ...j,
    matchScore: 85 + Math.floor(Math.random() * 14)
  })), [externalJobs]);

  const handleStartTailoring = (job: any) => {
    setSelectedJobForTailoring(job);
    setActiveTab('lab');
    setTailoredMaterials(null);
  };

  const handleGenerateTailoredDocs = async () => {
    if (!selectedJobForTailoring) return;
    setIsTailoring(true);
    try {
      const mockCandidate = { firstName: 'Sarah', lastName: 'Chen', role: 'Senior React Engineer', skills: ['React', 'TypeScript', 'Tailwind', 'Node.js'] } as any;
      const materials = await generateApplicationMaterials(mockCandidate, selectedJobForTailoring.title, selectedJobForTailoring.company);
      setTailoredMaterials(materials);
      setXpPoints(prev => prev + 150); // XP Reward
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
      setXpPoints(prev => prev + 300); // XP Reward for deployment
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* Gamified Top Deck Header */}
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
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Fingerprint size={14}/>} label="Vault" className="hidden lg:flex" />
        </nav>

        <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center gap-3 bg-brand-50 px-4 py-2.5 rounded-2xl border border-brand-100 text-brand-600 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <Gem size={16} className="fill-brand-200 animate-pulse" />
                <span className="text-sm font-black tracking-tight">{xpPoints.toLocaleString()} XP</span>
            </div>
            
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-black text-slate-900 uppercase">Sarah Chen</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald"></div> Top 1% Agent
                    </p>
                </div>
                <div className="relative group cursor-pointer">
                    <img src="https://picsum.photos/100/100?random=1" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-2 border-white shadow-xl group-hover:scale-105 transition-transform" alt="Me" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-[12px] font-bold shadow-lg animate-bounce duration-1000">👑</div>
                </div>
                <button 
                  onClick={onLogout} 
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  aria-label="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-12 animate-in fade-in duration-500 scroll-smooth">
        
        {activeTab === 'dashboard' && (
            <div className="space-y-12">
                {/* Hero Stats & Optimization */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-[0_30px_100px_rgba(15,23,42,0.15)] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-4 leading-[0.9] text-balance">Master the <br/><span className="text-brand-400">Search Protocol</span>.</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed mt-6">
                                You have <span className="text-white font-bold underline decoration-brand-500 decoration-2 underline-offset-4">12 new high-match quests</span> available. Deploy now to maintain rank.
                            </p>
                        </div>
                        <div className="mt-12 flex flex-col sm:flex-row gap-4 relative z-10">
                            <button onClick={handleBatchApply} className="flex-1 px-8 py-4.5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-600/30 hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                <Zap size={18} fill="currentColor" /> Deploy Multi-Apply
                            </button>
                            <button onClick={() => setActiveTab('missions')} className="px-8 py-4.5 bg-white/10 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                View Active Quests
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">Add <b>"AWS Lambda"</b> to <br/> reach <span className="text-brand-600 font-black">82% Optimization</span>.</p>
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
                                <h4 className="text-3xl font-black tracking-tighter uppercase leading-none text-balance">Fuel the Fire, <br/>Sarah.</h4>
                            </div>
                            <div className="space-y-5">
                                <div className="bg-black/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/20 shadow-inner">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-white/80 uppercase">Active Buff</p>
                                        <Zap size={12} className="fill-brand-400 text-brand-400" />
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed">2x Recruiter Visibility Active</p>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-white/60">T-Minus 14h to keep streak</span>
                                    <button className="underline hover:text-white/100 transition-colors">Surveillance Details</button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Achievement Gallery & Benchmarks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-end justify-between px-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Merit Rewards</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational achievements earned during this search</p>
                            </div>
                            <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline flex items-center gap-2">Full Registry <ChevronRight size={14}/></button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <BadgeCard icon={<Rocket className="text-emerald-500" />} label="Ignition" sub="1st Mission Deploy" date="MAY 12" active />
                            <BadgeCard icon={<Trophy className="text-yellow-500" />} label="Guardian" sub="10 Day Hot Streak" date="MAY 18" active />
                            <BadgeCard icon={<BrainCircuit className="text-purple-500" />} label="Architect" sub="Mock Level 5" date="MAY 20" active />
                            <BadgeCard icon={<Medal className="text-blue-500 opacity-20" />} label="Elite Fit" sub="98% Match Score" date="LOCKED" active={false} />
                        </div>

                        {/* Stats Hub */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-12 group hover:shadow-xl transition-all">
                            <div className="flex-1 space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                        <TrendingUp size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Neural Ranking</h4>
                                        <p className="text-xs font-medium text-slate-500">Benchmark comparison to current talent pool</p>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <ComparisonBar label="Technical Preparation" percentage={85} rank="TOP 15%" />
                                    <ComparisonBar label="Operational Velocity" percentage={94} rank="TOP 5%" />
                                    <ComparisonBar label="AI Response Precision" percentage={72} rank="STABLE" />
                                </div>
                            </div>
                            <div className="w-full md:w-56 flex flex-col justify-center items-center bg-slate-900 rounded-[2.5rem] p-8 border-b-8 border-brand-600 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl"></div>
                                <div className="text-5xl font-black text-white tracking-tighter">#422</div>
                                <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mt-3">Global Operative</div>
                                <div className="mt-8 w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-emerald-500 shadow-glow" style={{ width: '92%' }}></div>
                                </div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase mt-4 tracking-widest text-center leading-relaxed">Outperforming <br/>92% of the pool</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Weekly Power-Up Hub */}
                        <div className="bg-slate-950 p-8 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10"></div>
                            <div className="flex items-center gap-3 text-brand-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8">
                                <Zap size={16} className="animate-pulse fill-brand-400" /> Weekly Power-Ups
                            </div>
                            <div className="space-y-5">
                                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 group cursor-pointer hover:bg-white/10 hover:border-brand-500 transition-all">
                                    <p className="text-xs font-black uppercase text-white mb-2 flex items-center gap-2">Double Signal <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-glow"></div></p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Broadcast to 2x more recruiters for 24h cycle.</p>
                                    <div className="mt-5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-brand-400 tracking-widest uppercase">Cost: 500 XP</span>
                                        <button className="text-[9px] font-black px-4 py-2 bg-brand-600 text-white rounded-xl shadow-lg hover:bg-brand-700 uppercase tracking-widest">Activate</button>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 opacity-50 relative group/lock">
                                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover/lock:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] rounded-[1.5rem]">
                                        <div className="bg-slate-900 p-3 rounded-2xl border border-white/10 shadow-2xl text-[9px] font-black uppercase tracking-widest">Unlocks at Level 16</div>
                                    </div>
                                    <p className="text-xs font-black uppercase text-slate-400 mb-2">Ghost Node</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Passive hiding from current employer network.</p>
                                    <div className="mt-5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Locked</span>
                                        <Lock size={14} className="text-slate-700" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Digest Toggle */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-brand-300 transition-all">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <Bell size={16} className="text-brand-600" /> Intelligence Feed
                            </h4>
                            <div className="space-y-6">
                                <VaultToggleSimple label="Daily Strategic Brief" active={true} />
                                <VaultToggleSimple label="Real-time Signal Alerts" active={false} />
                                <VaultToggleSimple label="Messenger Integration" active={false} />
                            </div>
                            <div className="mt-10 pt-10 border-t border-slate-50">
                                <button className="w-full py-4 bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-[1.5rem] hover:bg-slate-100 hover:text-slate-900 transition-all shadow-inner">Operational Parameters</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'missions' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Quest Board</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">Deploy to missions with high matching resonance</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-6 py-3.5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald"></div>
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Live Search Active</span>
                        </div>
                        <button onClick={handleBatchApply} className="px-8 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                           <Layers size={18} /> Apply Top 5
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recommendedJobs.map((job, idx) => (
                        <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-500 transition-all group relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 right-0 p-6">
                                <div className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-brand-100 shadow-sm group-hover:scale-105 transition-transform">
                                    <Gem size={12} fill="currentColor" /> +{250 + (idx * 50)} XP
                                </div>
                            </div>
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
                            
                            <div className="space-y-4 mb-12 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Resonance Match</span>
                                    <span className="text-emerald-500">{job.matchScore}%</span>
                                </div>
                                <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                                    <div className="h-full bg-emerald-500 shadow-glow transition-all duration-1500 ease-out" style={{ width: `${job.matchScore}%` }}></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleStartTailoring(job)}
                                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                Initiate Forge <ArrowUpRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Mission Tracker</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">Real-time surveillance on all active deployments</p>
                    </div>
                    <div className="text-right px-6 py-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                        <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">03</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Ops</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-10">
                    {myApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden group relative hover:shadow-2xl hover:border-brand-100 transition-all">
                            <div className="p-10 lg:p-14">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                                            {app.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 group-hover:text-brand-600 transition-colors">{app.role}</h4>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{app.company}</p>
                                                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deployed {app.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full lg:w-auto">
                                        <button className="flex-1 lg:flex-none p-5 bg-slate-50 rounded-[1.5rem] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100 shadow-inner"><MessageSquare size={24} /></button>
                                        <button className="flex-[2] lg:flex-none px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">Mission Briefing</button>
                                    </div>
                                </div>

                                <div className="relative mb-20 px-4 lg:px-12">
                                    <div className="absolute left-10 lg:left-24 top-6 right-10 lg:right-24 h-[3px] bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                         <div className="h-full bg-brand-500 shadow-glow transition-all duration-1000" style={{ width: `${app.progress}%` }}></div>
                                    </div>
                                    <div className="relative flex justify-between">
                                        {['Applied', 'Viewed', 'AI Screened', 'Interview', 'Offer'].map((step, idx) => {
                                            const isDone = app.steps.includes(step);
                                            const isNext = !isDone && (idx === 0 || app.steps.includes(['Applied', 'Viewed', 'AI Screened', 'Interview', 'Offer'][idx-1]));
                                            return (
                                                <div key={step} className="flex flex-col items-center gap-6 relative z-10 group/step">
                                                    <div className={`w-12 h-12 rounded-[1.25rem] border-4 border-white shadow-2xl flex items-center justify-center transition-all duration-500 ${
                                                        isDone ? 'bg-brand-600 text-white' : 
                                                        isNext ? 'bg-white text-brand-600 border-brand-100 animate-pulse scale-110 shadow-brand-500/20' : 'bg-slate-100 text-slate-300'
                                                    }`}>
                                                        {isDone ? <CheckCircle size={24} /> : <div className={`w-2.5 h-2.5 rounded-full ${isNext ? 'bg-brand-500' : 'bg-slate-300'}`} />}
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isDone ? 'text-slate-900' : isNext ? 'text-brand-600' : 'text-slate-300'}`}>{step}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 flex items-start gap-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute right-0 bottom-0 opacity-10 p-6 pointer-events-none rotate-12"><Activity size={100} /></div>
                                    <div className="p-4 bg-brand-600/20 rounded-[1.5rem] text-brand-400 border border-brand-500/30 shadow-inner group-hover:scale-105 transition-transform"><Info size={24} /></div>
                                    <div className="relative z-10 flex-1">
                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-2">Live Intel Log</p>
                                        <p className="text-base text-slate-100 font-medium leading-relaxed italic opacity-90">"{app.feedback}"</p>
                                    </div>
                                    <button className="self-end px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black text-white/50 hover:text-white uppercase tracking-widest rounded-xl transition-all border border-white/10 uppercase">Refresh Node</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'lab' && (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">The Forge</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">AI synthesis of optimized deployment artifacts</p>
                    </div>
                    {selectedJobForTailoring && (
                        <button onClick={() => setSelectedJobForTailoring(null)} className="px-8 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-3 shadow-sm group">
                           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Quests
                        </button>
                    )}
                </div>

                {selectedJobForTailoring ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-b-8 border-brand-600">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16"></div>
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center font-black text-3xl border border-white/10 shadow-2xl">
                                        {selectedJobForTailoring.company[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-2xl uppercase tracking-tighter leading-none mb-2">{selectedJobForTailoring.title}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{selectedJobForTailoring.company}</p>
                                    </div>
                                </div>

                                <div className="space-y-8 pt-10 border-t border-white/10">
                                     <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yield Multiplier</span>
                                         <span className="text-sm font-black text-yellow-400">+150 XP</span>
                                     </div>
                                     <button 
                                        disabled={isTailoring}
                                        onClick={handleGenerateTailoredDocs}
                                        className="w-full py-5.5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                     >
                                        {isTailoring ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />}
                                        Run Forge Protocol
                                     </button>
                                </div>
                            </div>
                            
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                                <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] mb-2 flex items-center gap-3"><ShieldCheck size={18} className="text-brand-600"/> Pipeline Checksum</h4>
                                <div className="space-y-4">
                                    <PipelineItem label="Dossier Connected" active={true} />
                                    <PipelineItem label="Context Parsed" active={true} />
                                    <PipelineItem label="Forge Initialized" active={!!tailoredMaterials} />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8 h-full">
                            {!tailoredMaterials && !isTailoring ? (
                                <div className="bg-white rounded-[4rem] border-4 border-dashed border-slate-100 p-24 lg:p-48 flex flex-col items-center justify-center text-center opacity-50 group hover:opacity-100 transition-opacity">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-slate-100 group-hover:scale-110 transition-transform">
                                        <Rocket size={48} className="text-slate-200 group-hover:text-brand-500 transition-colors" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Awaiting Signal Inflow</h3>
                                    <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed font-medium">Activate the Forge to synthesize a tailored narrative specific to this quest.</p>
                                </div>
                            ) : isTailoring ? (
                                <div className="bg-white rounded-[4rem] border border-slate-200 p-24 lg:p-48 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-50 via-transparent to-transparent opacity-50"></div>
                                    <div className="relative">
                                        <div className="w-32 h-32 border-[10px] border-slate-100 border-t-brand-600 rounded-full animate-spin shadow-2xl"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-brand-600">
                                            <BrainCircuit size={48} />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-12 mb-3">AI Deep-Forging Artifacts...</h3>
                                    <p className="text-slate-500 text-lg font-medium animate-pulse">Contextualizing skills. Adjusting resonance. Optimizing narrative.</p>
                                </div>
                            ) : (
                                <div className="animate-in slide-in-from-right-12 duration-700 space-y-10">
                                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                                        <div className="p-8 lg:p-10 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md flex justify-between items-center">
                                            <div className="flex items-center gap-4 text-slate-900">
                                                <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20"><FileCheck size={20} /></div>
                                                <h4 className="font-black text-sm uppercase tracking-[0.2em]">Optimized Mission Artifact</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 tracking-widest">Resonance: 98%</span>
                                                <button className="text-[10px] font-black uppercase text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-all">Manual Tuning</button>
                                            </div>
                                        </div>
                                        <div className="p-10 lg:p-14 space-y-12">
                                            <div className="group/doc">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Award size={14} className="text-brand-500"/> AI Tailored Signal (Cover Letter)</h5>
                                                    <button className="opacity-0 group-hover/doc:opacity-100 p-2 bg-slate-50 text-slate-400 hover:text-brand-600 rounded-lg transition-all border border-slate-100" title="Copy Text"><Copy size={16}/></button>
                                                </div>
                                                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 text-base text-slate-600 font-medium leading-[1.8] whitespace-pre-wrap shadow-inner selection:bg-brand-600 selection:text-white">
                                                    {tailoredMaterials.coverLetter}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-10 lg:p-14 bg-slate-950 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[120px] opacity-10"></div>
                                            <div className="relative z-10 flex-1">
                                                <h5 className="font-black text-2xl uppercase tracking-tighter mb-2 leading-none">Ready for Deployment?</h5>
                                                <p className="text-sm text-slate-400 font-medium tracking-tight">Deployment Reward: <span className="text-brand-400 font-black">+300 XP</span> upon successful transmission.</p>
                                            </div>
                                            <button 
                                                onClick={handleTransmitApplication}
                                                disabled={isTransmitting}
                                                className="w-full md:w-auto px-12 py-6 bg-brand-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-brand-700 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                                            >
                                                {isTransmitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                                Transmit Application
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12 group hover:shadow-xl transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-5 leading-none">
                                    <div className="w-14 h-14 bg-brand-50 rounded-[1.5rem] flex items-center justify-center text-brand-600 shadow-inner group-hover:scale-110 transition-transform"><BarChart4 size={32} /></div>
                                    Forge Analytics
                                </h3>
                                <div className="text-[10px] font-black text-brand-600 bg-brand-50 px-4 py-2 rounded-xl border border-brand-100 tracking-widest shadow-sm">ELITE OPERATIVE HUB</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 px-4">
                                 <SkillNode label="Strategic Engineering" value={98} sub="React, Node, Cloud" />
                                 <SkillNode label="Tactical Leadership" value={82} sub="Stakeholders, Roadmaps" />
                            </div>
                            <div className="p-10 bg-brand-600 rounded-[3rem] shadow-[0_30px_60px_rgba(37,99,235,0.25)] flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 pointer-events-none scale-150"><Activity size={120} color="white" /></div>
                                <div className="text-center lg:text-left relative z-10">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3">AI Readiness: 9.1/10</h4>
                                    <p className="text-sm text-brand-50 font-medium opacity-90 max-w-sm tracking-tight leading-relaxed">Your core persona resonance is in the <span className="text-white font-black underline underline-offset-4 decoration-2">top 0.5%</span> for active Senior Operatives.</p>
                                </div>
                                <button onClick={() => setActiveTab('missions')} className="w-full lg:w-auto px-10 py-5 bg-white text-brand-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex items-center justify-center gap-3">
                                    Board Radar <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-brand-600 rounded-full blur-[120px] opacity-10 -ml-32 -mt-32"></div>
                            <div className="relative z-10">
                                <h4 className="text-brand-400 font-black text-[11px] uppercase tracking-[0.4em] mb-8">Forge Protocols</h4>
                                <p className="text-lg font-medium text-slate-300 leading-relaxed text-balance">Select an active quest from the radar board to begin artifact tailoring.</p>
                            </div>
                            <div className="flex-1"></div>
                            <div className="pt-10 border-t border-white/10 space-y-6">
                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 opacity-50 flex items-center justify-between group hover:opacity-80 transition-all cursor-not-allowed">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><Layers size={18} className="text-slate-600" /></div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">Passive Surveillance</p>
                                    </div>
                                    <div className="text-[8px] font-black text-slate-600 uppercase border border-slate-800 px-2 py-1 rounded">Offline</div>
                                </div>
                                <div className="p-6 bg-brand-600/10 rounded-[2rem] border border-brand-500/20 flex items-center justify-between group cursor-pointer hover:bg-brand-600/20 transition-all shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Zap size={20} fill="currentColor"/></div>
                                        <p className="text-xs font-black uppercase tracking-widest">Auto-Forge AI</p>
                                    </div>
                                    <div className="w-12 h-6 bg-brand-600 rounded-full p-1 flex justify-end transition-all shadow-glow"><div className="w-4 h-4 bg-white rounded-full shadow-lg"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="flex items-end justify-between px-4">
                    <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">The Vault</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px] ml-1">Secure control of your identity & preferences</p>
                    </div>
                    <ShieldCheck size={56} className="text-brand-600 opacity-20 hover:opacity-100 transition-opacity cursor-help" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12 group hover:shadow-2xl transition-all">
                        <h4 className="text-2xl font-black uppercase tracking tight flex items-center gap-4 leading-none">
                            <EyeOff size={32} className="text-brand-600" />
                            Privacy Node
                        </h4>
                        
                        <div className="space-y-10">
                            <VaultToggle 
                                label="Stealth Node Mode" 
                                sub="Appear in passive searches without active apply." 
                                active={isPassiveMode} 
                                onClick={() => setIsPassiveMode(!isPassiveMode)} 
                            />
                            <VaultToggle 
                                label="Redact Financials" 
                                sub="Hide salary targets until direct contract link." 
                                active={hideSalary} 
                                onClick={() => setHideSalary(!hideSalary)} 
                            />
                            <VaultToggle 
                                label="Global Talent Seal" 
                                sub="Publicly verify your elite operative rank." 
                                active={true} 
                                onClick={() => {}} 
                            />
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col h-full border-b-8 border-brand-600">
                             <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none translate-x-20 translate-y-20"></div>
                             <h4 className="text-brand-400 font-black text-[11px] uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                                <Sparkles size={18} fill="currentColor" /> Upgrade Operative Rank
                             </h4>
                             <p className="text-xl font-medium text-slate-200 leading-relaxed mb-12 text-balance">
                                Elevate to <span className="text-white font-black underline decoration-brand-500 decoration-4">Prime Operative</span> to unlock Priority Recruiter Radar and unlimited synthesis.
                             </p>
                             <div className="flex-1"></div>
                             <button className="w-full py-6 bg-white text-slate-950 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(255,255,255,0.1)] hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                View Intelligence Tiers
                             </button>
                         </div>

                         <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                            <h4 className="text-slate-900 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4"><Languages size={24} className="text-slate-400" /> Interface Locales</h4>
                            <div className="space-y-5">
                                <button className="w-full p-6 text-left border border-slate-100 bg-slate-50/50 rounded-[1.5rem] hover:border-brand-300 hover:bg-white transition-all flex items-center justify-between group shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Language</span>
                                        <span className="text-sm font-black uppercase tracking-tight text-slate-900">Global English (EN-US)</span>
                                    </div>
                                    <ChevronDown size={18} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
                                </button>
                                <button className="w-full p-6 text-left border border-slate-100 bg-slate-50/50 rounded-[1.5rem] hover:border-brand-300 hover:bg-white transition-all flex items-center justify-between group shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Mode</span>
                                        <span className="text-sm font-black uppercase tracking-tight text-slate-900">Accessibility: Contrast</span>
                                    </div>
                                    <div className="w-12 h-6 bg-slate-200 rounded-full p-1 flex justify-start group-hover:bg-brand-100 transition-all"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

      </main>
      
      {/* Gamified Footer */}
      <footer className="py-16 border-t border-slate-200 px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10 bg-white">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Operative Hub Build v4.2.0-STABLE</p>
              <div className="hidden lg:block h-6 w-[1px] bg-slate-100"></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                 <ShieldCheck size={14} fill="currentColor" /> SOC2 Verified Neural Node
              </p>
          </div>
          <div className="flex items-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600 py-1">Privacy Protocols</a>
              <a href="#" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600 py-1">Mission Terms</a>
              <a href="#" className="hover:text-brand-600 transition-colors border-b border-transparent hover:border-brand-600 py-1">Report Signal Error</a>
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
        <div className={`mt-5 text-[8px] font-black uppercase px-4 py-1.5 rounded-full border shadow-sm transition-colors ${active ? 'text-brand-600 bg-brand-50 border-brand-100' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
            {date}
        </div>
    </div>
);

const SkillNode = ({ label, value, sub }: { label: string, value: number, sub: string }) => (
    <div className="space-y-6 group/skill">
        <div className="flex justify-between items-end">
            <div>
                <p className="text-base font-black text-slate-900 uppercase tracking-tight group-hover/skill:text-brand-600 transition-colors">{label}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{sub}</p>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}%</span>
        </div>
        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
            <div className={`h-full shadow-glow transition-all duration-2000 ease-in-out ${value > 90 ? 'bg-brand-500' : 'bg-brand-400'}`} style={{ width: `${value}%` }} />
        </div>
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

const VaultToggle = ({ label, sub, active, onClick }: { label: string, sub: string, active: boolean, onClick: () => void }) => (
    <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group hover:border-brand-500 hover:bg-white transition-all shadow-inner hover:shadow-2xl">
        <div className="flex-1 pr-6">
            <p className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 leading-none">{label}</p>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed tracking-tight">{sub}</p>
        </div>
        <button 
            onClick={onClick}
            className={`w-16 h-9 rounded-full p-1.5 transition-all duration-500 shadow-inner border-2 ${active ? 'bg-brand-600 border-brand-500 shadow-glow' : 'bg-slate-200 border-slate-300'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow-2xl transform transition-all duration-500 ease-elastic ${active ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
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
