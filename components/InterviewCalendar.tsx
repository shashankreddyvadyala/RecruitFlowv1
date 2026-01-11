
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
  { label: 'UTC', value: 'UTC' },
  { label: 'Pacific Time', value: 'America/Los_Angeles' },
  { label: 'Eastern Time', value: 'America/New_York' },
  { label: 'London', value: 'Europe/London' },
  { label: 'India', value: 'Asia/Kolkata' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Sydney', value: 'Australia/Sydney' },
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
      "Ping Sent", 
      `Candidate ${selectedInterview.candidateName} notified that interviewer ${msg}`, 
      "info"
    );
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Interviews</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Schedule and manage candidate meetings</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Globe size={14} className="text-slate-400" />
            <select 
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="text-[10px] font-bold uppercase outline-none bg-transparent text-slate-700"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-700 transition-colors shadow-lg flex items-center gap-2">
            <Plus size={16} /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('Grid')} 
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'Grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Grid
          </button>
          <button 
            onClick={() => setViewMode('Agenda')} 
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'Agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Agenda
          </button>
        </div>

        {viewMode === 'Grid' && (
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20}/></button>
            <h3 className="text-lg font-bold text-slate-900 w-40 text-center">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20}/></button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Filter:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase outline-none"
          >
            <option value="All">All</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {viewMode === 'Grid' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {DAYS.map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map((dayObj, idx) => {
              const dayInterviews = dayObj.date 
                ? filteredInterviews.filter(i => new Date(i.startTime).toDateString() === dayObj.date!.toDateString())
                : [];
              const isToday = dayObj.date?.toDateString() === new Date().toDateString();

              return (
                <div key={idx} className={`min-h-[120px] p-2 border-r border-b last:border-r-0 border-slate-100 flex flex-col gap-1 ${!dayObj.day ? 'bg-slate-50/30' : ''}`}>
                  <span className={`text-[10px] font-bold ${isToday ? 'bg-brand-600 text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto' : 'text-slate-400'}`}>
                    {dayObj.day}
                  </span>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayInterviews.map(int => (
                      <div 
                        key={int.id}
                        onClick={() => setSelectedInterview(int)}
                        className="p-1 px-2 rounded bg-brand-50 text-brand-700 text-[8px] font-bold truncate cursor-pointer hover:bg-brand-100"
                      >
                        {formatTime(int.startTime, displayTimezone)} - {int.candidateName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredInterviews.length > 0 ? (
              filteredInterviews.map((int, idx) => {
                const isFirstOfDate = idx === 0 || new Date(filteredInterviews[idx-1].startTime).toDateString() !== new Date(int.startTime).toDateString();
                return (
                  <div key={int.id}>
                    {isFirstOfDate && (
                        <div className="mt-8 mb-4 flex items-center gap-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {formatDate(int.startTime, displayTimezone)}
                          </h4>
                          <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    )}

                    <div 
                        onClick={() => setSelectedInterview(int)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-6"
                    >
                        <div className="w-24 text-center border-r border-slate-50 pr-6">
                          <p className="text-xl font-bold text-slate-900 leading-none">{formatTime(int.startTime, displayTimezone)}</p>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 leading-none mb-1">{int.candidateName}</h3>
                          <p className="text-xs text-slate-400 font-medium">{int.type} Interview • {int.jobTitle}</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border ${
                            int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                            {int.status}
                        </div>
                    </div>
                  </div>
                );
              })
          ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                  <CalendarIcon size={32} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-[10px]">No upcoming interviews</p>
              </div>
          )}
        </div>
      )}

      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        {selectedInterview.location ? <Video size={20}/> : <PhoneCall size={20}/>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedInterview.candidateName}</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase">{selectedInterview.type} Interview</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedInterview(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg">
                    <X size={20} />
                 </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time</p>
                   <p className="text-lg font-bold text-slate-900">{formatTime(selectedInterview.startTime, displayTimezone)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
                   <p className="text-lg font-bold text-slate-900">{new Date(selectedInterview.startTime).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedInterview.location && (
                 <a href={selectedInterview.location} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Video size={18} /> Join Meeting
                 </a>
              )}

              <div className="space-y-2">
                 <h4 className="text-xs font-bold text-slate-400 uppercase">Notes</h4>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-600 leading-relaxed italic">
                    {selectedInterview.notes || "No notes provided."}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex gap-4">
                 <button onClick={() => handleStatusChange(selectedInterview.id, 'Completed')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-600">Complete</button>
                 <button onClick={() => handleStatusChange(selectedInterview.id, 'Cancelled')} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-100">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">New Interview</h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 text-slate-400"><X size={20} /></button>
             </div>
             <form onSubmit={handleCreateInterview} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <select required value={newInt.jobId} onChange={e => setNewInt({...newInt, jobId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium">
                        <option value="">Select Job...</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                    <select required value={newInt.candidateId} onChange={e => setNewInt({...newInt, candidateId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium">
                        <option value="">Select Candidate...</option>
                        {candidates.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newInt.date} onChange={e => setNewInt({...newInt, date: e.target.value})} />
                  <input type="time" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" value={newInt.time} onChange={e => setNewInt({...newInt, time: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-700 shadow-lg">Schedule Interview</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;
