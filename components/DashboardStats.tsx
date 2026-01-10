
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Users, CheckCircle, Clock, TrendingUp, HelpCircle, Info } from 'lucide-react';

const data = [
  { name: 'Mon', candidates: 40 },
  { name: 'Tue', candidates: 30 },
  { name: 'Wed', candidates: 65 },
  { name: 'Thu', candidates: 45 },
  { name: 'Fri', candidates: 90 },
  { name: 'Sat', candidates: 20 },
  { name: 'Sun', candidates: 15 },
];

const pipelineData = [
  { name: 'Sourcing', value: 120 },
  { name: 'AI Screen', value: 86 },
  { name: 'Interview', value: 34 },
  { name: 'Offer', value: 12 },
  { name: 'Hired', value: 8 },
];

const StatCard = ({ title, value, sub, icon, color, description }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between relative group">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <div className="relative group/tooltip">
            <HelpCircle size={14} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 font-bold uppercase tracking-wider text-center">
              {description}
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${sub.includes('+') ? 'text-emerald-500' : sub.includes('-') ? 'text-orange-500' : 'text-slate-400'}`}>
      {sub}
    </p>
  </div>
);

const DashboardStats: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Candidates" 
          value="1,284" 
          sub="+12% from last month" 
          icon={<Users size={20} />} 
          color="bg-brand-600" 
          description="The cumulative number of talent profiles discovered, imported, or matched in your database."
        />
        <StatCard 
          title="AI Interviews" 
          value="342" 
          sub="85% completion rate" 
          icon={<BotIcon />} 
          color="bg-purple-600" 
          description="Autonomous screenings conducted by voice agents. Measures how much manual first-round work is automated."
        />
        <StatCard 
          title="Time to Hire" 
          value="14 days" 
          sub="-3 days improvement" 
          icon={<Clock size={20} />} 
          color="bg-orange-500" 
          description="Average duration from job creation to offer acceptance. Low numbers indicate high agency efficiency."
        />
        <StatCard 
          title="Active Jobs" 
          value="8" 
          sub="2 closing soon" 
          icon={<TrendingUp size={20} />} 
          color="bg-emerald-500" 
          description="Total live job orders currently being fulfilled. High counts indicate healthy agency pipeline load."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Candidate Inflow</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Daily talent acquisition via AI Sourcing</p>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">7 Days</button>
               <button className="px-3 py-1 bg-brand-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-brand-600 border border-brand-100">30 Days</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '10px'}}
                />
                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCand)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pipeline Health</h3>
            <div className="relative group/pipeline">
              <Info size={14} className="text-slate-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/pipeline:opacity-100 transition-opacity pointer-events-none z-50 font-bold uppercase tracking-wider leading-relaxed shadow-2xl">
                Measures candidate distribution. A healthy pipeline shows a wide top (Sourcing) and consistent narrowing toward Hired. Bottlenecks are identified by stagnant middle stages.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-8">Talent conversion efficiency</p>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#475569', fontWeight: 700, textTransform: 'uppercase'}} />
                <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.4)'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple internal icon component
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

export default DashboardStats;
