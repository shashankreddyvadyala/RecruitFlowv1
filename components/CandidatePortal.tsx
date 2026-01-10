
import React, { useState } from 'react';
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
  Star
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CandidatePortalProps {
  onLogout: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs } = useStore();
  const [activeTab, setActiveTab] = useState<'applications' | 'profile' | 'explore'>('applications');

  // Mock candidate data
  const myApplications = [
    { id: 'ap1', role: 'Senior React Engineer', company: 'TechFlow Inc', status: 'Interviewing', date: '2 days ago', progress: 60 },
    { id: 'ap2', role: 'Staff Frontend Developer', company: 'CloudScale', status: 'AI Screened', date: '5 days ago', progress: 30 },
    { id: 'ap3', role: 'Lead Architect', company: 'GlobalData', status: 'Applied', date: '1 week ago', progress: 10 },
  ];

  const suggestedJobs = externalJobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain" alt="L" /> : branding.companyName[0]}
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">{branding.companyName} <span className="text-brand-600">Portal</span></span>
        </div>

        <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900">Sarah Chen</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</p>
                </div>
                <img src="https://picsum.photos/100/100?random=1" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Me" />
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-8 flex flex-col gap-8">
        {/* Profile Card */}
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <img src="https://picsum.photos/100/100?random=1" className="w-24 h-24 rounded-3xl border-4 border-white/10 shadow-2xl" alt="Profile" />
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">Welcome back, Sarah</h1>
                    <p className="text-slate-400 font-medium mb-4">Your profile is 85% complete. Recruiters are looking for your skills in <span className="text-brand-400">TypeScript</span> and <span className="text-brand-400">Next.js</span>.</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Active Hunt</span>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">8y Experience</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Verified Talent</span>
                    </div>
                </div>
                <button className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl">
                    Update Profile
                </button>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('applications')}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'applications' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                My Applications
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Portfolio & CV
            </button>
            <button 
                onClick={() => setActiveTab('explore')}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'explore' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Explore Roles
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {activeTab === 'applications' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Active Status</h3>
                        {myApplications.map(app => (
                            <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-slate-100">
                                            {app.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight">{app.role}</h4>
                                            <p className="text-sm font-bold text-slate-500">{app.company}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        app.status === 'Interviewing' ? 'bg-brand-50 text-brand-600' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        {app.status}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Pipeline Progress</span>
                                        <span>{app.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-500 transition-all duration-1000" 
                                            style={{ width: `${app.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Applied {app.date}</p>
                                    <button className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                        View Details <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'explore' && (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 flex gap-4 items-center">
                            <Search className="text-slate-400" size={20} />
                            <input type="text" placeholder="Search new opportunities..." className="flex-1 outline-none text-sm font-medium" />
                            <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Search</button>
                        </div>
                        {suggestedJobs.map(job => (
                            <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300">
                                            {job.logoUrl ? <img src={job.logoUrl} className="w-full h-full object-contain" alt="L" /> : job.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight">{job.title}</h4>
                                            <p className="text-sm font-bold text-slate-500">{job.company} • {job.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                                            <Zap size={14} className="fill-emerald-500" />
                                            98% MATCH
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.salary}</p>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-brand-200 transition-all">
                                    Express Interest via AI Agent
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {/* Stats Widget */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Activity Radar</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CheckCircle size={16} /></div>
                                <span className="text-xs font-black uppercase text-slate-400">Total Views</span>
                            </div>
                            <span className="text-xl font-black text-slate-900">42</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Star size={16} /></div>
                                <span className="text-xs font-black uppercase text-slate-400">Interview Invites</span>
                            </div>
                            <span className="text-xl font-black text-slate-900">3</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Widget */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Coming Up</h3>
                    <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar className="text-brand-600" size={18} />
                            <span className="text-[10px] font-black text-brand-700 uppercase">Today • 2:00 PM</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm uppercase">Technical Screen</h4>
                        <p className="text-xs font-bold text-slate-500 mb-4">with Spotify Tech Team</p>
                        <button className="w-full py-2 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-600/20">
                            Join AI Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatePortal;
