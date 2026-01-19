
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  MapPin, 
  Briefcase, 
  Send, 
  Loader2, 
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
  ShieldCheck, 
  Target, 
  FileCheck, 
  Trash2, 
  User, 
  History 
} from 'lucide-react';
import { ExternalJob, CandidateProfile, Skill } from '../types';
import { useStore } from '../context/StoreContext';
import { ResumeParserService } from '../services/externalServices';

// Compact Sub-components
const TabLink = ({ active, onClick, label, icon, count }: any) => (
    <button 
        onClick={onClick}
        className={`py-4 px-6 text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 relative transition-all ${active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        {label}
        {count !== undefined && count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border transition-all ${active ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {count}
            </span>
        )}
        {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600" />}
    </button>
);

const FilterBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${active ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}
  >
      {icon}{label}
  </button>
);

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
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'matches'>('settings');
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    experience: 0,
    skills: [] as Skill[]
  });

  const [internalNotes, setInternalNotes] = useState('');
  const [settings, setSettings] = useState({
    minSalary: '',
    location: '',
    workMode: 'Any',
    employmentType: 'Full-time',
    skillsFocus: '',
    visaStatus: 'Not Required'
  });

  const [matchFilter, setMatchFilter] = useState<'all' | 'high' | 'remote'>('all');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [isBulkSharing, setIsBulkSharing] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  const selectedProfile = useMemo(() => 
    talentProfiles.find(p => p.id === selectedProfileId) || null
  , [selectedProfileId, talentProfiles]);

  useEffect(() => {
    if (selectedProfile) {
        setSelectedMatchIds([]);
        setInternalNotes('');
        setProfileForm({
          name: selectedProfile.name || 'Unknown Candidate',
          title: selectedProfile.title || 'Professional Node',
          bio: selectedProfile.bio || '',
          location: selectedProfile.location || 'Remote',
          experience: selectedProfile.experience || 0,
          skills: selectedProfile.skills ? [...selectedProfile.skills] : []
        });
        setSettings({
          minSalary: '',
          location: selectedProfile.location || '',
          workMode: 'Any',
          employmentType: 'Full-time',
          skillsFocus: selectedProfile.skills ? selectedProfile.skills.slice(0, 3).map(s => s.name).join(', ') : '',
          visaStatus: 'Not Required'
        });
        setMatchFilter('all');
        setActiveSubTab('settings');
    }
  }, [selectedProfileId, selectedProfile]);

  const handleUpdateMatches = async () => {
    setIsRecalibrating(true);
    await new Promise(r => setTimeout(r, 600));
    setIsRecalibrating(false);
    setActiveSubTab('matches');
    notify("Engine Synchronized", "Matches recalibrated.", "success");
  };

  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];
    
    const searchStr = (profileForm.title || '').toLowerCase();
    const skillsArr = (settings.skillsFocus || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const locFilter = (settings.location || '').toLowerCase();

    let results = externalJobs.map((job, idx) => {
        let score = 70;
        const jobTitle = (job.title || '').toLowerCase();
        const jobLoc = (job.location || '').toLowerCase();

        if (searchStr && jobTitle.includes(searchStr.split(' ')[0])) score += 20;
        const allSkills = [...skillsArr, ...(profileForm.skills || []).map(s => (s.name || '').toLowerCase())];
        if (allSkills.some(skill => skill && jobTitle.includes(skill))) score += 10;

        if (settings.workMode !== 'Any' && jobLoc.includes(settings.workMode.toLowerCase())) score += 5;
        if (locFilter && jobLoc.includes(locFilter)) {
            score += 15;
        } else if (locFilter && !jobLoc.includes('remote')) {
            score -= 10;
        }

        if (settings.visaStatus === 'Requires Sponsorship' && !job.visaSponsorship) score -= 40;

        return {
            ...job,
            matchScore: Math.min(99, Math.max(0, score - (idx % 3)))
        };
    });

    if (matchFilter === 'high') results = results.filter(j => j.matchScore >= 85);
    if (matchFilter === 'remote') results = results.filter(j => (j.location || '').toLowerCase().includes('remote'));

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
              firstName: profileForm.name.split(' ')[0] || 'Candidate',
              lastName: profileForm.name.split(' ').slice(1).join(' ') || 'Node',
              email: email,
              role: profileForm.title,
              status: 'Active',
              stageId: 's1',
              matchScore: 0,
              skills: profileForm.skills,
              lastActivity: 'Sourced via Matcher',
              avatarUrl: selectedProfile.avatarUrl || `https://picsum.photos/100/100?u=${newId}`,
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
      notify("Shared", `Sent ${selectedJobs.length} roles to ${profileForm.name}.`, "success");
      
    } catch (e) {
      notify("Transmission Error", "Failed to dispatch payload.", "error");
    } finally {
      setIsBulkSharing(false);
    }
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
        const dummyFile = new File([""], "resume.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        addTalentProfile(newProfile);
        setSelectedProfileId(newProfile.id);
        setActiveSubTab('settings');
    } catch(e) {
        notify("Extraction Error", "Failed to parse dossier.", "error");
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
    <div className="flex h-[calc(100vh-100px)] gap-4 font-sans overflow-hidden">
      {/* COMPACT SIDEBAR */}
      <div className="w-56 flex flex-col gap-3">
        <button 
          onClick={handleUpload}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin w-3 h-3" /> : <Upload size={14} />}
          Ingest Profile
        </button>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profiles</h3>
                <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">{talentProfiles.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-1.5 space-y-1 no-scrollbar">
                {talentProfiles.map(profile => (
                    <button 
                        key={profile.id}
                        onClick={() => setSelectedProfileId(profile.id)}
                        className={`w-full p-2 rounded-lg flex gap-3 items-center transition-all text-left group ${
                            selectedProfileId === profile.id 
                            ? 'bg-slate-900 text-white shadow-lg' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-white/10" />
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-[11px] font-black uppercase truncate ${selectedProfileId === profile.id ? 'text-white' : 'text-slate-900'}`}>{profile.name}</h4>
                            <p className={`text-[8px] font-bold uppercase tracking-widest truncate ${selectedProfileId === profile.id ? 'text-slate-400' : 'text-slate-500'}`}>{profile.title}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* REFINED MAIN VIEW */}
      <div className="flex-1 flex flex-col relative">
        {selectedProfile ? (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-200">
                {/* COMPACT HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <img src={selectedProfile.avatarUrl} className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-white" />
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight leading-none">
                                  {profileForm.name}
                                  <span className="text-[8px] font-black bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-100 uppercase tracking-widest">Active</span>
                                </h2>
                                <div className="flex gap-3 items-center mt-1">
                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                        <MapPin size={10} className="text-brand-500"/> {profileForm.location}
                                    </span>
                                    <div className="h-0.5 w-0.5 rounded-full bg-slate-300"></div>
                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                        <Briefcase size={10} className="text-brand-500"/> {profileForm.experience}Y
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedProfileId(null)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex px-4 border-b border-slate-100 bg-white">
                    <TabLink active={activeSubTab === 'settings'} onClick={() => setActiveSubTab('settings')} label="Audit & Calibration" icon={<Settings size={12}/>} />
                    <TabLink active={activeSubTab === 'matches'} onClick={() => setActiveSubTab('matches')} label="Market Resonance" icon={<Zap size={12}/>} count={matchedJobs.length} />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                    {activeSubTab === 'settings' && (
                        <div className="flex flex-col lg:flex-row h-full divide-x divide-slate-50">
                            {/* AUDIT (LEFT) */}
                            <div className="lg:w-1/2 p-6 overflow-y-auto no-scrollbar">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <FileCheck size={14} className="text-brand-600" /> Identity Extraction
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Candidate Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                value={profileForm.name}
                                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Role</label>
                                        <div className="relative group">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                value={profileForm.title}
                                                onChange={e => setProfileForm({...profileForm, title: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Experience (Y)</label>
                                        <input 
                                            type="number"
                                            value={profileForm.experience}
                                            onChange={e => setProfileForm({...profileForm, experience: parseInt(e.target.value) || 0})}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Residence</label>
                                        <input 
                                            value={profileForm.location}
                                            onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Skills Graph</label>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {(profileForm.skills || []).map((skill, idx) => (
                                                <span key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold uppercase rounded-md">
                                                    {skill.name} • {skill.years}Y
                                                    <button onClick={() => removeSkill(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={10} /></button>
                                                </span>
                                            ))}
                                            <button className="px-2 py-1 border border-slate-200 border-dashed text-slate-400 text-[9px] font-black uppercase rounded-md hover:bg-slate-50">
                                                <Plus size={10} className="inline mr-1" /> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CALIBRATION (RIGHT) */}
                            <div className="lg:w-1/2 p-6 overflow-y-auto no-scrollbar">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Target size={14} className="text-brand-600" /> Match Parameters
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Tech Nodes</label>
                                        <input 
                                            value={settings.skillsFocus}
                                            onChange={e => setSettings({...settings, skillsFocus: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="React, Lead, Architecture..."
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Min. Comp</label>
                                            <input 
                                                value={settings.minSalary}
                                                onChange={e => setSettings({...settings, minSalary: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner"
                                                placeholder="$140k+"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Protocol</label>
                                            <select 
                                                value={settings.workMode}
                                                onChange={e => setSettings({...settings, workMode: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase shadow-inner cursor-pointer"
                                            >
                                                <option>Any</option>
                                                <option>Remote</option>
                                                <option>Hybrid</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Market Location</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                value={settings.location}
                                                onChange={e => setSettings({...settings, location: e.target.value})}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold shadow-inner focus:ring-2 focus:ring-brand-500 outline-none"
                                                placeholder="e.g. San Francisco, London..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Internal Mission Notes</label>
                                        <textarea 
                                            value={internalNotes}
                                            onChange={e => setInternalNotes(e.target.value)}
                                            rows={2}
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl text-[11px] font-medium text-slate-600 shadow-inner resize-none"
                                            placeholder="Insights..."
                                        />
                                    </div>

                                    <div className="bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden shadow-lg mt-4">
                                        <div className="relative z-10 flex items-center justify-between gap-4">
                                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest leading-snug">Sync market resonance based on corrections.</p>
                                            <button 
                                                onClick={handleUpdateMatches}
                                                disabled={isRecalibrating}
                                                className="px-6 py-3 bg-brand-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-brand-500 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                                            >
                                                {isRecalibrating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                                Sync Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'matches' && (
                        <div className="p-6 space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Filters:</p>
                                    <div className="flex gap-1">
                                        <FilterBtn active={matchFilter === 'all'} onClick={() => setMatchFilter('all')} label="All" />
                                        <FilterBtn active={matchFilter === 'high'} onClick={() => setMatchFilter('high')} label="High" icon={<Trophy size={12}/>} />
                                        <FilterBtn active={matchFilter === 'remote'} onClick={() => setMatchFilter('remote')} label="Remote" icon={<Globe size={12}/>} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMatchIds(selectedMatchIds.length === matchedJobs.length ? [] : matchedJobs.map(j => j.id))}
                                    className="text-[9px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest mr-2 underline decoration-2 underline-offset-4"
                                >
                                    {selectedMatchIds.length === matchedJobs.length ? 'DESELECT' : `SELECT ALL (${matchedJobs.length})`}
                                </button>
                            </div>

                            <div className="grid gap-2">
                                {matchedJobs.map((job) => (
                                    <div 
                                      key={job.id} 
                                      onClick={() => toggleMatchSelection(job.id)}
                                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-4 group ${
                                        selectedMatchIds.includes(job.id) ? 'border-brand-500 bg-brand-50/10 shadow-md' : 'border-slate-100 hover:border-brand-200'
                                      }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                            selectedMatchIds.includes(job.id) ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'border-slate-300'
                                        }`}>
                                            {selectedMatchIds.includes(job.id) && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg transition-all ${
                                            selectedMatchIds.includes(job.id) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white'
                                        }`}>
                                            {job.company ? job.company[0] : '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors">{job.title || 'Mission Profile'}</h4>
                                                {job.visaSponsorship && <ShieldCheck size={12} className="text-emerald-500" />}
                                            </div>
                                            <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="text-brand-600 font-black">{job.company || 'Confidential'}</span>
                                                <span className="text-slate-200">•</span>
                                                <span className="flex items-center gap-1"><MapPin size={10}/> {job.location || 'Global'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right px-4 border-l border-slate-100 flex flex-col items-center justify-center">
                                            <span className={`text-lg font-black tracking-tighter ${job.matchScore! >= 85 ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                {job.matchScore}%
                                            </span>
                                            <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Match</p>
                                        </div>
                                    </div>
                                ))}
                                {matchedJobs.length === 0 && (
                                    <div className="py-20 text-center opacity-50">
                                        <Search size={40} className="text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Zero Resonance</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* COMPACT ACTION BAR */}
                {activeSubTab === 'matches' && selectedMatchIds.length > 0 && (
                    <div className="px-6 py-3 bg-slate-950 text-white flex justify-between items-center animate-in slide-in-from-bottom-4 shadow-xl border-t border-white/5 relative z-50">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-sm font-black">{selectedMatchIds.length}</div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase text-slate-400">Payload Selected</span>
                                    <span className="text-[10px] font-black uppercase text-brand-400 truncate max-w-[120px]">{profileForm.name}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleBulkShare}
                            disabled={isBulkSharing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 active:scale-95"
                        >
                            {isBulkSharing ? <Loader2 className="animate-spin w-3 h-3" /> : <Send size={14} />}
                            Initiate Transmission
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 border-dashed p-10 shadow-inner group animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                    <UserPlus size={32} strokeWidth={1} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Neural Matching Ready</h3>
                <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium leading-relaxed mb-8">Provision a candidate profile from the pool to begin market mapping.</p>
                <button 
                    onClick={handleUpload}
                    disabled={isProcessing}
                    className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={16} />} 
                    Provision Profile
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TalentMatch;
