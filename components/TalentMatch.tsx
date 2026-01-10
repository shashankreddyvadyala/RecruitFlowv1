
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Search, MapPin, Briefcase, Zap, Star, ExternalLink, Send, ArrowRight, Share2, Mail, Sparkles, ShieldCheck, FileCode, TrendingDown, Info, ChevronDown, ChevronUp, Loader2, DollarSign } from 'lucide-react';
import { ExternalJob, CandidateProfile, OptimizationInsight, Candidate } from '../types';
import { useStore } from '../context/StoreContext';
import { ResumeParserService } from '../services/externalServices';
import { getHiringOptimization } from '../services/geminiService';

const TalentMatch: React.FC = () => {
  const { talentProfiles, externalJobs, addTalentProfile, shareJobWithCandidate, candidates, notify, addActivity, updateCandidateProfile } = useStore();
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sharingJobId, setSharingJobId] = useState<string | null>(null);
  
  // Optimization State
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationInsight[]>([]);
  const [expandedOptimization, setExpandedOptimization] = useState<string | null>(null);

  const getMatchedJobs = (profile: CandidateProfile): ExternalJob[] => {
    if (!profile) return [];
    return externalJobs.filter(job => {
        const titleMatch = job.title.toLowerCase().includes(profile.title.split(' ')[1]?.toLowerCase() || 'engineer');
        return titleMatch || Math.random() > 0.6;
    });
  };

  const handleRunOptimization = async (job: ExternalJob) => {
    if (!selectedProfile) return;
    setOptimizationLoading(true);
    try {
        const targetCandidate = candidates.find(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(selectedProfile.name.toLowerCase())) || candidates[0];
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
    const targetCandidate = candidates.find(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(selectedProfile?.name || '')) || candidates[0];
    
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
        const dummyFile = new File(["content"], "james_resume.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        addTalentProfile(newProfile);
        setSelectedProfile(newProfile);
    } catch(e) {
        console.error("Upload failed", e);
    } finally {
        setIsProcessing(false);
    }
  };

  const matchedJobs = selectedProfile ? getMatchedJobs(selectedProfile) : [];

  return (
    <div className="flex h-full gap-6 font-sans">
      {/* Left: Talent Inventory */}
      <div className="w-1/3 flex flex-col gap-4">
        <div 
          onClick={handleUpload}
          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all group"
        >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:text-brand-600">
                {isProcessing ? <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full"/> : <UploadCloud size={24} />}
            </div>
            <h3 className="font-semibold text-slate-900">Provision Records</h3>
            <p className="text-xs text-slate-500 mt-1">Ingest Dossiers via OCR</p>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Talent Inventory ({talentProfiles.length})</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {talentProfiles.map(profile => (
                    <div 
                        key={profile.id}
                        onClick={() => { setSelectedProfile(profile); setOptimizations([]); }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                            selectedProfile?.id === profile.id 
                            ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' 
                            : 'bg-white border-slate-200 hover:border-brand-300'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-10 h-10 rounded-full object-cover shadow-sm border border-white" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm truncate uppercase tracking-tight">{profile.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{profile.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right: Matching & Optimization Engine */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedProfile ? (
            <>
                {/* Profile Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-10 -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex gap-4">
                            <img src={selectedProfile.avatarUrl} className="w-20 h-20 rounded-2xl shadow-xl border-4 border-white" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedProfile.name}</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 mt-1">
                                    <Briefcase size={16} className="text-brand-600"/> {selectedProfile.title}
                                </p>
                            </div>
                        </div>
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                           <CheckCircle size={14} /> Open to Work
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-6 relative z-10">
                        {selectedProfile.skills.map(s => (
                            <span key={s} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-lg shadow-sm">{s}</span>
                        ))}
                    </div>
                </div>

                {/* Match Feed */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Sparkles className="text-purple-500" size={20} />
                                Resonance Feed ({matchedJobs.length})
                            </h3>
                        </div>
                    </div>

                    <div className="overflow-y-auto space-y-4 pr-2 pb-10">
                        {matchedJobs.map((job, idx) => (
                            <div key={job.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-brand-500 transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                            {job.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg group-hover:text-brand-600 transition-colors leading-none mb-2">{job.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                                                {job.company} • <MapPin size={12}/> {job.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg tracking-tighter">
                                            <Star size={16} className="fill-emerald-500 text-emerald-500" />
                                            {98 - idx * 5}%
                                        </div>
                                        <button 
                                            onClick={() => handleRunOptimization(job)}
                                            className="mt-2 text-[9px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-brand-800"
                                        >
                                            <Zap size={12} fill="currentColor" /> Run Strategic Lab
                                        </button>
                                    </div>
                                </div>

                                {/* Optimization Intelligence Module */}
                                {optimizations.length > 0 && optimizations[0].title !== "" && (
                                    <div className="mb-6 bg-slate-900 rounded-2xl overflow-hidden border border-brand-500/30 animate-in zoom-in-95">
                                        <div className="p-4 bg-brand-600/10 flex items-center justify-between">
                                            <h5 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <ShieldCheck size={14} /> Optimization Protocol
                                            </h5>
                                            <span className="text-[9px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded shadow-glow">Active InSIGHT</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {optimizations.map((insight) => (
                                                <div key={insight.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group/opt transition-all hover:border-white/30">
                                                    <div 
                                                        onClick={() => setExpandedOptimization(expandedOptimization === insight.id ? null : insight.id)}
                                                        className="p-4 flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${
                                                                insight.category === 'Tax' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                insight.category === 'HTS' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                                {insight.category === 'Tax' ? <TrendingDown size={14} /> : 
                                                                 insight.category === 'HTS' ? <FileCode size={14} /> : 
                                                                 <Info size={14} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{insight.title}</p>
                                                                {insight.savingsPotential && (
                                                                    <p className="text-[9px] font-bold text-emerald-400 uppercase mt-1 tracking-widest flex items-center gap-1">
                                                                        <DollarSign size={8} /> Est. Savings: {insight.savingsPotential}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {expandedOptimization === insight.id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                    </div>
                                                    
                                                    {expandedOptimization === insight.id && (
                                                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-4">
                                                                {insight.description}
                                                                {insight.htsCode && <span className="block mt-2 font-black text-purple-400">Classification: {insight.htsCode}</span>}
                                                            </p>
                                                            <button 
                                                                onClick={() => applyOptimization(insight)}
                                                                className="w-full py-2.5 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {insight.actionLabel} <ArrowRight size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button className="px-5 py-2.5 bg-slate-900 text-white text-[10px] rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
                                            Transmit Dossier
                                        </button>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Source Artifact: {job.source}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border border-slate-200 border-dashed relative overflow-hidden group">
                <Search className="text-brand-500 mb-8" size={40} />
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Select Target Operative</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">Choose a dossier from the inventory to begin high-resonance matching and fiscal optimization.</p>
                <button onClick={handleUpload} className="px-10 py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-700 transition-all">Provision New Record</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TalentMatch;
