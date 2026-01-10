
import React, { useState } from 'react';
/* Added missing Zap and Clock icons to the lucide-react import list */
import { User, Briefcase, FileText, Upload, Sparkles, ArrowRight, Camera, CheckCircle2, Star, MapPin, Globe, Compass, Timer, DollarSign, Zap, Clock } from 'lucide-react';
import { UserRole } from '../types';
import { useStore } from '../context/StoreContext';

interface ProfileSetupPageProps {
  role: UserRole;
  onComplete: () => void;
}

const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ role, onComplete }) => {
  const { branding } = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    skills: '',
    experience: '5',
    avatarUrl: `https://picsum.photos/200/200?u=${Math.random()}`,
    // New Preference Fields
    preferredRoles: '',
    preferredLocations: '',
    employmentType: 'Full-time',
    workMode: 'Remote',
    salaryExpectation: '',
    availability: 'Immediate'
  });

  const totalSteps = role === UserRole.Candidate ? 4 : 2;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    if (step === 1) return formData.name.length > 2 && formData.title.length > 2;
    if (step === 2) return formData.bio.length > 10;
    if (role === UserRole.Candidate && step === 3) return formData.preferredRoles.length > 2;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-400 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-400 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left: Progress Sidebar */}
        <div className="w-full md:w-80 bg-slate-900 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-12">
               <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-black text-lg">R</div>
               <span className="font-black text-sm uppercase tracking-tighter">{branding.companyName}</span>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-8">
              Complete <br/> Your Profile
            </h2>

            <div className="space-y-6">
              <StepIndicator num={1} label="Basic Identity" active={step === 1} completed={step > 1} />
              <StepIndicator num={2} label="Professional Bio" active={step === 2} completed={step > 2} />
              {role === UserRole.Candidate && (
                <>
                  <StepIndicator num={3} label="Career Goals" active={step === 3} completed={step > 3} />
                  <StepIndicator num={4} label="Skills & Resume" active={step === 4} completed={step > 4} />
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-12">
             <div className="flex items-center gap-2 text-brand-400 mb-2">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Assistant</span>
             </div>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
               Your profile will be automatically enriched by our AI agents to help you stand out to {role === UserRole.Candidate ? 'recruiters' : 'clients'}.
             </p>
          </div>
        </div>

        {/* Right: Form Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">The Essentials</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">Let's start with your professional identity.</p>
                
                <div className="flex flex-col items-center mb-10">
                   <div className="relative group">
                     <img src={formData.avatarUrl} className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-slate-50 transition-transform group-hover:scale-105" alt="Me" />
                     <button className="absolute -bottom-2 -right-2 p-2 bg-brand-600 text-white rounded-xl shadow-lg hover:bg-brand-700 transition-colors">
                        <Camera size={16} />
                     </button>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Profile Portrait</p>
                </div>

                <div className="space-y-6 max-w-md mx-auto">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Display Name</label>
                      <input 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                        placeholder="e.g. Sarah Chen"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Current Job Title</label>
                      <input 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                        placeholder={role === UserRole.Recruiter ? "e.g. Senior Technical Recruiter" : "e.g. Lead React Developer"}
                      />
                   </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Professional Bio</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">Describe your background and expertise.</p>
                
                <div className="space-y-6 max-w-md mx-auto">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">About You</label>
                      <textarea 
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        rows={6}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner resize-none"
                        placeholder="I'm a passionate professional with..."
                      />
                   </div>
                   <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100">
                      <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide leading-relaxed">
                        Tip: Highlight specific results or industries you've worked in. Our AI will use this to find the best job matches.
                      </p>
                   </div>
                </div>
              </div>
            )}

            {step === 3 && role === UserRole.Candidate && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Career Compass</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">Tell us exactly what kind of opportunities you're seeking.</p>
                
                <div className="space-y-6 max-w-md mx-auto">
                   <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                           <Compass size={14} /> Desired Roles
                        </label>
                        <input 
                           value={formData.preferredRoles}
                           onChange={e => setFormData({...formData, preferredRoles: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                           placeholder="e.g. Staff Engineer, Architect (Comma separated)"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                           <MapPin size={14} /> Location Preferences
                        </label>
                        <input 
                           value={formData.preferredLocations}
                           onChange={e => setFormData({...formData, preferredLocations: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                           placeholder="e.g. London, Austin, Remote"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                               <Timer size={14} /> Work Mode
                            </label>
                            <select 
                               value={formData.workMode}
                               onChange={e => setFormData({...formData, workMode: e.target.value})}
                               className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner appearance-none uppercase"
                            >
                               <option>Remote</option>
                               <option>Hybrid</option>
                               <option>On-site</option>
                               <option>Any</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                               <Zap size={14} /> Agreement
                            </label>
                            <select 
                               value={formData.employmentType}
                               onChange={e => setFormData({...formData, employmentType: e.target.value})}
                               className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner appearance-none uppercase"
                            >
                               <option>Full-time</option>
                               <option>Contract</option>
                               <option>Any</option>
                            </select>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                               <DollarSign size={14} /> Min Salary
                            </label>
                            <input 
                               value={formData.salaryExpectation}
                               onChange={e => setFormData({...formData, salaryExpectation: e.target.value})}
                               className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                               placeholder="e.g. $150k+"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-2">
                               <Clock size={14} /> Availability
                            </label>
                            <select 
                               value={formData.availability}
                               onChange={e => setFormData({...formData, availability: e.target.value})}
                               className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner appearance-none uppercase"
                            >
                               <option>Immediate</option>
                               <option>2 Weeks</option>
                               <option>1 Month</option>
                               <option>Exploring</option>
                            </select>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {((role === UserRole.Candidate && step === 4) || (role !== UserRole.Candidate && step === 3)) && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Skills & Assets</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium">Final details to complete your application readiness.</p>
                
                <div className="space-y-6 max-w-md mx-auto">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Skills (Keywords)</label>
                      <input 
                        value={formData.skills}
                        onChange={e => setFormData({...formData, skills: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold shadow-inner"
                        placeholder="React, TypeScript, Figma..."
                      />
                   </div>
                   
                   <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-center hover:border-brand-500 transition-colors group cursor-pointer bg-slate-50/50">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                         <Upload className="text-slate-400 group-hover:text-brand-600" />
                      </div>
                      <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">Upload CV / Resume</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">PDF or Word (Max 5MB)</p>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex justify-between items-center">
            <button 
              onClick={handlePrev}
              disabled={step === 1}
              className={`text-xs font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Back
            </button>
            <button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-3"
            >
              {step === totalSteps ? 'Finish Onboarding' : 'Next Step'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ num, label, active, completed }: { num: number, label: string, active: boolean, completed: boolean }) => (
  <div className={`flex items-center gap-4 transition-all ${active ? 'opacity-100 translate-x-1' : 'opacity-40'}`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border-2 transition-all ${completed ? 'bg-brand-600 border-brand-600 text-white' : active ? 'border-white text-white' : 'border-white/20 text-white/50'}`}>
      {completed ? <CheckCircle2 size={16} /> : num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
  </div>
);

export default ProfileSetupPage;
