
import React, { useState } from 'react';
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
import CRMView from './components/CRMView';
import UnifiedSearch from './components/UnifiedSearch';
import RecruiterLeaderboard from './components/RecruiterLeaderboard';
import { StoreProvider, useStore } from './context/StoreContext';
import { UserRole } from './types';
import { Bell, HelpCircle, UserCircle2, ChevronDown } from 'lucide-react';

function MainApp() {
  const { userRole, setUserRole, branding } = useStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardStats />;
      case 'crm':
        return <CRMView />;
      case 'agency-os':
        return <AgencyDashboard />;
      case 'team':
        return <RecruiterLeaderboard />;
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
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
             <div className="p-6 bg-purple-50 rounded-full animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Autonomous Agents</h2>
             <p className="text-slate-500 max-w-md">
               Configure your AI Recruiter voice, personality, and schedule constraints for automated phone screening.
             </p>
             <button className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-xl shadow-purple-200">
               Configure Voice Agent
             </button>
          </div>
        );
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-xl font-bold text-slate-900 capitalize hidden lg:block">
              {currentView.replace('-', ' ')}
            </h2>
            <UnifiedSearch />
          </div>

          <div className="flex items-center gap-4">
             {/* Role Switcher (For Demo Purposes) */}
             <div className="relative">
               <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all border border-slate-200 group"
               >
                 <UserCircle2 size={18} className="text-slate-600" />
                 <span className="text-xs font-bold text-slate-700">{userRole === UserRole.Owner ? 'Owner View' : 'Recruiter View'}</span>
                 <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
               </button>
               {isMenuOpen && (
                 <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                   <button 
                    onClick={() => { setUserRole(UserRole.Owner); setIsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${userRole === UserRole.Owner ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
                   >
                     Switch to Agency Owner
                   </button>
                   <button 
                    onClick={() => { setUserRole(UserRole.Recruiter); setIsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${userRole === UserRole.Recruiter ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
                   >
                     Switch to Recruiter
                   </button>
                 </div>
               )}
             </div>

             <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             
             <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase">
                   {branding.companyName}
                </span>
             </div>
          </div>
        </header>

        {/* Content Area */}
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
        onLogin={() => setIsLoggedIn(true)} 
        onNavigateToSignup={() => setAuthView('signup')} 
      />
    );
  }

  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}

export default App;
