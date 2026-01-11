
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Interview, ExternalJob } from '../types';
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
  Calendar, 
  MessageSquareText, 
  Save, 
  Send, 
  BrainCircuit, 
  Activity, 
  Loader2, 
  ArrowRight, 
  CheckCircle2,
  Share2,
  ThumbsUp
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ActivityTimeline from './ActivityTimeline';

const CandidateView: React.FC = () => {
  const { 
    candidates, 
    activities, 
    branding, 
    externalJobs,
    addCandidate, 
    removeCandidate, 
    addInterview, 
    updateCandidateNotes, 
    shareJobWithCandidate,
    notify, 
    addActivity 
  } = useStore();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'timeline' | 'schedule' | 'matches'>('info');
  
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

  // Simple AI Matching Logic for the matches tab
  const recommendedJobs = useMemo(() => {
    if (!activeCandidate) return [];
    
    return externalJobs.map(job => {
      // Basic matching simulation
      const skillMatch = activeCandidate.skills.some(skill => 
        job.title.toLowerCase().includes(skill.toLowerCase())
      );
      const score = skillMatch ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 20);
      return { ...job, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [activeCandidate, externalJobs]);

  useEffect(() => {
    if (activeCandidate) {
      setCandidateNotes(activeCandidate.notes || '');
      setSuggestedSlots([]);
    }
  }, [selectedCandidateId, activeCandidate?.notes]);

  const handleSaveNotes = () => {
    if (!activeCandidate) return;
    setIsSavingNotes(true);
    updateCandidateNotes(activeCandidate.id, candidateNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      notify("Saved", "Notes updated.", "success");
    }, 600);
  };

  const handleShareJob = (job: ExternalJob) => {
    if (!activeCandidate) return;
    
    shareJobWithCandidate(activeCandidate.id, job);
    
    // Add activity record
    addActivity({
      id: `act_share_${Date.now()}`,
      type: 'JobShared',
      subject: 'Job Opportunity Shared',
      content: `Shared "${job.title}" at ${job.company} with candidate via email and portal.`,
      timestamp: new Date().toISOString(),
      author: 'Alex Morgan',
      entityId: activeCandidate.id
    });

    notify("Job Shared", `Shared ${job.title} with ${activeCandidate.firstName}.`, "success");
  };

  const handleSmartSchedule = async () => {
    if (!activeCandidate) return;
    setIsSchedulingAI(true);
    try {
      const slots = await suggestInterviewSlots(
        `${activeCandidate.firstName} ${activeCandidate.lastName}`,
        activeCandidate.candidateTimezone || 'America/Los_Angeles',
        activeCandidate.availability || 'Immediate',
        'America/New_York'
      );
      setSuggestedSlots(slots);
      notify("Suggestions Ready", "Found best available times.", "success");
    } catch (e) {
      console.error(e);
      notify("Error", "Failed to get suggestions.", "error");
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
      notes: 'Scheduled via AI Suggestions.'
    };

    addInterview(interview);
    addActivity({
      id: `act_int_${Date.now()}`,
      type: 'Meeting',
      subject: 'Interview Scheduled',
      content: `Interview confirmed for ${date} at ${time}.`,
      timestamp: new Date().toISOString(),
      author: 'AI Assistant',
      entityId: activeCandidate.id
    });

    setActiveSubTab('timeline');
    notify("Interview Set", `Invites sent to ${activeCandidate.firstName}.`, "success");
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
      const mockResume = `Experienced engineer in ${candidate.skills.join(', ')}.`;
      await analyzeCandidate(mockResume, "Profile match check.");
      notify("Analysis Complete", "Match score updated.", "success");
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
      notify("Email Ready", "Drafted outreach email.", "info");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteCandidate = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete candidate ${name}?`)) {
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
      lastActivity: 'Manual Entry',
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`
    };
    addCandidate(candidate);
    setShowAddModal(false);
  };

  const candidateActivities = activeCandidate ? activities.filter(a => a.entityId === activeCandidate.id) : [];

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Candidate Pool</h2>
           <p className="text-xs text-slate-400 font-medium uppercase mt-1">Manage and track your candidates</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400">Name</th>
                <th className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400">Role</th>
                <th className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400">Status</th>
                <th className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400 text-right">Match Score</th>
                <th className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const isTopMatch = c.matchScore >= 90;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedCandidateId(c.id)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={c.avatarUrl} alt="" className="w-10 h-10 rounded-full border object-cover" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-none mb-1">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-700">{c.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        isTopMatch ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {isTopMatch ? 'Top Priority' : 'Active'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-sm font-bold ${c.matchScore > 85 ? 'text-emerald-600' : 'text-brand-600'}`}>
                        {c.matchScore}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEmail(c, e)} className="p-2 text-slate-400 hover:text-brand-600" title="Draft Outreach"><Mail size={16} /></button>
                        <button onClick={(e) => handleAnalyze(c, e)} className="p-2 text-slate-400 hover:text-purple-600" title="AI Resonance Check"><Zap size={16} /></button>
                        <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName}`, e)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <img src={activeCandidate.avatarUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                  <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded uppercase">{activeCandidate.matchScore}% Match</span>
                      <p className="text-xs font-medium text-slate-400">{activeCandidate.role}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCandidateId(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-100">
               <button onClick={() => setActiveSubTab('info')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'info' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Profile</button>
               <button onClick={() => setActiveSubTab('matches')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'matches' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Job Matches</button>
               <button onClick={() => setActiveSubTab('timeline')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'timeline' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Activity</button>
               <button onClick={() => setActiveSubTab('schedule')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'schedule' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Schedule</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : activeSubTab === 'matches' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended by AI</h4>
                        <span className="text-[10px] font-bold text-slate-300">BASED ON PROFILE SKILLS</span>
                    </div>
                    
                    {recommendedJobs.length > 0 ? (
                        recommendedJobs.map((job) => {
                            const isAlreadyShared = activeCandidate.sharedJobIds?.includes(job.id);
                            return (
                                <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-500 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                                {job.company[0]}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 text-sm">{job.title}</h5>
                                                <p className="text-[10px] text-slate-400 font-medium">{job.company} • {job.location}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-500 font-bold text-xs">{(job as any).matchScore}% Match</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-4">
                                        <button 
                                            disabled={isAlreadyShared}
                                            onClick={() => handleShareJob(job)}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                isAlreadyShared 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
                                                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/10'
                                            }`}
                                        >
                                            {isAlreadyShared ? (
                                                <><CheckCircle2 size={14} /> Shared with Candidate</>
                                            ) : (
                                                <><Share2 size={14} /> Share & Notify</>
                                            )}
                                        </button>
                                        <a 
                                            href={job.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2.5 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <Bot size={40} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-xs text-slate-400 font-bold uppercase">No external jobs found</p>
                        </div>
                    )}
                </div>
              ) : activeSubTab === 'schedule' ? (
                <div className="space-y-8">
                  <div className="bg-slate-900 p-8 rounded-3xl text-white">
                        <h4 className="text-xs font-bold text-brand-400 uppercase mb-4">Auto-Scheduling</h4>
                        <p className="text-lg font-bold mb-6">Let AI find the best time to meet.</p>
                        <button 
                            onClick={handleSmartSchedule}
                            disabled={isSchedulingAI}
                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-2"
                        >
                            {isSchedulingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Get Suggestions
                        </button>
                  </div>

                  {suggestedSlots.length > 0 && (
                      <div className="space-y-4">
                          <p className="text-xs font-bold text-slate-400 uppercase">Suggested Slots</p>
                          {suggestedSlots.map((slot, i) => (
                              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-brand-500 transition-colors">
                                  <div>
                                      <p className="font-bold text-slate-900">{slot.time} • {new Date(slot.date).toLocaleDateString()}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{slot.reason}</p>
                                  </div>
                                  <button onClick={() => executeSchedule(slot.date, slot.time)} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-brand-600 transition-colors">
                                      <ArrowRight size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-4">Manual Schedule</p>
                    <form onSubmit={handleManualSchedule} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                        <input type="time" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                      </div>
                      <button type="submit" className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">Confirm Date</button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Notes</h3>
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="text-xs font-bold text-brand-600 hover:underline">
                         {isSavingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                   </div>
                   <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-brand-500" placeholder="Add candidate notes here..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Salary</p>
                        <p className="text-sm font-bold text-slate-900">{activeCandidate.salaryExpectation || 'Not specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Work Mode</p>
                        <p className="text-sm font-bold text-slate-900">{activeCandidate.workMode || 'Any'}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Skills Inventory</p>
                    <div className="flex flex-wrap gap-2">
                        {activeCandidate.skills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-lg">
                                {skill}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900">Add New Candidate</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="First Name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newCandidate.firstName} onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})} />
                    <input required placeholder="Last Name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newCandidate.lastName} onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})} />
                 </div>
                 <input required type="email" placeholder="Email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} />
                 <input required placeholder="Target Role" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newCandidate.role} onChange={e => setNewCandidate({...newCandidate, role: e.target.value})} />
                 <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors">Add to Pool</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CandidateView;
