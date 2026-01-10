
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
import { Users, CheckCircle, Clock, TrendingUp, HelpCircle, Info, Zap, Sparkles, Calendar, ArrowUpRight, Video, PhoneCall } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const data = [
  { name: 'MON', candidates: 40 },
  { name: 'TUE', candidates: 30 },
  { name: 'WED', candidates: 65 },
  { name: 'THU', candidates: 45 },
  { name: 'FRI', candidates: 90 },
  { name: 'SAT', candidates: 20 },
  { name: 'SUN', candidates: 15 },
];

const pipelineData = [
  { name: 'SOURCING', value: 120 },
  { name: 'AI SCREEN', value: 86 },
  { name: 'INTERVIEW', value: 34 },
  { name: 'OFFER', value: 12 },
  { name: 'HIRED', value: 8 },
];

const StatCard = ({ title, value, sub, icon, color, description, trend }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between relative group hover:shadow-2xl hover:border-brand-100 transition-all duration-500 hover:-translate-y-1">
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
          <div className="relative group/tooltip">
            <HelpCircle size={12} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-slate-950 text-white text-[10px] rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[100] font-bold uppercase tracking-wider text-center shadow-2xl leading-relaxed">
              {description}
            </div>
          </div>
        </div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-xl ${color} text-white`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
            {sub}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs prev period</span>
    </div>
  </div>
);

const DashboardStats: React.FC = () => {
  const { interviews } = useStore();
  
  const upcomingToday = interviews
    .filter(i => {
        const date = new Date(i.startTime);
        const today = new Date();
        return date.toDateString() === today.toDateString() && date.getTime() > today.getTime();
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Recruiter Mission Control</h2>
           <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Real-time Performance & Operations Interface</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-900 text-white p-4 px-6 rounded-[1.5rem] flex items-center gap-4 shadow-xl border border-white/10">
              <Zap size={20} className="text-brand-400 fill-brand-400" />
              <div>
                 <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Neural Load</p>
                 <p className="text-sm font-black tracking-tight">94.2% OPTIMIZED</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Talent Pool" 
          value="1,284" 
          sub="+12%" 
          trend="up"
          icon={<Users size={24} />} 
          color="bg-slate-900" 
          description="The cumulative number of talent profiles discovered, imported, or matched in your database."
        />
        <StatCard 
          title="AI Cycles" 
          value="342" 
          sub="+85%" 
          trend="up"
          icon={<Sparkles size={24} />} 
          color="bg-brand-600" 
          description="Autonomous screenings conducted by voice agents. Measures how much manual first-round work is automated."
        />
        <StatCard 
          title="Velocity" 
          value="14d" 
          sub="-3d" 
          trend="up"
          icon={<Clock size={24} />} 
          color="bg-orange-500" 
          description="Average duration from job creation to offer acceptance."
        />
        <StatCard 
          title="Live Orders" 
          value="08" 
          sub="Stable" 
          trend="neutral"
          icon={<TrendingUp size={24} />} 
          color="bg-emerald-500" 
          description="Total live job orders currently being fulfilled."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
             <TrendingUp size={100} className="text-slate-50 opacity-[0.03]" />
          </div>
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Strategic Signal</h3>
              <p className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">Candidate Ingestion Velocity</p>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
               <button className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">7 Days</button>
               <button className="px-6 py-2 bg-white shadow-xl rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-100">30 Days</button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10, fontWeight: 900}} dx={-10} />
                <Tooltip 
                  cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px'}}
                  labelStyle={{fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', letterSpacing: '0.1em'}}
                />
                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCand)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Mission Briefing widget for Recruiters */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Daily Mission</h3>
              <p className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">Upcoming Syncs</p>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl group-hover:rotate-12 transition-transform">
                <Calendar size={24} />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {upcomingToday.length > 0 ? (
                upcomingToday.map((int) => (
                    <div key={int.id} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group/item hover:bg-slate-100 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                                {new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {int.location ? <Video size={14} className="text-slate-400" /> : <PhoneCall size={14} className="text-slate-400" />}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{int.candidateName}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 truncate">{int.jobTitle}</p>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-50 grayscale">
                    <Info size={32} className="text-slate-200 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zero missions for today</p>
                </div>
            )}
          </div>
          
          <button className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
             View Full Deck <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
