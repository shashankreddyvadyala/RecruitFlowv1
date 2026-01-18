
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
  Undo2,
  UserSearch,
  ShieldAlert,
  FileText,
  Info,
  Zap,
  Target,
  ClipboardList,
  History,
  CalendarDays,
  MessageSquareQuote,
  Activity as ActivityIcon
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
  visaSponsorship: string;
}

const JobAggregator: React.FC = () => {
  const { candidates, bulkShareJobs, notify } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [activeJobDetail, setActiveJobDetail] = useState<ExternalJob | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'matches' | 'applied'>('details');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<'all' | 'openToWork' | 'passive'>('all');
  const [candidateSearchInDrawer, setCandidateSearchInDrawer] = useState('');

  const [filters, setFilters] = useState<AdvancedFilters>({
    type: [],
    workMode: [],
    experience: [],
    salaryMin: '',
    postedDate: 'All',
    visaSponsorship: 'All'
  });

  useEffect(() => {
    handleSearch();
  }, [filters]);

  const handleSearch = async () => {
    setIsLoadingJobs(true);
    try {
      const results = await JobScraperService.searchJobs(searchQuery, locationQuery);
      
      const filtered = results.filter(job => {
          if (filters.type.length > 0 && !filters.type.includes(job.type)) return false;
          if (filters.workMode.length > 0 && !filters.workMode.some(m => job.location.toLowerCase().includes(m.toLowerCase()) || (m === 'Remote' && job.location.toLowerCase() === 'remote'))) return false;
          if (filters.salaryMin) {
              const minVal = parseInt(filters.salaryMin.replace('k', '')) * 1000;
              const jobSalary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) : 0;
              if (jobSalary < minVal) return false;
          }
          if (filters.postedDate !== 'All') {
              if (filters.postedDate === '24h' && !job.postedAt.includes('h')) return false;
              if (filters.postedDate === '7d' && job.postedAt.includes('m')) return false; 
          }
          if (filters.visaSponsorship !== 'All') {
              const offers = filters.visaSponsorship === 'Offers';
              if (job.visaSponsorship !== offers) return false;
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
        if (category === 'visaSponsorship') return { ...prev, visaSponsorship: value };

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
        postedDate: 'All',
        visaSponsorship: 'All'
    });
    setSearchQuery('');
    setLocationQuery('');
  };

  const matchedCandidates = useMemo(() => {
    if (!activeJobDetail) return [];
    
    return candidates
      .filter(c => {
        if (candidateStatusFilter === 'openToWork' && !c.isOpenToWork) return false;
        if (candidateStatusFilter === 'passive' && c.isOpenToWork) return false;
        if (candidateSearchInDrawer) {
            const search = candidateSearchInDrawer.toLowerCase();
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            const role = c.role.toLowerCase();
            if (!fullName.includes(search) && !role.includes(search)) return false;
        }
        return true;
      })
      .map(c => {
        const titleMatch = activeJobDetail.title.toLowerCase().split(' ').some(word => 
          word.length > 3 && c.role.toLowerCase().includes(word)
        );
        const score = titleMatch ? 85 + Math.floor(Math.random() * 10) : 60 + Math.floor(Math.random() * 20);
        return { ...c, currentMatchScore: score };
      })
      .sort((a, b) => b.currentMatchScore - a.currentMatchScore);
  }, [activeJobDetail, candidates, candidateStatusFilter, candidateSearchInDrawer]);

  const appliedCandidates = useMemo(() => {
    if (!activeJobDetail) return [];
    return candidates.filter(c => {
        const hasApplied = c.applicationHistory?.some(app => 
            app.jobTitle.toLowerCase().includes(activeJobDetail.title.toLowerCase()) || 
            app.company.toLowerCase().includes(activeJobDetail.company.toLowerCase())
        );

        if (!hasApplied) return false;

        if (candidateSearchInDrawer) {
            const search = candidateSearchInDrawer.toLowerCase();
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            if (!fullName.includes(search)) return false;
        }
        return true;
    }).map(c => {
        const application = c.applicationHistory?.find(app => 
            app.jobTitle.toLowerCase().includes(activeJobDetail.title.toLowerCase()) || 
            app.company.toLowerCase().includes(activeJobDetail.company.toLowerCase())
        );
        return { 
            ...c, 
            appStatus: application?.status || 'Active', 
            appliedDate: application?.appliedDate || 'N/A',
            latestNote: application?.notes || 'No recent activity logs detected for this candidate node.'
        };
    });
  }, [activeJobDetail, candidates, candidateSearchInDrawer]);

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkTransmit = async () => {
    if (!activeJobDetail) return;
    setIsTransmitting(true);
    await bulkShareJobs(selectedCandidateIds, [activeJobDetail]);
    setIsTransmitting(false);
    setSelectedCandidateIds([]);
    setActiveJobDetail(null);
  };

  const hasActiveFilters = filters.type.length > 0 || filters.workMode.length > 0 || filters.experience.length > 0 || filters.salaryMin !== '' || filters.postedDate !== 'All' || filters.visaSponsorship !== 'All';

  // Helper to determine if the footer container should be rendered
  const shouldShowFooter = (drawerTab === 'details') || (drawerTab === 'matches' && selectedCandidateIds.length > 0);

  return (
    <div className="h-full flex flex-col space-y-6 relative pb-12 font-sans">
      {/* HEADER & MAIN SEARCH */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Market Explorer</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Live Global Job Feed Synchronization</p>
          </div>
          
          <div className="flex items-center gap-3">
             {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">
                  <Undo2 size={14} /> Reset Configuration
                </button>
             )}
             <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvanced ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Settings2 size={16} /> Advanced Filters
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-[2] relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input type="text" placeholder="Target role, mission keywords, or specific tech stacks..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex-1 relative group">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input type="text" placeholder="Global Region..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-brand-500 outline-none font-bold text-sm shadow-inner transition-all" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} />
          </div>
          <button onClick={handleSearch} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
            {isLoadingJobs ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Search
          </button>
        </div>

        {showAdvanced && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Work Protocol</label>
                        <div className="flex flex-wrap gap-2">
                            {['Full-time', 'Contract', 'Freelance'].map(t => (
                                <TagButton key={t} active={filters.type.includes(t)} onClick={() => toggleFilter('type', t)} label={t} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Environment</label>
                        <div className="flex flex-wrap gap-2">
                            {['Remote', 'Hybrid', 'On-site'].map(m => (
                                <TagButton key={m} active={filters.workMode.includes(m)} onClick={() => toggleFilter('workMode', m)} label={m} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Visa Protocol</label>
                        <div className="flex flex-wrap gap-2">
                            {[{ label: 'Offers Sponsorship', value: 'Offers' }, { label: 'All', value: 'All' }].map(v => (
                                <TagButton key={v.value} active={filters.visaSponsorship === v.value} onClick={() => toggleFilter('visaSponsorship', v.value)} label={v.label} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* JOBS GRID */}
      <div className="grid gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} onClick={() => { setActiveJobDetail(job); setDrawerTab('details'); setSelectedCandidateIds([]); setCandidateStatusFilter('all'); }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 transition-all group hover:shadow-2xl hover:border-brand-500 cursor-pointer relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                  {job.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors">{job.title}</h3>
                        {job.visaSponsorship && (
                            <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                <ShieldCheck size={10} /> Sponsorship Node
                            </span>
                        )}
                    </div>
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
                  <div className="bg-brand-50 text-brand-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-500/10">
                    Click for Details <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
             <Search size={56} className="text-slate-100 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No opportunities detected</h3>
          </div>
        )}
      </div>

      {/* INTELLIGENCE DRAWER */}
      {activeJobDetail && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setActiveJobDetail(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* DRAWER HEADER */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">
                    {activeJobDetail.company[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeJobDetail.title}</h3>
                        {activeJobDetail.visaSponsorship && <ShieldCheck className="text-emerald-500" size={18} />}
                    </div>
                    <p className="text-brand-600 font-black text-[10px] uppercase tracking-widest mt-2">{activeJobDetail.company} • {activeJobDetail.location}</p>
                  </div>
                </div>
                <button onClick={() => setActiveJobDetail(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              {/* TAB SWITCHER */}
              <div className="flex gap-8 border-b border-slate-200 overflow-x-auto no-scrollbar">
                  <button onClick={() => setDrawerTab('details')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${drawerTab === 'details' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Protocol Node
                  </button>
                  <button onClick={() => setDrawerTab('matches')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${drawerTab === 'matches' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Neural Alignment
                  </button>
                  <button onClick={() => setDrawerTab('applied')} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${drawerTab === 'applied' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                      Applied Talent
                  </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
              {drawerTab === 'details' ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-6">
                        <InfoBox label="Work Protocol" value={activeJobDetail.type} icon={<Globe size={14}/>} />
                        <InfoBox label="Compensation" value={activeJobDetail.salary || 'Market Rate'} icon={<DollarSign size={14}/>} />
                        <InfoBox label="Visa Policy" value={activeJobDetail.visaSponsorship ? 'Sponsorship Authorized' : 'Native Candidates Only'} icon={<ShieldCheck size={14}/>} />
                        <InfoBox label="Source Node" value={activeJobDetail.source} icon={<Zap size={14}/>} />
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                            <FileText size={18} className="text-brand-600" /> Synchronization Brief
                        </h4>
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm text-slate-600 leading-relaxed italic shadow-inner">
                            <p className="mb-4">Live feed detected for a {activeJobDetail.title} mission at {activeJobDetail.company}. The role focus appears to be centered on high-scale delivery and node optimization within their {activeJobDetail.location} cluster.</p>
                            <p>Key alignment nodes: Advanced technical literacy, verified experience in modern protocols, and autonomous reasoning capabilities.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Target size={18} className="text-brand-600" /> Target Requirements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['Technical Leadership', 'Infrastructure Architecture', 'Product Vision', 'System Design'].map(req => (
                                <span key={req} className="px-4 py-2 bg-white border border-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-sm">{req}</span>
                            ))}
                        </div>
                    </div>
                </div>
              ) : drawerTab === 'matches' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="sticky top-0 bg-white z-10 pb-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner">
                                <FilterButton active={candidateStatusFilter === 'all'} onClick={() => setCandidateStatusFilter('all')} label="All" />
                                <FilterButton active={candidateStatusFilter === 'openToWork'} onClick={() => setCandidateStatusFilter('openToWork')} label="Seekers" icon={<Star size={12} className={candidateStatusFilter === 'openToWork' ? 'fill-emerald-500 text-emerald-500' : ''} />} />
                                <FilterButton active={candidateStatusFilter === 'passive'} onClick={() => setCandidateStatusFilter('passive')} label="Passive" />
                            </div>
                            <div className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{matchedCandidates.length} Node(s) Found</div>
                        </div>

                        <div className="relative group">
                            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search candidates by name or skill node..." 
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-[11px] shadow-inner transition-all"
                                value={candidateSearchInDrawer}
                                onChange={(e) => setCandidateSearchInDrawer(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pb-12">
                        {matchedCandidates.length > 0 ? (
                        matchedCandidates.map(candidate => {
                            const isSelected = selectedCandidateIds.includes(candidate.id);
                            return (
                            <div key={candidate.id} onClick={() => handleToggleCandidate(candidate.id)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-5 group/item ${isSelected ? 'bg-brand-50 border-brand-500 shadow-lg' : 'bg-white border-slate-100 hover:border-brand-200 shadow-sm'}`}>
                                <div className="relative">
                                    <img src={candidate.avatarUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white" />
                                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-glow' : 'bg-white border-slate-200'}`}>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">{candidate.firstName} {candidate.lastName}</h5>
                                            {candidate.isOpenToWork && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" title="Open to Work" />}
                                        </div>
                                        <div className={`text-xs font-black tracking-tighter ${candidate.currentMatchScore >= 90 ? 'text-emerald-500' : 'text-brand-500'}`}>{candidate.currentMatchScore}% Match</div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{candidate.role}</p>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${candidate.currentMatchScore >= 90 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${candidate.currentMatchScore}%` }} />
                                    </div>
                                </div>
                            </div>
                            );
                        })
                        ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                            <Users size={32} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching talent detected</p>
                        </div>
                        )}
                    </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                     {/* APPLIED TALENT SEARCH */}
                     <div className="sticky top-0 bg-white z-10 pb-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ClipboardList size={18} className="text-brand-600" /> Submission Tracking
                            </h4>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appliedCandidates.length} Active Application(s)</div>
                        </div>

                        <div className="relative group">
                            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by name..." 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-[11px] shadow-inner transition-all"
                                value={candidateSearchInDrawer}
                                onChange={(e) => setCandidateSearchInDrawer(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pb-12">
                        {appliedCandidates.length > 0 ? (
                            appliedCandidates.map(applicant => (
                                <div key={applicant.id} className="p-6 rounded-[2.5rem] border border-slate-100 bg-white hover:border-brand-200 transition-all shadow-sm hover:shadow-xl relative overflow-hidden group/applicant">
                                    <div className="flex gap-6 items-start mb-6">
                                        <div className="relative shrink-0">
                                            <img src={applicant.avatarUrl} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white" />
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                                                applicant.appStatus === 'Hired' ? 'bg-emerald-500 border-white text-white' : 'bg-slate-900 border-white text-white'
                                            }`}>
                                                <ActivityIcon size={12} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h5 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-2">{applicant.firstName} {applicant.lastName}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{applicant.role}</p>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest shadow-sm ${
                                                    applicant.appStatus === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    applicant.appStatus === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-brand-50 text-brand-600 border-brand-100'
                                                }`}>
                                                    {applicant.appStatus}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <CalendarDays size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Submitted: {applicant.appliedDate}</span>
                                                </div>
                                                <div className="h-3 w-px bg-slate-100"></div>
                                                <button className="text-[9px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline decoration-2">
                                                    Intelligence Link <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] relative">
                                        <div className="absolute top-4 left-4 text-brand-200">
                                            <MessageSquareQuote size={16} />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-7 italic">
                                            {applicant.latestNote}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                                <History size={32} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No target history detected</p>
                            </div>
                        )}
                    </div>
                </div>
              )}
            </div>

            {/* DOCK FOOTER - Only render if there is an actionable CTA */}
            {shouldShowFooter && (
                <div className="p-8 border-t border-slate-100 bg-white">
                    {drawerTab === 'matches' && selectedCandidateIds.length > 0 && (
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-black">{selectedCandidateIds.length}</div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipients</span>
                                    <span className="text-sm font-bold uppercase tracking-tight">Sync Ready</span>
                                </div>
                            </div>
                            <button disabled={isTransmitting} onClick={handleBulkTransmit} className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center gap-3 active:scale-95">
                                {isTransmitting ? <><Loader2 size={16} className="animate-spin" /> Transmitting...</> : <><Send size={16} /> Broadcast Sync</>}
                            </button>
                        </div>
                    )}

                    {drawerTab === 'details' && (
                        <a 
                            href={activeJobDetail.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            See Original Post <ExternalLink size={18} />
                        </a>
                    )}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TagButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${active ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
        {label}
    </button>
);

const InfoTag: React.FC<{ icon: any; text: string; highlighted?: boolean }> = ({ icon, text, highlighted }) => (
  <span className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${highlighted ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
    {icon} {text}
  </span>
);

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon}{label}
  </button>
);

const InfoBox = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 mb-2">
            {icon}
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</span>
        </div>
        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{value}</p>
    </div>
);

export default JobAggregator;
