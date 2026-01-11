
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
import { Users, Calendar, ArrowUpRight, Video, PhoneCall, UserCheck, HelpCircle, Info, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';

type TimeRange = '7D' | '30D' | '6M' | '12M';

const dataSets: Record<TimeRange, { name: string; candidates: number }[]> = {
  '7D': [
    { name: 'MON', candidates: 40 },
    { name: 'TUE', candidates: 30 },
    { name: 'WED', candidates: 65 },
    { name: 'THU', candidates: 45 },
    { name: 'FRI', candidates: 90 },
    { name: 'SAT', candidates: 20 },
    { name: 'SUN', candidates: 15 },
  ],
  '30D': [
    { name: 'WEEK 1', candidates: 120 },
    { name: 'WEEK 2', candidates: 210 },
    { name: 'WEEK 3', candidates: 180 },
    { name: 'WEEK 4', candidates: 250 },
  ],
  '6M': [
    { name: 'JAN', candidates: 400 },
    { name: 'FEB', candidates: 520 },
    { name: 'MAR', candidates: 480 },
    { name: 'APR', candidates: 610 },
    { name: 'MAY', candidates: 750 },
    { name: 'JUN', candidates: 820 },
  ],
  '12M': [
    { name: 'Q1', candidates: 1400 },
    { name: 'Q2', candidates: 1800 },
    { name: 'Q3', candidates: 2100 },
    { name: 'Q4', candidates: 2800 },
  ]
};

const StatCard = ({ title, value, sub, icon, color, description, trend }: any) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
          <div className="relative group/tooltip">
            <HelpCircle size={12} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[100] font-medium shadow-xl">
              {description}
            </div>
          </div>
        </div>
        <h3 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-sm`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : trend === 'down' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
            {sub}
        </span>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">this period</span>
    </div>
  </div>
);

interface DashboardStatsProps {
  onViewCalendar?: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ onViewCalendar }) => {
  const { interviews, candidates } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  
  const stats = useMemo(() => {
    let multiplier = 1;
    switch(timeRange) {
        case '30D': multiplier = 4; break;
        case '6M': multiplier = 24; break;
        case '12M': multiplier = 48; break;
        default: multiplier = 1;
    }

    return {
        pool: (candidates.length * multiplier).toLocaleString(),
        active: Math.floor(candidates.filter(c => c.status === 'Active').length * (multiplier * 0.8)).toString(),
        interviews: (interviews.length * multiplier).toString(),
        trend: timeRange === '7D' ? '+12%' : timeRange === '30D' ? '+24%' : '+68%'
    };
  }, [timeRange, candidates, interviews]);

  const todayInterviews = useMemo(() => {
    const todayStr = new Date().toDateString();
    return interviews
      .filter(i => new Date(i.startTime).toDateString() === todayStr)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3);
  }, [interviews]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Recruiter Dashboard</h2>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Real-time performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
           {(['7D', '30D', '6M', '12M'] as TimeRange[]).map((range) => (
             <button
               key={range}
               onClick={() => setTimeRange(range)}
               className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                 timeRange === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          title="Total Pool" 
          value={stats.pool} 
          sub={stats.trend} 
          trend="up"
          icon={<Users size={24} />} 
          color="bg-slate-900" 
          description="Total number of candidates in the system."
        />
        <StatCard 
          title="Active Candidates" 
          value={stats.active} 
          sub="Qualified" 
          trend="up"
          icon={<UserCheck size={24} />} 
          color="bg-emerald-500" 
          description="Candidates currently active in the hiring pipeline."
        />
        <StatCard 
          title="Interviews" 
          value={stats.interviews} 
          sub="Scheduled" 
          trend="neutral"
          icon={<Calendar size={24} />} 
          color="bg-brand-600" 
          description="Total interviews scheduled in this time range."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overview</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Candidate Activity</h3>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataSets[timeRange]}>
                <defs>
                  <linearGradient id="colorCand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  labelStyle={{fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', fontSize: '10px'}}
                />
                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCand)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Interviews</h3>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                <Calendar size={20} />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {todayInterviews.length > 0 ? (
                todayInterviews.map((int) => (
                    <div key={int.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer" onClick={onViewCalendar}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-brand-600 uppercase">
                                {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {int.location ? <Video size={12} className="text-slate-400" /> : <PhoneCall size={12} className="text-slate-400" />}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{int.candidateName}</h4>
                        <p className="text-[9px] font-medium text-slate-500 uppercase truncate">{int.jobTitle}</p>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                    <Info size={32} className="text-slate-200 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase">No interviews today</p>
                </div>
            )}
          </div>
          
          <button 
            onClick={onViewCalendar}
            className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
             View Calendar <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
