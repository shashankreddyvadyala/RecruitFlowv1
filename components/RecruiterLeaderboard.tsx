
import React from 'react';
import { useStore } from '../context/StoreContext';
import { Trophy, Mail, Phone } from 'lucide-react';

const RecruiterLeaderboard: React.FC = () => {
  const { recruiterStats } = useStore();

  const sortedRecruiters = [...recruiterStats].sort((a, b) => b.placements - a.placements);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy size={24} className="text-yellow-500" />
          Team Performance Leaderboard
        </h3>
        <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 font-bold text-slate-700 outline-none">
          <option>This Month</option>
          <option>Q1 2026</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recruiter</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Activity Score</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Placements</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRecruiters.map((recruiter, idx) => (
              <tr key={recruiter.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-400 text-lg">#{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img src={recruiter.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                    <div>
                      <p className="font-bold text-slate-900">{recruiter.name}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Mail size={10} /> {recruiter.emailsSent}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {recruiter.callsLogged}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col items-center gap-2">
                     <span className="text-sm font-bold text-slate-900">{recruiter.activityScore}/100</span>
                     <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-brand-500 transition-all duration-1000" 
                        style={{ width: `${recruiter.activityScore}%` }} 
                       />
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <p className="text-lg font-black text-slate-900">{recruiter.placements}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hires Confirmed</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                    {recruiter.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecruiterLeaderboard;
