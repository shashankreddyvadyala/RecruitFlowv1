import React, { useState, useEffect, useMemo } from 'react';
// Fix: Removed non-existent CandidateApplication import from types
import { Candidate, Interview, ExternalJob, Skill, ResumeFile } from '../types';
import { analyzeCandidate, generateOutreachEmail, suggestInterviewSlots } from '../services/geminiService';
import { 
  Mail, 
  Sparkles, 
  FileText, 
  X, 
  Search, 
  Trash2, 
  UserPlus, 
  Zap, 
  Target, 
  ShieldCheck, 
  ExternalLink, 
  Bot, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Timer, 
  Compass, 
  Info, 
  FileSearch, 
  Star, 
  Clock, 
  Calendar as CalendarIcon, 
  MessageSquareText, 
  Save, 
  Send, 
  BrainCircuit, 
  Activity, 
  Loader2, 
  ArrowRight, 
  CheckCircle2,
  Share2,
  ThumbsUp,
  Video,
  PhoneCall,
  History,
  Plus,
  GraduationCap,
  Award,
  FileCheck,
  ChevronRight,
  Eye,
  Check,
  Users,
  Filter,
  Layers,
  AlertCircle,
  ShieldAlert,
  Globe,
  Scale
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ActivityTimeline from './ActivityTimeline';
import BulkShareModal from './BulkShareModal';

const CandidateView: React.FC = () => {
  const { 
    candidates, 
    activities, 
    branding, 
    externalJobs,
    interviews,
    addCandidate, 
    removeCandidate, 
    addInterview, 
    updateCandidateNotes, 
    shareJobWithCandidate,
    bulkShareJobs,
    notify, 
    addActivity 
  } = useStore();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'resumes' | 'timeline' | 'matches' | 'calendar' | 'applications'>('info');
  
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'openToWork' | 'passive'>('all');

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = `${c.firstName} ${c.lastName} ${c.role} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        || (statusFilter === 'openToWork' && c.isOpenToWork)
        || (statusFilter === 'passive' && !c.isOpenToWork);
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const sortedResumes = useMemo(() => {
    if (!activeCandidate?.resumes) return [];
    return [...activeCandidate.resumes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [activeCandidate]);

  const recommendedJobs = useMemo(() => {
    if (!activeCandidate) return [];
    return externalJobs.map(job => {
      let score = 75 + Math.floor(Math.random() * 20);
      // AI Logic: Weight Visa Sponsorship compatibility
      if (activeCandidate.workAuthorization === 'Requires Sponsorship' && job.matchScore && job.matchScore < 80) score -= 40;
      return { ...job, matchScore: score };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [activeCandidate, externalJobs]);

  useEffect(() => {
    if (activeCandidate) {
      setCandidateNotes(activeCandidate.notes || '');
      setActiveSubTab('info');
    }
  }, [selectedCandidateId]);

  const handleSaveNotes = () => {
    if (!activeCandidate) return;
    setIsSavingNotes(true);
    updateCandidateNotes(activeCandidate.id, candidateNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      notify("Saved", "Internal intelligence updated.", "success");
    }, 600);
  };

  const handleEmail = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    try {
      await generateOutreachEmail(candidate, branding.companyName, "Recruiter Node");
      notify("Synthesis Ready", "Personalized outreach drafted.", "info");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Talent Pool</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Active Intelligence Node</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
             <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
             <FilterButton active={statusFilter === 'openToWork'} onClick={() => setStatusFilter('openToWork')} label="Open" />
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name, role, or skill..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Identity Node</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Alignment Vector</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Market Status</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 text-right tracking-widest">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedCandidateId(c.id)}>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-4">
                      <img src={c.avatarUrl} alt="" className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl object-cover" />
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight mb-0.5">{c.firstName} {c.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                     <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{c.role}</p>
                     <p className="text-[9px] text-brand-600 font-black uppercase tracking-widest mt-1">Score: {c.matchScore}% Resonance</p>
                  </td>
                  <td className="px-10 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${c.isOpenToWork ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-glow' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {c.isOpenToWork ? 'Market Active' : 'Passive'}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEmail(c, e)} className="p-2 text-slate-400 hover:text-brand-600 transition-all"><Mail size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-purple-600 transition-all"><Zap size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeCandidate && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedCandidateId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="relative">
                    <img src={activeCandidate.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-white shadow-2xl" />
                    {activeCandidate.isOpenToWork && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white"><Star size={10} className="fill-white text-white"/></div>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                  <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black bg-brand-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">{activeCandidate.matchScore}% Resonance</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeCandidate.role}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCandidateId(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
               <SubTabButton active={activeSubTab === 'info'} onClick={() => setActiveSubTab('info')} label="Profile Node" />
               <SubTabButton active={activeSubTab === 'matches'} onClick={() => setActiveSubTab('matches')} label="Market Sync" />
               <SubTabButton active={activeSubTab === 'timeline'} onClick={() => setActiveSubTab('timeline')} label="Activity" />
               <SubTabButton active={activeSubTab === 'applications'} onClick={() => setActiveSubTab('applications')} label="Archived Runs" />
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
              {activeSubTab === 'info' && (
                <div className="space-y-10">
                  {/* RECRUITER VIEW: ENHANCED MARKET ALIGNMENT */}
                  <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24 transition-opacity group-hover:opacity-20"></div>
                        <div className="relative z-10 flex items-center justify-between mb-10">
                             <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Market Alignment Node</h4>
                                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Candidate-Reported DNA</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-brand-400 shadow-inner">
                                <Scale size={28} />
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Compensation Floor</p>
                                    <p className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{activeCandidate.salaryExpectation || 'Uncalibrated'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Visa Sponsorship</p>
                                    <div className="flex">
                                        {activeCandidate.workAuthorization === 'Requires Sponsorship' ? (
                                            <div className="flex items-center gap-3 px-5 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                                <ShieldAlert size={16} className="text-orange-400" />
                                                <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">Required</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                                <ShieldCheck size={16} className="text-emerald-400" />
                                                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Authorized</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Work Protocol</p>
                                    <p className="text-base font-black text-slate-100 uppercase tracking-tight">{activeCandidate.workMode || 'Hybrid / Remote'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Notice Node</p>
                                    <p className="text-base font-black text-slate-100 uppercase tracking-tight">{activeCandidate.noticePeriod || 'Standard (2-4 Weeks)'}</p>
                                </div>
                            </div>
                        </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <MessageSquareText size={16} className="text-brand-600" /> Internal Intelligence
                      </h3>
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline disabled:opacity-50">
                         {isSavingNotes ? 'Synchronizing...' : 'Update Logs'}
                      </button>
                   </div>
                   <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium text-slate-600 leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-brand-500/20 resize-none italic" placeholder="Log recruiter insights here..." />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <ProfileStatCard icon={<Award size={20}/>} label="Market Seniority" value={activeCandidate.yearsOfExperience || '0'} sub="Years Protocol" />
                     <ProfileStatCard icon={<Globe size={20}/>} label="Node Location" value={activeCandidate.preferredLocations?.[0] || 'Global Remote'} sub="Geographic Affinity" />
                  </div>
                </div>
              )}

              {activeSubTab === 'matches' && (
                <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Market Predications</h4>
                        <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">{recommendedJobs.length} Compatible Nodes</span>
                    </div>
                    {recommendedJobs.map(job => (
                        <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">{job.company[0]}</div>
                                    <div>
                                        <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none mb-1 group-hover:text-brand-600 transition-colors">{job.title}</h5>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{job.company} • {job.location}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black tracking-tighter ${job.matchScore! >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>{job.matchScore}% Match</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Neural Rank</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {activeSubTab === 'timeline' && <ActivityTimeline activities={activities.filter(a => a.entityId === activeCandidate.id)} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
);

const SubTabButton = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${active ? 'text-brand-600 border-brand-600 bg-brand-50/20' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{label}</button>
);

const ProfileStatCard = ({ icon, label, value, sub }: any) => (
  <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all">
     <div className="p-3 bg-white text-slate-400 rounded-xl inline-block shadow-sm group-hover:text-brand-600 group-hover:scale-110 transition-all mb-6">{icon}</div>
     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{label}</p>
     <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">{value}</p>
     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">{sub}</p>
  </div>
);

export default CandidateView;
