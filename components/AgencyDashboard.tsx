
import React from 'react';
import { Briefcase, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AgencyDashboard: React.FC = () => {
  const { placements, recruiterStats, jobs } = useStore();

  const totalPlacements = placements.length;

  return (
    <div className="space-y-6">
      {/* Top Level Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-slate-400 text-sm font-medium mb-1">Total Placements (YTD)</p>
                <h3 className="text-3xl font-bold">{totalPlacements}</h3>
                <p className="text-emerald-400 text-xs mt-2 font-medium flex items-center gap-1">
                    <TrendingUp size={12} /> +24% vs last period
                </p>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                 <CheckCircle size={100} />
             </div>
        </div>
        
        <StatsCard 
            title="Active Job Orders" 
            value={jobs.length.toString()} 
            sub="3 new this week" 
            icon={<Briefcase size={20} />} 
        />
        <StatsCard 
            title="Team Activity Score" 
            value="92/100" 
            sub="Top 5% in industry" 
            icon={<Users size={20} />} 
        />
        <StatsCard 
            title="Avg Time to Fill" 
            value="18 days" 
            sub="Target: 15 days" 
            icon={<Clock size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart */}
         <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6">Team Placement Performance</h3>
            <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recruiterStats.map(r => ({ name: r.name, value: r.placements }))}>
                        <defs>
                            <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPlacements)" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Placements */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-3">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900">Recent Placements & Activity</h3>
                <button className="text-sm text-brand-600 font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
                {placements.map(placement => (
                    <div key={placement.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-white transition-colors hover:shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                {placement.candidateName[0]}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{placement.candidateName}</h4>
                                <p className="text-xs text-slate-500">{placement.jobTitle} @ {placement.clientName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-xs text-slate-400">Recruiter</p>
                                <p className="text-sm font-medium text-slate-700">{placement.recruiterName}</p>
                             </div>
                             <div className="text-right w-24">
                                 <p className="font-bold text-emerald-600">CONFIRMED</p>
                                 <span className="text-[10px] uppercase font-bold text-slate-400">
                                    {placement.placedDate}
                                 </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, sub, icon }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
      <p className="text-xs mt-2 text-slate-400 font-medium">{sub}</p>
    </div>
    <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
      {icon}
    </div>
  </div>
);

export default AgencyDashboard;
