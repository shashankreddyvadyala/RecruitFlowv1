
import React, { useState, useEffect } from 'react';
import { Candidate, Interview } from '../types';
import { analyzeCandidate, generateOutreachEmail, suggestInterviewSlots } from '../services/geminiService';
import { Mail, Sparkles, FileText, X, Search, Trash2, UserPlus, Zap, Target, ShieldCheck, ExternalLink, Bot, MapPin, Briefcase, DollarSign, Timer, Compass, Info, FileSearch, Star, Clock, Calendar, MessageSquareText, Save, Send, BrainCircuit, Activity, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ActivityTimeline from './ActivityTimeline';

const CandidateView: React.FC = () => {
  const { candidates, activities, branding, addCandidate, removeCandidate, addInterview, updateCandidateNotes, notify, addActivity } = useStore();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'timeline' | 'schedule'>('info');
  
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Scheduling States
  const [isSchedulingAI, setIsSchedulingAI] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<{ date: string; time: string; reason: string; score: number }[]>([]);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewer, setInterviewer] = useState('Alex Morgan');
  const [interviewType, setInterviewType] = useState<Interview['type']>('Technical');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    skills: ''
  });

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  useEffect(() => {
    if (activeCandidate) {
      setCandidateNotes(activeCandidate.notes || '');
      // Reset scheduling when switching candidates
      setSuggestedSlots([]);
    }
  }, [selectedCandidateId, activeCandidate?.notes]);

  const handleSaveNotes = () => {
    if (!activeCandidate) return;
    setIsSavingNotes(true);
    updateCandidateNotes(activeCandidate.id, candidateNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      notify("Intelligence Synced", "Candidate records have been normalized.", "success");
    }, 600);
  };

  const handleSmartSchedule = async () => {
    if (!activeCandidate) return;
    setIsSchedulingAI(true);
    try {
      const slots = await suggestInterviewSlots(
        `${activeCandidate.firstName} ${activeCandidate.lastName}`,
        activeCandidate.candidateTimezone || 'America/Los_Angeles',
        activeCandidate.availability || 'Immediate',
        'America/New_York' // Recruiter TZ
      );
      setSuggestedSlots(slots);
      notify("Neural Slot Optimization", "High-harmony slots identified.", "success");
    } catch (e) {
      console.error(e);
      notify("Optimization Error", "Failed to generate AI slots.", "error");
    } finally {
      setIsSchedulingAI(false);
    }
  };

  const executeSchedule = (date: string, time: string) => {
    if (!activeCandidate) return;

    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 45 * 60 * 1000);

    const interview: Interview = {
      id: `int_${Date.now()}`,
      candidateId: activeCandidate.id,
      candidateName: `${activeCandidate.firstName} ${activeCandidate.lastName}`,
      jobId: 'j1',
      jobTitle: activeCandidate.role,
      interviewerName: interviewer,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: 'https://meet.google.com/abc-defg-hij',
      status: 'Scheduled',
      type: interviewType,
      notes: 'Scheduled via AI Smart Optimizer.'
    };

    addInterview(interview);
    addActivity({
      id: `act_int_${Date.now()}`,
      type: 'Meeting',
      subject: 'Session Locked',
      content: `AI-optimized interview confirmed for ${date} at ${time}. Calendar invites transmitted.`,
      timestamp: new Date().toISOString(),
      author: 'AI Scheduler',
      entityId: activeCandidate.id
    });

    setActiveSubTab('timeline');
    notify("Session Synchronized", `Meeting link dispatched to ${activeCandidate.firstName}.`, "success");
  };

  const handleManualSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) return;
    executeSchedule(interviewDate, interviewTime);
  };

  const handleAnalyze = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidateId(candidate.id);
    setActiveSubTab('info');
    try {
      const mockResume = `Experienced software engineer with 5 years in ${candidate.skills.join(', ')}.`;
      await analyzeCandidate(mockResume, "Role resonance check.");
      notify("AI Scan Complete", "Resonance identified.", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEmail = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidateId(candidate.id);
    try {
      await generateOutreachEmail(candidate, branding.companyName, "Alex");
      notify("Sequence Prepared", "AI Outreach transmission ready.", "info");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteCandidate = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Purge ${name}?`)) {
      removeCandidate(id);
      if (selectedCandidateId === id) setSelectedCandidateId(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: Candidate = {
      id: `c_${Date.now()}`,
      firstName: newCandidate.firstName,
      lastName: newCandidate.lastName,
      email: newCandidate.email,
      role: newCandidate.role,
      status: 'Active',
      stageId: 's1',
      matchScore: 0,
      skills: newCandidate.skills.split(',').map(s => s.trim()).filter(s => s),
      lastActivity: 'Manual Ingestion',
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`
    };
    addCandidate(candidate);
    setShowAddModal(false);
  };

  const candidateActivities = activeCandidate ? activities.filter(a => a.entityId === activeCandidate.id) : [];

  return (
    <div className="h-full flex flex-col font-sans animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Talent Ingress</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Agency Resonance Database</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search talent..." 
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] w-80 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all text-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-3"
          >
            <UserPlus size={18} /> Provision Talent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Dossier</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Assignment</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Priority Tier</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-right">Match resonance</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const isBench = c.lastActivity.includes('Bench') || c.matchScore >= 90;
                const isPool = c.lastActivity.includes('Pool');
                
                return (
                  <tr key={c.id} className={`hover:bg-brand-50/20 transition-all group cursor-pointer ${isBench ? 'bg-brand-50/10' : ''}`} onClick={() => setSelectedCandidateId(c.id)}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <img src={c.avatarUrl} alt="" className={`w-14 h-14 rounded-2xl shadow-xl border-2 object-cover ${isBench ? 'border-brand-500 ring-2 ring-brand-100' : 'border-white'}`} />
                          {isBench && (
                            <div className="absolute -top-2 -right-2 bg-brand-600 text-white p-1 rounded-lg shadow-lg border-2 border-white">
                                <Zap size={12} fill="white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-1.5">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{c.role}</span>
                    </td>
                    <td className="px-10 py-6">
                      {isBench ? (
                        <div className="inline-flex items-center gap-2 bg-brand-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-brand-500/30">
                            <Star size={12} className="fill-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Elite Bench (P1)</span>
                        </div>
                      ) : isPool ? (
                        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800">
                            <BrainCircuit size={12} className="text-brand-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Pool (P2)</span>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border border-slate-200">
                            Neural Discovery
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-xl font-black ${c.matchScore > 85 ? 'text-emerald-500' : 'text-brand-500'}`}>{c.matchScore}%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000 ${c.matchScore > 90 ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-brand-500'}`} style={{width: `${c.matchScore}%`}} />
                          </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => handleEmail(c, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand-600 hover:border-brand-500"><Mail size={16} /></button>
                        <button onClick={(e) => handleAnalyze(c, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-purple-600 hover:border-purple-500"><Zap size={16} /></button>
                        <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName}`, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeCandidate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-10">
                <div className="flex gap-6 items-center">
                  <img src={activeCandidate.avatarUrl} className="w-24 h-24 rounded-[2rem] shadow-2xl border-4 border-white object-cover" />
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                    <div className="flex gap-3 items-center">
                        <span className="text-[10px] font-black bg-brand-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest">{activeCandidate.matchScore}% Resonance</span>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Target size={14} className="text-brand-600" /> {activeCandidate.role}
                        </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidateId(null)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200">
                 <button onClick={() => setActiveSubTab('info')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'info' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>Intelligence</button>
                 <button onClick={() => setActiveSubTab('timeline')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'timeline' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>Chronology</button>
                 <button onClick={() => setActiveSubTab('schedule')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'schedule' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500'}`}>Sync Lab</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : activeSubTab === 'schedule' ? (
                <div className="space-y-10">
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden group">
                     <div className="relative z-10">
                        <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} /> Temporal Intelligence
                        </h4>
                        <p className="text-xl font-black uppercase tracking-tight mb-8">Deploy Gemini to identify <br/> high-harmony sync windows.</p>
                        <button 
                            onClick={handleSmartSchedule}
                            disabled={isSchedulingAI}
                            className="px-8 py-4 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center gap-3"
                        >
                            {isSchedulingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Optimize via AI
                        </button>
                     </div>
                     <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500 rounded-full blur-[100px] opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                  </div>

                  {suggestedSlots.length > 0 && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-4">
                          <div className="flex items-center gap-3 px-2">
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Suggested Slots</h5>
                             <div className="h-[1px] flex-1 bg-slate-100"></div>
                          </div>
                          <div className="grid gap-4">
                             {suggestedSlots.map((slot, i) => (
                                 <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:border-brand-500 hover:shadow-xl transition-all group flex items-center justify-between">
                                     <div className="flex items-center gap-6">
                                         <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
                                            <Calendar size={18} className="text-slate-400 group-hover:text-brand-600" />
                                            <span className="text-[9px] font-black text-brand-600 uppercase mt-1">{slot.score}%</span>
                                         </div>
                                         <div>
                                            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{slot.time} • {new Date(slot.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[240px]">{slot.reason}</p>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => executeSchedule(slot.date, slot.time)}
                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-brand-600 transition-all shadow-xl group-hover:scale-110"
                                     >
                                        <ArrowRight size={20} />
                                     </button>
                                 </div>
                             ))}
                          </div>
                      </div>
                  )}

                  <div className="pt-10 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-2">Manual Dispatch</p>
                    <form onSubmit={handleManualSchedule} className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Date</label>
                          <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold shadow-inner" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Time (Local)</label>
                          <input type="time" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold shadow-inner" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-6 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-200 hover:text-slate-600 transition-all">Manual Mission Lock</button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-brand-400 text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                         <MessageSquareText size={20} /> Field Intelligence
                      </h3>
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                         {isSavingNotes ? 'Syncing...' : 'Sync Intel'}
                      </button>
                   </div>
                   <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} className="w-full min-h-[160px] p-8 bg-white/5 border border-white/10 rounded-[2rem] text-slate-200 shadow-inner resize-none transition-all leading-relaxed outline-none" placeholder="Log classified field intel..." />
                  </div>
                  
                  {activeCandidate.lastActivity.includes('Preference') && (
                    <div className="bg-brand-50 border border-brand-100 rounded-[2rem] p-8">
                        <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Activity size={16} /> Sourcing Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-brand-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Source Tier</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{activeCandidate.lastActivity.split(' (')[0]}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-brand-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Resonance Level</p>
                                <p className="text-sm font-black text-emerald-600 uppercase">High Fidelity</p>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Provisioning</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="First Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold shadow-inner outline-none" value={newCandidate.firstName} onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})} />
                    <input required placeholder="Last Name" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold shadow-inner outline-none" value={newCandidate.lastName} onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all">Formalize Dossier</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CandidateView;
