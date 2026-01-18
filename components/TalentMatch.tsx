
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
  ClipboardList
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
    addCandidate
  } = useStore();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'matches'>('settings');
  
  // Simplified Local State
  const [internalNotes, setInternalNotes] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [settings, setSettings] = useState({
    minSalary: '',
    workMode: 'Any',
    employmentType: 'Full-time',
    skillsFocus: '',
    visaStatus: 'Not Required',
    location: ''
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
        setTargetRole(selectedProfile.title || '');
        setSettings({
          minSalary: '',
          workMode: 'Any',
          employmentType: 'Full-time',
          skillsFocus: '',
          visaStatus: 'Not Required',
          location: selectedProfile.location || ''
        });
        setMatchFilter('all');
    }
  }, [selectedProfileId]);

  const handleUpdateMatches = async () => {
    setIsRecalibrating(true);
    await new Promise(r => setTimeout(r, 600));
    setIsRecalibrating(false);
    setActiveSubTab('matches');
    notify("Matches Updated", "System synchronized with your filters.", "success");
  };

  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];
    
    const searchStr = (targetRole || selectedProfile.title).toLowerCase();
    const skillsArr = settings.skillsFocus.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const locFilter = settings.location.toLowerCase();

    let results = externalJobs.map((job, idx) => {
        let score = 70;
        const jobTitle = job.title.toLowerCase();
        const jobLoc = job.location.toLowerCase();

        // Role match
        const titleMatch = jobTitle.includes(searchStr.split(' ')[0]);
        if (titleMatch) score += 20;

        // Skills match
        if (skillsArr.some(skill => jobTitle.includes(skill))) score += 10;

        // Work mode match
        if (settings.workMode !== 'Any' && jobLoc.includes(settings.workMode.toLowerCase())) score += 5;

        // Location alignment (New)
        if (locFilter && jobLoc.includes(locFilter)) {
            score += 15;
        } else if (locFilter && !jobLoc.includes('remote')) {
            // Subtraction for location mismatch if role isn't remote
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
  }, [selectedProfile, externalJobs, targetRole, settings, matchFilter]);

  const toggleMatchSelection = (jobId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
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
              role: targetRole || selectedProfile.title,
              status: 'Active',
              stageId: 's1',
              matchScore: 0,
              skills: selectedProfile.skills,
              lastActivity: 'Added from Matching',
              avatarUrl: selectedProfile.avatarUrl,
              notes: internalNotes,
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
      notify("Shared Successfully", `Sent ${selectedJobs.length} jobs to ${selectedProfile.name}.`, "success");
      
    } catch (e) {
      notify("Error", "Action failed.", "error");
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
        notify("Error", "Failed to process resume.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 flex flex-col gap-4">
        <button 
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-600 transition-all shadow-md active:scale-95 shrink-0"
        >
          {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
          Upload Resume
        </button>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Candidate Pool</h3>
                <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">{talentProfiles.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-1.5 space-y-1 no-scrollbar">
                {talentProfiles.map(profile => (
                    <button 
                        key={profile.id}
                        onClick={() => setSelectedProfileId(profile.id)}
                        className={`w-full p-2.5 rounded-lg flex gap-3 items-center transition-all text-left group ${
                            selectedProfileId === profile.id 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-white/10" />
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold truncate ${selectedProfileId === profile.id ? 'text-white' : 'text-slate-900'}`}>{profile.name}</h4>
                            <p className={`text-[9px] font-medium truncate ${selectedProfileId === profile.id ? 'text-slate-400' : 'text-slate-500'}`}>{profile.title}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col relative">
        {selectedProfile ? (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* HEADER */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <img src={selectedProfile.avatarUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm border-2 border-white" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                  {selectedProfile.name}
                                  <span className="text-[9px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100 uppercase tracking-widest">Matched</span>
                                </h2>
                                <div className="flex gap-3 items-center mt-0.5">
                                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                        <MapPin size={12} className="text-slate-400"/> {selectedProfile.location}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                        <Briefcase size={12} className="text-slate-400"/> {selectedProfile.experience}Y Exp
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedProfileId(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex px-4 border-b border-slate-100 bg-white">
                    <TabLink active={activeSubTab === 'settings'} onClick={() => setActiveSubTab('settings')} label="Matching Settings" icon={<Settings size={14}/>} />
                    <TabLink active={activeSubTab === 'matches'} onClick={() => setActiveSubTab('matches')} label="Job Matches" icon={<Check size={14}/>} count={matchedJobs.length} />
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/20">
                    {activeSubTab === 'settings' && (
                        <div className="flex flex-col lg:flex-row h-full">
                            {/* RESUME PREVIEW */}
                            <div className="lg:w-[45%] p-4 border-r border-slate-100 overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Resume Preview
                                    </h4>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-full">
                                    <h1 className="text-xl font-bold text-slate-900 mb-1">{selectedProfile.name}</h1>
                                    <p className="text-brand-600 font-bold text-xs mb-5">{selectedProfile.title}</p>
                                    
                                    <div className="space-y-5">
                                      <section>
                                          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Summary</h5>
                                          <p className="text-xs text-slate-600 leading-relaxed">{selectedProfile.bio}</p>
                                      </section>

                                      <section>
                                          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Skills</h5>
                                          <div className="flex flex-wrap gap-1.5">
                                              {selectedProfile.skills.map(skill => (
                                                  <span key={skill.name} className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[10px] font-medium border border-slate-200 rounded">
                                                      {skill.name} • {skill.years}Y
                                                  </span>
                                              ))}
                                          </div>
                                      </section>
                                    </div>
                                </div>
                            </div>

                            {/* SETTINGS FORM */}
                            <div className="flex-1 p-6 overflow-y-auto no-scrollbar bg-white">
                                <div className="max-w-xl space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Desired Role</label>
                                            <input 
                                                value={targetRole}
                                                onChange={e => setTargetRole(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                placeholder="e.g. Senior Frontend Engineer"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Target Location</label>
                                            <input 
                                                value={settings.location}
                                                onChange={e => setSettings({...settings, location: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                placeholder="e.g. New York, Remote"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Required Skills (Comma separated)</label>
                                        <input 
                                            value={settings.skillsFocus}
                                            onChange={e => setSettings({...settings, skillsFocus: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="e.g. React, Node.js, AWS"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Min Salary</label>
                                            <input 
                                                value={settings.minSalary}
                                                onChange={e => setSettings({...settings, minSalary: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                                placeholder="$120k+"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Work Type</label>
                                            <select 
                                                value={settings.workMode}
                                                onChange={e => setSettings({...settings, workMode: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                            >
                                                <option>Any</option>
                                                <option>Remote</option>
                                                <option>Hybrid</option>
                                                <option>On-site</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Visa Policy</label>
                                            <select 
                                                value={settings.visaStatus}
                                                onChange={e => setSettings({...settings, visaStatus: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                                            >
                                                <option>Not Required</option>
                                                <option>Requires Sponsorship</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Internal Notes</label>
                                        <textarea 
                                            value={internalNotes}
                                            onChange={e => setInternalNotes(e.target.value)}
                                            rows={3}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none italic"
                                            placeholder="Notes for internal recruiter use..."
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={handleUpdateMatches}
                                            disabled={isRecalibrating}
                                            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-brand-600 transition-all shadow active:scale-95 flex items-center gap-2"
                                        >
                                            {isRecalibrating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                            Update Matches
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'matches' && (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filters:</p>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <FilterBtn active={matchFilter === 'all'} onClick={() => setMatchFilter('all')} label="All" />
                                        <FilterBtn active={matchFilter === 'high'} onClick={() => setMatchFilter('high')} label="Best Match" icon={<Trophy size={11}/>} />
                                        <FilterBtn active={matchFilter === 'remote'} onClick={() => setMatchFilter('remote')} label="Remote" icon={<Globe size={11}/>} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedMatchIds(selectedMatchIds.length === matchedJobs.length ? [] : matchedJobs.map(j => j.id))}
                                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest underline underline-offset-4"
                                >
                                    {selectedMatchIds.length === matchedJobs.length ? 'Deselect All' : `Select All`}
                                </button>
                            </div>

                            <div className="grid gap-2.5">
                                {matchedJobs.map((job) => (
                                    <div 
                                      key={job.id} 
                                      onClick={() => toggleMatchSelection(job.id)}
                                      className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-4 group ${
                                        selectedMatchIds.includes(job.id) ? 'border-brand-500 bg-brand-50/20 shadow-sm' : 'border-slate-100 hover:border-brand-200'
                                      }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                            selectedMatchIds.includes(job.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                                        }`}>
                                            {selectedMatchIds.includes(job.id) && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200 group-hover:bg-white group-hover:text-brand-600 transition-colors">
                                            {job.company[0]}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{job.title}</h4>
                                            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                                                <span className="text-brand-600 font-bold">{job.company}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-0.5"><MapPin size={10}/> {job.location}</span>
                                                {job.salary && <span>• {job.salary}</span>}
                                            </div>
                                        </div>

                                        <div className="text-right px-3 border-l border-slate-100">
                                            <span className={`text-[11px] font-bold ${job.matchScore! >= 85 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                {job.matchScore}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {matchedJobs.length === 0 && (
                                    <div className="py-20 text-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                        <Search size={32} className="text-slate-200 mx-auto mb-3" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matches found for current settings</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ACTION BAR */}
                {activeSubTab === 'matches' && selectedMatchIds.length > 0 && (
                    <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3 px-4">
                            <span className="text-lg font-black">{selectedMatchIds.length}</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Jobs selected for {selectedProfile.name}</span>
                        </div>
                        <div className="flex gap-2 pr-2">
                             <button 
                                onClick={() => setSelectedMatchIds([])}
                                className="px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-all"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={handleBulkShare}
                                disabled={isBulkSharing}
                                className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {isBulkSharing ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Send size={14} />}
                                Send to Candidate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 border-dashed p-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-5 border border-slate-100">
                    <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Talent Selection</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-xs font-medium leading-relaxed">Select a candidate from your pipeline or upload a new dossier to start the matching process.</p>
                <button 
                    onClick={handleUpload}
                    className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                >
                    Ingest Profile
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
        className={`py-3 px-5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 relative transition-all ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        {label}
        {count !== undefined && count > 0 && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {count}
            </span>
        )}
        {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900" />}
    </button>
);

const FilterBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
  >
      {icon}{label}
  </button>
);

export default TalentMatch;
