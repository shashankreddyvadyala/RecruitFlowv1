
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, Filter, ExternalLink, Globe, DollarSign, Clock, CheckCircle, Loader2, BrainCircuit, Activity, Zap, Star } from 'lucide-react';
import { ExternalJob } from '../types';
import { useStore } from '../context/StoreContext';
import { JobScraperService } from '../services/externalServices';

const JobAggregator: React.FC = () => {
  const { sourceCandidatesForJob } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  const [activeSourcingId, setActiveSourcingId] = useState<string | null>(null);
  const [sourcingPhase, setSourcingPhase] = useState<string>('Ready');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
      handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoadingJobs(true);
    try {
        const results = await JobScraperService.searchJobs(searchQuery, locationQuery);
        setJobs(results);
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoadingJobs(false);
    }
  }

  const handleSource = async (id: string) => {
    setActiveSourcingId(id);
    setProgress(10);
    
    await sourceCandidatesForJob(id, (phase) => {
        setSourcingPhase(phase);
        setProgress(prev => Math.min(prev + 30, 95));
    });

    setProgress(100);
    setTimeout(() => {
        setActiveSourcingId(null);
        setSourcingPhase('Ready');
        setProgress(0);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Job Board Aggregator</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Global Mission Acquisition Engine</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Title or keywords..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Location..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            {isLoadingJobs ? <Loader2 className="animate-spin" /> : 'Scan Missions'}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {jobs.map((job) => {
          const isSourcing = activeSourcingId === job.id;
          return (
            <div key={job.id} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all group relative overflow-hidden ${isSourcing ? 'border-brand-500 ring-4 ring-brand-50' : 'border-slate-200 hover:shadow-2xl'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 shrink-0 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                  {job.company[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{job.title}</h3>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{job.postedAt} • {job.source}</span>
                  </div>
                  <p className="text-brand-600 font-black text-[11px] uppercase tracking-widest mb-4">{job.company}</p>

                  <div className="flex flex-wrap gap-3">
                    <InfoTag icon={<MapPin size={12}/>} text={job.location} />
                    <InfoTag icon={<DollarSign size={12}/>} text={job.salary || '$140k+'} />
                    <InfoTag icon={<Globe size={12}/>} text={job.type} />
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
                  {!isSourcing ? (
                    <button 
                      onClick={() => handleSource(job.id)}
                      className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all active:scale-95"
                    >
                      <Sparkles size={14} /> AI Resonance Sourcing
                    </button>
                  ) : (
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-xl min-w-[240px] shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 flex items-center gap-2">
                                <BrainCircuit size={14} className="animate-pulse" /> Neural Scan
                            </span>
                            <span className="text-[10px] font-black text-slate-500">{progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-brand-500 shadow-glow transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                           Phase: <span className="text-white">{sourcingPhase}</span>
                        </p>
                    </div>
                  )}
                  <a href={job.url} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    View Context <ExternalLink size={12} className="inline ml-1" />
                  </a>
                </div>
              </div>

              {isSourcing && (
                <div className="absolute inset-0 bg-brand-600/5 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-500/50 animate-[scan_2s_linear_infinite]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
      `}</style>
    </div>
  );
};

const InfoTag = ({ icon, text }: { icon: any, text: string }) => (
    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {icon} {text}
    </span>
);

export default JobAggregator;
