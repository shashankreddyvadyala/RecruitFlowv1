
import React, { useState, useMemo } from 'react';
import { Briefcase, TrendingUp, CheckCircle, Trophy, Send, Zap, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const AgencyDashboard: React.FC = () => {
  const { placements, recruiterStats } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const multipliers: Record<TimeRange, number> = {
    '7D': 0.25, '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'ALL': 18
  };

  const POINTS = { PLACEMENT: 50, PROGRESSION: 10, APPLICATION: 2 };

  const calculatePerformanceScore = (stats: { placements: number, stageProgressions: number, applications: number }, currentRange: TimeRange) => {
    const rawScore = (stats.placements * POINTS.PLACEMENT) + 
                     (stats.stageProgressions * POINTS.PROGRESSION) + 
                     (stats.applications * POINTS.APPLICATION);
    // Standard Monthly Top-Performer Target is 1500 points
    const target = 1500 * multipliers[currentRange];
    return Math.min(100, Math.round((rawScore / target) * 100));
  };

  const stats = useMemo(() => {
    const mult = multipliers[timeRange];
    const totalApps = recruiterStats.reduce((sum, r) => sum + r.applications, 0);
    const totalMoves = recruiterStats.reduce((sum, r) => sum + r.stageProgressions, 0);
    const totalPlacements = recruiterStats.reduce((sum, r) => sum + r.placements, 0);

    const aggregatePerf = calculatePerformanceScore({
        placements: totalPlacements,
        stageProgressions: totalMoves,
        applications: totalApps
    }, timeRange);

    return {
        placements: Math.round(totalPlacements * mult),
        submissions: Math.round(totalApps * mult),
        movements: Math.round(totalMoves * mult),
        performanceScore: aggregatePerf,
        chartData: recruiterStats.map(r => {
            const scaled = {
                placements: Math.round(r.placements * mult),
                stageProgressions: Math.round(r.stageProgressions * mult),
                applications: Math.round(r.applications * mult)
            };
            return {
                name: r.name,
                value: calculatePerformanceScore(scaled, timeRange)
            };
        }).sort((a, b) => b.value - a.value)
    };
  }, [timeRange, recruiterStats]);

  const timeOptions: { label: string, value: TimeRange }[] = [
    { label: '7 Days', value: '7D' }, { label: '1 Month', value: '1M' }, { label: '3 Months', value: '3M' },
    { label: '6 Months', value: '6M' }, { label: '1 Year', value: '1Y' }, { label: 'All Time', value: 'ALL' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Operations Intelligence</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Agency Performance Index (API) v3.2</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
           {timeOptions.map((opt) => (
             <button
               key={opt.value}
               onClick={() => setTimeRange(opt.value)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 timeRange === opt.value ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Collective Outcome Score</p>
                <h3 className="text-5xl font-black tracking-tighter leading-none">{stats.performanceScore}%</h3>
                <p className="text-emerald-400 text-[10px] mt-6 font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> High-Efficiency Synthesis
                </p>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                 <Sparkles size={160} />
             </div>
        </div>
        
        <StatsCard title="Total Submissions" value={stats.submissions.toString()} sub="Volume Node" icon={<Send size={24} />} />
        <StatsCard title="Pipeline Movements" value={stats.movements.toString()} sub="Velocity Node" icon={<Zap size={24} />} />
        <StatsCard title="Successful Hires" value={stats.placements.toString()} sub="Success Node" icon={<Trophy size={24} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Resonance Map</h3>
                   <p className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Standardized Performance Curve</p>
                </div>
                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                    <TrendingUp size={24} />
                </div>
            </div>

            <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                        <defs>
                            <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
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
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPerf)" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, sub, icon }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-start justify-between group hover:shadow-2xl hover:border-brand-100 transition-all duration-500">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{title}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 bg-slate-50 px-3 py-1 rounded-lg inline-block">{sub}</p>
    </div>
    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-all shadow-inner shrink-0">
      {icon}
    </div>
  </div>
);

export default AgencyDashboard;
