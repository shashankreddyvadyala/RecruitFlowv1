
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
  MessageSquareText
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Interview, Candidate } from '../types';

const TIMEZONES = [
  { label: 'UTC (Universal)', value: 'UTC' },
  { label: 'PST (Pacific)', value: 'America/Los_Angeles' },
  { label: 'EST (Eastern)', value: 'America/New_York' },
  { label: 'GMT (London)', value: 'Europe/London' },
  { label: 'IST (India)', value: 'Asia/Kolkata' },
  { label: 'SGT (Singapore)', value: 'Asia/Singapore' },
  { label: 'AEST (Sydney)', value: 'Australia/Sydney' },
];

const InterviewCalendar: React.FC = () => {
  const { interviews, candidates, updateInterviewStatus, addInterview, notify } = useStore();
  const [viewDate, setViewDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'Month' | 'Agenda'>('Agenda');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');

  // New Interview Form State
  const [newInt, setNewInt] = useState({
    candidateId: '',
    type: 'Technical' as Interview['type'],
    date: '',
    time: '',
    interviewer: 'Alex Morgan',
    candidateTimezone: 'UTC',
    location: '', 
    includeMeetingLink: true
  });

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleStatusChange = (id: string, status: Interview['status']) => {
    updateInterviewStatus(id, status);
  };

  const handleManualPing = (type: 'late' | 'ready') => {
    if (!selectedInterview) return;
    const msg = type === 'late' ? "is running 5-10 minutes late." : "is ready and waiting in the meeting room.";
    notify(
      "Ping Sent", 
      `Candidate ${selectedInterview.candidateName} notified that the interviewer ${msg}`, 
      "info"
    );
  };

  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = candidates.find(c => c.id === newInt.candidateId);
    if (!candidate || !newInt.date || !newInt.time) return;

    const start = new Date(`${newInt.date}T${newInt.time}`);
    const end = new Date(start.getTime() + 45 * 60 * 1000);

    const interview: Interview = {
      id: `int_${Date.now()}`,
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      jobId: 'j1',
      jobTitle: candidate.role,
      interviewerName: newInt.interviewer,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: newInt.includeMeetingLink ? (newInt.location || 'https://meet.google.com/abc-def-ghi') : undefined,
      status: 'Scheduled',
      type: newInt.type,
      notes: '',
      candidateTimezone: newInt.candidateTimezone
    };

    addInterview(interview);
    setShowScheduleModal(false);
    
    notify(
      "Global Sync Complete", 
      `Interview scheduled. Candidate alert set for ${formatTime(interview.startTime, interview.candidateTimezone!)} (${interview.candidateTimezone!.split('/').pop()}).`, 
      "success"
    );

    setNewInt({ 
      candidateId: '', 
      type: 'Technical', 
      date: '', 
      time: '', 
      interviewer: 'Alex Morgan', 
      candidateTimezone: 'UTC', 
      location: '',
      includeMeetingLink: true
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
        return "Time Error";
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

  const sortedInterviews = useMemo(() => {
    return [...interviews]
      .filter(i => statusFilter === 'All' || i.status === statusFilter)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, statusFilter]);

  // Derived selected candidate for the preparation panel
  const activeCandidate = useMemo(() => 
    selectedInterview ? candidates.find(c => c.id === selectedInterview.candidateId) : null
  , [selectedInterview, candidates]);

  const isSoon = (startTime: string) => {
      const diff = new Date(startTime).getTime() - Date.now();
      return diff > 0 && diff < 15 * 60 * 1000; // 15 mins
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <CalendarIcon size={24} />
             </div>
             Interview Hub
          </h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px] ml-16">Zero-confuse Global Coordination Engine</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm group">
            <Globe size={14} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            <select 
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent text-slate-700 cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button onClick={() => setActiveTab('Month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Month' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Month</button>
             <button onClick={() => setActiveTab('Agenda')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Agenda' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Agenda</button>
          </div>

          <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center gap-2">
            <Plus size={16} /> Schedule Session
          </button>
        </div>
      </div>

      {activeTab === 'Agenda' ? (
        <div className="space-y-4 max-w-4xl mx-auto pb-20">
          {sortedInterviews.map((int, idx) => {
            const startDate = new Date(int.startTime);
            const isFirstOfDate = idx === 0 || new Date(sortedInterviews[idx-1].startTime).toDateString() !== startDate.toDateString();
            const startingSoon = isSoon(int.startTime);

            return (
              <div key={int.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {isFirstOfDate && (
                  <div className="mt-12 mb-4 px-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                      {formatDate(int.startTime, displayTimezone)}
                      <div className="h-[1px] bg-slate-200 flex-1"></div>
                    </h4>
                  </div>
                )}

                <div 
                  onClick={() => setSelectedInterview(int)}
                  className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group flex items-start gap-8 relative overflow-hidden ${
                      startingSoon ? 'border-brand-500 ring-4 ring-brand-50 shadow-2xl scale-[1.02]' : 'border-slate-200 hover:shadow-xl hover:border-brand-100'
                  }`}
                >
                  {startingSoon && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 animate-pulse"></div>
                  )}

                  <div className="w-28 pt-1 shrink-0">
                    <p className="text-xl font-black text-slate-900">{formatTime(int.startTime, displayTimezone)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Recruiter Time</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-brand-600 italic">{formatTime(int.startTime, int.candidateTimezone || 'UTC')}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Candidate Time</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase group-hover:text-brand-600 transition-colors leading-none">
                          {int.candidateName}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {int.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                               for {int.jobTitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            int.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            int.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-brand-50 text-brand-600 border-brand-100 shadow-sm'
                          }`}>
                            {int.status}
                          </span>
                          {startingSoon && (
                              <span className="flex items-center gap-1.5 text-brand-600 text-[10px] font-black animate-pulse">
                                  <Timer size={12} /> STARTING SOON
                              </span>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                           <User size={14} />
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Recruiter</p>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{int.interviewerName}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                           {int.location ? <Video size={14} /> : <PhoneCall size={14} />}
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Channel</p>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {int.location ? 'Virtual Meeting Room' : 'Direct Phone Screen'}
                            </span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 border-dashed max-w-4xl mx-auto shadow-inner">
             <CalendarIcon size={64} className="mx-auto text-slate-100 mb-6" />
             <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Monthly view disabled</h3>
             <p className="text-slate-400 mt-2 font-medium">Use the Agenda tab for dual-timezone precision tracking.</p>
        </div>
      )}

      {/* Detail Modal with Briefing Sidebar */}
      {selectedInterview && activeCandidate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]">
             
             {/* Left: Metadata & Actions */}
             <div className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-brand-600/30">
                         {selectedInterview.location ? <Video size={28} /> : <PhoneCall size={28} />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Interview Brief</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Globe size={10} /> Precision Sync: Active
                        </p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedInterview(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                     <X size={24} />
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Schedule Timing</p>
                      <div className="space-y-4">
                         <div>
                            <p className="text-lg font-black text-slate-900">{formatTime(selectedInterview.startTime, displayTimezone)}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Your Local Time</p>
                         </div>
                         <div className="pt-4 border-t border-slate-200">
                            <p className="text-lg font-black text-brand-600">{formatTime(selectedInterview.startTime, selectedInterview.candidateTimezone || 'UTC')}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Candidate Local Time ({selectedInterview.candidateTimezone?.split('/').pop()})</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                      <div className="p-6 bg-brand-50 rounded-[2rem] border border-brand-100">
                         <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">Session Protocol</p>
                         <p className="text-lg font-black text-slate-900 uppercase">{selectedInterview.type}</p>
                         <p className="text-[9px] font-bold text-brand-700 uppercase mt-2">Verified Slot • 45 Minutes</p>
                      </div>
                      
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Operational Alerts</p>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleManualPing('ready')}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                            >
                               <Zap size={14} className="text-brand-400" /> I'm Ready
                            </button>
                            <button 
                              onClick={() => handleManualPing('late')}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                               <Clock size={14} className="text-orange-400" /> Running Late
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Coordination Channel</h4>
                   {selectedInterview.location ? (
                        <a 
                          href={selectedInterview.location} 
                          target="_blank" 
                          className="flex items-center justify-between p-6 bg-white border border-slate-200 text-slate-900 rounded-[2rem] group active:scale-[0.98] transition-all hover:bg-slate-50 shadow-sm"
                        >
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-brand-100 rounded-xl text-brand-600"><Video size={24} /></div>
                              <div>
                                 <span className="text-xs font-black uppercase tracking-widest block">Virtual Meeting Active</span>
                                 <p className="text-[10px] text-slate-400 font-bold">Auto-generated Google Meet Room</p>
                              </div>
                           </div>
                           <ExternalLink size={20} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                        </a>
                      ) : (
                        <div className="p-6 bg-slate-50 border border-slate-100 text-slate-400 rounded-[2rem] text-center flex flex-col items-center gap-2">
                           <PhoneCall size={24} className="text-slate-300" />
                           <span className="text-xs font-black uppercase tracking-widest italic">In-Person or Direct Phone screen</span>
                           <p className="text-[10px] font-bold">Candidate: {activeCandidate.email}</p>
                        </div>
                      )}
                </div>

                <div className="flex gap-4 mt-10">
                   <button 
                    onClick={() => { handleStatusChange(selectedInterview.id, 'Completed'); setSelectedInterview(null); }}
                    className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20"
                   >
                     Log Completion
                   </button>
                   <button 
                    onClick={() => { handleStatusChange(selectedInterview.id, 'Cancelled'); setSelectedInterview(null); }}
                    className="px-8 py-5 bg-white text-red-500 border border-red-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                   >
                     Cancel
                   </button>
                </div>
             </div>

             {/* Right: Prep Briefing Sidebar */}
             <div className="w-full md:w-[380px] bg-slate-900 p-10 text-white flex flex-col border-l border-white/5">
                <div className="mb-10">
                   <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                     <Sparkles size={14} /> Quick-Prep Briefing
                   </h4>
                   <div className="flex items-center gap-4 mb-8">
                      <img src={activeCandidate.avatarUrl} className="w-20 h-20 rounded-[2rem] border-4 border-white/10 shadow-2xl" />
                      <div>
                         <p className="text-xl font-black uppercase leading-none mb-1">{activeCandidate.firstName}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{activeCandidate.role}</p>
                         <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase">{activeCandidate.matchScore}% Match</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Skills</p>
                         <div className="flex flex-wrap gap-2">
                            {activeCandidate.skills.slice(0, 4).map(s => (
                               <span key={s} className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase border border-white/10">{s}</span>
                            ))}
                         </div>
                      </div>

                      <div>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MessageSquareText size={12} /> Recruiter Intelligence
                         </p>
                         <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10">
                            <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                               "{activeCandidate.notes || "No internal notes provided for this candidate yet."}"
                            </p>
                         </div>
                      </div>

                      <div>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Send size={12} /> Quick Links
                         </p>
                         <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-colors border border-white/5">
                               <FileText size={12} /> Resume
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-colors border border-white/5">
                               <Globe size={12} /> LinkedIn
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <Timer size={12} /> Last Alert: {selectedInterview.lastPingSent ? new Date(selectedInterview.lastPingSent).toLocaleTimeString() : 'None Sent'}
                    </div>
                    <button 
                      onClick={() => notify("Alert Resent", "Candidate has been reminded of the session via Email/Portal.", "success")}
                      className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all"
                    >
                      Resend Candidate Alert
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal Updated with optional Link logic */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl">
                     <CalendarCheck size={24} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sync New Session</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Dispatch Protocol</p>
                   </div>
                 </div>
                 <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                   <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleCreateInterview} className="p-10 space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Select Talent</label>
                    <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-600 transition-colors" size={20} />
                        <select 
                          required
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-sm shadow-inner appearance-none uppercase tracking-tight"
                          value={newInt.candidateId}
                          onChange={(e) => setNewInt({...newInt, candidateId: e.target.value})}
                        >
                           <option value="">Select Candidate...</option>
                           {candidates.map(c => (
                             <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.role})</option>
                           ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Meeting Date</label>
                      <input 
                        type="date"
                        required
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-sm shadow-inner"
                        value={newInt.date}
                        onChange={(e) => setNewInt({...newInt, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Recruiter Start</label>
                      <input 
                        type="time"
                        required
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-sm shadow-inner"
                        value={newInt.time}
                        onChange={(e) => setNewInt({...newInt, time: e.target.value})}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Talent Timezone</label>
                        <div className="relative">
                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <select 
                                required
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-[10px] shadow-inner appearance-none uppercase tracking-widest"
                                value={newInt.candidateTimezone}
                                onChange={(e) => setNewInt({...newInt, candidateTimezone: e.target.value})}
                            >
                                {TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Classification</label>
                        <select 
                            required
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-[10px] shadow-inner appearance-none uppercase tracking-widest"
                            value={newInt.type}
                            onChange={(e) => setNewInt({...newInt, type: e.target.value as any})}
                        >
                            <option>Technical</option>
                            <option>Screening</option>
                            <option>Behavioral</option>
                            <option>Final</option>
                        </select>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${newInt.includeMeetingLink ? 'bg-brand-600' : 'bg-slate-200'}`}>
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={newInt.includeMeetingLink}
                                onChange={e => setNewInt({...newInt, includeMeetingLink: e.target.checked})}
                            />
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${newInt.includeMeetingLink ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enable Virtual Room Link</span>
                    </label>

                    {newInt.includeMeetingLink && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                             <input 
                                type="url"
                                placeholder="Custom link (e.g. https://meet.google.com/xyz)"
                                className="w-full px-6 py-4 bg-slate-50 border border-brand-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-mono shadow-sm"
                                value={newInt.location}
                                onChange={e => setNewInt({...newInt, location: e.target.value})}
                             />
                             <p className="text-[9px] text-slate-400 mt-3 italic font-medium px-2">Leave blank to use agency default virtual room.</p>
                        </div>
                    )}
                 </div>

                 <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                    <BellRing className="text-emerald-500 shrink-0 mt-1" size={24} />
                    <div>
                        <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wide">Sync-Alerts Ready</p>
                        <p className="text-[10px] font-bold text-emerald-700 leading-relaxed mt-1">
                            The candidate will receive invitations normalized to their local timezone ({newInt.candidateTimezone.split('/').pop()?.replace('_',' ')}).
                        </p>
                    </div>
                 </div>

                 <button 
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all hover:bg-slate-800"
                 >
                    Lock Session & Dispatch
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCalendar;
