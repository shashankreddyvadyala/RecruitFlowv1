
import React, { useState, useMemo, useEffect } from 'react';
// Added missing ChevronRight and LayoutGrid icons to the import list
import { UploadCloud, CheckCircle, Search, MapPin, Briefcase, Zap, Star, ExternalLink, Send, ArrowRight, Share2, Mail, Sparkles, ShieldCheck, FileCode, TrendingDown, Info, ChevronDown, ChevronUp, Loader2, DollarSign, Eye, FileText, GraduationCap, Award, Clock, ChevronRight, LayoutGrid } from 'lucide-react';
import { ExternalJob, CandidateProfile, OptimizationInsight, Candidate, Skill, ResumeFile } from '../types';
import { useStore } from '../context/StoreContext';
import { ResumeParserService } from '../services/externalServices';
import { getHiringOptimization } from '../services/geminiService';

const TalentMatch: React.FC = () => {
  const { talentProfiles, externalJobs, addTalentProfile, shareJobWithCandidate, candidates, notify, addActivity, updateCandidateProfile } = useStore();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'dossier' | 'artifacts' | 'resonance'>('dossier');
  
  // Optimization State
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationInsight[]>([]);
  const [expandedOptimization, setExpandedOptimization] = useState<string | null>(null);

  const selectedProfile = talentProfiles.find(p => p.id === selectedProfileId) || null;

  // Try to find the full candidate record if it exists to access full resume vault
  const candidateRecord = useMemo(() => {
    if (!selectedProfile) return null;
    return candidates.find(c => `${c.firstName} ${c.lastName}`.toLowerCase() === selectedProfile.name.toLowerCase());
  }, [selectedProfile, candidates]);

  // Resume Stacking & Selection Logic
  const sortedResumes = useMemo(() => {
    if (candidateRecord?.resumes) {
        return [...candidateRecord.resumes].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
    // Fallback to single resume if no candidate record found
    if (selectedProfile?.resumeUrl) {
        return [{
            id: 'legacy_1',
            name: 'primary_resume.pdf',
            url: selectedProfile.resumeUrl,
            updatedAt: new Date().toISOString(),
            type: 'PDF'
        } as ResumeFile];
    }
    return [];
  }, [candidateRecord, selectedProfile]);

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
      if (sortedResumes.length > 0) {
          setSelectedResumeId(sortedResumes[0].id);
      } else {
          setSelectedResumeId(null);
      }
  }, [sortedResumes]);

  const activeResume = sortedResumes.find(r => r.id === selectedResumeId);

  // FIX: useMemo must be called unconditionally. Logic moved inside the callback.
  const matchedJobs = useMemo(() => {
    if (!selectedProfile) return [];
    
    return externalJobs.filter(job => {
        const titleMatch = job.title.toLowerCase().includes(selectedProfile.title.split(' ')[1]?.toLowerCase() || 'engineer');
        return titleMatch || Math.random() > 0.6;
    }).map((job, idx) => ({
        ...job,
        matchScore: 98 - idx * 5
    }));
  }, [selectedProfile, externalJobs]);

  const handleRunOptimization = async (job: ExternalJob) => {
    if (!selectedProfile) return;
    setOptimizationLoading(true);
    try {
        const targetCandidate = candidateRecord || candidates[0];
        const results = await getHiringOptimization(targetCandidate, job.title, job.location);
        setOptimizations(results);
        notify("Strategic Protocol Active", "Global tax and compliance optimizations identified.", "success");
    } catch (e) {
        console.error(e);
        notify("Lab Error", "Failed to retrieve optimization data.", "error");
    } finally {
        setOptimizationLoading(false);
    }
  };

  const applyOptimization = (insight: OptimizationInsight) => {
    const targetCandidate = candidateRecord || candidates[0];
    
    const updates: Partial<Candidate> = {};
    if (insight.category === 'HTS' && insight.htsCode) {
        updates.htsClassification = insight.htsCode;
    }
    if (insight.category === 'Tax') {
        updates.taxOptimizationApplied = true;
    }

    updateCandidateProfile(targetCandidate.id, updates);
    addActivity({
        id: `opt_${Date.now()}`,
        type: 'Optimization',
        subject: `Strategic Alignment: ${insight.title}`,
        content: `Applied fiscal optimization protocol: ${insight.description}. Savings potential tracked.`,
        timestamp: new Date().toISOString(),
        author: 'AI Auditor',
        entityId: targetCandidate.id
    });

    notify("Optimization Synthesized", `Applied ${insight.title} to dossier.`, "success");
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
        const dummyFile = new File(["content"], "new_operative.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        addTalentProfile(newProfile);
        setSelectedProfileId(newProfile.id);
        setActiveSubTab('dossier');
    } catch(e) {
        console.error("Upload failed", e);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full gap-6 font-sans">
      {/* Left: Talent Inventory */}
      <div className="w-1/3 flex flex-col gap-4">
        <div 
          onClick={handleUpload}
          className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all group shadow-sm"
        >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:text-brand-600 group-hover:shadow-lg transition-all">
                {isProcessing ? <Loader2 className="animate-spin w-6 h-6 text-brand-600" /> : <UploadCloud size={24} />}
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Provision Record</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingest Dossier via Neural OCR</p>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px]">Talent Inventory</h3>
                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">{talentProfiles.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {talentProfiles.map(profile => (
                    <div 
                        key={profile.id}
                        onClick={() => { setSelectedProfileId(profile.id); setOptimizations([]); }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex gap-4 items-center group ${
                            selectedProfileId === profile.id 
                            ? 'bg-brand-600 border-brand-600 shadow-xl shadow-brand-600/20 translate-x-1' 
                            : 'bg-white border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black uppercase tracking-tight text-sm truncate ${selectedProfileId === profile.id ? 'text-white' : 'text-slate-900'}`}>{profile.name}</h4>
                            <p className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${selectedProfileId === profile.id ? 'text-brand-100' : 'text-slate-400'}`}>{profile.title}</p>
                        </div>
                        {selectedProfileId !== profile.id && <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-600" />}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right: Detailed Analysis & Matching Engine */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedProfile ? (
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Profile Header Card */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-5 -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-6 items-center">
                            <img src={selectedProfile.avatarUrl} className="w-24 h-24 rounded-[2rem] shadow-2xl border-4 border-white object-cover" />
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedProfile.name}</h2>
                                <div className="flex gap-3 items-center mt-3">
                                    <span className="bg-brand-600 text-white text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest shadow-md shadow-brand-600/20">{selectedProfile.status}</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin size={12} className="text-brand-600"/> {selectedProfile.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-all shadow-sm">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub Tabs */}
                <div className="flex border-b border-slate-100 px-4">
                    <TabButton active={activeSubTab === 'dossier'} onClick={() => setActiveSubTab('dossier')} label="Dossier" icon={<LayoutGrid size={14}/>} />
                    <TabButton active={activeSubTab === 'artifacts'} onClick={() => setActiveSubTab('artifacts')} label="Artifact Vault" icon={<FileText size={14}/>} />
                    <TabButton active={activeSubTab === 'resonance'} onClick={() => setActiveSubTab('resonance')} label="Market Resonance" icon={<Sparkles size={14}/>} />
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeSubTab === 'dossier' ? (
                        <div className="space-y-8 max-w-4xl">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                       <Award size={14} className="text-brand-600" /> Industry Tenure
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{selectedProfile.experience}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Years</span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                       <GraduationCap size={14} className="text-brand-600" /> Academic Background
                                    </p>
                                    {candidateRecord?.education && candidateRecord.education.length > 0 ? (
                                        <div className="space-y-4">
                                            {candidateRecord.education.map((edu, i) => (
                                                <div key={i} className="border-l-2 border-brand-200 pl-3">
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{edu.degree}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{edu.institution} • {edu.year}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">Detailed academic data not provisioned</p>
                                    )}
                                </div>
                            </div>

                            {/* Tech Stack Breakdown */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-inner bg-slate-50/30">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Neural Skill Profile</h3>
                                <div className="flex flex-wrap gap-3">
                                    {selectedProfile.skills.map(skill => (
                                        <div key={skill.name} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-500 transition-all group/skill">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover/skill:text-brand-600">{skill.name}</span>
                                            <span className="w-px h-3 bg-slate-200"></span>
                                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">{skill.years}Y</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Professional Bio */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Info size={14} className="text-brand-600"/> Executive Summary
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {selectedProfile.bio}
                                </p>
                            </div>
                        </div>
                    ) : activeSubTab === 'artifacts' ? (
                        <div className="h-full flex flex-col gap-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px]">
                                {/* Stack Selection */}
                                <div className="lg:col-span-4 space-y-3">
                                    {sortedResumes.length > 0 ? (
                                        sortedResumes.map((resume, idx) => (
                                            <div 
                                                key={resume.id}
                                                onClick={() => setSelectedResumeId(resume.id)}
                                                className={`group cursor-pointer p-5 rounded-2xl border transition-all relative overflow-hidden ${
                                                    selectedResumeId === resume.id 
                                                    ? 'bg-brand-50 border-brand-500 shadow-xl translate-x-2' 
                                                    : 'bg-white border-slate-100 hover:border-brand-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl ${selectedResumeId === resume.id ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-black uppercase truncate tracking-tight ${selectedResumeId === resume.id ? 'text-brand-800' : 'text-slate-700'}`}>
                                                            {resume.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            Ingested: {new Date(resume.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {idx === 0 && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                                                        Latest
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                                            <FileCode size={40} className="text-slate-200 mx-auto mb-4" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No documentation provisioned</p>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Frame */}
                                <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
                                    {activeResume ? (
                                        <>
                                            <div className="p-4 bg-slate-800 border-b border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Preview: {activeResume.name}</span>
                                                </div>
                                                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                            <div className="flex-1 p-10 overflow-y-auto">
                                                <div className="bg-white rounded-xl shadow-2xl p-12 space-y-8 mx-auto max-w-lg min-h-full border border-slate-100 font-serif relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[100px] pointer-events-none"></div>
                                                    <div className="text-center pb-8 border-b border-slate-100">
                                                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{selectedProfile.name}</h1>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{selectedProfile.title}</p>
                                                    </div>
                                                    
                                                    <div className="space-y-8">
                                                        <section>
                                                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                                <Briefcase size={12} className="text-brand-600" /> Career History
                                                            </h2>
                                                            <div className="pl-4 border-l-2 border-slate-100">
                                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Principal Systems Engineer</p>
                                                                <p className="text-[10px] text-slate-400 italic mb-2 uppercase tracking-widest">2021 - Present • Global Node Systems</p>
                                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                                    Spearheaded architecture for high-resonance matching algorithms. Optimized processing latency by 45% using distributed neural caching.
                                                                </p>
                                                            </div>
                                                        </section>

                                                        <section>
                                                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                                <Zap size={12} className="text-brand-600" /> Technical Capabilities
                                                            </h2>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedProfile.skills.map(s => (
                                                                    <span key={s.name} className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-tight">{s.name}</span>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-slate-500 mb-6 shadow-2xl">
                                                <Eye size={32} />
                                            </div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Select an artifact to initiate preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                        <Sparkles className="text-purple-500" size={24} />
                                        Neural Resonance Feed
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time market matching based on current profile</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {matchedJobs.map((job) => (
                                    <div key={job.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-brand-500 transition-all group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="flex gap-6">
                                                <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-3xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                                    {job.company[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-xl group-hover:text-brand-600 transition-colors leading-none mb-3">{job.title}</h4>
                                                    <div className="flex flex-wrap gap-4">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                                            <Briefcase size={12} className="text-brand-600"/> {job.company}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                                                            <MapPin size={12} className="text-brand-600"/> {job.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2 text-emerald-600 font-black text-2xl tracking-tighter bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                                                    <Star size={20} className="fill-emerald-500 text-emerald-500" />
                                                    {job.matchScore}%
                                                </div>
                                                <button 
                                                    onClick={() => handleRunOptimization(job)}
                                                    className="mt-3 text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:text-brand-800 bg-brand-50/50 px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-all"
                                                >
                                                    <Zap size={14} fill="currentColor" /> Strategic Lab
                                                </button>
                                            </div>
                                        </div>

                                        {/* Optimization Intelligence Module (Conditional) */}
                                        {optimizations.length > 0 && (
                                            <div className="mb-8 bg-slate-900 rounded-[2rem] overflow-hidden border border-brand-500/30 animate-in zoom-in-95 shadow-2xl relative">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                                                <div className="p-6 bg-brand-600/10 flex items-center justify-between border-b border-white/5">
                                                    <h5 className="text-[11px] font-black text-brand-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                                        <ShieldCheck size={18} /> Optimization Protocol
                                                    </h5>
                                                    <span className="text-[9px] font-black text-white bg-emerald-500 px-3 py-1 rounded-full shadow-glow uppercase tracking-widest">Active Synthesis</span>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    {optimizations.map((insight) => (
                                                        <div key={insight.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/30 group/opt">
                                                            <div 
                                                                onClick={() => setExpandedOptimization(expandedOptimization === insight.id ? null : insight.id)}
                                                                className="p-5 flex items-center justify-between cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-5">
                                                                    <div className={`p-3 rounded-xl shadow-lg ${
                                                                        insight.category === 'Tax' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        insight.category === 'HTS' ? 'bg-purple-500/20 text-purple-400' :
                                                                        'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                        {insight.category === 'Tax' ? <TrendingDown size={18} /> : 
                                                                         insight.category === 'HTS' ? <FileCode size={18} /> : 
                                                                         <Info size={18} />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-white uppercase tracking-tight leading-none group-hover/opt:text-brand-400 transition-colors">{insight.title}</p>
                                                                        {insight.savingsPotential && (
                                                                            <p className="text-[10px] font-bold text-emerald-400 uppercase mt-2 tracking-widest flex items-center gap-2">
                                                                                <DollarSign size={10} /> Yield Opportunity: {insight.savingsPotential}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className={`transition-transform duration-300 ${expandedOptimization === insight.id ? 'rotate-180' : ''}`}>
                                                                    <ChevronDown size={20} className="text-slate-500" />
                                                                </div>
                                                            </div>
                                                            
                                                            {expandedOptimization === insight.id && (
                                                                <div className="px-5 pb-6 animate-in slide-in-from-top-4 duration-500 border-t border-white/5 pt-4">
                                                                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
                                                                        {insight.description}
                                                                        {insight.htsCode && <span className="block mt-3 font-black text-purple-400 uppercase tracking-widest text-xs bg-purple-400/10 self-start px-3 py-1 rounded-lg border border-purple-400/20">HTS Node: {insight.htsCode}</span>}
                                                                    </p>
                                                                    <button 
                                                                        onClick={() => applyOptimization(insight)}
                                                                        className="w-full py-4 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl"
                                                                    >
                                                                        {insight.actionLabel} <ArrowRight size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                                            <div className="flex gap-4">
                                                <button className="px-8 py-3 bg-slate-900 text-white text-[10px] rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/10 flex items-center gap-2 group/btn">
                                                    <Send size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /> Transmit Dossier
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Neural Verification Matrix Ready</span>
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border border-slate-200 border-dashed relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <Search size={48} />
                </div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Select Target Operative</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-12 leading-relaxed">Access the Talent Inventory to initiate high-resonance matching protocols and fiscal optimization sequences.</p>
                <button onClick={handleUpload} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-600 transition-all active:scale-95">Provision New Node</button>
            </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 relative ${active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        {label}
        {active && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-600 rounded-t-full shadow-glow"></div>}
    </button>
);

export default TalentMatch;
