
import React, { useState, useMemo } from 'react';
import { X, Search, Briefcase, MapPin, CheckCircle2, Send, Loader2, Sparkles, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Candidate, ExternalJob } from '../types';

interface BulkShareModalProps {
  selectedCandidates: Candidate[];
  onClose: () => void;
}

const BulkShareModal: React.FC<BulkShareModalProps> = ({ selectedCandidates, onClose }) => {
  const { externalJobs, bulkShareJobs, notify } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const filteredJobs = useMemo(() => {
    return externalJobs.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [externalJobs, searchQuery]);

  const toggleJob = (id: string) => {
    setSelectedJobIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTransmit = async () => {
    setIsTransmitting(true);
    const jobsToShare = externalJobs.filter(j => selectedJobIds.includes(j.id));
    const candIds = selectedCandidates.map(c => c.id);
    
    // Simulate high-fidelity processing
    await new Promise(r => setTimeout(r, 2000));
    
    await bulkShareJobs(candIds, jobsToShare);
    setIsTransmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Send size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Opportunity Transmission</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Targeting {selectedCandidates.length} Node(s)</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                <X size={20} />
            </button>
        </div>

        {step === 'select' ? (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 border-b border-slate-100">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Filter opportunities by title, tech stack, or client..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <div 
                                key={job.id}
                                onClick={() => toggleJob(job.id)}
                                className={`p-5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                                    selectedJobIds.includes(job.id)
                                    ? 'bg-brand-50 border-brand-500 shadow-md ring-4 ring-brand-500/5'
                                    : 'bg-white border-slate-100 hover:border-brand-200'
                                }`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-colors ${
                                        selectedJobIds.includes(job.id) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'
                                    }`}>
                                        {job.company[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none mb-1.5">{job.title}</h4>
                                        <div className="flex gap-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Briefcase size={12} className="text-brand-600" /> {job.company}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <MapPin size={12} className="text-brand-600" /> {job.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedJobIds.includes(job.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200'
                                }`}>
                                    {selectedJobIds.includes(job.id) && <CheckCircle2 size={14} />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <Search size={40} className="text-slate-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching nodes found</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Payload</span>
                        <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">{selectedJobIds.length} Opportunities</span>
                    </div>
                    <button 
                        disabled={selectedJobIds.length === 0}
                        onClick={() => setStep('confirm')}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-600 transition-all disabled:opacity-30 flex items-center gap-3"
                    >
                        Review Protocol <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-8 duration-500">
                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                    <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <User size={16} className="text-brand-600" /> Recipient Manifest
                        </h4>
                        <div className="flex flex-wrap gap-4">
                            {selectedCandidates.map(c => (
                                <div key={c.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 pr-4 rounded-2xl p-1.5 shadow-sm">
                                    <img src={c.avatarUrl} className="w-8 h-8 rounded-xl object-cover" />
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.firstName} {c.lastName}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-500" /> Security & Transmission Details
                        </h4>
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[60px] opacity-10"></div>
                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Method</p>
                                    <p className="text-sm font-black uppercase tracking-tight">Direct Neural Sync</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Encrypted</p>
                                    <p className="text-sm font-black uppercase tracking-tight text-emerald-400">AES-256 Validated</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Notifications</p>
                                    <p className="text-sm font-black uppercase tracking-tight">Email + Portal Ping</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Batch ID</p>
                                    <p className="text-sm font-black uppercase tracking-tight">TX-{Date.now().toString().slice(-6)}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 flex gap-4">
                        <Sparkles className="text-brand-600 shrink-0" size={24} />
                        <p className="text-[11px] font-bold text-brand-700 leading-relaxed uppercase tracking-wide">
                            Transmission will sync selected opportunities directly to candidate portals and trigger personalized outreach sequences for each pair.
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
                    <button 
                        onClick={() => setStep('select')}
                        className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        Adjust Selection
                    </button>
                    <button 
                        disabled={isTransmitting}
                        onClick={handleTransmit}
                        className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-3"
                    >
                        {isTransmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Synchronizing Neural Nodes...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Confirm & Initiate Transmission
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default BulkShareModal;
