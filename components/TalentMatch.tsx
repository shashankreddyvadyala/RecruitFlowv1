
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UploadCloud, 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  Send, 
  FileText, 
  Loader2, 
  ChevronRight, 
  LayoutGrid, 
  Check, 
  Plus,
  Sparkles,
  Info,
  UserPlus,
  ArrowRight,
  DollarSign,
  Globe,
  Zap,
  Settings2,
  RefreshCw,
  Trophy,
  X,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { ExternalJob, CandidateProfile, Skill, ResumeFile } from '../types';
import { useStore } from '../context/StoreContext';
import { ResumeParserService } from '../services/externalServices';

const TalentMatch: React.FC = () => {
  const { 
    talentProfiles, 
    externalJobs, 
    addTalentProfile, 
    candidates, 
    notify, 
    bulkShareJobs,
    addCandidate
  } = useStore();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'enrich' | 'matches' | 'resume'>('enrich');
  
  // Local enrichment & calibration state
  const [additionalContext, setAdditionalContext] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [calibration, setCalibration] = useState({
    minSalary: '',
    workMode: 'Any',
    employmentType: 'Full-time',
    techFocus: '',
    visaStatus: 'Not Required' // 'Not Required', 'Requires Sponsorship', 'Transfer Only'
  });

  // Filter state for the Matches tab
  const [matchFilter, setMatchFilter] = useState<'all' | 'high' | 'remote'>('all');

  // Bulk Selection States
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [isBulkSharing, setIsBulkSharing] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  const selectedProfile = talentProfiles.find(p => p.id === selectedProfileId) || null;

  // Reset local state when switching candidates
  useEffect(() => {
    setSelectedMatchIds([]);
    setAdditionalContext('');
    setPreferredRole(selectedProfile?.title || '');
    setCalibration({
      minSalary: '',
      workMode: 'Any',
      employmentType: 'Full-time',
      techFocus: '',
      visaStatus: 'Not Required'
    });
    setMatchFilter('all');
  }, [selectedProfileId]);

  const handleRecalibrate = async () => {
    setIsRecalibrating(true);
    await new Promise(r => setTimeout(r, 800));
    setIsRecalibrating(false);
    setActiveSubTab('matches');
    notify("AI Recalibrated", "Matching logic synchronized with new constraints.", "success");
  };

  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];
    
    // Core AI Matching Logic
    const searchStr = (preferredRole || selectedProfile.title).toLowerCase();
    const techFocusArr = calibration.techFocus.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

    let results = externalJobs.map((job, idx) => {
        let score = 72;
        const titleMatch = job.title.toLowerCase().includes(searchStr.split(' ')[0]);
        
        // Calibration Multipliers
        if (titleMatch) score += 18;
        if (techFocusArr.some(tech => job.title.toLowerCase().includes(tech))) score += 12;
        if (calibration.workMode !== 'Any' && job.location.toLowerCase().includes(calibration.workMode.toLowerCase())) score += 5;

        // Visa / Sponsorship Logic Simulation
        if (calibration.visaStatus === 'Requires Sponsorship') {
            const allowsSponsorship = idx % 3 === 0; // Mock: 33% of jobs allow it
            if (!allowsSponsorship) score -= 40;
            else score += 10;
        }

        // Salary Hard Constraint Simulation
        if (calibration.minSalary && job.salary) {
            const min = parseInt(calibration.minSalary.replace(/[^0-9]/g, ''));
            const jobSal = parseInt(job.salary.replace(/[^0-9]/g, ''));
            if (jobSal < min) score -= 25;
        }

        return {
            ...job,
            matchScore: Math.min(99, Math.max(0, score - (idx % 4)))
        };
    });

    // Sub-tab Filters
    if (matchFilter === 'high') results = results.filter(j => j.matchScore >= 90);
    if (matchFilter === 'remote') results = results.filter(j => j.location.toLowerCase().includes('remote'));

    return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [selectedProfile, externalJobs, preferredRole, calibration, matchFilter]);

  const toggleMatchSelection = (jobId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMatchIds.length === matchedJobs.length) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(matchedJobs.map(j => j.id));
    }
  };

  const handleBulkShare = async () => {
    if (!selectedProfile || selectedMatchIds.length === 0) return;
    setIsBulkSharing(true);
    
    try {
      const existingCandidate = candidates.find(c => c.email.toLowerCase() === `${selectedProfile.name.toLowerCase().replace(' ', '.')}@talent.agency.ai`);
      let candidateId = existingCandidate?.id;
      
      if (!existingCandidate) {
          const newId = `c_match_${Date.now()}`;
          addCandidate({
              id: newId,
              firstName: selectedProfile.name.split(' ')[0],
              lastName: selectedProfile.name.split(' ').slice(1).join(' ') || 'Candidate',
              email: `${selectedProfile.name.toLowerCase().replace(' ', '.')}@talent.agency.ai`,
              role: preferredRole || selectedProfile.title,
              status: 'New / Invited',
              stageId: 's1',
              matchScore: 0,
              skills: selectedProfile.skills,
              lastActivity: 'Invited via Match',
              avatarUrl: selectedProfile.avatarUrl,
              notes: additionalContext,
              isOpenToWork: true,
              salaryExpectation: calibration.minSalary,
              workMode: calibration.workMode,
              workAuthorization: calibration.visaStatus
          });
          candidateId = newId;
      }

      const selectedJobs = matchedJobs.filter(j => selectedMatchIds.includes(j.id));
      await bulkShareJobs([candidateId!], selectedJobs);
      
      setSelectedMatchIds([]);
      notify("Dispatch Success", `Invitations sent to ${selectedProfile.name} with ${selectedJobs.length} matches.`, "success");
      
    } catch (e) {
      notify("Error", "Node synchronization failed.", "error");
    } finally {
      setIsBulkSharing(false);
    }
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
        const dummyFile = new File(["content"], "new_resume.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        addTalentProfile(newProfile);
        setSelectedProfileId(newProfile.id);
        setActiveSubTab('enrich');
    } catch(e) {
        notify("Upload Failed", "Dossier extraction error.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 font-sans">
      {/* Left Sidebar */}
      <div className="w-1/4 flex flex-col gap-4">
        <button 
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
          {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
          Process New Resume
        </button>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intake Staging</h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">{talentProfiles.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {talentProfiles.map(profile => (
                    <button 
                        key={profile.id}
                        onClick={() => setSelectedProfileId(profile.id)}
                        className={`w-full p-4 rounded-xl flex gap-3 items-center transition-all text-left group ${
                            selectedProfileId === profile.id 
                            ? 'bg-brand-50 border border-brand-100' 
                            : 'hover:bg-slate-50'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${selectedProfileId === profile.id ? 'text-brand-700' : 'text-slate-900'}`}>{profile.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate mt-0.5">{profile.title}</p>
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${selectedProfileId === profile.id ? 'text-brand-500 translate-x-1' : 'text-slate-300 group-hover:text-slate-400'}`} />
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Matching Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedProfile ? (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div className="flex gap-6 items-center">
                        <div className="relative">
                            <img src={selectedProfile.avatarUrl} className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white" />
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                                <Sparkles size={14} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedProfile.name}</h2>
                                <span className="text-[10px] font-black bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 uppercase tracking-widest">New Intake</span>
                            </div>
                            <div className="flex gap-4 items-center mt-2">
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400"/> {selectedProfile.location}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-slate-400"/> {selectedProfile.experience}Y Experience
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-slate-100 gap-10">
                    <SubTabButton active={activeSubTab === 'enrich'} onClick={() => setActiveSubTab('enrich')} label="1. Calibrate AI" icon={<Settings2 size={16}/>} />
                    <SubTabButton active={activeSubTab === 'matches'} onClick={() => setActiveSubTab('matches')} label="2. Review Matches" icon={<Sparkles size={16}/>} count={matchedJobs.length} />
                    <SubTabButton active={activeSubTab === 'resume'} onClick={() => setActiveSubTab('resume')} label="Raw Dossier" icon={<FileText size={16}/>} />
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20 no-scrollbar">
                    {activeSubTab === 'enrich' && (
                        <div className="max-w-4xl space-y-12 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Trajectory</label>
                                    <input 
                                        value={preferredRole}
                                        onChange={e => setPreferredRole(e.target.value)}
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g. Senior Backend Engineer"
                                    />
                                    <p className="text-[10px] text-slate-400 italic px-1">Defining this recalibrates neural resonance.</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tech Stack Focus</label>
                                    <input 
                                        value={calibration.techFocus}
                                        onChange={e => setCalibration({...calibration, techFocus: e.target.value})}
                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g. Node.js, AWS, Postgres"
                                    />
                                    <p className="text-[10px] text-slate-400 italic px-1">Specific clusters the AI should prioritize.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Zap size={16} className="text-brand-600" /> Advanced Constraints
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                            <DollarSign size={14} className="text-brand-500" /> Min Salary
                                        </label>
                                        <input 
                                            value={calibration.minSalary}
                                            onChange={e => setCalibration({...calibration, minSalary: e.target.value})}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold shadow-inner"
                                            placeholder="$140,000"
                                        />
                                    </div>
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                            <Globe size={14} className="text-brand-500" /> Work Mode
                                        </label>
                                        <select 
                                            value={calibration.workMode}
                                            onChange={e => setCalibration({...calibration, workMode: e.target.value})}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold appearance-none shadow-inner"
                                        >
                                            <option>Any</option>
                                            <option>Remote</option>
                                            <option>Hybrid</option>
                                            <option>On-site</option>
                                        </select>
                                    </div>
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                            <ShieldAlert size={14} className="text-brand-500" /> Visa Sponsorship
                                        </label>
                                        <select 
                                            value={calibration.visaStatus}
                                            onChange={e => setCalibration({...calibration, visaStatus: e.target.value})}
                                            className={`w-full border-none rounded-xl px-4 py-2.5 text-xs font-black appearance-none shadow-inner transition-colors ${calibration.visaStatus === 'Requires Sponsorship' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'}`}
                                        >
                                            <option>Not Required</option>
                                            <option>Requires Sponsorship</option>
                                            <option>Transfer Only</option>
                                        </select>
                                    </div>
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                            <Briefcase size={14} className="text-brand-500" /> Type
                                        </label>
                                        <select 
                                            value={calibration.employmentType}
                                            onChange={e => setCalibration({...calibration, employmentType: e.target.value})}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold appearance-none shadow-inner"
                                        >
                                            <option>Full-time</option>
                                            <option>Contract</option>
                                            <option>Freelance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recruiter Strategy Context</label>
                                <textarea 
                                    value={additionalContext}
                                    onChange={e => setAdditionalContext(e.target.value)}
                                    rows={5}
                                    className="w-full px-8 py-6 bg-white border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-600 leading-relaxed shadow-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                    placeholder="Add nuances like team fit, salary flexibility, or specific soft skill notes..."
                                />
                            </div>

                            <div className="flex justify-end pt-6">
                                <button 
                                    onClick={handleRecalibrate}
                                    disabled={isRecalibrating}
                                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                >
                                    {isRecalibrating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                    Recalibrate & Sync Matches
                                </button>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'matches' && (
                        <div className="space-y-6 pb-32">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <div>
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Recommended Nodes</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized for {preferredRole || selectedProfile.title}</p>
                                        {calibration.visaStatus === 'Requires Sponsorship' && (
                                            <span className="bg-orange-50 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded border border-orange-100 uppercase tracking-widest flex items-center gap-1">
                                                <ShieldAlert size={10} /> Sponsorship Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
                                    <button 
                                        onClick={() => setMatchFilter('all')}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${matchFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        All Nodes
                                    </button>
                                    <button 
                                        onClick={() => setMatchFilter('high')}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${matchFilter === 'high' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Trophy size={12} /> High Resinance
                                    </button>
                                    <button 
                                        onClick={() => setMatchFilter('remote')}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${matchFilter === 'remote' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Globe size={12} /> Remote
                                    </button>
                                </div>

                                <button 
                                    onClick={toggleSelectAll}
                                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest underline underline-offset-4 px-2"
                                >
                                    {selectedMatchIds.length === matchedJobs.length ? 'Deselect All' : `Select All Node(s)`}
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {matchedJobs.map((job) => {
                                    const isSelected = selectedMatchIds.includes(job.id);
                                    // Simulated logic for showing sponsorship availability based on match score boost in memo
                                    const allowsSponsorship = calibration.visaStatus === 'Requires Sponsorship' ? job.matchScore! > 80 : false;
                                    
                                    return (
                                        <div 
                                          key={job.id} 
                                          onClick={() => toggleMatchSelection(job.id)}
                                          className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer flex items-center gap-6 group ${
                                            isSelected ? 'border-brand-500 bg-brand-50/10 shadow-lg ring-4 ring-brand-500/5' : 'border-slate-200 hover:border-brand-300'
                                          }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                                isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-md' : 'bg-white border-slate-200 group-hover:border-slate-400'
                                            }`}>
                                                {isSelected && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-all ${
                                                isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-white group-hover:text-slate-600 group-hover:border-slate-200 shadow-inner'
                                            }`}>
                                                {job.company[0]}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-base font-black text-slate-900 truncate uppercase tracking-tight">{job.title}</h4>
                                                    {allowsSponsorship && <ShieldCheck size={14} className="text-emerald-500" title="Sponsorship Verified" />}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-brand-600 font-black uppercase tracking-widest">{job.company}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <MapPin size={10} /> {job.location}
                                                    </span>
                                                    {job.salary && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{job.salary}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 px-8 border-l border-slate-100">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1.5">Score</p>
                                                    <p className={`text-xl font-black tracking-tighter ${job.matchScore! >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>{job.matchScore}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {matchedJobs.length === 0 && (
                                    <div className="py-40 text-center bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
                                        <Search size={48} className="text-slate-200 mx-auto mb-6" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No nodes match current calibration constraints</p>
                                        <button onClick={() => setMatchFilter('all')} className="mt-4 text-brand-600 font-black text-xs uppercase tracking-widest hover:underline">Clear Protocol</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'resume' && (
                        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
                            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex-1 flex flex-col items-center justify-center text-center">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                        <FileText size={40} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight">Node Dossier</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto font-medium text-sm leading-relaxed italic">
                                        This candidate is not yet synchronized to the main talent cloud. View the source extraction to verify visa and skill vectors.
                                    </p>
                                    <button className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 mx-auto">
                                        Download Raw PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Action Footer */}
                {activeSubTab === 'matches' && selectedMatchIds.length > 0 && (
                    <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.03)] animate-in slide-in-from-bottom-2 sticky bottom-0 z-20">
                        <div className="flex items-center gap-5 px-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">
                                {selectedMatchIds.length}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Payload</p>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Sync with {selectedProfile.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setSelectedMatchIds([])}
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Clear Selection
                            </button>
                            <button 
                                onClick={handleBulkShare}
                                disabled={isBulkSharing}
                                className="flex items-center gap-3 px-10 py-4 bg-brand-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 disabled:opacity-50 active:scale-95"
                            >
                                {isBulkSharing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
                                Initiate Invitation
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 border-dashed p-20 group shadow-inner">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 shadow-inner">
                    <UserPlus size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">New Candidate Intake</h3>
                <p className="text-slate-500 max-w-sm mt-4 font-medium leading-relaxed">Extract professional DNA from a new resume to begin the AI matching protocol. You can calibrate visa and financial constraints after scan.</p>
                <button 
                    onClick={handleUpload}
                    className="mt-10 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-600 transition-all active:scale-95"
                >
                    Initialize Sequence
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const SubTabButton = ({ active, onClick, label, icon, count }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode, count?: number }) => (
    <button 
        onClick={onClick}
        className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 relative group ${active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        <span className={active ? 'text-brand-600' : 'text-slate-300 group-hover:text-slate-500'}>{icon}</span>
        {label}
        {count !== undefined && count > 0 && (
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                {count}
            </span>
        )}
        {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 rounded-full shadow-glow" />}
    </button>
);

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
        {label}
        <button onClick={onRemove} className="hover:text-red-500 transition-colors">
            <X size={12} />
        </button>
    </span>
);

export default TalentMatch;
