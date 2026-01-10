
import React, { useState } from 'react';
import { Candidate } from '../types';
import { generateOutreachEmail, analyzeCandidate } from '../services/geminiService';
import { Mail, Sparkles, FileText, X, Check, Search, Trash2, Phone, UserPlus, Link, Copy, Layers, History } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BulkApplyModal from './BulkApplyModal';
import ActivityTimeline from './ActivityTimeline';

const CandidateView: React.FC = () => {
  const { candidates, activities, branding, addCandidate, removeCandidate } = useStore();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'timeline'>('info');
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [showBulkApply, setShowBulkApply] = useState(false);
  const [bulkCandidate, setBulkCandidate] = useState<Candidate | null>(null);

  // Modal State for adding new candidate
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    skills: ''
  });

  const handleCopyPortalLink = () => {
    if (!selectedCandidate?.portalToken) return;
    const url = `${window.location.origin}/portal/${selectedCandidate.portalToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAnalyze = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidate(candidate);
    setActiveSubTab('info');
    try {
      const mockResume = `Experienced software engineer with 5 years in ${candidate.skills.join(', ')}. Led teams of 5. Built scalable systems.`;
      const result = await analyzeCandidate(mockResume, "Senior React Engineer capable of leading architectural decisions.");
      setGeneratedContent({ type: 'analysis', data: result });
    } catch (err) {
      console.error(err);
      alert("AI Error: Ensure API Key is set.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEmail = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAI(true);
    setSelectedCandidate(candidate);
    setActiveSubTab('info');
    try {
      const result = await generateOutreachEmail(candidate, branding.companyName, "Alex (Recruiter)");
      setGeneratedContent({ type: 'email', data: result });
    } catch (err) {
      console.error(err);
      alert("AI Error: Ensure API Key is set.");
    } finally {
      setLoadingAI(false);
    }
  };
  
  const handleBulkApply = (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      setBulkCandidate(candidate);
      setShowBulkApply(true);
  };

  const handleDeleteCandidate = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${name} from your agency database?`)) {
      removeCandidate(id);
      if (selectedCandidate?.id === id) {
        closeModal();
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: Candidate = {
      id: `c_${Date.now()}`,
      firstName: newCandidate.firstName,
      lastName: newCandidate.lastName,
      email: newCandidate.email,
      role: newCandidate.role,
      status: 'Active',
      stageId: 's1',
      matchScore: 0,
      skills: newCandidate.skills.split(',').map(s => s.trim()).filter(s => s),
      lastActivity: 'Manually added',
      avatarUrl: `https://picsum.photos/100/100?u=${newCandidate.firstName}`,
      portalToken: `t_${Date.now()}_${newCandidate.firstName.toLowerCase()}`
    };
    addCandidate(candidate);
    setNewCandidate({ firstName: '', lastName: '', email: '', role: '', skills: '' });
    setShowAddModal(false);
  };

  const closeModal = () => {
    setSelectedCandidate(null);
    setGeneratedContent(null);
    setActiveSubTab('info');
  };

  const candidateActivities = selectedCandidate ? activities.filter(a => a.entityId === selectedCandidate.id) : [];

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-brand-600" size={20} />
          <input 
            type="text" 
            placeholder="Filter candidates..." 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2"
          >
            <UserPlus size={18} /> Add Candidate
          </button>
          <button className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center gap-2 shadow-lg shadow-brand-600/20">
            <Sparkles size={18} /> Auto-Source
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Candidate</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Target Role</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Match Score</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={c.avatarUrl} alt="" className="w-10 h-10 rounded-xl shadow-sm border border-white" />
                    <div>
                      <p className="font-bold text-slate-900">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm font-medium">{c.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    c.stageId === 's1' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                    c.stageId === 's2' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {c.stageId === 's1' ? 'Sourcing' : c.stageId === 's2' ? 'Outreach' : c.stageId === 's3' ? 'Screening' : 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${c.matchScore > 80 ? 'bg-emerald-500' : c.matchScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{width: `${c.matchScore}%`}}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{c.matchScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={(e) => handleBulkApply(c, e)} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800" title="Bulk Submit"><Layers size={14} /></button>
                    <button onClick={(e) => handleEmail(c, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:text-brand-600" title="Draft Email"><Mail size={14} /></button>
                    <button onClick={(e) => handleAnalyze(c, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-purple-500 hover:text-purple-600" title="AI Report"><FileText size={14} /></button>
                    <button onClick={(e) => handleDeleteCandidate(c.id, `${c.firstName} ${c.lastName}`, e)} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-red-500 hover:text-red-600" title="Remove"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {candidates.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <Search className="text-slate-300" size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-900">No candidates found</h4>
            <p className="text-slate-500 mt-1">Start by adding your first candidate manually or via auto-sourcing.</p>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Manual Add</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Talent Entry</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                  <input required value={newCandidate.firstName} onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="Alex" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Last Name</label>
                  <input required value={newCandidate.lastName} onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="Morgan" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input required type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="alex.morgan@example.com" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Role</label>
                <input required value={newCandidate.role} onChange={e => setNewCandidate({...newCandidate, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="Staff Software Engineer" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Skills (Comma separated)</label>
                <input value={newCandidate.skills} onChange={e => setNewCandidate({...newCandidate, skills: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" placeholder="React, Node.js, AI, etc." />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all mt-4">
                Confirm & Create Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkApply && bulkCandidate && (
          <BulkApplyModal candidate={bulkCandidate} onClose={() => { setShowBulkApply(false); setBulkCandidate(null); }} />
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <img src={selectedCandidate.avatarUrl} className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCandidate.firstName} {selectedCandidate.lastName}</h2>
                    <p className="text-slate-500 font-medium">{selectedCandidate.role}</p>
                    <div className="flex gap-2 mt-3">
                      {selectedCandidate.skills.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-md shadow-sm">
                              {s}
                          </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => handleDeleteCandidate(selectedCandidate.id, `${selectedCandidate.firstName} ${selectedCandidate.lastName}`, e)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors" title="Delete Candidate">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                 <button onClick={() => setActiveSubTab('info')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                   <FileText size={14} /> Information
                 </button>
                 <button onClick={() => setActiveSubTab('timeline')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                   <History size={14} /> Activity Timeline
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeSubTab === 'timeline' ? (
                <ActivityTimeline activities={candidateActivities} />
              ) : (
                loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold mt-4 animate-pulse">Gemini 3 Pro is thinking...</p>
                  </div>
                ) : generatedContent ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {generatedContent.type === 'email' && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 overflow-hidden">
                                {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain" alt="L" /> : branding.companyName[0]}
                              </div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{branding.companyName} Outreach</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Draft</span>
                          </div>
                          <div className="p-6">
                            <p className="text-sm font-bold text-slate-900 mb-4 pb-4 border-b border-slate-50">Subject: {generatedContent.data.subject}</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">{generatedContent.data.body}</p>
                            
                            <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-400">AM</div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Alex Morgan</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{branding.tagline}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all">
                          Finalize & Send via Omnichannel
                        </button>
                      </div>
                    )}
                    {generatedContent.type === 'analysis' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Match Score</p>
                              <p className="text-4xl font-bold text-slate-900">{generatedContent.data.score}%</p>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Top Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {generatedContent.data.skills.map((s: string) => <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">{s}</span>)}
                              </div>
                           </div>
                        </div>
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                           <h4 className="font-bold text-blue-900 text-sm mb-2">Executive Summary</h4>
                           <p className="text-blue-800 text-sm leading-relaxed">{generatedContent.data.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Portal Section */}
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                       <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                         <Link size={18} /> Candidate Self-Service
                       </h3>
                       <p className="text-sm text-emerald-700 mb-6">
                         Generate a secure link for <b>{selectedCandidate.firstName}</b> to update their profile, skills, and availability.
                       </p>
                       <div className="flex items-center gap-2">
                         <div className="flex-1 px-4 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 truncate">
                            {window.location.origin}/portal/{selectedCandidate.portalToken || 'pending_gen'}
                         </div>
                         <button 
                          onClick={handleCopyPortalLink}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${copiedLink ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                         >
                           {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                           {copiedLink ? 'Copied' : 'Copy'}
                         </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={(e) => handleAnalyze(selectedCandidate, e)} className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                         <Sparkles size={24} />
                         <span className="font-bold text-sm">Run AI Analysis</span>
                       </button>
                       <button onClick={(e) => handleEmail(selectedCandidate, e)} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm">
                         <Mail size={24} />
                         <span className="font-bold text-sm">Personalized Email</span>
                       </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateView;
