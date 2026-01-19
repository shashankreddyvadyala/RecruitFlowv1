
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Interview, ExternalJob, Skill, ResumeFile, UserRole, RecruiterStats } from '../types';
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
  Scale,
  User,
  Trophy,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ActivityTimeline from './ActivityTimeline';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type CandidateStatusFilter = 'all' | 'openToWork' | 'passive' | 'hired';

interface CandidateViewProps {
  initialFilter?: CandidateStatusFilter;
}

const CandidateView: React.FC<CandidateViewProps> = ({ initialFilter = 'all' }) => {
  const { 
    candidates, 
    activities, 
    branding, 
    externalJobs,
    interviews,
    recruiterStats,
    userRole,
    removeCandidate,
    addCandidate,
    addActivity,
    updateCandidateNotes, 
    notify 
  } = useStore();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'resumes' | 'timeline' | 'matches' | 'calendar' | 'applications'>('info');
  
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatusFilter>(initialFilter);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  // Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    assignedRecruiter: recruiterStats[0]?.name || ''
  });

  const isOwner = userRole === UserRole.Owner;

  // Sync internal filter if prop changes (deep linking)
  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  const filteredCandidates = useMemo(() => {
    const now = new Date();
    
    return candidates.filter(c => {
      // 1. Basic Identity Filter
      const matchesSearch = `${c.firstName} ${c.lastName} ${c.role} ${c.email} ${c.assignedRecruiter || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' 
        || (statusFilter === 'openToWork' && c.isOpenToWork)
        || (statusFilter === 'passive' && !c.isOpenToWork)
        || (statusFilter === 'hired' && (c.status === 'Hired' || c.status === 'Placed'));

      // 3. Temporal Activity Filter
      let matchesTime = true;
      if (timeRange !== 'ALL') {
        const candidateActivities = activities.filter(a => a.entityId === c.id);
        if (candidateActivities.length === 0) {
          matchesTime = false; // No activity ever
        } else {
          const latestActivityDate = new Date(Math.max(...candidateActivities.map(a => new Date(a.timestamp).getTime())));
          const diffMs = now.getTime() - latestActivityDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          switch (timeRange) {
            case '1D': matchesTime = diffDays <= 1; break;
            case '7D': matchesTime = diffDays <= 7; break;
            case '1M': matchesTime = diffDays <= 30; break;
            case '3M': matchesTime = diffDays <= 90; break;
            case '6M': matchesTime = diffDays <= 180; break;
            case '1Y': matchesTime = diffDays <= 365; break;
            default: matchesTime = true;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [candidates, searchQuery, statusFilter, timeRange, activities]);

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
  }, [selectedCandidateId, activeCandidate]);

  const handleSaveNotes = () => {
    if (!activeCandidate) return;
    setIsSavingNotes(true);
    updateCandidateNotes(activeCandidate.id, candidateNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      notify("Saved", "Internal intelligence updated.", "success");
    }, 600);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName) return;
    
    setIsInviting(true);
    const newId = `c_inv_${Date.now()}`;
    
    // Provision new node
    const newCandidate: Candidate = {
        id: newId,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        email: inviteForm.email,
        role: inviteForm.role || 'Unspecified Node',
        status: 'New',
        stageId: 's1',
        matchScore: 0,
        skills: [],
        lastActivity: 'Invitation Dispatched',
        avatarUrl: `https://picsum.photos/100/100?u=${newId}`,
        assignedRecruiter: inviteForm.assignedRecruiter,
        isOpenToWork: true,
        notes: 'Node provisioned via manual invitation.'
    };

    // Simulate Network Latency
    await new Promise(r => setTimeout(r, 1200));
    
    addCandidate(newCandidate);
    addActivity({
        id: `act_inv_${Date.now()}`,
        type: 'Email',
        subject: 'Invitation Transmitted',
        content: `Agency invitation dispatched to ${inviteForm.email} for the ${inviteForm.role} role.`,
        timestamp: new Date().toISOString(),
        author: inviteForm.assignedRecruiter || 'System',
        entityId: newId
    });

    notify("Invitation Sent", `Target node ${inviteForm.firstName} provisioned successfully.`, "success");
    setIsInviting(false);
    setShowInviteModal(false);
    setInviteForm({ firstName: '', lastName: '', email: '', role: '', assignedRecruiter: recruiterStats[0]?.name || '' });
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

  const handleDeleteCandidate = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`ARE YOU SURE? Permanently remove node [${candidate.firstName} ${candidate.lastName}] from the cloud?`)) {
      removeCandidate(candidate.id);
      notify("Node Removed", "Candidate identity purged from system.", "warning");
    }
  };

  const getRecruiterAvatar = (name?: string) => {
    if (!name) return null;
    const rec = recruiterStats.find(r => r.name === name);
    return rec?.avatarUrl || `https://picsum.photos/40/40?u=${encodeURIComponent(name)}`;
  };

  return (
    <div className="h-full flex flex-col font-sans relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Talent Pool</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Active Intelligence Node</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
          >
            <UserPlus size={16} /> Invite Candidate
          </button>

          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                {(['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((opt) => (
                    <button 
                      key={opt} 
                      onClick={() => setTimeRange(opt)} 
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === opt ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {opt}
                    </button>
                ))}
            </div>

          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
             <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
             <FilterButton active={statusFilter === 'openToWork'} onClick={() => setStatusFilter('openToWork')} label="Open" />
             <FilterButton active={statusFilter === 'hired'} onClick={() => setStatusFilter('hired')} label="Hired" icon={<Trophy size={12}/>} />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl w-48 focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">CANDIDATE</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Alignment Vector</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">RECRUITER</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Market Status</th>
                <th className="px-10 py-4 font-black text-[10px] uppercase text-slate-400 text-right tracking-widest">ACTIONS</th>
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
                    <div className="flex items-center gap-3">
                        <img src={getRecruiterAvatar(c.assignedRecruiter) || `https://picsum.photos/40/40?u=${c.id}`} className="w-6 h-6 rounded-lg border border-slate-200 object-cover" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{c.assignedRecruiter || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                        (c.status === 'Hired' || c.status === 'Placed') ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-glow' :
                        c.isOpenToWork ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-glow' : 
                        'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                        {(c.status === 'Hired' || c.status === 'Placed') ? <><Trophy size={10}/> HIRED</> : c.isOpenToWork ? 'Market Active' : 'Passive'}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEmail(c, e)} className="p-2 text-slate-400 hover:text-brand-600 transition-all"><Mail size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-purple-600 transition-all"><Zap size={16} /></button>
                      {isOwner && (
                        <button onClick={(e) => handleDeleteCandidate(c, e)} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="py-20 text-center">
                <AlertCircle size={48} className="text-slate-100 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No matching nodes</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Zero candidates detected in the {timeRange} window with the current filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* INVITE CANDIDATE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg"><UserPlus size={20} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Invite Candidate Node</h3>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={20} /></button>
             </div>
             <form onSubmit={handleInviteSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" 
                            placeholder="Alex"
                            value={inviteForm.firstName}
                            onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Last Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" 
                            placeholder="Chen"
                            value={inviteForm.lastName}
                            onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Identity (Email)</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            required 
                            type="email" 
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" 
                            placeholder="alex.chen@global.ai"
                            value={inviteForm.email}
                            onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alignment Role</label>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            required 
                            type="text" 
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" 
                            placeholder="Lead React Architect"
                            value={inviteForm.role}
                            onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ownership Assignment</label>
                    <div className="relative">
                        <select 
                            value={inviteForm.assignedRecruiter}
                            onChange={e => setInviteForm({...inviteForm, assignedRecruiter: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner appearance-none uppercase"
                        >
                            <option value="">Unassigned</option>
                            {recruiterStats.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-center gap-3">
                    <Sparkles size={18} className="text-brand-600" />
                    <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide leading-relaxed">
                        Provisioning this node will trigger a welcome sequence and activate portal synchronization.
                    </p>
                </div>

                <button 
                    type="submit" 
                    disabled={isInviting}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isInviting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Initiate Invitation Protocol</>}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* INTELLIGENCE DRAWER */}
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
                  {/* RECRUITER INFO NODE */}
                  <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={getRecruiterAvatar(activeCandidate.assignedRecruiter) || `https://picsum.photos/40/40?u=${activeCandidate.id}`} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Managing Recruiter</p>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{activeCandidate.assignedRecruiter || 'Unassigned'}</p>
                            </div>
                        </div>
                        <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                            <Mail size={16} />
                        </button>
                  </div>

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
                     <ProfileStatCard icon={<Award size={20}/>} label="Market Seniority" value={activeCandidate.skills?.[0]?.years || '0'} sub="Years Protocol" />
                     <ProfileStatCard icon={<Globe size={20}/>} label="Node Location" value="Global Remote" sub="Geographic Affinity" />
                  </div>
                </div>
              )}

              {activeSubTab === 'matches' && (
                <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Market Predictions</h4>
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

              {activeSubTab === 'timeline' && (
                <div className="animate-in fade-in duration-500">
                    <ActivityTimeline activities={activities.filter(a => a.entityId === activeCandidate.id)} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick} 
    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
        active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
      {icon}{label}
  </button>
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
