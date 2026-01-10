
import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, ShieldCheck, Briefcase, Zap } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  onNavigateToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Owner);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API authentication request
    setTimeout(() => {
      setIsLoading(false);
      onLogin(role);
    }, 1200);
  };

  const getRoleDescription = () => {
    switch(role) {
      case UserRole.Owner: return "Full control over agency branding, team performance, and high-level operations.";
      case UserRole.Recruiter: return "Focus on sourcing, talent matching, and closing active job orders.";
      case UserRole.Candidate: return "Update your profile, track applications, and engage with AI agents.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-brand-100 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg p-4 relative z-10">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-600/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-black text-3xl">R</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Sign In</h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">Access your autonomous recruiting hub</p>
          </div>

          <div className="mb-10">
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
              <button 
                type="button"
                onClick={() => setRole(UserRole.Owner)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${role === UserRole.Owner ? 'bg-white shadow-xl text-brand-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Owner</span>
              </button>
              <button 
                type="button"
                onClick={() => setRole(UserRole.Recruiter)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${role === UserRole.Recruiter ? 'bg-white shadow-xl text-brand-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Briefcase size={20} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Recruiter</span>
              </button>
              <button 
                type="button"
                onClick={() => setRole(UserRole.Candidate)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${role === UserRole.Candidate ? 'bg-white shadow-xl text-brand-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <User size={20} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Candidate</span>
              </button>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 text-center animate-in fade-in slide-in-from-top-1">
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                {getRoleDescription()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Identity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-brand-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300 shadow-inner"
                  placeholder="name@recruitflow.ai"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security</label>
                <a href="#" className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest">Forgot Access?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-brand-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-900 font-bold text-sm placeholder:text-slate-300 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex justify-center items-center py-5 px-4 rounded-2xl shadow-2xl shadow-brand-600/30 text-xs font-black uppercase tracking-[0.2em] text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Enter Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Don't have an agency?{' '}
              <button onClick={onNavigateToSignup} className="text-brand-600 hover:text-brand-700 font-black">
                Join the Network
              </button>
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-400 opacity-60">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 opacity-60">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Gemini 3 Pro</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
