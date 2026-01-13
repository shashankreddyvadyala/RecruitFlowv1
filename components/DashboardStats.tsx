
import React, { useState, useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Send, Zap, Trophy, HelpCircle, Info, Calendar, ArrowUpRight, TrendingUp, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';

type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const BASE_CHART_VALUES = [
  { inflow: 8, submissions: 12 }, 
  { inflow: 14, submissions: 18 }, 
  { inflow: 10, submissions: 15 },
  { inflow: 18, submissions: 22 }, 
  { inflow: 25, submissions: 30 }, 
  { inflow: 20, submissions: 25 }, 
  { inflow: 30, submissions: 35 },
];

const StatCard = ({ title, value, sub, icon, color, description, trend }: any) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
          <div className="relative group/tooltip">
            <HelpCircle size={12} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[100] font-medium shadow-xl">
              {description}
            </div>
          </div>
        </div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-sm`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
            {sub}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Velocity</span>
    </div>
  </div>
);

interface DashboardStatsProps {
  onViewCalendar?: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ onViewCalendar }) => {
  const { interviews, recruiterStats, candidates } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const multipliers: Record<TimeRange, number> = {
    '7D': 0.25, '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'ALL': 18
  };

  const getLabels = (range: TimeRange) => {
    switch (range) {
      case '7D': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case '1M': return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];
      case '3M':
      case '6M': return ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7'];
      case '1Y':
      case 'ALL': return ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec'];
      default: return ['1', '2', '3', '4', '5', '6', '7'];
    }
  };
  
  const stats = useMemo(() => {
    const mult = multipliers[timeRange];
    const labels = getLabels(timeRange);
    const baseStats = recruiterStats.reduce((acc, curr) => ({
        apps: acc.apps + curr.applications,
        moves: acc.moves + curr.stageProgressions,
        hires: acc.hires + curr.placements
    }), { apps: 0, moves: 0, hires: 0 });

    return {
        submissions: Math.round(baseStats.apps * mult).toLocaleString(),
        movements: Math.round(baseStats.moves * mult).toLocaleString(),
        placements: Math.round(baseStats.hires * mult).toLocaleString(),
        candidates: candidates.length.toLocaleString(),
        trend: timeRange === '7D' ? '+4%' : '+18%',
        chartData: BASE_CHART_VALUES.map((d, idx) => ({ 
            name: labels[idx] || `P${idx + 1}`, 
            inflow: Math.round(d.inflow * mult),
            submissions: Math.round(d.submissions * mult)
        }))
    };
  }, [timeRange, recruiterStats, candidates]);

  const timeOptions: { label: string, value: TimeRange }[] = [
    { label: '7D', value: '7D' }, { label: '1M', value: '1M' }, { label: '3M', value: '3M' },
    { label: '6M', value: '6M' }, { label: '1Y', value: '1Y' }, { label: 'All', value: 'ALL' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Recruiter Dashboard</h2>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Operational Performance Hub</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
           {timeOptions.map((opt) => (
             <button
               key={opt.value}
               onClick={() => setTimeRange(opt.value)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 timeRange === opt.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Total Candidates" 
          value={stats.candidates} 
          sub="Live Pool" 
          trend="neutral"
          icon={<Users size={24} />} 
          color="bg-brand-600" 
          description="Total candidates currently registered in the agency talent cloud."
        />
        <StatCard 
          title="Total Submissions" 
          value={stats.submissions} 
          sub={stats.trend} 
          trend="up"
          icon={<Send size={24} />} 
          color="bg-slate-900" 
          description="Total job applications submitted (Score weight: 2pt)."
        />
        <StatCard 
          title="Pipeline Movements" 
          value={stats.movements} 
          sub="Stable" 
          trend="neutral"
          icon={<Zap size={24} />} 
          color="bg-purple-600" 
          description="Successful stage progressions (Score weight: 10pt)."
        />
        <StatCard 
          title="Confirmed Hires" 
          value={stats.placements} 
          sub="+12%" 
          trend="up"
          icon={<Trophy size={24} />} 
          color="bg-emerald-600" 
          description="Total successful candidate placements (Score weight: 50pt)."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market & Pipeline Flow</p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">Inflow & Submissions</h3>
            </div>
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Inflow</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Submissions</span>
                </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px'}}
                  labelStyle={{fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px'}}
                  itemStyle={{fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'}}
                />
                <Area 
                    type="monotone" 
                    dataKey="inflow" 
                    name="Inflow"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorInflow)" 
                    strokeWidth={4} 
                />
                <Area 
                    type="monotone" 
                    dataKey="submissions" 
                    name="Submissions"
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorSubmissions)" 
                    strokeWidth={4} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Events</p>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">Interviews</h3>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                <Calendar size={20} />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {interviews.slice(0, 3).map((int) => (
                <div key={int.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer" onClick={onViewCalendar}>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">
                            {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{int.candidateName}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase truncate tracking-widest">{int.jobTitle}</p>
                </div>
            ))}
          </div>
          
          <button 
            onClick={onViewCalendar}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
             View Full Calendar <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
