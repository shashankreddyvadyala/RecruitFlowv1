
import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Building, Briefcase, Command, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const UnifiedSearch: React.FC = () => {
  const { candidates, jobs, crmClients } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCandidates = candidates.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    c.role.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(query.toLowerCase()) ||
    j.client.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredClients = crmClients.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const hasResults = filteredCandidates.length > 0 || filteredJobs.length > 0 || filteredClients.length > 0;

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search candidates, clients, or jobs..."
          className="w-full pl-10 pr-12 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
          <Command size={10} /> K
        </div>
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          {hasResults ? (
            <div className="max-h-[70vh] overflow-y-auto">
              {filteredCandidates.length > 0 && (
                <div className="p-2">
                  <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidates</h4>
                  {filteredCandidates.map(c => (
                    <button key={c.id} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                        <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{c.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredJobs.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Jobs</h4>
                  {filteredJobs.map(j => (
                    <button key={j.id} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Briefcase size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{j.title}</p>
                        <p className="text-xs text-slate-500 truncate">{j.client}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredClients.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients</h4>
                  {filteredClients.map(cl => (
                    <button key={cl.id} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                      <div className="w-8 h-8 rounded-lg border border-slate-100 p-1">
                        <img src={cl.logoUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{cl.name}</p>
                        <p className="text-xs text-slate-500 truncate">{cl.industry}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
