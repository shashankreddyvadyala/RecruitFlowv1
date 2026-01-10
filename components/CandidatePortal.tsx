
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
  Star,
  Video,
  ExternalLink,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CandidatePortalProps {
  onLogout: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ onLogout }) => {
  const { branding, externalJobs, interviews } = useStore();
  const [activeTab, setActiveTab] = useState<'applications' | 'profile' | 'explore' | 'interviews'>('applications');

  // Filter interviews for this specific candidate (Mocked for Sarah Chen)
  const myInterviews = interviews
    .filter(i => i.candidateName.includes('Sarah') || i.candidateId === 'c1')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const myApplications = [
    { id: 'ap1', role: 'Senior React Engineer', company: 'TechFlow Inc', status: 'Interviewing', date: '2 days ago', progress: 60 },
    { id: 'ap2', role: 'Staff Frontend Developer', company: 'CloudScale', status: 'AI Screened', date: '5 days ago', progress: 30 },
    { id: 'ap3', role: 'Lead Architect', company: 'GlobalData', status: 'Applied', date: '1 week ago', progress: 10 },
  ];

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
        {/* Welcome Section */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <img src="https://picsum.photos/100/100?random=1" className="w-24 h-24 rounded-3xl border-4 border-white/10 shadow-2xl" alt="Profile" />
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">Welcome back, Sarah</h1>
                    <p className="text-slate-400 font-medium mb-4">Your profile is 85% complete. Recruiters are looking for your skills in <span className="text-brand-400">TypeScript</span> and <span className="text-brand-400">Next.js</span>.</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Active Hunt</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Verified Talent</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('applications')}
                        className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'applications' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Applications
                    </button>
                    <button 
                        onClick={() => setActiveTab('interviews')}
                        className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'interviews' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        My Interviews
                    </button>
                    <button 
                        onClick={() => setActiveTab('explore')}
                        className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'explore' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Explore Roles
                    </button>
                </div>

                {activeTab === 'applications' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                    <div className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-widest">
                                        {app.status}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500" style={{ width: `${app.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'interviews' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {myInterviews.length > 0 ? (
                      myInterviews.map((int, idx) => {
                        const isUpcoming = int.status === 'Scheduled';
                        return (
                          <div key={int.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            {isUpcoming && <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/5 rounded-bl-[4rem] -mr-4 -mt-4"></div>}
                            
                            <div className="flex flex-col md:flex-row gap-8">
                              <div className="w-full md:w-32 shrink-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Meeting Time</p>
                                <h4 className="text-xl font-black text-slate-900 leading-none">
                                  {new Date(int.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </h4>
                                <p className="text-sm font-bold text-brand-600 mt-1">
                                  {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>

                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-brand-600 transition-colors">
                                      {int.jobTitle}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Interviewer:</span>
                                      <span className="text-[10px] font-black text-slate-900 uppercase">{int.interviewerName}</span>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                    int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-brand-50 text-brand-600 border-brand-100'
                                  }`}>
                                    {int.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                   <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                                        <Video size={20} />
                                      </div>
                                      <div>
                                         <p className="text-[9px] font-black text-slate-400 uppercase">Channel</p>
                                         <p className="text-xs font-bold text-slate-900">Google Meet</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                                        <MapPin size={20} />
                                      </div>
                                      <div>
                                         <p className="text-[9px] font-black text-slate-400 uppercase">Location</p>
                                         <p className="text-xs font-bold text-slate-900">Virtual / Remote</p>
                                      </div>
                                   </div>
                                </div>

                                {isUpcoming && (
                                  <div className="mt-8 flex gap-4">
                                     <a 
                                      href={int.location} 
                                      target="_blank" 
                                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all"
                                     >
                                        Enter Meeting Room <ExternalLink size={16} />
                                     </a>
                                     <button className="px-6 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all">
                                        Reschedule
                                     </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                        <Calendar size={40} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No interviews on file</h3>
                        <p className="text-slate-500 mt-1 font-medium">Once a recruiter schedules a session, it will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="space-y-8">
                {/* Upcoming Widget Summary */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Coming Up</h3>
                    {myInterviews.filter(i => i.status === 'Scheduled').length > 0 ? (
                      myInterviews.filter(i => i.status === 'Scheduled').slice(0, 1).map(int => (
                        <div key={int.id} className="bg-brand-50 p-5 rounded-2xl border border-brand-100 mb-4 animate-in fade-in slide-in-from-right-4">
                          <div className="flex items-center gap-3 mb-3">
                              <Calendar className="text-brand-600" size={18} />
                              <span className="text-[10px] font-black text-brand-700 uppercase">
                                {new Date(int.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                          </div>
                          <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">{int.jobTitle}</h4>
                          <p className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5">
                            <Video size={12} /> with {int.interviewerName}
                          </p>
                          <button 
                            onClick={() => setActiveTab('interviews')}
                            className="w-full block text-center py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all"
                          >
                            View All Details
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <Clock className="mx-auto text-slate-300 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No pending sessions</p>
                      </div>
                    )}
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10"></div>
                    <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Zap size={16} /> Fast Track
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">
                      Our AI agents have analyzed your skill set. You are eligible for <b>3 instant screenings</b> this week.
                    </p>
                    <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all">
                       Check Eligibility
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatePortal;
