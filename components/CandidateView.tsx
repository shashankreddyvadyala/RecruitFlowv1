
import React, { useState, useEffect } from 'react';
import { Candidate, Interview } from '../types';
import { generateOutreachEmail, analyzeCandidate } from '../services/geminiService';
import { Mail, Sparkles, FileText, X, Check, Search, Trash2, UserPlus, Link, Copy, Layers, History, Calendar, Clock, Video, User, Save, ChevronDown, Bell, MessageSquareText, Edit3 } from 'lucide-react';
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

  // Notes state
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Scheduling State
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
      notify("Notes Updated", "Candidate notes have been synchronized.", "success");
    }, 600);
  };

  const handleCopyPortalLink = () => {
    if (!activeCandidate?.portalToken) return;
    const url = `${window.location.origin}/portal/${activeCandidate.portalToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    notify("Copied", "Portal link copied to clipboard.", "info");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate || !interviewDate || !interviewTime) return;

    const start = new Date(`${interviewDate}T${interviewTime}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

    const interview: Interview = {
      id: `int_${Date.now()}`,
      candidateId: activeCandidate.id,
      candidateName: `${activeCandidate.firstName} ${activeCandidate.lastName}`,
      jobId: 'j1', // Default or linked
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
      notify("AI Error", "Ensure API Key is set properly.", "error");
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
      notify("AI Error", "Could not generate email sequence.", "error");
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
    if (window.confirm(`Are you sure you want to remove ${name} from your agency database?`)) {
      removeCandidate(id);
      notify("Candidate Removed", `${name} was deleted from records.`, "warning");
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
      lastActivity: 'Manually added',
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`,
      portalToken: `t_${Date.now()}_${newCandidate.firstName.toLowerCase()}`
    };
    addCandidate(candidate);
    notify("Candidate Added", `${candidate.firstName} is now in sourcing.`, "success");
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
    <div className="h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-600" size={20} />
          <input 
            type="text" 
            placeholder="Filter candidates..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2"
          >
            <UserPlus size={18} /> Add Candidate
          </button>
          <button className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-600/20">
            <Sparkles size={18} /> Auto-Source
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Candidate</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Target Role</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Match Score</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedCandidateId(c.id)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={c.avatarUrl} alt="" className="w-10 h-10 rounded-xl shadow-sm border border-white" />
                    <div>
                      <p className="font-bold text-slate-900">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm font-medium">{c.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    c.stageId === 's1' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                    c.stageId === 's2' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {c.stageId === 's1' ? 'Sourcing' : c.stageId === 's2' ? 'Outreach' : c.stageId === 's3' ? 'Screening' : 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${c.matchScore > 80 ? 'bg-emerald-500' : c.matchScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{width: `${c.matchScore}%`}}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{c.matchScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={(e) => handleBulkApply(c, e)} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800" title="Bulk Submit"><Layers size={14} /></button>
                    <button onClick={(e) => handleEmail(c, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:text-brand-600" title="Draft Email"><Mail size={14} /></button>
                    <button onClick={(e) => handleAnalyze(c, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-purple-500 hover:text-purple-600" title="AI Report"><FileText size={14} /></button>
                    <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName} ${c.lastName}`, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-red-500 hover:text-red-600" title="Remove"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Slide-over */}
      {activeCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <img src={activeCandidate.avatarUrl} className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                    <p className="text-slate-500 font-medium">{activeCandidate.role}</p>
                    <div className="flex gap-2 mt-3">
                      {activeCandidate.skills.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-md shadow-sm">
                              {s}
                          </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                 <button onClick={() => setActiveSubTab('info')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                   <FileText size={14} /> Profile
                 </button>
                 <button onClick={() => setActiveSubTab('timeline')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                   <History size={14} /> Activity
                 </button>
                 <button onClick={() => setActiveSubTab('schedule')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'schedule' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                   <Calendar size={14} /> Book
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : activeSubTab === 'schedule' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="bg-brand-50 p-6 rounded-[2rem] border border-brand-100 flex items-start gap-4">
                    <Clock className="text-brand-600 shrink-0" size={24} />
                    <div>
                      <h4 className="font-black text-brand-900 uppercase tracking-tight mb-1">Set Interview Slot</h4>
                      <p className="text-xs text-brand-700 font-medium">Coordinate a human interview or AI screen.</p>
                    </div>
                  </div>

                  <form onSubmit={handleScheduleInterview} className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Meeting Type</label>
                       <div className="grid grid-cols-2 gap-2">
                          {(['Screening', 'Technical', 'Behavioral', 'Culture', 'Final'] as Interview['type'][]).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setInterviewType(type)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                interviewType === type 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type="date"
                              required
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
                              value={interviewDate}
                              onChange={(e) => setInterviewDate(e.target.value)}
                            />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                              type="time"
                              required
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                            />
                        </div>
                      </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lead Interviewer</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <select 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner appearance-none"
                            value={interviewer}
                            onChange={(e) => setInterviewer(e.target.value)}
                          >
                             <option>Alex Morgan</option>
                             <option>Sarah Jenkins</option>
                             <option>Tom Harris</option>
                             <option>Voice AI Agent</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between group cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-xl"><Video size={20} className="text-brand-400" /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Channel</p>
                            <p className="text-xs font-bold">Auto-generate Google Meet</p>
                          </div>
                       </div>
                       <div className="w-5 h-5 rounded-full border-2 border-brand-500 bg-brand-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/20 active:scale-[0.98] transition-all"
                    >
                      Dispatch Invites
                    </button>
                  </form>
                </div>
              ) : (
                loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold mt-4 animate-pulse">Gemini 3 Pro is thinking...</p>
                  </div>
                ) : generatedContent ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {generatedContent.type === 'analysis' ? (
                       <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 space-y-4 shadow-xl">
                          <div className="flex items-center gap-2">
                             <Sparkles size={20} className="text-purple-600" />
                             <h3 className="font-black text-purple-900 uppercase text-xs tracking-widest">AI Profile Analysis</h3>
                          </div>
                          <div className="p-4 bg-white rounded-2xl shadow-sm border border-purple-100">
                             <p className="text-xs font-black text-purple-900 uppercase mb-1">Recommendation</p>
                             <p className="text-sm text-purple-700 leading-relaxed">{generatedContent.data.summary}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {generatedContent.data.skills.map((s: string) => (
                               <span key={s} className="px-3 py-1 bg-white rounded-full text-[10px] font-black uppercase text-purple-600 border border-purple-100">{s}</span>
                             ))}
                          </div>
                          <button onClick={() => setGeneratedContent(null)} className="text-[10px] font-black uppercase text-purple-400 hover:text-purple-600 transition-colors">Dismiss Report</button>
                       </div>
                    ) : (
                       <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4 shadow-xl">
                          <div className="flex items-center gap-2">
                             <Mail size={20} className="text-blue-600" />
                             <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Generated Sequence</h3>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase">Subject</p>
                             <p className="text-sm font-bold text-slate-900">{generatedContent.data.subject}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase">Body</p>
                             <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{generatedContent.data.body}</p>
                          </div>
                          <button onClick={() => setGeneratedContent(null)} className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-600 transition-colors">Start New Draft</button>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                    
                    {/* Integrated Free-text Notes Field (Directly in Info Sub-tab) */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10"></div>
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="font-black text-brand-400 text-xs uppercase tracking-widest flex items-center gap-2">
                           <MessageSquareText size={16} /> Recruiter Workspace
                        </h3>
                        <button 
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isSavingNotes ? 'bg-white/10 text-white/40' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20'
                          }`}
                        >
                           {isSavingNotes ? 'Saving...' : <><Save size={12} /> Sync Notes</>}
                        </button>
                     </div>
                     <textarea 
                        value={candidateNotes}
                        onChange={(e) => setCandidateNotes(e.target.value)}
                        placeholder="Log interview feedback, internal salary expectations, or cultural fit notes here..."
                        className="w-full min-h-[180px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-slate-200 placeholder:text-slate-500 shadow-inner resize-none transition-all focus:bg-white/10"
                     />
                     <p className="mt-3 text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 italic">
                        * Internal notes are private to the agency team.
                     </p>
                    </div>

                    {/* Candidate Self-Service */}
                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm">
                       <h3 className="font-black text-emerald-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Link size={16} /> Candidate Self-Service
                       </h3>
                       <p className="text-xs text-emerald-700 mb-4 font-medium leading-relaxed">
                         Provide this unique link to <b>{activeCandidate.firstName}</b> to allow them to securely update their profile and materials.
                       </p>
                       <div className="flex items-center gap-2">
                         <div className="flex-1 px-4 py-3 bg-white border border-emerald-200 rounded-xl text-[10px] font-mono text-emerald-800 truncate shadow-inner">
                            {window.location.origin}/portal/{activeCandidate.portalToken}
                         </div>
                         <button onClick={handleCopyPortalLink} className="p-3 bg-white border border-emerald-200 rounded-xl text-emerald-600 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"><Copy size={16}/></button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={(e) => handleAnalyze(activeCandidate, e)} className="p-8 bg-slate-900 text-white rounded-[2.5rem] flex flex-col items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl group active:scale-[0.98]">
                         <Sparkles size={32} className="group-hover:rotate-12 transition-transform text-brand-400" />
                         <span className="font-black text-[10px] uppercase tracking-[0.2em]">Analyze Profile</span>
                       </button>
                       <button onClick={(e) => handleEmail(activeCandidate, e)} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center gap-3 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm group active:scale-[0.98]">
                         <Mail size={32} className="group-hover:-translate-y-1 transition-transform" />
                         <span className="font-black text-[10px] uppercase tracking-[0.2em]">Generate Sequence</span>
                       </button>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Automated Discovery</p>
                        <p className="text-xs text-slate-500 font-medium">Profile last enriched {activeCandidate.lastActivity}</p>
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

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Add New Talent</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                   <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">First Name</label>
                    <input required className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" value={newCandidate.firstName} onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Last Name</label>
                    <input required className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" value={newCandidate.lastName} onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                    <input required type="email" className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Role</label>
                    <input required className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" value={newCandidate.role} onChange={e => setNewCandidate({...newCandidate, role: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    Provision Records
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CandidateView;
