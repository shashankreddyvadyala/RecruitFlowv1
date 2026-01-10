
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
  List
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Interview, Candidate, Job } from '../types';

const TIMEZONES = [
  { label: 'UTC (UNIVERSAL)', value: 'UTC' },
  { label: 'PST (PACIFIC)', value: 'America/Los_Angeles' },
  { label: 'EST (EASTERN)', value: 'America/New_York' },
  { label: 'GMT (LONDON)', value: 'Europe/London' },
  { label: 'IST (INDIA)', value: 'Asia/Kolkata' },
  { label: 'SGT (SINGAPORE)', value: 'Asia/Singapore' },
  { label: 'AEST (SYDNEY)', value: 'Australia/Sydney' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const InterviewCalendar: React.FC = () => {
  const { interviews, candidates, jobs, updateInterviewStatus, addInterview, notify } = useStore();
  // Changed default view mode to Agenda per user requirement
  const [viewMode, setViewMode] = useState<'Grid' | 'Agenda'>('Agenda');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');

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

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    // Days of current month
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, date: new Date(year, month, i) });
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const today = () => setCurrentMonth(new Date());

  const handleStatusChange = (id: string, status: Interview['status']) => {
    updateInterviewStatus(id, status);
    if (selectedInterview && selectedInterview.id === id) {
        setSelectedInterview({ ...selectedInterview, status });
    }
  };

  const handleManualPing = (type: 'late' | 'ready') => {
    if (!selectedInterview) return;
    const msg = type === 'late' ? "is running 5-10 minutes late." : "is ready and waiting in the meeting room.";
    notify(
      "Recruiter Ping Sent", 
      `Candidate ${selectedInterview.candidateName} notified that the interviewer ${msg}`, 
      "info"
    );
  };

  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = candidates.find(c => c.id === newInt.candidateId);
    const job = jobs.find(j => j.id === newInt.jobId);
    
    if (!candidate || !job || !newInt.date || !newInt.time) {
        notify("Field Error", "Target candidate, mission, and temporal window required.", "error");
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
    
    notify(
      "Mission Synchronized", 
      `New session locked for ${job.title}. Transmission links deployed.`, 
      "success"
    );

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
    } catch {
        return "N/A";
    }
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
    return [...interviews]
      .filter(i => statusFilter === 'All' || i.status === statusFilter)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, statusFilter]);

  const isSoon = (startTime: string) => {
      const diff = new Date(startTime).getTime() - Date.now();
      return diff > 0 && diff < 15 * 60 * 1000; 
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-6 leading-none">
             <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 border border-white/10">
                <CalendarIcon size={28} />
             </div>
             Temporal Command
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 ml-2">Enterprise-Grade Temporal Sync & Orchestration</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm group hover:border-brand-300 transition-colors">
            <Globe size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <select 
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="text-[10px] font-black uppercase tracking-[0.2em] outline-none bg-transparent text-slate-700 cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowScheduleModal(true)} className="px-8 py-4 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-brand-700 transition-all flex items-center gap-4 active:scale-95 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Lock Mission
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => setViewMode('Grid')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Grid' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={16} /> Grid
          </button>
          <button 
            onClick={() => setViewMode('Agenda')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Agenda' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={16} /> Agenda
          </button>
        </div>

        {viewMode === 'Grid' && (
          <div className="flex items-center gap-6">
            <button onClick={prevMonth} className="p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all text-slate-400 hover:text-slate-900"><ChevronLeft size={24}/></button>
            <div className="text-center min-w-[200px]">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <button onClick={nextMonth} className="p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all text-slate-400 hover:text-slate-900"><ChevronRight size={24}/></button>
            <button onClick={today} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg">Current</button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Events</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'Grid' ? (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {DAYS.map(day => (
              <div key={day} className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-r last:border-r-0 border-slate-100">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map((dayObj, idx) => {
              const dayInterviews = dayObj.date 
                ? filteredInterviews.filter(i => new Date(i.startTime).toDateString() === dayObj.date!.toDateString())
                : [];
              const isToday = dayObj.date?.toDateString() === new Date().toDateString();

              return (
                <div 
                  key={idx} 
                  className={`min-h-[160px] p-4 border-r border-b last:border-r-0 border-slate-100 flex flex-col gap-3 group transition-colors ${!dayObj.day ? 'bg-slate-50/20' : 'hover:bg-slate-50/30'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-black transition-colors ${dayObj.day ? (isToday ? 'bg-brand-600 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30' : 'text-slate-400 group-hover:text-slate-900') : 'text-slate-200'}`}>
                      {dayObj.day}
                    </span>
                    {dayInterviews.length > 0 && (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{dayInterviews.length} Missions</span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[100px] scrollbar-hide">
                    {dayInterviews.map(int => (
                      <div 
                        key={int.id}
                        onClick={() => setSelectedInterview(int)}
                        className={`p-2 rounded-lg text-left cursor-pointer transition-all border border-transparent hover:border-brand-200 group/event relative overflow-hidden ${
                          int.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                          int.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                          'bg-brand-50 text-brand-700'
                        }`}
                      >
                        <p className="text-[9px] font-black truncate uppercase leading-none mb-1">{int.candidateName}</p>
                        <div className="flex items-center gap-1 opacity-60">
                           <Clock size={8} />
                           <span className="text-[8px] font-bold uppercase">{new Date(int.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View (Legacy-ish but Polished) */
        <div className="space-y-6 max-w-5xl mx-auto">
          {filteredInterviews.length > 0 ? (
              filteredInterviews.map((int, idx) => {
              const startDate = new Date(int.startTime);
              const isFirstOfDate = idx === 0 || new Date(filteredInterviews[idx-1].startTime).toDateString() !== startDate.toDateString();
              const startingSoon = isSoon(int.startTime);

              return (
                  <div key={int.id} className="animate-in fade-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                  {isFirstOfDate && (
                      <div className="mt-16 mb-8 px-4 flex items-center gap-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap">
                            {formatDate(int.startTime, displayTimezone)}
                        </h4>
                        <div className="h-[2px] bg-slate-100 flex-1 rounded-full"></div>
                      </div>
                  )}

                  <div 
                      onClick={() => setSelectedInterview(int)}
                      className={`bg-white p-8 rounded-[3rem] border transition-all cursor-pointer group flex flex-col md:flex-row items-stretch gap-10 relative overflow-hidden ${
                          startingSoon ? 'border-brand-500 ring-8 ring-brand-50 shadow-2xl scale-[1.02] z-10' : 'border-slate-200 hover:shadow-2xl hover:border-brand-100'
                      }`}
                  >
                      <div className="w-full md:w-36 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-50 pb-6 md:pb-0">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{formatTime(int.startTime, displayTimezone)}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Local Sync</p>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase group-hover:text-brand-600 transition-colors leading-none mb-3">
                                    {int.candidateName}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="px-3 py-1 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">
                                        {int.type}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {int.jobTitle}
                                    </span>
                                </div>
                            </div>
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                                int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                                {int.status}
                            </span>
                        </div>
                      </div>
                  </div>
                  </div>
              );
              })
          ) : (
              <div className="py-32 text-center bg-white rounded-[4rem] border border-slate-100 border-dashed max-w-2xl mx-auto">
                  <CalendarIcon size={40} className="text-slate-200 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Agenda Clear</h3>
                  <p className="text-slate-400 font-medium mt-2">No missions matching filters found.</p>
              </div>
          )}
        </div>
      )}

      {/* Session Details Slide-over */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right-8 duration-500 relative overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start relative z-10">
              <div className="flex gap-6 items-center">
                 <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ${selectedInterview.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                    {selectedInterview.location ? <Video size={28}/> : <PhoneCall size={28}/>}
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{selectedInterview.candidateName}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap size={14} className="text-brand-600" /> {selectedInterview.type} Operation
                    </p>
                 </div>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Window</p>
                   <p className="text-lg font-black text-slate-900">{formatTime(selectedInterview.startTime, displayTimezone)}</p>
                   <p className="text-[10px] font-bold text-slate-500">{formatDate(selectedInterview.startTime, displayTimezone)}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective</p>
                   <p className="text-lg font-black text-slate-900 truncate">{selectedInterview.jobTitle}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Target Ops</p>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Command Center</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {selectedInterview.location && (
                       <a href={selectedInterview.location} target="_blank" rel="noopener noreferrer" className="p-6 bg-brand-600 text-white rounded-[2rem] shadow-xl hover:bg-brand-700 transition-all flex flex-col items-center gap-2 group">
                          <Video size={24} />
                          <span className="font-black text-[10px] uppercase tracking-widest text-center">Join Room</span>
                       </a>
                    )}
                    <button onClick={() => handleManualPing('ready')} className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all flex flex-col items-center gap-2 group">
                       <BellRing size={24} />
                       <span className="font-black text-[10px] uppercase tracking-widest text-center">Recruiter Ready</span>
                    </button>
                 </div>
              </div>

              <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl">
                 <h3 className="font-black text-brand-400 text-[10px] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <MessageSquareText size={18} /> Intel Logs
                 </h3>
                 <textarea 
                    defaultValue={selectedInterview.notes || "No logs..."}
                    className="w-full min-h-[160px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none text-sm text-slate-200 shadow-inner resize-none transition-all leading-relaxed"
                 />
              </div>

              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Normalization</h4>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleStatusChange(selectedInterview.id, 'Completed')}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedInterview.status === 'Completed' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-emerald-600 border-emerald-100'}`}
                    >
                      Complete
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedInterview.id, 'Cancelled')}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedInterview.status === 'Cancelled' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-red-600 border-red-100'}`}
                    >
                      Void
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Mission Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sync Initiation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Configure Temporal Sync Node</p>
                  </div>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400">
                  <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateInterview} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Ops</label>
                        <select 
                          required
                          value={newInt.jobId}
                          onChange={e => setNewInt({...newInt, jobId: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner appearance-none uppercase"
                        >
                            <option value="">Select Job...</option>
                            {jobs.map(j => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Candidate</label>
                        <select 
                          required
                          value={newInt.candidateId}
                          onChange={e => setNewInt({...newInt, candidateId: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner appearance-none uppercase"
                        >
                            <option value="">Select Target...</option>
                            {candidates.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                    <input type="date" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner" value={newInt.date} onChange={e => setNewInt({...newInt, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">T+0</label>
                    <input type="time" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 shadow-inner" value={newInt.time} onChange={e => setNewInt({...newInt, time: e.target.value})} />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sync Protocol</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['Technical', 'Behavioral', 'Culture'] as Interview['type'][]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewInt({...newInt, type})}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${
                            newInt.type === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-brand-700"
                >
                  Confirm & Lock Mission
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;
