
import React, { useState, useEffect, useMemo } from 'react';
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
  Eye
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ActivityTimeline from './ActivityTimeline';

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
    notify, 
    addActivity 
  } = useStore();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'resumes' | 'timeline' | 'matches' | 'calendar'>('info');
  
  const [candidateNotes, setCandidateNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Scheduling States
  const [isSchedulingAI, setIsSchedulingAI] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<{ date: string; time: string; reason: string; score: number }[]>([]);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewer, setInterviewer] = useState('Alex Morgan');
  const [interviewType, setInterviewType] = useState<Interview['type']>('Technical');
  const [showManualForm, setShowManualForm] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    skillsRaw: '',
    yearsOfExperience: '0'
  });

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;
  
  // Resume Stacking & Selection Logic
  const sortedResumes = useMemo(() => {
    if (!activeCandidate?.resumes) return [];
    return [...activeCandidate.resumes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [activeCandidate]);

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
      if (sortedResumes.length > 0) {
          setSelectedResumeId(sortedResumes[0].id);
      } else {
          setSelectedResumeId(null);
      }
  }, [sortedResumes]);

  const activeResume = sortedResumes.find(r => r.id === selectedResumeId);

  // Filter interviews for this specific candidate
  const candidateInterviews = useMemo(() => {
    if (!activeCandidate) return [];
    return interviews
      .filter(i => i.candidateId === activeCandidate.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [activeCandidate, interviews]);

  const upcomingInterviews = candidateInterviews.filter(i => i.status === 'Scheduled' && new Date(i.startTime) > new Date());
  const pastInterviews = candidateInterviews.filter(i => i.status !== 'Scheduled' || new Date(i.startTime) <= new Date());

  // Simple AI Matching Logic for the matches tab
  const recommendedJobs = useMemo(() => {
    if (!activeCandidate) return [];
    
    return externalJobs.map(job => {
      // Basic matching simulation
      const skillMatch = activeCandidate.skills.some(skill => 
        job.title.toLowerCase().includes(skill.name.toLowerCase())
      );
      const score = skillMatch ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 20);
      return { ...job, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [activeCandidate, externalJobs]);

  useEffect(() => {
    if (activeCandidate) {
      setCandidateNotes(activeCandidate.notes || '');
      setSuggestedSlots([]);
      setShowManualForm(false);
      // Default to info tab when switching candidates
      // setActiveSubTab('info'); // Keep current tab for better UX if desired
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

    setSuggestedSlots([]);
    setShowManualForm(false);
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
      const mockResume = `Experienced engineer in ${candidate.skills.map(s => s.name).join(', ')}.`;
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
    const parsedSkills: Skill[] = newCandidate.skillsRaw.split(',').map(s => {
        const [name, years] = s.split(':');
        return {
            name: name.trim(),
            years: parseInt(years?.trim() || '0')
        };
    }).filter(s => s.name);

    const candidate: Candidate = {
      id: `c_${Date.now()}`,
      firstName: newCandidate.firstName,
      lastName: newCandidate.lastName,
      email: newCandidate.email,
      role: newCandidate.role,
      status: 'Active',
      stageId: 's1',
      matchScore: 0,
      skills: parsedSkills,
      lastActivity: 'Manual Entry',
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`,
      yearsOfExperience: parseInt(newCandidate.yearsOfExperience),
      resumes: []
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
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-bold text-slate-900 text-sm leading-none">{c.firstName} {c.lastName}</p>
                             {c.isOpenToWork && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" title="Open to Work Priority" />}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-700">{c.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            isTopMatch ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                            {isTopMatch ? 'Top Priority' : 'Active'}
                        </span>
                        {c.isOpenToWork && (
                            <span className="px-2 py-1 bg-emerald-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest shadow-glow">Open To Work</span>
                        )}
                      </div>
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
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="relative">
                    <img src={activeCandidate.avatarUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" />
                    {activeCandidate.isOpenToWork && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white shadow-lg">
                            <Star size={12} className="text-white fill-white" />
                        </div>
                    )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{activeCandidate.firstName} {activeCandidate.lastName}</h2>
                    {activeCandidate.isOpenToWork && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-200">Priority Hire</span>}
                  </div>
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

            <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
               <button onClick={() => setActiveSubTab('info')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'info' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Profile</button>
               <button onClick={() => setActiveSubTab('resumes')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'resumes' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Resumes</button>
               <button onClick={() => setActiveSubTab('matches')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'matches' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Job Matches</button>
               <button onClick={() => setActiveSubTab('calendar')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'calendar' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Calendar</button>
               <button onClick={() => setActiveSubTab('timeline')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'timeline' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Activity</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : activeSubTab === 'resumes' ? (
                <div className="h-full flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Resume Vault</h3>
                           <p className="text-xs text-slate-400 font-medium uppercase mt-1">Select a version to preview</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                        {/* Resume Stack Selection */}
                        <div className="lg:col-span-4 space-y-3">
                            {sortedResumes.length > 0 ? (
                                sortedResumes.map((resume, idx) => (
                                    <div 
                                        key={resume.id}
                                        onClick={() => setSelectedResumeId(resume.id)}
                                        className={`group cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden ${
                                            selectedResumeId === resume.id 
                                            ? 'bg-brand-50 border-brand-500 shadow-md translate-x-2' 
                                            : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${selectedResumeId === resume.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[11px] font-bold uppercase truncate tracking-tight ${selectedResumeId === resume.id ? 'text-brand-700' : 'text-slate-700'}`}>
                                                    {resume.name}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {new Date(resume.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {idx === 0 && (
                                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-bl-lg">
                                                Latest
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                                    <FileText size={32} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">No resumes uploaded</p>
                                </div>
                            )}
                        </div>

                        {/* Resume Preview Window */}
                        <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner flex flex-col relative overflow-hidden min-h-[400px]">
                            {activeResume ? (
                                <>
                                    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previewing:</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate max-w-[200px]">{activeResume.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg">
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto">
                                        {/* Real App: <iframe src={activeResume.url} /> */}
                                        {/* Simulation UI */}
                                        <div className="bg-white rounded-xl shadow-lg p-10 space-y-6 mx-auto max-w-lg min-h-full border border-slate-200 font-serif">
                                            <div className="text-center pb-6 border-b border-slate-100">
                                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{activeCandidate.firstName} {activeCandidate.lastName}</h1>
                                                <p className="text-xs text-slate-500">{activeCandidate.email} • {activeCandidate.role}</p>
                                            </div>
                                            
                                            <section>
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Professional Experience</h2>
                                                <div className="space-y-4">
                                                    <div className="relative pl-4 border-l border-slate-100">
                                                        <p className="text-xs font-bold text-slate-900">Lead Systems Engineer @ GlobalScale</p>
                                                        <p className="text-[9px] text-slate-400 italic">2022 - Present</p>
                                                        <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                                                            Architected and deployed high-resonance neural matching engine processing 50k+ transactions per minute. Led a team of 15 engineers across 3 timezones.
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Key Competencies</h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeCandidate.skills.map(s => (
                                                        <span key={s.name} className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{s.name}</span>
                                                    ))}
                                                </div>
                                            </section>

                                            <section>
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Academic Credentials</h2>
                                                {activeCandidate.education?.map((edu, idx) => (
                                                    <div key={idx} className="mb-2">
                                                        <p className="text-[10px] font-bold text-slate-900">{edu.degree}</p>
                                                        <p className="text-[9px] text-slate-500 uppercase">{edu.institution} • {edu.year}</p>
                                                    </div>
                                                ))}
                                            </section>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                    <div className="w-16 h-16 bg-white rounded-3xl shadow-md flex items-center justify-center text-slate-200 mb-4 border border-slate-200">
                                        <Eye size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a resume to preview documentation</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
              ) : activeSubTab === 'calendar' ? (
                <div className="space-y-8 pb-12">
                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        <h4 className="text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-4">Interviews & Scheduling</h4>
                        <p className="text-lg font-bold mb-6 leading-tight">Find the perfect time to meet {activeCandidate.firstName}.</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={handleSmartSchedule}
                                disabled={isSchedulingAI}
                                className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-600/20"
                            >
                                {isSchedulingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                AI Suggestions
                            </button>
                            <button 
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                            >
                                <Plus size={16} /> Manual Entry
                            </button>
                        </div>

                        {showManualForm && (
                            <div className="mt-8 pt-8 border-t border-white/10 animate-in slide-in-from-top-4 duration-300">
                                <form onSubmit={handleManualSchedule} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Date</label>
                                            <input type="date" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 outline-none" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Time</label>
                                            <input type="time" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 outline-none" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                        Confirm Interview Schedule
                                    </button>
                                </form>
                            </div>
                        )}

                        {suggestedSlots.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Optimized Availability</p>
                                {suggestedSlots.map((slot, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors group/slot">
                                        <div>
                                            <p className="font-bold text-white text-sm">{slot.time} • {new Date(slot.date).toLocaleDateString()}</p>
                                            <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">{slot.reason}</p>
                                        </div>
                                        <button onClick={() => executeSchedule(slot.date, slot.time)} className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-lg">
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {upcomingInterviews.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-brand-600" />
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Sessions</h4>
                            </div>
                            {upcomingInterviews.map((int) => (
                                <div key={int.id} className="bg-white border-l-4 border-brand-500 rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xl font-bold text-slate-900 leading-tight">
                                                {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {new Date(int.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-100">
                                            {int.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                            {int.location ? <Video size={18} /> : <PhoneCall size={18} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{int.jobTitle}</p>
                                            <p className="text-xs text-slate-500 font-medium">Interviewer: {int.interviewerName}</p>
                                        </div>
                                    </div>
                                    {int.location && (
                                        <a href={int.location} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                            <Video size={14} /> Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <History size={16} className="text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">History & Completed</h4>
                        </div>
                        {pastInterviews.length > 0 ? (
                            pastInterviews.map((int) => (
                                <div key={int.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-700 text-sm">{new Date(int.startTime).toLocaleDateString()}</p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                            int.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {int.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{int.jobTitle}</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">{int.type} Interview • {int.interviewerName}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No historical data available</p>
                            </div>
                        )}
                    </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Notes Section */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Notes</h3>
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="text-xs font-bold text-brand-600 hover:underline">
                         {isSavingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                   </div>
                   <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-brand-500" placeholder="Add candidate notes here..." />
                  </div>
                  
                  {/* Experience & Education Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Award size={14} className="text-brand-600" /> Professional Experience
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{activeCandidate.yearsOfExperience || '0'}</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Years in Industry</span>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <GraduationCap size={14} className="text-brand-600" /> Academic Foundation
                        </p>
                        {activeCandidate.education && activeCandidate.education.length > 0 ? (
                            <div className="space-y-4">
                                {activeCandidate.education.map((edu, i) => (
                                    <div key={i} className="border-l-2 border-brand-200 pl-3">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{edu.degree}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{edu.institution} • {edu.year}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No education provided</p>
                        )}
                    </div>
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Skills & Technology Inventory</p>
                    <div className="flex flex-wrap gap-2">
                        {activeCandidate.skills.map(skill => (
                            <span key={skill.name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{skill.name}</span>
                                <span className="w-px h-3 bg-slate-200"></span>
                                <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">{skill.years}Y Exp</span>
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
                 
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Skills (Format: React:5, Vue:2)</label>
                    <input 
                        required 
                        placeholder="React:5, TypeScript:3" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" 
                        value={newCandidate.skillsRaw} 
                        onChange={e => setNewCandidate({...newCandidate, skillsRaw: e.target.value})} 
                    />
                 </div>

                 <div className="flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-500 uppercase shrink-0">Total Experience (Years)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newCandidate.yearsOfExperience} onChange={e => setNewCandidate({...newCandidate, yearsOfExperience: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors">Add to Pool</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CandidateView;
