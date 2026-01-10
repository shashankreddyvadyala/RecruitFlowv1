
import React, { useState, useEffect } from 'react';
import { Candidate, Interview } from '../types';
import { generateOutreachEmail, analyzeCandidate } from '../services/geminiService';
import { Mail, Sparkles, FileText, X, Check, Search, Trash2, UserPlus, Link, Copy, Layers, History, Calendar, Clock, Video, User, Save, ChevronDown, Bell, MessageSquareText, Edit3, Target, Zap, Send, ShieldCheck, ExternalLink, Bot, MapPin, Briefcase, DollarSign, Timer, Compass, Info, FileSearch } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BulkApplyModal from './BulkApplyModal';
import ActivityTimeline from './ActivityTimeline';

const CandidateView: React.FC = () => {
  const { candidates, activities, branding, addCandidate, removeCandidate, addInterview, updateCandidateNotes, notify } = useStore();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'timeline' | 'schedule'>('info');
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [showBulkApply, setShowBulkApply] = useState(false);
  const [bulkCandidate, setBulkCandidate] = useState<Candidate | null>(null);

  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  const handleCopyPortalLink = () => {
    if (!activeCandidate?.portalToken) return;
    const url = `${window.location.origin}/portal/${activeCandidate.portalToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    notify("Secure Link Copied", "Encrypted portal token synchronized to clipboard.", "info");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate || !interviewDate || !interviewTime) return;

    const start = new Date(`${interviewDate}T${interviewTime}`);
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
      notes: ''
    };

    addInterview(interview);
    setInterviewDate('');
    setInterviewTime('');
    setActiveSubTab('timeline');
    notify("Session Locked", `Interview dispatch sent to ${activeCandidate.firstName}.`, "success");
  };

  const handleAnalyze = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidateId(candidate.id);
    setActiveSubTab('info');
    try {
      const mockResume = `Experienced software engineer with 5 years in ${candidate.skills.join(', ')}. Led teams of 5. Built scalable systems.`;
      const result = await analyzeCandidate(mockResume, "Senior React Engineer capable of leading architectural decisions.");
      setGeneratedContent({ type: 'analysis', data: result });
    } catch (err) {
      console.error(err);
      notify("AI Link Failure", "Ensure Gemini API Key is valid in settings.", "error");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEmail = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidateId(candidate.id);
    setActiveSubTab('info');
    try {
      const result = await generateOutreachEmail(candidate, branding.companyName, "Alex (Recruiter)");
      setGeneratedContent({ type: 'email', data: result });
    } catch (err) {
      console.error(err);
      notify("Sequence Error", "Could not generate personalized outreach.", "error");
    } finally {
      setLoadingAI(false);
    }
  };
  
  const handleBulkApply = (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      setBulkCandidate(candidate);
      setShowBulkApply(true);
  };

  const handleDeleteCandidate = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Purge ${name} from all agency neural records?`)) {
      removeCandidate(id);
      notify("Dossier Purged", `${name} removed from global search.`, "warning");
      if (selectedCandidateId === id) {
        closeModal();
      }
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
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`,
      portalToken: `t_${Date.now()}_${newCandidate.firstName.toLowerCase()}`
    };
    addCandidate(candidate);
    notify("Ingestion Complete", `${candidate.firstName} added to sourcing queue.`, "success");
    setNewCandidate({ firstName: '', lastName: '', email: '', role: '', skills: '' });
    setShowAddModal(false);
  };

  const closeModal = () => {
    setSelectedCandidateId(null);
    setGeneratedContent(null);
    setActiveSubTab('info');
  };

  const candidateActivities = activeCandidate ? activities.filter(a => a.entityId === activeCandidate.id) : [];

  return (
    <div className="h-full flex flex-col font-sans animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Talent Ingress</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Direct access to agency candidate neural network</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by skill, role, or identity..." 
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] w-80 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all text-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3.5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-3"
          >
            <UserPlus size={18} /> Add Talent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Candidate Dossier</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Assignment</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Status Node</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-right">Intel Score</th>
                <th className="px-10 py-5 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/20 transition-all group cursor-pointer" onClick={() => setSelectedCandidateId(c.id)}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={c.avatarUrl} alt="" className="w-14 h-14 rounded-2xl shadow-xl border-2 border-white bg-slate-100 object-cover" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-1.5">{c.firstName} {c.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{c.role}</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                             {c.skills.slice(0, 3).map(s => (
                                 <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase rounded shadow-inner">{s}</span>
                             ))}
                             {c.skills.length > 3 && <span className="text-[9px] font-black text-slate-300">+{c.skills.length - 3}</span>}
                        </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      c.stageId === 's1' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                      c.stageId === 's2' ? 'bg-brand-50 text-brand-600 border-brand-200' :
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {c.stageId === 's1' ? 'Ingested' : c.stageId === 's2' ? 'Active Outreach' : c.stageId === 's3' ? 'Screening' : 'Verified'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-xl font-black ${c.matchScore > 80 ? 'text-emerald-500' : c.matchScore > 60 ? 'text-brand-500' : 'text-orange-500'}`}>{c.matchScore}%</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${c.matchScore > 80 ? 'bg-emerald-500' : c.matchScore > 60 ? 'bg-brand-500' : 'bg-orange-500'}`} 
                            style={{width: `${c.matchScore}%`}}
                        />
                        </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <button onClick={(e) => handleBulkApply(c, e)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg" title="Auto-Apply Engine"><Layers size={16} /></button>
                      <button onClick={(e) => handleEmail(c, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand-600 hover:border-brand-500 hover:shadow-xl" title="AI Outreach"><Mail size={16} /></button>
                      <button onClick={(e) => handleAnalyze(c, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-purple-600 hover:border-purple-500 hover:shadow-xl" title="Deep Analysis"><Zap size={16} /></button>
                      <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName} ${c.lastName}`, e)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-400" title="Purge Record"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligence Dossier Slide-over */}
      {activeCandidate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right-8 duration-500 relative overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex gap-6 items-center">
                  <div className="relative">
                    <img src={activeCandidate.avatarUrl} className="w-24 h-24 rounded-[2rem] shadow-2xl border-4 border-white object-cover" />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                        <ShieldCheck size={16} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target size={14} className="text-brand-600" /> {activeCandidate.role}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {activeCandidate.skills.map(s => (
                          <span key={s} className="px-3 py-1 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase rounded-lg shadow-sm">
                              {s}
                          </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] relative z-10 border border-slate-200 shadow-inner">
                 <button onClick={() => setActiveSubTab('info')} className={`flex-1 flex items-center justify-center gap-3 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'info' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
                   <FileText size={16} /> Intelligence
                 </button>
                 <button onClick={() => setActiveSubTab('timeline')} className={`flex-1 flex items-center justify-center gap-3 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'timeline' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
                   <History size={16} /> Chronology
                 </button>
                 <button onClick={() => setActiveSubTab('schedule')} className={`flex-1 flex items-center justify-center gap-3 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'schedule' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>
                   <Calendar size={16} /> Schedule
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-white">
              {activeSubTab === 'timeline' ? (
                <div className="animate-in fade-in duration-500">
                    <ActivityTimeline activities={candidateActivities} />
                </div>
              ) : activeSubTab === 'schedule' ? (
                <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-10">
                  <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 flex items-start gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                    <div className="p-4 bg-brand-600/10 rounded-2xl text-brand-400 group-hover:scale-110 transition-transform">
                        <Clock size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase tracking-tight mb-1 text-xl">Operational Window</h4>
                      <p className="text-xs text-slate-400 font-medium">Coordinate a human interview or AI technical screen.</p>
                    </div>
                  </div>
                  <form onSubmit={handleScheduleInterview} className="space-y-8">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Protocol Selection</label>
                       <div className="grid grid-cols-2 gap-3">
                          {(['Screening', 'Technical', 'Behavioral', 'Culture', 'Final'] as Interview['type'][]).map(type => (
                            <button key={type} type="button" onClick={() => setInterviewType(type)} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${interviewType === type ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                              {type}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Mission Date</label>
                        <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Start T+0</label>
                        <input type="time" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all hover:bg-brand-700">
                      Dispatch Operational Signal
                    </button>
                  </form>
                </div>
              ) : (
                loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                    <Bot size={32} className="text-brand-600 animate-bounce" />
                    <p className="text-slate-900 font-black uppercase tracking-[0.2em] mt-8 text-xs">Intelligence Deep-Dive...</p>
                  </div>
                ) : generatedContent ? (
                    <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-10">
                        <div className="bg-slate-950 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <Sparkles size={28} className="text-purple-400" />
                                <h3 className="font-black text-white uppercase text-xl tracking-tight">Intelligence Report</h3>
                            </div>
                            <div className="p-8 bg-white/5 rounded-[2rem] shadow-inner border border-white/5 relative z-10">
                                <p className="text-lg text-slate-100 font-medium leading-relaxed italic">"{generatedContent.data.summary}"</p>
                            </div>
                            <button onClick={() => setGeneratedContent(null)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest flex items-center gap-2">
                                <X size={14} /> Void Report
                            </button>
                        </div>
                    </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Resume Node (Updated to show sync status) */}
                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-30 -mr-20 -mt-20"></div>
                       <h3 className="font-black text-brand-400 text-xs uppercase tracking-[0.4em] flex items-center gap-3 mb-6 relative z-10">
                          <FileSearch size={20} /> Dossier Artifacts
                       </h3>
                       <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10 relative z-10 group/resume">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-400">
                                <FileText size={24} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-black uppercase tracking-tight truncate">{activeCandidate.resumeName || 'sarah_chen_resume.pdf'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    Last Sync: {activeCandidate.resumeUpdatedAt ? new Date(activeCandidate.resumeUpdatedAt).toLocaleDateString() : 'Original Ingestion'}
                                </p>
                             </div>
                          </div>
                          <button className="p-3 bg-white/10 hover:bg-brand-600 rounded-xl transition-all shadow-xl">
                             <ExternalLink size={18} />
                          </button>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden group shadow-inner">
                       <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.4em] flex items-center gap-3 mb-8">
                            <Compass size={20} className="text-brand-600" /> Tactical Intent Summary
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <PreferenceNode icon={<Briefcase size={16}/>} label="Target Missions" values={activeCandidate.preferredRoles || ['Senior React Engineer', 'UI Lead']} />
                          <PreferenceNode icon={<MapPin size={16}/>} label="Operational Areas" values={activeCandidate.preferredLocations || ['Remote', 'San Francisco']} />
                          <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2">
                             <PreferenceNode icon={<Timer size={16}/>} label="Environment" value={activeCandidate.workMode || 'Remote'} />
                             <PreferenceNode icon={<Zap size={16}/>} label="Engagement" value={activeCandidate.employmentType || 'Permanent'} />
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-950 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="font-black text-brand-400 text-xs uppercase tracking-[0.4em] flex items-center gap-3">
                           <MessageSquareText size={20} /> Field Intelligence
                        </h3>
                        <button onClick={handleSaveNotes} disabled={isSavingNotes} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSavingNotes ? 'bg-white/10 text-white/40' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl'}`}>
                           {isSavingNotes ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Sync Intel</>}
                        </button>
                     </div>
                     <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} placeholder="Log classified field intel..." className="w-full min-h-[120px] p-8 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none text-base font-medium text-slate-200 shadow-inner resize-none transition-all leading-relaxed" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showBulkApply && bulkCandidate && (
          <BulkApplyModal 
            candidate={bulkCandidate} 
            onClose={() => setShowBulkApply(false)} 
          />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Talent Provisioning</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400">
                   <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Given Name</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newCandidate.firstName} onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Surname</label>
                        <input required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newCandidate.lastName} onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})} />
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 mt-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all hover:bg-slate-800">
                    Formalize Dossier
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PreferenceNode = ({ icon, label, value, values }: { icon: React.ReactNode, label: string, value?: string, values?: string[] }) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            {values ? (
                <div className="flex flex-wrap gap-1">
                    {values.length > 0 ? values.map(v => (
                        <span key={v} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{v}</span>
                    )) : <span className="text-[10px] font-bold text-slate-300 italic">Not specified</span>}
                </div>
            ) : (
                <p className="text-[10px] font-bold text-slate-700">{value || <span className="text-slate-300 italic">Not specified</span>}</p>
            )}
        </div>
    </div>
);

export default CandidateView;
