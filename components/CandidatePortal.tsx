
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
  Activity,
  Award,
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'lab' | 'settings'>('dashboard');
  
  const myData = candidates.find(c => c.id === 'c1') || candidates[0];

  const [editSkills, setEditSkills] = useState(myData.skills.join(', '));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [resumeName, setResumeName] = useState(myData.resumeName || 'resume_2025.pdf');

  const [selectedJobForTailoring, setSelectedJobForTailoring] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredMaterials, setTailoredMaterials] = useState<any>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const [profileCompleteness, setProfileCompleteness] = useState(68);
  const [isPassiveMode, setIsPassiveMode] = useState(false);
  const [hideSalary, setHideSalary] = useState(true);

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
              skills: editSkills.split(',').map(s => s.trim()).filter(s => s) 
          });
          setIsUpdatingProfile(false);
          notify("Success", "Profile skills updated.", "success");
      }, 800);
  };

  const handleSimulateResumeUpload = () => {
      const names = ['resume_v2.pdf', 'engineering_cv.pdf', 'latest_cv_2025.pdf'];
      const newName = names[Math.floor(Math.random() * names.length)];
      setResumeName(newName);
      updateCandidateProfile(myData.id, { 
          resumeName: newName,
          resumeUpdatedAt: new Date().toISOString()
      });
      notify("Resume Uploaded", `${newName} is now active.`, "success");
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
      notify("Applied", "Application submitted successfully.", "success");
      setSelectedJobForTailoring(null);
      setActiveTab('applications');
    }, 1500);
  };

  const handleBatchApply = () => {
    notify("Processing", "AI is submitting 5 applications for you.", "info");
    setTimeout(() => {
      notify("Complete", "5 applications have been submitted.", "success");
    }, 3000);
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                R
            </div>
            <div className="hidden sm:block">
                <span className="font-bold text-lg text-slate-900 uppercase">
                    {branding.companyName} <span className="text-[10px] text-slate-400 font-bold ml-2">Portal</span>
                </span>
            </div>
        </div>

        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 mx-4">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={14}/>} label="Overview" />
            <NavTab active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={14}/>} label="Jobs" />
            <NavTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Layers size={14}/>} label="Applications" />
            <NavTab active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<Sparkles size={14}/>} label="AI Tools" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<User size={14}/>} label="Profile" />
        </nav>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-slate-900">{myData.firstName} {myData.lastName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{myData.role}</p>
                </div>
                <img src={myData.avatarUrl} className="w-10 h-10 rounded-xl border border-slate-200" alt="Profile" />
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
                    <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[300px]">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold mb-4">Welcome back, <br/>{myData.firstName}.</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-md mt-4">
                                You have {sharedJobs.length + recommendedJobs.length} new job matches today.
                            </p>
                        </div>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 relative z-10">
                            <button onClick={() => setActiveTab('jobs')} className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
                                <Search size={16} /> View Matches
                            </button>
                            <button onClick={() => setActiveTab('applications')} className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold text-sm border border-white/20 hover:bg-white/20 transition-colors">
                                Track Applications
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="relative inline-flex mb-6">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                <circle className="text-brand-500 transition-all duration-1000 ease-out" strokeWidth="8" strokeDasharray={364} strokeDashoffset={364 * (1 - profileCompleteness / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{profileCompleteness}%</span>
                            </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Profile Health</h4>
                        <p className="text-xs text-slate-500 px-4">Keep your profile updated to get better matches.</p>
                        <button onClick={() => setActiveTab('settings')} className="mt-4 text-xs font-bold text-brand-600 hover:underline">Edit Profile</button>
                    </div>
                </div>

                {sharedJobs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                             <Share2 className="text-brand-600" size={20} />
                             <h3 className="text-xl font-bold text-slate-900">Recommended for You</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sharedJobs.map(job => (
                                <div key={job.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-500 transition-all flex flex-col md:flex-row items-center gap-8">
                                     <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0">
                                        {job.company[0]}
                                     </div>
                                     <div className="flex-1 text-center md:text-left">
                                         <h4 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h4>
                                         <p className="text-xs font-medium text-slate-400 mb-4">{job.company}</p>
                                         <button onClick={() => handleStartTailoring(job)} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold text-xs hover:bg-brand-700 transition-colors">
                                             Customize Application
                                         </button>
                                     </div>
                                     <div className="text-emerald-500 font-bold text-lg shrink-0">
                                         {job.matchScore}% Match
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'jobs' && (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Job Matches</h2>
                        <p className="text-slate-500 text-sm">Best opportunities based on your skills</p>
                    </div>
                    <button onClick={handleBatchApply} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Zap size={14} /> Batch Apply
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedJobs.map((job) => (
                        <div key={job.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-500 transition-all flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-xl">
                                    {job.company[0]}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 leading-none mb-1">{job.company}</h4>
                                    <p className="text-[10px] text-slate-400">{job.location}</p>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex-1">{job.title}</h3>
                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                <span className="text-xs font-bold text-emerald-600">{job.matchScore}% Match</span>
                                <button onClick={() => handleStartTailoring(job)} className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-bold text-xs hover:bg-brand-600 hover:text-white transition-colors">
                                    Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'applications' && (
            <div className="space-y-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900">My Applications</h2>
                <div className="space-y-4">
                    {myApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl">
                                        {app.company[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-1">{app.role}</h4>
                                        <p className="text-xs text-slate-400">{app.company} • Submitted {app.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                        app.status === 'Interview' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        app.status === 'Screened' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                        {app.status}
                                    </span>
                                    <ChevronRight size={18} className="text-slate-300" />
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
                    <h2 className="text-3xl font-bold text-slate-900">AI Application Lab</h2>
                    {selectedJobForTailoring && <button onClick={() => setSelectedJobForTailoring(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2">
                        <ArrowLeft size={14}/> Back to Jobs
                    </button>}
                </div>
                {selectedJobForTailoring ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xl">
                                        {selectedJobForTailoring.company[0]}
                                    </div>
                                    <p className="font-bold text-lg leading-tight">{selectedJobForTailoring.title}</p>
                                </div>
                                <p className="text-xs text-slate-400 mb-8 leading-relaxed">Customize your documents for this specific role to increase your chances.</p>
                                <button disabled={isTailoring} onClick={handleGenerateTailoredDocs} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
                                    {isTailoring ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Tailor My Resume
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            {tailoredMaterials ? (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Custom Cover Letter</h4>
                                    <div className="bg-slate-50 p-6 rounded-xl text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-8 border border-slate-100">
                                        {tailoredMaterials.coverLetter}
                                    </div>
                                    <button onClick={handleTransmitApplication} disabled={isTransmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                                        {isTransmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        Submit Now
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                                    <Sparkles size={32} className="text-slate-200 mb-4" />
                                    <p className="text-sm text-slate-400 font-medium">Select a job and click "Tailor My Resume" to start.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
                        <Rocket size={40} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">Choose a Job to Tailor</h3>
                        <p className="text-slate-400 text-sm mt-2">Personalize your application for better results.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900">Profile Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                        <h4 className="text-lg font-bold flex items-center gap-3 text-slate-900">
                            <User size={24} className="text-brand-600" />
                            Personal Info
                        </h4>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Technical Skills</label>
                                <input 
                                    type="text"
                                    value={editSkills}
                                    onChange={(e) => setEditSkills(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900"
                                    placeholder="e.g. React, Python"
                                />
                            </div>

                            <button 
                                onClick={handleUpdateProfile}
                                disabled={isUpdatingProfile}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                {isUpdatingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-xl flex flex-col h-full">
                             <h4 className="text-brand-400 font-bold text-xs uppercase mb-8 flex items-center gap-2">
                                <FileText size={16} /> Current Resume
                             </h4>
                             <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-8">
                                <p className="text-sm font-bold truncate mb-1">{resumeName}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Last updated {myData.resumeUpdatedAt || 'recently'}</p>
                             </div>
                             <div className="mt-auto">
                                <button onClick={handleSimulateResumeUpload} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                    <Upload size={16} /> Update File
                                </button>
                             </div>
                         </div>

                         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <h4 className="text-slate-900 font-bold text-xs uppercase flex items-center gap-2">Privacy</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Open to opportunities</span>
                                    <button 
                                        onClick={() => setIsPassiveMode(!isPassiveMode)}
                                        className={`w-10 h-5 rounded-full p-1 transition-colors ${isPassiveMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isPassiveMode ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      <footer className="py-12 border-t border-slate-200 px-6 lg:px-12 flex items-center justify-between bg-white mt-auto">
          <p className="text-xs text-slate-300 font-medium">Version 2.5.0</p>
          <div className="flex items-center gap-8 text-xs text-slate-400 font-medium">
              <a href="#" className="hover:text-brand-600">Privacy</a>
              <a href="#" className="hover:text-brand-600">Terms</a>
          </div>
      </footer>
    </div>
  );
};

const NavTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`px-4 lg:px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${active ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'}`}
    >
        <span className={`${active ? 'text-brand-600' : ''}`}>{icon}</span> 
        <span className="hidden sm:inline">{label}</span>
    </button>
);

export default CandidatePortal;
