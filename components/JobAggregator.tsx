
import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Sparkles, ExternalLink, Globe, DollarSign, Loader2, BrainCircuit, Check, X, Send, Users, Star, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import { ExternalJob, Candidate } from '../types';
import { useStore } from '../context/StoreContext';
import { JobScraperService } from '../services/externalServices';

const JobAggregator: React.FC = () => {
  const { candidates, bulkShareJobs, externalJobs, sourceCandidatesForJob } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  const [activeJobDetail, setActiveJobDetail] = useState<ExternalJob | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoadingJobs(true);
    try {
      const results = await JobScraperService.searchJobs(searchQuery, locationQuery);
      setJobs(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const matchedCandidates = useMemo(() => {
    if (!activeJobDetail) return [];
    return candidates.map(c => {
      // Logic: Boost score if role keywords match
      const titleMatch = activeJobDetail.title.toLowerCase().split(' ').some(word => 
        word.length > 3 && c.role.toLowerCase().includes(word)
      );
      const score = titleMatch ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 25);
      return { ...c, currentMatchScore: score };
    }).sort((a, b) => b.currentMatchScore - a.currentMatchScore);
  }, [activeJobDetail, candidates]);

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkTransmit = async () => {
    if (!activeJobDetail) return;
    setIsTransmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    await bulkShareJobs(selectedCandidateIds, [activeJobDetail]);
    setIsTransmitting(false);
    setSelectedCandidateIds([]);
    setActiveJobDetail(null);
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative pb-12">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Explorer</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Live Global Mission Feed</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Job title or keywords..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Global region..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            {isLoadingJobs ? <Loader2 className="animate-spin" /> : 'Scan Missions'}
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-6">
        {jobs.map((job) => (
          <div 
            key={job.id} 
            onClick={() => { setActiveJobDetail(job); setSelectedCandidateIds([]); }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 transition-all group hover:shadow-2xl hover:border-brand-500 cursor-pointer relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                {job.company[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors">{job.title}</h3>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{job.postedAt} • {job.source}</span>
                </div>
                <p className="text-brand-600 font-black text-[11px] uppercase tracking-widest mb-4">{job.company}</p>

                <div className="flex flex-wrap gap-3">
                  <InfoTag icon={<MapPin size={12}/>} text={job.location} />
                  <InfoTag icon={<DollarSign size={12}/>} text={job.salary || '$140k+'} />
                  <InfoTag icon={<Globe size={12}/>} text={job.type} />
                </div>
              </div>
              
              <div className="shrink-0 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  Match Candidates <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mission Command Drawer */}
      {activeJobDetail && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
          <div 
            className="absolute inset-0" 
            onClick={() => setActiveJobDetail(null)} 
          />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">
                    {activeJobDetail.company[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeJobDetail.title}</h3>
                    <p className="text-brand-600 font-black text-[10px] uppercase tracking-widest mt-2">{activeJobDetail.company} • {activeJobDetail.location}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveJobDetail(null)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 py-1 bg-white border border-slate-200 rounded-lg">
                  Mission Target Node
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
            </div>

            {/* Candidate Matching List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <BrainCircuit size={16} className="text-brand-600" /> Neural Match Ranking
                </h4>
                <button 
                  onClick={() => setSelectedCandidateIds(matchedCandidates.map(c => c.id))}
                  className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-3">
                {matchedCandidates.map(candidate => {
                  const isSelected = selectedCandidateIds.includes(candidate.id);
                  return (
                    <div 
                      key={candidate.id}
                      onClick={() => handleToggleCandidate(candidate.id)}
                      className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-5 group/item ${
                        isSelected 
                        ? 'bg-brand-50 border-brand-500 shadow-lg' 
                        : 'bg-white border-slate-100 hover:border-brand-200'
                      }`}
                    >
                      <div className="relative">
                        <img src={candidate.avatarUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white" />
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-glow' : 'bg-white border-slate-200'
                        }`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">{candidate.firstName} {candidate.lastName}</h5>
                          <div className={`text-xs font-black tracking-tighter ${candidate.currentMatchScore >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>
                            {candidate.currentMatchScore}% Match
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{candidate.role}</p>
                        
                        <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${candidate.currentMatchScore >= 90 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                            style={{ width: `${candidate.currentMatchScore}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection Dock (Inside Drawer) */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              {selectedCandidateIds.length > 0 ? (
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-black">
                      {selectedCandidateIds.length}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Recipients</span>
                      <span className="text-sm font-bold uppercase tracking-tight">Transmission Ready</span>
                    </div>
                  </div>
                  <button 
                    disabled={isTransmitting}
                    onClick={handleBulkTransmit}
                    className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isTransmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Transmitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send Outreach
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-[2rem] border border-slate-200 border-dashed text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select candidates to initiate transmission</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoTag = ({ icon, text }: { icon: any, text: string }) => (
  <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
    {icon} {text}
  </span>
);

export default JobAggregator;
