
import React, { useState } from 'react';
import { Briefcase, TrendingUp, Users, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type TimeRange = '7D' | '30D' | '6M' | '12M';

const AgencyDashboard: React.FC = () => {
  const { placements, recruiterStats, jobs } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  // Mock scaling for demo purposes based on range
  const rangeMultiplier = timeRange === '7D' ? 0.25 : timeRange === '30D' ? 1 : timeRange === '6M' ? 5 : 9;
  const scaledPlacements = Math.round(placements.length * rangeMultiplier);
  const activeJobsCount = jobs.length + (timeRange === '12M' ? 24 : 0);
  const avgTime = timeRange === '7D' ? '12 days' : '18 days';

  const chartData = recruiterStats.map(r => ({ 
    name: r.name, 
    value: Math.round(r.placements * rangeMultiplier) 
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Temporal Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Operations Intelligence</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Agency-wide Performance Orchestration</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm">
           {(['7D', '30D', '6M', '12M'] as TimeRange[]).map((range) => (
             <button
               key={range}
               onClick={() => setTimeRange(range)}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 timeRange === range ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      {/* Top Level Operations KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Total Placements ({timeRange})</p>
                <h3 className="text-5xl font-black tracking-tighter leading-none">{scaledPlacements}</h3>
                <p className="text-emerald-400 text-xs mt-6 font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> +24% Velocity
                </p>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                 <CheckCircle size={180} />
             </div>
        </div>
        
        <StatsCard 
            title="Active Job Orders" 
            value={activeJobsCount.toString()} 
            sub={`${timeRange === '7D' ? '3' : '14'} new this period`} 
            icon={<Briefcase size={24} />} 
        />
        <StatsCard 
            title="Avg Time to Fill" 
            value={avgTime} 
            sub="Efficiency Threshold" 
            icon={<Clock size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart */}
         <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Yield Analysis</h3>
                   <p className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Team Output Performance</p>
                </div>
                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                    <TrendingUp size={24} />
                </div>
            </div>

            <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dx={-10} />
                        <Tooltip 
                           contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px'}}
                           labelStyle={{fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', letterSpacing: '0.1em'}}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPlacements)" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Recent Placements */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 lg:col-span-3">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Wins ({timeRange})</h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 transition-colors">View All Transmissions</button>
            </div>
            <div className="space-y-4">
                {placements.map(placement => (
                    <div key={placement.id} className="flex flex-col sm:flex-row items-center justify-between p-6 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all hover:shadow-xl group">
                        <div className="flex items-center gap-6 mb-4 sm:mb-0">
                            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-600/20 group-hover:scale-110 transition-transform">
                                {placement.candidateName[0]}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{placement.candidateName}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{placement.jobTitle} @ {placement.clientName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                             <div className="text-right hidden md:block">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recruiter Agent</p>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{placement.recruiterName}</p>
                             </div>
                             <div className="text-right w-32">
                                 <div className="flex items-center justify-end gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-1">
                                    <CheckCircle size={14} /> Confirmed
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {placement.placedDate}
                                 </p>
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
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-start justify-between group hover:shadow-2xl hover:border-brand-100 transition-all duration-500">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{title}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 bg-slate-50 px-3 py-1 rounded-lg inline-block">{sub}</p>
    </div>
    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-all shadow-inner">
      {icon}
    </div>
  </div>
);

export default AgencyDashboard;
