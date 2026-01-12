
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import AgencyDashboard from './components/AgencyDashboard';
import JobBuilder from './components/JobBuilder';
import CandidateView from './components/CandidateView';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import LandingPage from './components/LandingPage';
import JobAggregator from './components/JobAggregator';
import TalentMatch from './components/TalentMatch';
import SettingsPage from './components/SettingsPage';
import UnifiedSearch from './components/UnifiedSearch';
import TeamManagement from './components/RecruiterLeaderboard';
import CandidatePortal from './components/CandidatePortal';
import ProfileSetupPage from './components/ProfileSetupPage';
import AgencyActivityLog from './components/AgencyActivityLog';
import InterviewCalendar from './components/InterviewCalendar';
import NotificationSystem from './components/NotificationSystem';
import { StoreProvider, useStore } from './context/StoreContext';
import { UserRole, Activity } from './types';
import { Bell, UserCircle2, ChevronDown, BellRing, Clock, ArrowRight, Zap, User, FileText, CheckCircle2, Briefcase } from 'lucide-react';

function MainApp({ onLogout }: { onLogout: () => void }) {
  const { userRole, setUserRole, branding, interviews, notify, activities } = useStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Background Alert Checker
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      interviews.forEach(int => {
        if (int.status !== 'Scheduled' || int.reminderSent) return;
        
        const startTime = new Date(int.startTime);
        const diffMs = startTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins > 0 && diffMins <= 15) {
          notify(
            "Upcoming Interview", 
            `Your session with ${int.candidateName} starts in ${diffMins} minutes.`, 
            "warning"
          );
        }
      });
    };

    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [interviews, notify]);

  // Handle outside clicks for notification dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
            setIsNotifOpen(false);
        }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (userRole !== UserRole.Owner && !isProfileComplete) {
      return <ProfileSetupPage role={userRole} onComplete={() => setIsProfileComplete(true)} />;
  }

  if (userRole === UserRole.Candidate) {
      return <CandidatePortal onLogout={onLogout} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardStats onViewCalendar={() => setCurrentView('calendar')} />;
      case 'agency-os':
        return <AgencyDashboard />;
      case 'team':
        return <TeamManagement />;
      case 'activity-log':
        return <AgencyActivityLog />;
      case 'calendar':
        return <InterviewCalendar />;
      case 'jobs':
        return <JobBuilder />;
      case 'job-search':
        return <JobAggregator />;
      case 'talent-market':
        return <TalentMatch />;
      case 'candidates':
        return <CandidateView />;
      case 'settings':
        return <SettingsPage />;
      case 'ai-agents':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 font-sans">
             <div className="p-6 bg-purple-50 rounded-full animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
             </div>
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Autonomous Agents</h2>
             <p className="text-slate-500 max-w-md font-medium">
               Configure your AI Recruiter voice, personality, and schedule constraints for automated phone screening.
             </p>
             <button className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all">
               Configure Voice Agent
             </button>
          </div>
        );
      default:
        return <DashboardStats onViewCalendar={() => setCurrentView('calendar')} />;
    }
  };

  const recentCandidateActivities = activities
    .filter(a => ['ProfileUpdate', 'ResumeUpload', 'JobApplication'].includes(a.type))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
        <NotificationSystem />

        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-lg font-black text-slate-900 capitalize hidden lg:block tracking-tighter uppercase">
              {currentView.replace('-', ' ')}
            </h2>
            <UnifiedSearch />
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
               <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all border border-slate-200 group"
               >
                 <UserCircle2 size={18} className="text-slate-600" />
                 <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    {userRole === UserRole.Owner ? 'Owner' : userRole === UserRole.Recruiter ? 'Recruiter' : 'Candidate'} View
                 </span>
                 <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
               </button>
               {isMenuOpen && (
                 <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                   <button 
                    onClick={() => { setUserRole(UserRole.Owner); setIsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${userRole === UserRole.Owner ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                   >
                     Switch to Owner
                   </button>
                   <button 
                    onClick={() => { setUserRole(UserRole.Recruiter); setIsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${userRole === UserRole.Recruiter ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                   >
                     Switch to Recruiter
                   </button>
                   <div className="h-[1px] bg-slate-100 my-1"></div>
                   <button 
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                   >
                     Logout System
                   </button>
                 </div>
               )}
             </div>

             <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

             {/* Dynamic Notification System */}
             <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`p-2 rounded-xl transition-all relative ${isNotifOpen ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    <Bell size={20} />
                    {recentCandidateActivities.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>
                
                {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Agency Intel</h4>
                            <span className="bg-brand-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{recentCandidateActivities.length} NEW</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {recentCandidateActivities.length > 0 ? (
                                recentCandidateActivities.map(activity => (
                                    <div key={activity.id} className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                                activity.type === 'JobApplication' ? 'bg-purple-50 text-purple-600' :
                                                activity.type === 'ProfileUpdate' ? 'bg-brand-50 text-brand-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {activity.type === 'JobApplication' ? <Zap size={16} /> :
                                                 activity.type === 'ProfileUpdate' ? <User size={16} /> :
                                                 <FileText size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate pr-2">{activity.subject}</p>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter whitespace-nowrap pt-0.5">
                                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-2">
                                                    {activity.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <BellRing size={32} className="mx-auto mb-3 text-slate-100" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No recent alerts</p>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => { setCurrentView('activity-log'); setIsNotifOpen(false); }}
                            className="w-full py-4 text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            Open Command Center <ArrowRight size={12} />
                        </button>
                    </div>
                )}
             </div>
             
             <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-widest">
                   {branding.companyName}
                </span>
             </div>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [loggedRole, setLoggedRole] = useState<UserRole>(UserRole.Owner);

  const handleLogin = (role: UserRole) => {
      setLoggedRole(role);
      setIsLoggedIn(true);
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setAuthView('landing');
  };

  if (!isLoggedIn) {
    if (authView === 'landing') {
        return <LandingPage onLogin={() => setAuthView('login')} onSignup={() => setAuthView('signup')} />;
    }
    if (authView === 'signup') {
      return (
        <SignUpPage 
          onSignup={() => setIsLoggedIn(true)} 
          onNavigateToLogin={() => setAuthView('login')} 
        />
      );
    }
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onNavigateToSignup={() => setAuthView('signup')} 
      />
    );
  }

  return (
    <StoreProvider>
      <StoreRoleWrapper role={loggedRole} onLogout={handleLogout} />
    </StoreProvider>
  );
}

const StoreRoleWrapper = ({ role, onLogout }: { role: UserRole, onLogout: () => void }) => {
    const { setUserRole } = useStore();
    React.useEffect(() => {
        setUserRole(role);
    }, [role, setUserRole]);

    return <MainApp onLogout={onLogout} />;
};

export default App;
