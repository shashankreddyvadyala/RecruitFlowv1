import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, Filter, ExternalLink, Globe, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { ExternalJob } from '../types';
import { useStore } from '../context/StoreContext';
import { JobScraperService } from '../services/externalServices';

const JobAggregator: React.FC = () => {
  const { sourceCandidatesForJob } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  
  // Local state for results, initialized empty or fetching
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  const [sourcingIds, setSourcingIds] = useState<Set<string>>(new Set());

  // Initial Load
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

  // Simulate autonomous sourcing
  const handleSource = async (id: string) => {
    // Optimistic UI update
    setSourcingIds(prev => new Set(prev).add(id));
    
    // Trigger Global Action
    await sourceCandidatesForJob(id);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header & Search Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Job Board Aggregator</h2>
          <p className="text-slate-500 mt-1">Search 50+ job boards instantly and deploy AI agents to source candidates.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Job title, keywords, or company" 
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="City, state, zip code, or 'Remote'" 
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 placeholder:text-slate-400"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
          >
            {isLoadingJobs ? 'Searching...' : 'Find Jobs'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap">
            <Filter size={14} /> All Filters
          </button>
          <button className="px-3 py-1.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap">
            Posted Past 24h
          </button>
          <button className="px-3 py-1.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap">
            Remote Only
          </button>
          <button className="px-3 py-1.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap">
            Salary $150k+
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center px-1">
        <p className="text-slate-500 font-medium">
          Found {jobs.length} active listings
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Powered by BrightData & Firecrawl</span>
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              
              {/* Logo / Icon */}
              <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {job.logoUrl ? (
                   <img src={job.logoUrl} alt={job.company} className="w-full h-full object-contain" />
                ) : (
                   <span className="text-xl font-bold text-slate-400">{job.company[0]}</span>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                     {job.postedAt} • via {job.source}
                  </span>
                </div>
                
                <p className="text-slate-600 font-medium mb-3">{job.company}</p>

                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <MapPin size={14} className="text-slate-400" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <DollarSign size={14} className="text-slate-400" /> {job.salary}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    <Globe size={14} className="text-slate-400" /> {job.type}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                {!sourcingIds.has(job.id) ? (
                  <button 
                    onClick={() => handleSource(job.id)}
                    className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20 whitespace-nowrap"
                  >
                    <Sparkles size={16} /> AI Source Candidates
                  </button>
                ) : (
                  <button 
                    disabled
                    className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-semibold whitespace-nowrap cursor-default"
                  >
                    <CheckCircle size={16} /> Sourcing Active...
                  </button>
                )}
                
                <a href={job.url} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  View Original <ExternalLink size={14} />
                </a>
              </div>
            </div>
            
            {/* Sourcing Stats Simulation */}
            {sourcingIds.has(job.id) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-xs text-slate-500 font-medium">
                    AI Recruiter active: <span className="text-slate-900">3 candidates sourced</span>... analyzing profiles...
                 </p>
              </div>
            )}
          </div>
        ))}

        {!isLoadingJobs && jobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                <p className="text-slate-400">No jobs found matching your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default JobAggregator;