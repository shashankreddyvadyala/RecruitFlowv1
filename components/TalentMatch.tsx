
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  Send, 
  FileText, 
  Loader2, 
  ChevronRight, 
  Check, 
  Plus,
  Sparkles,
  UserPlus,
  ArrowRight,
  DollarSign,
  Globe,
  Zap,
  Settings,
  RefreshCw,
  Trophy,
  X,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Target,
  Layers,
  FileCheck,
  ClipboardList,
  Trash2,
  User
} from 'lucide-react';
import { ExternalJob, CandidateProfile, Skill } from '../types';
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
    addCandidate,
    updateCandidateProfile
  } = useStore();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'matches'>('settings');
  
  // Local Form State for Editing Extracted Info
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    experience: 0,
    skills: [] as Skill[]
  });

  // Local State for Matching Logic
  const [internalNotes, setInternalNotes] = useState('');
  const [settings, setSettings] = useState({
    minSalary: '',
    workMode: 'Any',
    employmentType: 'Full-time',
    skillsFocus: '',
    visaStatus: 'Not Required'
  });

  const [matchFilter, setMatchFilter] = useState<'all' | 'high' | 'remote'>('all');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [isBulkSharing, setIsBulkSharing] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  const selectedProfile = talentProfiles.find(p => p.id === selectedProfileId) || null;

  useEffect(() => {
    if (selectedProfile) {
        setSelectedMatchIds([]);
        setInternalNotes('');
        setProfileForm({
          name: selectedProfile.name,
          title: selectedProfile.title,
          bio: selectedProfile.bio,
          location: selectedProfile.location,
          experience: selectedProfile.experience,
          skills: [...selectedProfile.skills]
        });
        setSettings({
          minSalary: '',
          workMode: 'Any',
          employmentType: 'Full-time',
          skillsFocus: selectedProfile.skills.slice(0, 3).map(s => s.name).join(', '),
          visaStatus: 'Not Required'
        });
        setMatchFilter('all');
    }
  }, [selectedProfileId]);

  const handleUpdateMatches = async () => {
    setIsRecalibrating(true);
    // Simulate re-indexing logic
    await new Promise(r => setTimeout(r, 600));
    setIsRecalibrating(false);
    setActiveSubTab('matches');
    notify("System Calibrated", "Job matches synchronized with your corrections.", "success");
  };

  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];
    
    // Logic now relies on profileForm (the editable data)
    const searchStr = profileForm.title.toLowerCase();
    const skillsArr = settings.skillsFocus.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const locFilter = profileForm.location.toLowerCase();

    let results = externalJobs.map((job, idx) => {
        let score = 70;
        const jobTitle = job.title.toLowerCase();
        const jobLoc = job.location.toLowerCase();

        // Role match
        const titleMatch = jobTitle.includes(searchStr.split(' ')[0]);
        if (titleMatch) score += 20;

        // Skills match (against focus list and profile skills)
        const allSkills = [...skillsArr, ...profileForm.skills.map(s => s.name.toLowerCase())];
        if (allSkills.some(skill => jobTitle.includes(skill))) score += 10;

        // Work mode match
        if (settings.workMode !== 'Any' && jobLoc.includes(settings.workMode.toLowerCase())) score += 5;

        // Location alignment
        if (locFilter && jobLoc.includes(locFilter)) {
            score += 15;
        } else if (locFilter && !jobLoc.includes('remote')) {
            score -= 10;
        }

        // Visa match
        if (settings.visaStatus === 'Requires Sponsorship' && !job.visaSponsorship) score -= 40;

        return {
            ...job,
            matchScore: Math.min(99, Math.max(0, score - (idx % 3)))
        };
    });

    if (matchFilter === 'high') results = results.filter(j => j.matchScore >= 85);
    if (matchFilter === 'remote') results = results.filter(j => j.location.toLowerCase().includes('remote'));

    return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [selectedProfile, externalJobs, profileForm, settings, matchFilter]);

  const toggleMatchSelection = (jobId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBulkShare = async () => {
    if (!selectedProfile || selectedMatchIds.length === 0) return;
    setIsBulkSharing(true);
    
    try {
      const email = `${profileForm.name.toLowerCase().replace(/\s+/g, '.')}@talent.agency.ai`;
      const existingCandidate = candidates.find(c => c.email.toLowerCase() === email);
      let candidateId = existingCandidate?.id;
      
      if (!existingCandidate) {
          const newId = `c_match_${Date.now()}`;
          addCandidate({
              id: newId,
              firstName: profileForm.name.split(' ')[0],
              lastName: profileForm.name.split(' ').slice(1).join(' ') || 'Candidate',
              email: email,
              role: profileForm.title,
              status: 'Active',
              stageId: 's1',
              matchScore: 0,
              skills: profileForm.skills,
              lastActivity: 'Sourced from Matcher',
              avatarUrl: selectedProfile.avatarUrl,
              notes: internalNotes || profileForm.bio,
              isOpenToWork: true,
              salaryExpectation: settings.minSalary,
              workMode: settings.workMode,
              workAuthorization: settings.visaStatus
          });
          candidateId = newId;
      }

      const selectedJobs = matchedJobs.filter(j => selectedMatchIds.includes(j.id));
      await bulkShareJobs([candidateId!], selectedJobs);
      
      setSelectedMatchIds([]);
      notify("Shared Successfully", `Dispatched ${selectedJobs.length} opportunities to ${profileForm.name}.`, "success");
      
    } catch (e) {
      notify("Error", "Transmission failed.", "error");
    } finally {
      setIsBulkSharing(false);
    }
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
        const dummyFile = new File(["content"], "resume.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        addTalentProfile(newProfile);
        setSelectedProfileId(newProfile.id);
        setActiveSubTab('settings');
    } catch(e) {
        notify("Error", "Failed to parse dossier.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const removeSkill = (index: number) => {
    setProfileForm(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 font-sans overflow-hidden">
      {/* SIDEBAR - RECRUITER TALENT CLOUD */}
      <div className="w-64 flex flex-col gap-4">
        <button 
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl active:scale-95 shrink-0"
        >
          {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
          Ingest Profile
        </button>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Extractions</h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{talentProfiles.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 no-scrollbar">
                {talentProfiles.map(profile => (
                    <button 
                        key={profile.id}
                        onClick={() => setSelectedProfileId(profile.id)}
                        className={`w-full p-3 rounded-xl flex gap-4 items-center transition-all text-left group ${
                            selectedProfileId === profile.id 
                            ? 'bg-slate-900 text-white shadow-xl' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-9 h-9 rounded-xl object-cover bg-slate-100 border border-white/10" />
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-black uppercase tracking-tight truncate ${selectedProfileId === profile.id ? 'text-white' : 'text-slate-900'}`}>{profile.name}</h4>
                            <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${selectedProfileId === profile.id ? 'text-slate-400' : 'text-slate-500'}`}>{profile.title}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* MAIN VIEW - CALIBRATION & MATCHING */}
      <div className="flex-1 flex flex-col relative">
        {selectedProfile ? (
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-6 items-center">
                            <img src={selectedProfile.avatarUrl} className="w-16 h-16 rounded-2xl object-cover shadow-2xl border-4 border-white" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight leading-none">
                                  {profileForm.name}
                                  <span className="text-[9px] font-black bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 uppercase tracking-widest shadow-sm">Extracted Node</span>
                                </h2>
                                <div className="flex gap-4 items-center mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                        <MapPin size={12} className="text-brand-500"/> {profileForm.location}
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                        <Briefcase size={12} className="text-brand-500"/> {profileForm.experience} Years DNA
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedProfileId(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex px-6 border-b border-slate-100 bg-white">
                    <TabLink active={activeSubTab === 'settings'} onClick={() => setActiveSubTab('settings')} label="Calibration & Review" icon={<Settings size={14}/>} />
                    <TabLink active={activeSubTab === 'matches'} onClick={() => setActiveSubTab('matches')} label="Market Resonance" icon={<Zap size={14}/>} count={matchedJobs.length} />
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/20">
                    {activeSubTab === 'settings' && (
                        <div className="flex flex-col lg:flex-row h-full divide-x divide-slate-100">
                            {/* DATA CORRECTION PANEL (LEFT) */}
                            <div className="lg:w-[45%] p-8 overflow-y-auto no-scrollbar bg-white">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <FileCheck size={18} className="text-brand-600" /> Extracted Data Audit
                                    </h4>
                                    <div className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-brand-100">Editable</div>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Candidate Identity</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input 
                                                    value={profileForm.name}
                                                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Current Role DNA</label>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input 
                                                    value={profileForm.title}
                                                    onChange={e => setProfileForm({...profileForm, title: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                    placeholder="Role Title"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Market Geo</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input 
                                                    value={profileForm.location}
                                                    onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                    placeholder="London, Remote, etc."
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Years Protocol</label>
                                            <div className="relative group">
                                                <History className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={16} />
                                                <input 
                                                    type="number"
                                                    value={profileForm.experience}
                                                    onChange={e => setProfileForm({...profileForm, experience: parseInt(e.target.value) || 0})}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Extracted Summary Brief</label>
                                        <textarea 
                                            value={profileForm.bio}
                                            onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                            rows={4}
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-medium text-slate-600 leading-relaxed shadow-inner outline-none focus:ring-2 focus:ring-brand-500 resize-none italic"
                                            placeholder="Extracted dossier summary..."
                                        />
                                    </div>

                                    <section>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Validated Skill Nodes</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profileForm.skills.map((skill, idx) => (
                                                <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-xl group/skill">
                                                    {skill.name} • {skill.years}Y
                                                    <button onClick={() => removeSkill(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 border-dashed text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">
                                                <Plus size={14} /> Add Skill
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* MATCH PARAMETERS PANEL (RIGHT) */}
                            <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-white">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Target size={18} className="text-brand-600" /> Neural Alignment Filters
                                    </h4>
                                </div>

                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Calibration focus (comma separated)</label>
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input 
                                                    value={settings.skillsFocus}
                                                    onChange={e => setSettings({...settings, skillsFocus: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                    placeholder="React, AWS, Leadership..."
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Comp Floor</label>
                                            <div className="relative group">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input 
                                                    value={settings.minSalary}
                                                    onChange={e => setSettings({...settings, minSalary: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none"
                                                    placeholder="$140k+"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Deployment Node</label>
                                            <select 
                                                value={settings.workMode}
                                                onChange={e => setSettings({...settings, workMode: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option>Any</option>
                                                <option>Remote</option>
                                                <option>Hybrid</option>
                                                <option>On-site</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Internal Mission Notes</label>
                                            <textarea 
                                                value={internalNotes}
                                                onChange={e => setInternalNotes(e.target.value)}
                                                rows={3}
                                                className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-medium text-slate-600 shadow-inner outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                                placeholder="Confidential Recruiter Insights..."
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-brand-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl group/btn">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10 -mr-16 -mt-16 group-hover/btn:opacity-20 transition-opacity"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex-1">
                                                <h5 className="text-xl font-black uppercase tracking-tight mb-2">Initialize Resonance</h5>
                                                <p className="text-brand-100 text-[10px] font-medium leading-relaxed uppercase tracking-widest">Re-calculate all market opportunities based on audit corrections.</p>
                                            </div>
                                            <button 
                                                onClick={handleUpdateMatches}
                                                disabled={isRecalibrating}
                                                className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all shadow-brand-900/10 active:scale-95 flex items-center gap-3 shrink-0"
                                            >
                                                {isRecalibrating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                                Sync Matches
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'matches' && (
                        <div className="p-8 space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Signal Filters:</p>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                                        <FilterBtn active={matchFilter === 'all'} onClick={() => setMatchFilter('all')} label="Broad Spectrum" />
                                        <FilterBtn active={matchFilter === 'high'} onClick={() => setMatchFilter('high')} label="High Resonance" icon={<Trophy size={14}/>} />
                                        <FilterBtn active={matchFilter === 'remote'} onClick={() => setMatchFilter('remote')} label="Remote Nodes" icon={<Globe size={14}/>} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMatchIds(selectedMatchIds.length === matchedJobs.length ? [] : matchedJobs.map(j => j.id))}
                                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-[0.2em] underline underline-offset-8 decoration-2"
                                >
                                    {selectedMatchIds.length === matchedJobs.length ? 'PURGE SELECTION' : `SELECT ALL (${matchedJobs.length})`}
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {matchedJobs.map((job) => (
                                    <div 
                                      key={job.id} 
                                      onClick={() => toggleMatchSelection(job.id)}
                                      className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer flex items-center gap-6 group ${
                                        selectedMatchIds.includes(job.id) ? 'border-brand-500 bg-brand-50/20 shadow-2xl ring-8 ring-brand-500/5 scale-[1.01]' : 'border-slate-100 hover:border-brand-200 shadow-sm'
                                      }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                            selectedMatchIds.includes(job.id) ? 'bg-brand-600 border-brand-600 text-white shadow-glow' : 'border-slate-200'
                                        }`}>
                                            {selectedMatchIds.includes(job.id) && <Check size={16} strokeWidth={4} />}
                                        </div>
                                        
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all shadow-lg ${
                                            selectedMatchIds.includes(job.id) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white'
                                        }`}>
                                            {job.company[0]}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors">{job.title}</h4>
                                                {job.visaSponsorship && <ShieldCheck size={14} className="text-emerald-500" />}
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="text-brand-600 font-black">{job.company}</span>
                                                <span className="text-slate-200">•</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-400"/> {job.location}</span>
                                                {job.salary && (
                                                    <>
                                                        <span className="text-slate-200">•</span>
                                                        <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-brand-400"/> {job.salary}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right px-6 border-l border-slate-100 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-black tracking-tighter ${job.matchScore! >= 85 ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                {job.matchScore}%
                                            </span>
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Resonance</p>
                                        </div>
                                    </div>
                                ))}
                                {matchedJobs.length === 0 && (
                                    <div className="py-40 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                                        <Search size={64} className="text-slate-100 mx-auto mb-6" />
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No resonance detected</h3>
                                        <p className="text-slate-400 mt-2 font-medium italic">Adjust calibration nodes in the audit panel.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ACTION BAR - FLOATING SYNC DOCK */}
                {activeSubTab === 'matches' && selectedMatchIds.length > 0 && (
                    <div className="p-5 bg-slate-950 text-white flex justify-between items-center animate-in slide-in-from-bottom-8 shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.5)] border-t border-white/5 relative z-50">
                        <div className="flex items-center gap-8 px-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl shadow-brand-600/30">{selectedMatchIds.length}</div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Payload</span>
                                    <span className="text-sm font-black uppercase tracking-tight">Opportunities Selected</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                            <div className="hidden md:flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Node</span>
                                <span className="text-sm font-black uppercase tracking-tight text-brand-400">{profileForm.name}</span>
                            </div>
                        </div>
                        <div className="flex gap-4 pr-6">
                             <button 
                                onClick={() => setSelectedMatchIds([])}
                                className="px-6 py-3 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all"
                            >
                                ABORT SYNC
                            </button>
                            <button 
                                onClick={handleBulkShare}
                                disabled={isBulkSharing}
                                className="flex items-center gap-3 px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-brand-600/20 disabled:opacity-50 active:scale-95"
                            >
                                {isBulkSharing ? <Loader2 className="animate-spin w-4 h-4" /> : <Send size={18} />}
                                Initiate Transmission
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-slate-200 border-dashed p-20 shadow-inner group">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                    <UserPlus size={48} strokeWidth={1} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Market Resonance Engine</h3>
                <p className="text-slate-400 max-w-md mx-auto text-lg font-medium leading-relaxed mb-10">Ingest a candidate dossier to begin autonomous market discovery and neural job alignment.</p>
                <button 
                    onClick={handleUpload}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                >
                    <Plus size={18} /> Provision Talent Node
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const TabLink = ({ active, onClick, label, icon, count }: any) => (
    <button 
        onClick={onClick}
        className={`py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 relative transition-all ${active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        {label}
        {count !== undefined && count > 0 && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all ${active ? 'bg-brand-600 text-white border-brand-600 shadow-glow' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {count}
            </span>
        )}
        {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 shadow-glow" />}
    </button>
);

const FilterBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
  >
      {icon}{label}
  </button>
);

export default TalentMatch;
