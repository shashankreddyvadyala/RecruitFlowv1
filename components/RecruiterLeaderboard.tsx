
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, RecruiterStats } from '../types';
import { Trophy, Mail, Phone, UserPlus, Trash2, X, ShieldCheck, Sparkles } from 'lucide-react';

const TeamManagement: React.FC = () => {
  const { recruiterStats, userRole, addRecruiter, removeRecruiter } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = userRole === UserRole.Owner;
  const sortedRecruiters = [...recruiterStats].sort((a, b) => b.placements - a.placements);

  const handleAddRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      const newRecruiter: RecruiterStats = {
        id: `rec_${Date.now()}`,
        name: newName,
        avatarUrl: `https://picsum.photos/100/100?u=${encodeURIComponent(newName)}`,
        placements: 0,
        activityScore: 50,
        emailsSent: 0,
        callsLogged: 0,
        conversionRate: 0,
        activeJobs: 0
      };
      
      addRecruiter(newRecruiter);
      setNewName('');
      setNewEmail('');
      setIsSubmitting(false);
      setShowAddModal(false);
    }, 800);
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the agency?`)) {
      removeRecruiter(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck size={24} className="text-brand-600" />
              Agency Team Management
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Manage recruiters and track real-time performance
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select className="bg-white border border-slate-200 rounded-xl text-[10px] px-4 py-2.5 font-black text-slate-700 outline-none uppercase tracking-widest shadow-sm">
              <option>Performance: All Time</option>
              <option>Performance: This Month</option>
              <option>Performance: Last 7 Days</option>
            </select>
            
            {isOwner && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
              >
                <UserPlus size={16} /> Invite Recruiter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Score</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Output</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Success</th>
                {isOwner && <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecruiters.map((recruiter, idx) => (
                <tr key={recruiter.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-300 text-2xl tracking-tighter italic">
                    {idx === 0 ? <span className="text-yellow-500 text-3xl">#1</span> : `#${idx + 1}`}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={recruiter.avatarUrl} className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl bg-slate-100" alt="" />
                        {idx === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full border-2 border-white shadow-lg"><Trophy size={10} /></div>}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{recruiter.name}</p>
                        <div className="flex gap-4 mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Mail size={12} className="text-slate-300" /> {recruiter.emailsSent}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Phone size={12} className="text-slate-300" /> {recruiter.callsLogged}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col items-center gap-2">
                       <span className="text-xs font-black text-slate-900 tracking-tighter">{recruiter.activityScore}/100</span>
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                         <div 
                          className={`h-full transition-all duration-1000 ${recruiter.activityScore > 80 ? 'bg-emerald-500' : recruiter.activityScore > 50 ? 'bg-brand-500' : 'bg-orange-500'}`} 
                          style={{ width: `${recruiter.activityScore}%` }} 
                         />
                       </div>
                     </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-xl font-black text-slate-900 tracking-tighter">{recruiter.placements}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed Hires</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black border border-brand-100 uppercase tracking-widest shadow-sm">
                      {recruiter.conversionRate}% Yield
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleRemove(recruiter.id, recruiter.name)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                        title="Remove Recruiter"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedRecruiters.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <ShieldCheck className="text-slate-300" size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-900">No recruiters on team</h4>
            <p className="text-slate-500 mt-1">Start by inviting your first recruiter to the agency.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Add Recruiter</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Agency Member</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleAddRecruiter} className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                   <input 
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                    placeholder="e.g. Jordan Smith"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Professional Email</label>
                   <input 
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                    placeholder="jordan@agency.ai"
                   />
                </div>
                
                <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex gap-3">
                    <Sparkles className="text-brand-600 shrink-0" size={18} />
                    <p className="text-[10px] font-bold text-brand-700 leading-relaxed uppercase tracking-wide">
                        Recruiters gain access to the Job Aggregator, Talent Match engine, and AI outreach sequences.
                    </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      Confirm & Invite Member
                    </>
                  )}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
