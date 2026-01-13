
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, RecruiterStats } from '../types';
import { Trophy, Send, Zap, UserPlus, Trash2, X, ShieldCheck, Sparkles, HelpCircle, ArrowUpRight, TrendingUp, CalendarDays, Edit3, Save } from 'lucide-react';

type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TeamManagement: React.FC = () => {
  const { recruiterStats, userRole, addRecruiter, updateRecruiter, removeRecruiter, notify } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<RecruiterStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = userRole === UserRole.Owner;

  const POINTS = {
    PLACEMENT: 50,
    PROGRESSION: 10,
    APPLICATION: 2
  };

  const multipliers: Record<TimeRange, number> = {
    '7D': 0.25,
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12,
    'ALL': 18
  };

  const calculatePerformanceScore = (stats: { placements: number, stageProgressions: number, applications: number }) => {
    const rawScore = (stats.placements * POINTS.PLACEMENT) + 
                     (stats.stageProgressions * POINTS.PROGRESSION) + 
                     (stats.applications * POINTS.APPLICATION);
    const target = 1500 * multipliers[timeRange];
    return Math.min(100, Math.round((rawScore / target) * 100));
  };

  const sortedRecruiters = useMemo(() => {
    const multiplier = multipliers[timeRange];
    return [...recruiterStats]
      .map(r => {
        const scaled = {
            ...r,
            placements: Math.round(r.placements * multiplier),
            applications: Math.round(r.applications * multiplier),
            stageProgressions: Math.round(r.stageProgressions * multiplier),
        };
        return { 
            ...scaled, 
            perfScore: calculatePerformanceScore(scaled) 
        };
      })
      .sort((a, b) => b.perfScore - a.perfScore);
  }, [recruiterStats, timeRange]);

  const handleAddRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newRecruiter: RecruiterStats = {
        id: `rec_${Date.now()}`,
        name: newName,
        jobTitle: newRole || 'Technical Recruiter',
        avatarUrl: `https://picsum.photos/100/100?u=${encodeURIComponent(newName)}`,
        placements: 0,
        applications: 0,
        stageProgressions: 0,
        activityScore: 0, 
        conversionRate: 0,
        activeJobs: 0
      };
      addRecruiter(newRecruiter);
      setNewName('');
      setNewRole('');
      setNewEmail('');
      setIsSubmitting(false);
      setShowAddModal(false);
      notify("Recruiter Invited", `${newName} has been added to the team.`, "success");
    }, 800);
  };

  const handleEditRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecruiter) return;
    setIsSubmitting(true);
    setTimeout(() => {
      updateRecruiter(editingRecruiter.id, {
        name: newName,
        jobTitle: newRole
      });
      setIsSubmitting(false);
      setEditingRecruiter(null);
      notify("Profile Updated", "Recruiter information successfully synchronized.", "success");
    }, 600);
  };

  const openEditModal = (recruiter: RecruiterStats) => {
    setEditingRecruiter(recruiter);
    setNewName(recruiter.name);
    setNewRole(recruiter.jobTitle || '');
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the agency?`)) {
      removeRecruiter(id);
    }
  };

  const timeOptions: { label: string, value: TimeRange }[] = [
    { label: '7 Days', value: '7D' },
    { label: '1 Month', value: '1M' },
    { label: '3 Months', value: '3M' },
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1Y' },
    { label: 'All Time', value: 'ALL' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck size={24} className="text-brand-600" />
              Agency Team Management
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Performance Index: Hires ({POINTS.PLACEMENT}pt) • Progressions ({POINTS.PROGRESSION}pt) • Applications ({POINTS.APPLICATION}pt)
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full no-scrollbar">
                {timeOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setTimeRange(opt.value)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            timeRange === opt.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {isOwner && (
              <button 
                onClick={() => { setShowAddModal(true); setNewName(''); setNewRole(''); }}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/10 flex items-center gap-2"
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
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recruiter</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Outcome Score</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Applications</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Progressions</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hires</th>
                {isOwner && <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Management</th>}
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
                        <img src={recruiter.avatarUrl} className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl bg-slate-100 object-cover" alt="" />
                        {idx === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full border-2 border-white shadow-lg"><Trophy size={10} /></div>}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{recruiter.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recruiter.jobTitle || 'Technical Recruiter'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col items-center gap-2">
                       <div className="flex items-center gap-1.5">
                         <span className="text-xs font-black text-slate-900 tracking-tighter">{recruiter.perfScore}/100</span>
                         <div className="relative group/help">
                            <HelpCircle size={10} className="text-slate-300 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover/help:opacity-100 transition-opacity z-50 pointer-events-none uppercase tracking-widest shadow-2xl">
                                Hires: x{POINTS.PLACEMENT}<br/>Progressions: x{POINTS.PROGRESSION}<br/>Applications: x{POINTS.APPLICATION}
                            </div>
                         </div>
                       </div>
                       <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                         <div 
                          className={`h-full transition-all duration-1000 ${recruiter.perfScore >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : recruiter.perfScore >= 50 ? 'bg-brand-500' : 'bg-slate-300'}`} 
                          style={{ width: `${recruiter.perfScore}%` }} 
                         />
                       </div>
                     </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 text-slate-900">
                           <Send size={12} className="text-slate-400" />
                           <span className="text-xl font-black tracking-tighter">{recruiter.applications}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Submissions</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 text-slate-900">
                           <Zap size={12} className="text-purple-500" />
                           <span className="text-xl font-black tracking-tighter">{recruiter.stageProgressions}</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Movements</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-emerald-600 tracking-tighter">{recruiter.placements}</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conf. Hires</p>
                    </div>
                  </td>
                  {isOwner && (
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                            onClick={() => openEditModal(recruiter)}
                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" 
                            title="Edit Role Information"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" title="View Dossier">
                            <ArrowUpRight size={18} />
                        </button>
                        <button 
                            onClick={() => handleRemove(recruiter.id, recruiter.name)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Recruiter"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
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
            <h4 className="text-xl font-bold text-slate-900">No active agency nodes</h4>
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
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Provision Recruiter</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Intelligence Node</p>
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
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Role / Job Title</label>
                   <input 
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                    placeholder="e.g. Technical Sourcing Specialist"
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
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      Confirm & Invite Operative
                    </>
                  )}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecruiter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Edit Profile</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Operative Metadata</p>
                  </div>
                </div>
                <button onClick={() => setEditingRecruiter(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleEditRecruiter} className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                   <input 
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 shadow-inner"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Role / Job Title</label>
                   <input 
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-900 shadow-inner"
                   />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Synchronize Profile
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
