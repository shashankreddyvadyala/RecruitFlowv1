
import React, { useState, useEffect, useRef } from 'react';
import { Save, Cpu, Palette, Globe, Megaphone, Trash2, Image as ImageIcon, Upload, Mail, Type, User, Briefcase, Sparkles, Fingerprint, Lock } from 'lucide-react';
import { getApiKey, setApiKey } from '../services/externalServices';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

const SettingsPage: React.FC = () => {
  const { branding, updateBranding, recruiterSettings, updateRecruiterSettings, userRole, notify } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keys, setKeys] = useState({
    BRIGHTDATA: '',
    AFFINDA: '',
    PROXYCURL: '',
    RESEND: '',
    VAPI: ''
  });

  const isOwner = userRole === UserRole.Owner;
  const isRecruiter = userRole === UserRole.Recruiter;

  useEffect(() => {
    setKeys({
      BRIGHTDATA: getApiKey('BRIGHTDATA') || '',
      AFFINDA: getApiKey('AFFINDA') || '',
      PROXYCURL: getApiKey('PROXYCURL') || '',
      RESEND: getApiKey('RESEND') || '',
      VAPI: getApiKey('VAPI') || ''
    });
  }, []);

  const handleChangeKey = (service: string, value: string) => {
    setKeys(prev => ({ ...prev, [service]: value }));
  };

  const handleSaveKeys = () => {
    Object.entries(keys).forEach(([service, key]) => {
      setApiKey(service, key as string);
    });
    notify("Configuration Saved", "API Infrastructure keys updated.", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBranding({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    if (isOwner) fileInputRef.current?.click();
  };

  const handleBrandingSave = () => {
      notify("Branding Updated", "Agency identity settings have been synchronized.", "success");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Agency Branding (Owner & Recruiter) */}
      {(isOwner || isRecruiter) && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                  <Palette size={32} className="text-brand-600"/> 
                  Agency Identity & Branding
              </h2>
              <p className="text-slate-500 font-medium mt-2">
                {isOwner ? "Customize your professional presence across all communication channels." : "Review agency-wide identity and branding settings."}
              </p>
            </div>
            {isOwner ? (
                <button 
                    onClick={handleBrandingSave}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                   <Save size={18} /> Update Branding
                </button>
            ) : (
                <div className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} /> Locked by Admin
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            <div className={`xl:col-span-7 space-y-8 ${!isOwner ? 'opacity-70 pointer-events-none' : ''}`}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Agency Name</label>
                    <input 
                        type="text" 
                        readOnly={!isOwner}
                        value={branding.companyName}
                        onChange={(e) => updateBranding({ companyName: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-bold shadow-inner"
                        placeholder="e.g. TalentPulse AI"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Brand Tagline</label>
                    <input 
                        type="text" 
                        readOnly={!isOwner}
                        value={branding.tagline}
                        onChange={(e) => updateBranding({ tagline: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-bold shadow-inner"
                        placeholder="e.g. Modernizing Global Recruitment"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Agency Logo</label>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                readOnly={!isOwner}
                                value={branding.logoUrl}
                                onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-bold text-sm shadow-inner"
                                placeholder="Paste logo URL or upload below..."
                            />
                        </div>
                        {branding.logoUrl && (
                            <div className="w-14 h-14 border border-slate-200 rounded-2xl flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-sm">
                                <img src={branding.logoUrl} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain" />
                            </div>
                        )}
                    </div>
                    
                    {isOwner && (
                        <div className="flex items-center gap-4">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileUpload}
                            />
                            <button 
                                onClick={triggerFileUpload}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Upload size={16} /> Upload Local File
                            </button>
                            {branding.logoUrl && (
                                <button 
                                    onClick={() => updateBranding({ logoUrl: '' })}
                                    className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    )}
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Mail size={16} className="text-brand-600" /> Outreach Settings
                  </h3>
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Sender Email Address</label>
                        <input 
                            type="email" 
                            readOnly={!isOwner}
                            value={branding.senderEmail || ''}
                            onChange={(e) => updateBranding({ senderEmail: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-bold shadow-inner"
                            placeholder="outreach@youragency.com"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Email Signature</label>
                        <textarea 
                            readOnly={!isOwner}
                            value={branding.signature || ''}
                            onChange={(e) => updateBranding({ signature: e.target.value })}
                            rows={4}
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-medium shadow-inner resize-none text-sm"
                            placeholder="Your professional signature..."
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Branding Preview */}
            <div className="xl:col-span-5">
                <div className="sticky top-24 space-y-6">
                    <SignaturePreview 
                        companyName={branding.companyName} 
                        tagline={branding.tagline} 
                        logoUrl={branding.logoUrl} 
                        signature={branding.signature || 'Best regards,\nAlex Morgan'} 
                    />
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Tech Configuration (Owner Only) */}
      {isOwner && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                  <Cpu size={28} className="text-brand-600"/> 
                  AI & Infrastructure Nodes
              </h2>
              <p className="text-slate-500 font-medium mt-2">
                Authorize core API connections to enable global talent scraping and autonomous agents.
              </p>
            </div>
            <button 
              onClick={handleSaveKeys}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
                <Save size={18} /> Save Credentials
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">BrightData / Market Scraper</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Production</span>
                </label>
                <input 
                    type="password" 
                    value={keys.BRIGHTDATA}
                    onChange={e => handleChangeKey('BRIGHTDATA', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm shadow-inner"
                    placeholder="Enter Scraper API Token"
                />
                <p className="text-[10px] text-slate-400 italic px-1">Required for live market discovery across LinkedIn, Indeed, and Dice.</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Affinda CV Parser</span>
                    <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded">Neural Node</span>
                </label>
                <input 
                    type="password" 
                    value={keys.AFFINDA}
                    onChange={e => handleChangeKey('AFFINDA', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm shadow-inner"
                    placeholder="Enter Affinda Key"
                />
                <p className="text-[10px] text-slate-400 italic px-1">High-fidelity PDF/DOCX extraction for building talent graphs.</p>
              </div>
               <div className="space-y-2">
                <label className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resend / Outreach Engine</span>
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Transmission</span>
                </label>
                <input 
                    type="password" 
                    value={keys.RESEND}
                    onChange={e => handleChangeKey('RESEND', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm shadow-inner"
                    placeholder="re_..."
                />
                <p className="text-[10px] text-slate-400 italic px-1">Native delivery node for autonomous email sequence deployment.</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vapi.ai Voice Interface</span>
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded">Voice AI</span>
                </label>
                <input 
                    type="password" 
                    value={keys.VAPI}
                    onChange={e => handleChangeKey('VAPI', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm shadow-inner"
                    placeholder="Enter Vapi API Key"
                />
                <p className="text-[10px] text-slate-400 italic px-1">Autonomous phone screening call orchestration.</p>
              </div>
          </div>

          <div className="mt-12 bg-slate-950 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 rounded-full blur-[80px] opacity-10"></div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-brand-400">
                  <Globe size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                  <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1">Global Compliance Engine</h4>
                  <p className="text-slate-400 text-xs font-medium">RecruitFlow automatically handles regional tax calculations and GDPR/CCPA data residency protocols based on these connection nodes.</p>
              </div>
              <div className="bg-brand-600/10 border border-brand-600/20 px-4 py-2 rounded-xl text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">
                  System Status: Online
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SignaturePreview = ({ companyName, tagline, logoUrl, signature }: any) => (
    <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24 pointer-events-none"></div>
        
        <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Fingerprint size={20} /> Signature Preview
        </p>

        <div className="bg-white rounded-3xl shadow-2xl p-8 font-serif">
            <div className="flex flex-col gap-6">
                {/* Signature Text Section */}
                <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed italic border-l-2 border-slate-100 pl-6">
                    {signature}
                </div>
                
                {/* Agency Brand Block */}
                <div className="flex items-center gap-5 pt-6 border-t border-slate-50">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Agency Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-2xl font-black text-brand-600">{companyName[0] || 'R'}</span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{companyName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-tight mb-2">{tagline}</p>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[9px] font-black text-brand-400 uppercase tracking-[0.3em]">Live Synchronization Active</p>
        </div>
    </div>
);

export default SettingsPage;
