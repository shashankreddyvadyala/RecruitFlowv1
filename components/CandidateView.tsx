import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, Interview, ExternalJob, Skill, ResumeFile, CandidateApplication } from '../types';
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
  AlertCircle
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

  // Bulk Selection States (Main Table)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [showBulkShare, setShowBulkShare] = useState(false);

  // Match Selection States (Sub-tab)
  const [selectedMatchJobIds, setSelectedMatchJobIds] = useState<string[]>([]);
  const [isSharingMatches, setIsSharingMatches] = useState(false);

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

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = `${c.firstName} ${c.lastName} ${c.role} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        || (statusFilter === 'openToWork' && c.isOpenToWork)
        || (statusFilter === 'passive' && !c.isOpenToWork);
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;
  
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

  const candidateInterviews = useMemo(() => {
    if (!activeCandidate) return [];
    return interviews
      .filter(i => i.candidateId === activeCandidate.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [activeCandidate, interviews]);

  const upcomingInterviews = candidateInterviews.filter(i => i.status === 'Scheduled' && new Date(i.startTime) > new Date());
  const pastInterviews = candidateInterviews.filter(i => i.status !== 'Scheduled' || new Date(i.startTime) <= new Date());

  const recommendedJobs = useMemo(() => {
    if (!activeCandidate) return [];
    
    return externalJobs.map(job => {
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
      setSelectedMatchJobIds([]); 
    }
  }, [selectedCandidateId, activeCandidate?.notes]);

  const toggleBulkSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBulkSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (bulkSelectedIds.length === filteredCandidates.length) {
        setBulkSelectedIds([]);
    } else {
        setBulkSelectedIds(filteredCandidates.map(c => c.id));
    }
  };

  const toggleMatchSelect = (jobId: string) => {
    setSelectedMatchJobIds(prev => 
        // Fix: Use 'jobId' instead of undefined variable 'id'
        prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBulkShareMatches = async () => {
    if (!activeCandidate || selectedMatchJobIds.length === 0) return;
    
    setIsSharingMatches(true);
    const selectedJobs = recommendedJobs.filter(j => selectedMatchJobIds.includes(j.id));
    
    try {
        await bulkShareJobs([activeCandidate.id], selectedJobs);
        setSelectedMatchJobIds([]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSharingMatches(false);
    }
  };

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
    
    addActivity({
      id: `act_share_${Date.now()}`,
      type: 'JobShared',
      subject: 'Job Shared',
      content: `Shared "${job.title}" at ${job.company} with candidate.`,
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
      location: 'https://meet.google.com/abc-def-ghi',
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
    <div className="h-full flex flex-col font-sans relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Candidate Pool</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Direct Talent Access</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
            <FilterButton 
              active={statusFilter === 'all'} 
              onClick={() => setStatusFilter('all')} 
              label="All" 
            />
            <FilterButton 
              active={statusFilter === 'openToWork'} 
              onClick={() => setStatusFilter('openToWork')} 
              label="Open to Work" 
              icon={<Star size={14} className={statusFilter === 'openToWork' ? 'fill-emerald-500 text-emerald-500' : ''} />}
            />
            <FilterButton 
              active={statusFilter === 'passive'} 
              onClick={() => setStatusFilter('passive')} 
              label="Passive" 
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <UserPlus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-4 w-10">
                    <button 
                        onClick={toggleAll}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            bulkSelectedIds.length === filteredCandidates.length && filteredCandidates.length > 0
                            ? 'bg-brand-600 border-brand-600 text-white shadow-lg'
                            : 'border-slate-300 bg-white'
                        }`}
                    >
                        {bulkSelectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 && <Check size={14} />}
                    </button>
                </th>
                <th className="px-4 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Candidate</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Current Role / Desired Role</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase text-slate-400 text-right tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((c) => {
                const isSelected = bulkSelectedIds.includes(c.id);
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-brand-50/40' : ''}`} onClick={() => setSelectedCandidateId(c.id)}>
                    <td className="px-8 py-5">
                         <button 
                            onClick={(e) => toggleBulkSelect(c.id, e)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-lg' : 'border-slate-300 bg-white group-hover:border-brand-400'
                            }`}
                        >
                            {isSelected && <Check size={14} />}
                        </button>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <img src={c.avatarUrl} alt="" className="w-11 h-11 rounded-2xl border border-white shadow-sm object-cover" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-black text-slate-900 text-sm leading-none uppercase tracking-tight">{c.firstName} {c.lastName}</p>
                             {c.isOpenToWork && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow" title="Open to Work Priority" />}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{c.role}</span>
                        {c.preferredRoles && c.preferredRoles.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                            <span className="text-brand-600/50">Target:</span> {c.preferredRoles[0]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            c.isOpenToWork ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                            {c.isOpenToWork ? 'Open to Work' : 'Passive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEmail(c, e)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Draft Outreach"><Mail size={16} /></button>
                        <button onClick={(e) => handleAnalyze(c, e)} className="p-2 text-slate-400 hover:text-purple-600 transition-colors" title="AI Match Check"><Zap size={16} /></button>
                        <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName}`, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Users size={48} className="text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No candidates match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selection Dock */}
      {bulkSelectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-8 duration-300">
              <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-slate-200 flex items-center gap-6">
                  <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
                    <span className="flex items-center justify-center w-6 h-6 bg-brand-600 text-white text-[10px] font-black rounded-lg">{bulkSelectedIds.length}</span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Selected</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setBulkSelectedIds([])}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={() => setShowBulkShare(true)}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                      >
                          <Send size={14} /> Share Jobs
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showBulkShare && (
          <BulkShareModal 
            selectedCandidates={candidates.filter(c => bulkSelectedIds.includes(c.id))}
            onClose={() => {
                setShowBulkShare(false);
                setBulkSelectedIds([]);
            }}
          />
      )}

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
               <button onClick={() => setActiveSubTab('applications')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'applications' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Applications</button>
               <button onClick={() => setActiveSubTab('matches')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'matches' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Job Matches</button>
               <button onClick={() => setActiveSubTab('calendar')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'calendar' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Calendar</button>
               <button onClick={() => setActiveSubTab('timeline')} className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeSubTab === 'timeline' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-slate-400'}`}>Activity</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : activeSubTab === 'applications' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Historical Outcomes</h3>
                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest border border-slate-200">System Logs Verified</span>
                    </div>

                    {activeCandidate.applicationHistory && activeCandidate.applicationHistory.length > 0 ? (
                        <div className="space-y-4">
                            {activeCandidate.applicationHistory.map((app) => (
                                <div key={app.id} className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                        app.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        app.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        app.status === 'Withdrawn' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        'bg-brand-50 text-brand-600 border border-brand-100'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300">•</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.outcomeDate || app.appliedDate}</span>
                                                </div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">{app.jobTitle}</h4>
                                                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-2">{app.company}</p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:text-brand-500 transition-colors">
                                                <Briefcase size={16} />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle size={10} className="text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dossier Reason / Outcome Notes</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                                                {app.notes}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                            <Layers size={40} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No verified application history available</p>
                        </div>
                    )}
                </div>
              ) : activeSubTab === 'resumes' ? (
                <div className="h-full flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Documents</h3>
                           <p className="text-xs text-slate-400 font-medium uppercase mt-1">Preview uploaded resumes</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
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
                                                Current
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                                    <FileText size={32} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">No documents</p>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-8 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner flex flex-col relative overflow-hidden min-h-[400px]">
                            {activeResume ? (
                                <>
                                    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Viewing:</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate max-w-[200px]">{activeResume.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg">
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 overflow-y-auto">
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
                                                            Architected and deployed complex enterprise solutions for distributed infrastructure.
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Skills</h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeCandidate.skills.map(s => (
                                                        <span key={s.name} className="text-[9px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{s.name}</span>
                                                    ))}
                                                </div>
                                            </section>

                                            <section>
                                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Education</h2>
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
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a document to preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              ) : activeSubTab === 'matches' ? (
                <div className="space-y-6 relative pb-20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended by AI</h4>
                            {selectedMatchJobIds.length > 0 && (
                                <span className="bg-brand-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                    {selectedMatchJobIds.length} Selected
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={() => {
                                if (selectedMatchJobIds.length === recommendedJobs.length) {
                                    setSelectedMatchJobIds([]);
                                } else {
                                    setSelectedMatchJobIds(recommendedJobs.map(j => j.id));
                                }
                            }}
                            className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                        >
                            {selectedMatchJobIds.length === recommendedJobs.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    
                    {recommendedJobs.length > 0 ? (
                        <div className="space-y-3">
                            {recommendedJobs.map((job) => {
                                const isAlreadyShared = activeCandidate.sharedJobIds?.includes(job.id);
                                const isSelected = selectedMatchJobIds.includes(job.id);
                                return (
                                    <div 
                                        key={job.id} 
                                        onClick={() => !isAlreadyShared && toggleMatchSelect(job.id)}
                                        className={`bg-white border rounded-2xl p-5 transition-all group cursor-pointer relative overflow-hidden ${
                                            isSelected 
                                            ? 'border-brand-500 bg-brand-50/20 shadow-md ring-2 ring-brand-500/5' 
                                            : isAlreadyShared 
                                                ? 'border-slate-100 opacity-60 grayscale-[0.5]' 
                                                : 'border-slate-200 hover:border-brand-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                                                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-900 text-white'
                                                    }`}>
                                                        {job.company[0]}
                                                    </div>
                                                    {!isAlreadyShared && (
                                                        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                            isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 group-hover:border-brand-400'
                                                        }`}>
                                                            {isSelected && <Check size={12} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">{job.title}</h5>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{job.company} • {job.location}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-black text-xs ${job.matchScore >= 90 ? 'text-emerald-500' : 'text-brand-600'}`}>{job.matchScore}% Match</span>
                                                {isAlreadyShared && <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><CheckCircle2 size={10} /> Shared</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!isAlreadyShared && !isSelected && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleShareJob(job); }}
                                                    className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-md flex items-center justify-center gap-2"
                                                >
                                                    <Share2 size={14} /> Share with Candidate
                                                </button>
                                            )}
                                            <a 
                                                href={job.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Bot size={40} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-xs text-slate-400 font-bold uppercase">No job matches identified</p>
                        </div>
                    )}

                    {/* Internal Selection Dock */}
                    {selectedMatchJobIds.length > 0 && (
                        <div className="absolute bottom-4 left-0 right-0 px-2 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] flex items-center justify-between shadow-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-black text-xs">
                                        {selectedMatchJobIds.length}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Jobs Selected</span>
                                </div>
                                <button 
                                    disabled={isSharingMatches}
                                    onClick={handleBulkShareMatches}
                                    className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center gap-2"
                                >
                                    {isSharingMatches ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Share with {activeCandidate.firstName}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              ) : activeSubTab === 'calendar' ? (
                <div className="space-y-8 pb-12">
                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        <h4 className="text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-4">Interviews</h4>
                        <p className="text-lg font-bold mb-6 leading-tight">Schedule an interview with {activeCandidate.firstName}.</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={handleSmartSchedule}
                                disabled={isSchedulingAI}
                                className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-600/20"
                            >
                                {isSchedulingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                AI Suggest Time
                            </button>
                            <button 
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                            >
                                <Plus size={16} /> Manual Schedule
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
                                            <input type="time" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                        Set Interview
                                    </button>
                                </form>
                            </div>
                        )}

                        {suggestedSlots.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Best Times</p>
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
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Past Interviews</h4>
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No past interview records</p>
                            </div>
                        )}
                    </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Internal Notes</h3>
                      <button onClick={handleSaveNotes} disabled={isSavingNotes} className="text-xs font-bold text-brand-600 hover:underline">
                         {isSavingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                   </div>
                   <textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-brand-500" placeholder="Add candidate notes here..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Award size={14} className="text-brand-600" /> Total Experience
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{activeCandidate.yearsOfExperience || '0'}</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Years</span>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <GraduationCap size={14} className="text-brand-600" /> Education
                        </p>
                        {activeCandidate.education && activeCandidate.education.length > 0 ? (
                            <div className="space-y-4">
                                {activeCandidate.education.map((edu, i) => (
                                    <div key={i} className="border-l-2 border-brand-200 pl-3">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{edu.degree}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{edu.institution} • {edu.year}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No education provided</p>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Salary</p>
                        <p className="text-sm font-bold text-slate-900">{activeCandidate.salaryExpectation || 'Not specified'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Work Mode</p>
                        <p className="text-sm font-bold text-slate-900">{activeCandidate.workMode || 'Any'}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Skills</p>
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
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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

const FilterButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) => (
  <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
  >
      {icon}
      {label}
  </button>
);

export default CandidateView;