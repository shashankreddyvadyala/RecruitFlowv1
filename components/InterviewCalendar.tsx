
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  MapPin, 
  Video, 
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronDown,
  X,
  CalendarCheck,
  Globe,
  BellRing,
  Sparkles,
  Zap,
  PhoneCall,
  Send,
  Timer,
  MessageSquareText,
  Briefcase,
  AlertCircle,
  MoreVertical,
  ShieldCheck,
  ArrowUpRight,
  ClipboardCheck,
  Mail,
  History,
  LayoutGrid,
  List,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Interview, Candidate, Job } from '../types';

type TimeRange = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIMEZONES = [
  { label: 'My Local Time', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: 'UTC', value: 'UTC' },
  { label: 'Pacific Time', value: 'America/Los_Angeles' },
  { label: 'Eastern Time', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const InterviewCalendar: React.FC = () => {
  const { interviews, candidates, jobs, updateInterviewStatus, addInterview, notify } = useStore();
  const [viewMode, setViewMode] = useState<'Grid' | 'Agenda'>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  const [newInt, setNewInt] = useState({
    candidateId: '',
    jobId: '',
    type: 'Technical' as Interview['type'],
    date: '',
    time: '',
    interviewer: 'Alex Morgan',
    candidateTimezone: 'UTC',
    location: '', 
    includeMeetingLink: true,
    notes: ''
  });

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, date: new Date(year, month, i) });
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const handleStatusChange = (id: string, status: Interview['status']) => {
    updateInterviewStatus(id, status);
    if (selectedInterview && selectedInterview.id === id) {
        setSelectedInterview({ ...selectedInterview, status });
    }
  };

  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = candidates.find(c => c.id === newInt.candidateId);
    const job = jobs.find(j => j.id === newInt.jobId);
    
    if (!candidate || !job || !newInt.date || !newInt.time) {
        notify("Required Fields", "Please select a candidate, job, and time.", "error");
        return;
    }

    const start = new Date(`${newInt.date}T${newInt.time}`);
    const end = new Date(start.getTime() + 45 * 60 * 1000);

    const interview: Interview = {
      id: `int_${Date.now()}`,
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      jobId: job.id,
      jobTitle: job.title,
      interviewerName: newInt.interviewer,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: newInt.includeMeetingLink ? (newInt.location || 'https://meet.google.com/abc-def-ghi') : undefined,
      status: 'Scheduled',
      type: newInt.type,
      notes: newInt.notes,
      candidateTimezone: newInt.candidateTimezone
    };

    addInterview(interview);
    setShowScheduleModal(false);
    notify("Scheduled", `Interview for ${job.title} set.`, "success");

    setNewInt({ 
      candidateId: '', 
      jobId: '',
      type: 'Technical', 
      date: '', 
      time: '', 
      interviewer: 'Alex Morgan', 
      candidateTimezone: 'UTC', 
      location: '',
      includeMeetingLink: true,
      notes: ''
    });
  };

  const formatTime = (isoString: string, tz: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: tz,
            hour12: true
          }).format(new Date(isoString));
    } catch { return "N/A"; }
  };

  const formatDate = (isoString: string, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: tz
    }).format(new Date(isoString));
  };

  const filteredInterviews = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [...interviews]
      .filter(i => {
        // Status Filter
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;

        // Time Range Filter
        if (timeRange === 'ALL') return true;

        const startTime = new Date(i.startTime);
        const diffMs = startTime.getTime() - startOfToday.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (timeRange) {
          case '1D': return diffDays >= 0 && diffDays < 1;
          case '7D': return diffDays >= 0 && diffDays < 7;
          case '1M': return diffDays >= 0 && diffDays < 30;
          case '3M': return diffDays >= 0 && diffDays < 90;
          case '6M': return diffDays >= 0 && diffDays < 180;
          case '1Y': return diffDays >= 0 && diffDays < 365;
          default: return true;
        }
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, statusFilter, timeRange]);

  const timeOptions: { label: string, value: TimeRange }[] = [
    { label: '1D', value: '1D' }, 
    { label: '7D', value: '7D' }, 
    { label: '1M', value: '1M' }, 
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' }, 
    { label: '1Y', value: '1Y' }, 
    { label: 'ALL', value: 'ALL' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Interview Calendar</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Direct Coordination & Session Management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Globe size={14} className="text-slate-400" />
            <select 
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="text-[10px] font-black uppercase outline-none bg-transparent text-slate-700"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2">
            <Plus size={16} /> Provision Session
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setViewMode('Grid')} 
            className={`p-2 rounded-lg transition-all ${viewMode === 'Grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('Agenda')} 
            className={`p-2 rounded-lg transition-all ${viewMode === 'Agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Agenda View"
          >
            <List size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-inner">
           {timeOptions.map((opt) => (
             <button
               key={opt.value}
               onClick={() => setTimeRange(opt.value)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 timeRange === opt.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
               }`}
             >
               {opt.label}
             </button>
           ))}
        </div>

        {viewMode === 'Grid' && (
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight w-48 text-center">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
          </div>
        )}

        <div className="flex items-center gap-2 pr-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {viewMode === 'Grid' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {DAYS.map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map((dayObj, idx) => {
              const dayInterviews = dayObj.date 
                ? filteredInterviews.filter(i => new Date(i.startTime).toDateString() === dayObj.date!.toDateString())
                : [];
              const isToday = dayObj.date?.toDateString() === new Date().toDateString();

              return (
                <div key={idx} className={`min-h-[140px] p-2 border-r border-b last:border-r-0 border-slate-100 flex flex-col gap-1 transition-colors ${!dayObj.day ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                  <span className={`text-[10px] font-black ${isToday ? 'bg-brand-600 text-white w-6 h-6 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-brand-600/20' : 'text-slate-300'}`}>
                    {dayObj.day}
                  </span>
                  <div className="flex-1 space-y-1 overflow-y-auto mt-2 px-1">
                    {dayInterviews.map(int => (
                      <div 
                        key={int.id}
                        onClick={() => setSelectedInterview(int)}
                        className={`p-1.5 rounded-lg text-[9px] font-black truncate cursor-pointer transition-all border ${
                            int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            int.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-brand-50 text-brand-700 border-brand-100 hover:scale-[1.02]'
                        }`}
                      >
                        {formatTime(int.startTime, displayTimezone)} {int.candidateName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
          {filteredInterviews.length > 0 ? (
              filteredInterviews.map((int, idx) => {
                const isFirstOfDate = idx === 0 || new Date(filteredInterviews[idx-1].startTime).toDateString() !== new Date(int.startTime).toDateString();
                return (
                  <div key={int.id} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    {isFirstOfDate && (
                        <div className="mt-12 mb-6 flex items-center gap-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                              {formatDate(int.startTime, displayTimezone)}
                          </h4>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                    )}

                    <div 
                        onClick={() => setSelectedInterview(int)}
                        className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-brand-500 hover:shadow-2xl transition-all cursor-pointer flex items-center gap-8 group"
                    >
                        <div className="w-32 text-center border-r border-slate-100 pr-8">
                          <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatTime(int.startTime, displayTimezone)}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Session Time</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-brand-50 text-brand-600 border-brand-100 shadow-sm shadow-brand-500/10'
                            }`}>
                                {int.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-200">•</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{int.type} Selection Round</span>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{int.candidateName}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">Interviewer: {int.interviewerName} • {int.jobTitle}</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })
          ) : (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                  <CalendarIcon size={56} className="text-slate-100 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No sessions found</h3>
                  <p className="text-slate-500 font-medium mt-2">Adjust your filters or schedule a new candidate round.</p>
              </div>
          )}
        </div>
      )}

      {selectedInterview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-md flex items-center justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedInterview(null)}></div>
          <div className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        {selectedInterview.location ? <Video size={24}/> : <PhoneCall size={24}/>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{selectedInterview.candidateName}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedInterview.type} Selection Round</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedInterview(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                    <X size={24} />
                 </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Time</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{formatTime(selectedInterview.startTime, displayTimezone)}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Calendar Date</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{new Date(selectedInterview.startTime).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedInterview.location && (
                 <a href={selectedInterview.location} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-600/20">
                    <Video size={20} /> Join Secure Meeting Room
                 </a>
              )}

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Info size={14} className="text-brand-600" /> Preparation Notes
                 </h4>
                 <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed italic shadow-inner">
                    {selectedInterview.notes || "No additional preparation notes provided for this candidate round."}
                 </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                 <h4 className="text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Role Insight</h4>
                 <p className="text-lg font-black uppercase tracking-tight leading-tight">{selectedInterview.jobTitle}</p>
                 <p className="text-slate-400 text-xs mt-3 font-medium">Coordinate with candidate to ensure alignment on core competencies for this {selectedInterview.type} round.</p>
              </div>

              <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => handleStatusChange(selectedInterview.id, 'Completed')} 
                    className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    <CheckCircle2 size={16} /> Mark Completed
                 </button>
                 <button 
                    onClick={() => handleStatusChange(selectedInterview.id, 'Cancelled')} 
                    className="py-4 bg-white border border-slate-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    <X size={16} /> Cancel Session
                 </button>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setSelectedInterview(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Return to Calendar
                </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <CalendarCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Provision Session</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Candidate Round</p>
                    </div>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                </button>
             </div>
             <form onSubmit={handleCreateInterview} className="p-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Opportunity</label>
                        <select required value={newInt.jobId} onChange={e => setNewInt({...newInt, jobId: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner">
                            <option value="">Select Job...</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Candidate Node</label>
                        <select required value={newInt.candidateId} onChange={e => setNewInt({...newInt, candidateId: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner">
                            <option value="">Select Candidate...</option>
                            {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Session Date</label>
                        <input type="date" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newInt.date} onChange={e => setNewInt({...newInt, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Time</label>
                        <input type="time" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner" value={newInt.time} onChange={e => setNewInt({...newInt, time: e.target.value})} />
                    </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-center gap-3">
                    <Sparkles size={18} className="text-brand-600" />
                    <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide leading-relaxed">
                        Tip: Scheduling will automatically synchronize with both Recruiter and Candidate neural nodes.
                    </p>
                </div>

                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    Schedule Round & Sync Nodes
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;
