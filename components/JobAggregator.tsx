
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  ExternalLink, 
  Globe, 
  DollarSign, 
  Loader2, 
  BrainCircuit, 
  Check, 
  X, 
  Send, 
  Users, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  Briefcase, 
  Filter, 
  ChevronDown,
  Clock,
  Layers,
  Settings2,
  Undo2
} from 'lucide-react';
import { ExternalJob, Candidate } from '../types';
import { useStore } from '../context/StoreContext';
import { JobScraperService } from '../services/externalServices';

interface AdvancedFilters {
  type: string[];
  workMode: string[];
  experience: string[];
  salaryMin: string;
  postedDate: string;
}

const JobAggregator: React.FC = () => {
  const { candidates, bulkShareJobs } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [activeJobDetail, setActiveJobDetail] = useState<ExternalJob | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<'all' | 'openToWork' | 'passive'>('all');

  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    experience: [],
    salaryMin: '',
    postedDate: 'All'
  });

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoadingJobs(true);
    try {
      const results = await JobScraperService.searchJobs(searchQuery, locationQuery);
      
      const filtered = results.filter(job => {
          // Job Type / Protocol Filter
          if (filters.type.length > 0 && !filters.type.includes(job.type)) return false;
          
          // Environment / Work Mode Filter
          if (filters.workMode.length > 0 && !filters.workMode.some(m => job.location.toLowerCase().includes(m.toLowerCase()) || (m === 'Remote' && job.location.toLowerCase() === 'remote'))) return false;

          // Salary Filter
          if (filters.salaryMin) {
              const minVal = parseInt(filters.salaryMin.replace('k', '')) * 1000;
              const jobSalary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) : 0;
              if (jobSalary < minVal) return false;
          }

          // Temporal Filter
          if (filters.postedDate !== 'All') {
              if (filters.postedDate === '24h' && !job.postedAt.includes('h')) return false;
              if (filters.postedDate === '7d' && job.postedAt.includes('m')) return false; // Simple logic for mock
          }

          return true;
      });

      setJobs(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const toggleFilter = (category: keyof AdvancedFilters, value: string) => {
    setFilters(prev => {
        if (category === 'postedDate') return { ...prev, postedDate: value };
        if (category === 'salaryMin') return { ...prev, salaryMin: value };

        const current = prev[category] as string[];
        const updated = current.includes(value) 
            ? current.filter(v => v !== value)
            : [...current, value];
        return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
        type: [],
        workMode: [],
        experience: [],
        salaryMin: '',
        postedDate: 'All'
    });
    setSearchQuery('');
    setLocationQuery('');
    handleSearch();
  };

  const matchedCandidates = useMemo(() => {
    if (!activeJobDetail) return [];
    
    return candidates
      .filter(c => {
        if (candidateStatusFilter === 'all') return true;
        if (candidateStatusFilter === 'openToWork') return c.isOpenToWork;
        if (candidateStatusFilter === 'passive') return !c.isOpenToWork;
        return true;
      })
      .map(c => {
        const titleMatch = activeJobDetail.title.toLowerCase().split(' ').some(word => 
          word.length > 3 && c.role.toLowerCase().includes(word)
        );
        const score = titleMatch ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 25);
        return { ...c, currentMatchScore: score };
      })
      .sort((a, b) => b.currentMatchScore - a.currentMatchScore);
  }, [activeJobDetail, candidates, candidateStatusFilter]);

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

  const hasActiveFilters = filters.type.length > 0 || filters.workMode.length > 0 || filters.experience.length > 0 || filters.salaryMin !== '' || filters.postedDate !== 'All';

  return (
    <div className="h-full flex flex-col space-y-6 relative pb-12 font-sans">
      {/* Search & Advanced Filters Container */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Explorer</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Live Global Job Feed Synchronization</p>
          </div>
          
          <div className="flex items-center gap-3">
             {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Undo2 size={14} /> Reset Configuration
                </button>
             )}
             <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    showAdvanced ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
             >
                <Settings2 size={16} /> Advanced Filters
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-[2] relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Target role, mission keywords, or specific tech stacks..." 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 relative group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Global Region..." 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-3"
          >
            {isLoadingJobs ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Scan Markets
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Protocol</label>
                        <div className="flex flex-wrap gap-2">
                            {['Full-time', 'Contract', 'Freelance', 'Part-time'].map(t => (
                                <TagButton 
                                    key={t} 
                                    active={filters.type.includes(t)} 
                                    onClick={() => toggleFilter('type', t)} 
                                    label={t} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Environment</label>
                        <div className="flex flex-wrap gap-2">
                            {['Remote', 'Hybrid', 'On-site'].map(m => (
                                <TagButton 
                                    key={m} 
                                    active={filters.workMode.includes(m)} 
                                    onClick={() => toggleFilter('workMode', m)} 
                                    label={m} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seniority Tier</label>
                        <div className="flex flex-wrap gap-2">
                            {['Junior', 'Mid', 'Senior', 'Lead', 'Staff'].map(e => (
                                <TagButton 
                                    key={e} 
                                    active={filters.experience.includes(e)} 
                                    onClick={() => toggleFilter('experience', e)} 
                                    label={e} 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Compensation Min</label>
                        <select 
                            value={filters.salaryMin}
                            onChange={e => setFilters({...filters, salaryMin: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none shadow-inner"
                        >
                            <option value="">Any Salary</option>
                            <option value="100k">$100k+</option>
                            <option value="150k">$150k+</option>
                            <option value="200k">$200k+</option>
                            <option value="250k">$250k+</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Temporal Range</label>
                        <div className="flex flex-wrap gap-2">
                            {['24h', '7d', '30d', 'All'].map(p => (
                                <TagButton 
                                    key={p} 
                                    active={filters.postedDate === p} 
                                    onClick={() => toggleFilter('postedDate', p)} 
                                    label={p} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Active Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center mr-2">Active Protocols:</span>
            {filters.type.map(t => <FilterChip key={t} label={t} onRemove={() => toggleFilter('type', t)} />)}
            {filters.workMode.map(m => <FilterChip key={m} label={m} onRemove={() => toggleFilter('workMode', m)} />)}
            {filters.experience.map(e => <FilterChip key={e} label={e} onRemove={() => toggleFilter('experience', e)} />)}
            {filters.salaryMin && <FilterChip label={`Min ${filters.salaryMin}`} onRemove={() => setFilters({...filters, salaryMin: ''})} />}
            {filters.postedDate !== 'All' && <FilterChip label={filters.postedDate} onRemove={() => setFilters({...filters, postedDate: 'All'})} />}
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div 
              key={job.id} 
              onClick={() => { setActiveJobDetail(job); setSelectedCandidateIds([]); setCandidateStatusFilter('all'); }}
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
                    <InfoTag icon={<DollarSign size={12}/>} text={job.salary || '$140k+'} highlighted={filters.salaryMin !== ''} />
                    <InfoTag icon={<Globe size={12}/>} text={job.type} highlighted={filters.workMode.includes(job.type) || filters.type.includes(job.type)} />
                    <InfoTag icon={<Clock size={12}/>} text="Recently Synchronized" />
                  </div>
                </div>
                
                <div className="shrink-0 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-brand-50 text-brand-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-500/10">
                    Neural Match <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
             <Search size={56} className="text-slate-100 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No opportunities detected</h3>
             <p className="text-slate-500 font-medium mt-2">Adjust your neural parameters or clear filters to reset the scanner.</p>
             <button 
                onClick={clearFilters}
                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
             >
                Clear Node Constraints
             </button>
          </div>
        )}
      </div>

      {/* Command Drawer */}
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

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 py-1 bg-white border border-slate-200 rounded-lg">
                    Neural Ranker
                  </span>
                  <div className="h-px w-12 bg-slate-200" />
                </div>

                <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <FilterButton 
                    active={candidateStatusFilter === 'all'} 
                    onClick={() => setCandidateStatusFilter('all')} 
                    label="All" 
                  />
                  <FilterButton 
                    active={candidateStatusFilter === 'openToWork'} 
                    onClick={() => setCandidateStatusFilter('openToWork')} 
                    label="Open to Work" 
                    icon={<Star size={12} className={candidateStatusFilter === 'openToWork' ? 'fill-emerald-500 text-emerald-500' : ''} />}
                  />
                  <FilterButton 
                    active={candidateStatusFilter === 'passive'} 
                    onClick={() => setCandidateStatusFilter('passive')} 
                    label="Passive" 
                  />
                </div>
              </div>
            </div>

            {/* Candidate Matching List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <BrainCircuit size={16} className="text-brand-600" /> Candidate Synchronization
                </h4>
                <button 
                  onClick={() => setSelectedCandidateIds(matchedCandidates.map(c => c.id))}
                  className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-3 pb-12">
                {matchedCandidates.length > 0 ? (
                  matchedCandidates.map(candidate => {
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
                            <div className="flex items-center gap-2">
                                <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">{candidate.firstName} {candidate.lastName}</h5>
                                {candidate.isOpenToWork && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />}
                            </div>
                            <div className={`text-xs font-black tracking-tighter ${candidate.currentMatchScore >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>
                              {candidate.currentMatchScore}% Match
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{candidate.role}</p>
                          
                          <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-1000 ${candidate.currentMatchScore >= 90 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                              style={{ width: `${candidate.currentMatchScore}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                    <Users size={32} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching talent segments detected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selection Dock */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              {selectedCandidateIds.length > 0 ? (
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-black">
                      {selectedCandidateIds.length}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Recipients</span>
                      <span className="text-sm font-bold uppercase tracking-tight">Ready for Transmission</span>
                    </div>
                  </div>
                  <button 
                    disabled={isTransmitting}
                    onClick={handleBulkTransmit}
                    className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {isTransmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Synchronizing...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send Opportunity
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-[2rem] border border-slate-200 border-dashed text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select talent nodes to initiate transmission</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TagButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
            active 
            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
        }`}
    >
        {label}
    </button>
);

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
        {label}
        <button onClick={onRemove} className="hover:text-red-500 transition-colors">
            <X size={12} />
        </button>
    </span>
);

const InfoTag: React.FC<{ icon: any; text: string; highlighted?: boolean }> = ({ icon, text, highlighted }) => (
  <span className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
    highlighted 
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
    : 'bg-slate-50 border-slate-100 text-slate-500'
  }`}>
    {icon} {text}
  </span>
);

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
  >
      {icon}
      {label}
  </button>
);

export default JobAggregator;
