
import React, { useState, useEffect } from 'react';
import { Save, Cpu, Palette, Globe, Megaphone, Trash2 } from 'lucide-react';
import { getApiKey, setApiKey } from '../services/externalServices';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

const SettingsPage: React.FC = () => {
  const { branding, updateBranding, userRole } = useStore();
  const [keys, setKeys] = useState({
    BRIGHTDATA: '',
    AFFINDA: '',
    PROXYCURL: '',
    RESEND: '',
    VAPI: ''
  });

  const isOwner = userRole === UserRole.Owner;

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
    alert('Infrastructure Configuration Saved');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Agency Branding (Owner Only) */}
      {isOwner && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Palette size={24} className="text-brand-600"/> 
                  Agency Identity & Branding
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Customize how your agency appears to clients and candidates.
              </p>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
               <Save size={18} /> Update Branding
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Agency Name</label>
                  <input 
                    type="text" 
                    value={branding.companyName}
                    onChange={(e) => updateBranding({ companyName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-medium"
                    placeholder="e.g. TalentPulse AI"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Brand Tagline</label>
                  <input 
                    type="text" 
                    value={branding.tagline}
                    onChange={(e) => updateBranding({ tagline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-medium"
                    placeholder="e.g. Modernizing Global Recruitment"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Primary Color</label>
                  <div className="flex gap-4 items-center">
                     <input 
                        type="color" 
                        value={branding.primaryColor}
                        onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                        className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1"
                     />
                     <input 
                        type="text" 
                        value={branding.primaryColor}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                        readOnly
                     />
                  </div>
               </div>
            </div>

            {/* Branding Preview */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
               <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Megaphone size={12} /> Email Preview
               </p>
               
               <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: branding.primaryColor }}>
                        {branding.companyName[0]}
                     </div>
                     <p className="font-bold text-slate-900 text-sm">{branding.companyName}</p>
                  </div>
                  <div className="space-y-2 mb-6">
                     <div className="h-2 w-full bg-slate-100 rounded"></div>
                     <div className="h-2 w-4/5 bg-slate-100 rounded"></div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                     <p className="text-[10px] font-bold text-slate-900">Alex Morgan</p>
                     <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{branding.tagline}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Tech Configuration */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Cpu size={24} className="text-brand-600"/> 
                AI & Infrastructure Configuration
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Connect your account to real-world APIs to enable production-grade recruiting.
            </p>
          </div>
          <button 
            onClick={handleSaveKeys}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
          >
              <Save size={18} /> Save Keys
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">BrightData / Scraper API</label>
              <p className="text-xs text-slate-500 mb-2">Required for live Job Aggregation & Scraping.</p>
              <input 
                  type="password" 
                  value={keys.BRIGHTDATA}
                  onChange={e => handleChangeKey('BRIGHTDATA', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                  placeholder="Enter API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Affinda (Resume Parser)</label>
              <p className="text-xs text-slate-500 mb-2">High-accuracy CV parsing for Talent Market.</p>
              <input 
                  type="password" 
                  value={keys.AFFINDA}
                  onChange={e => handleChangeKey('AFFINDA', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                  placeholder="Enter API Key"
              />
            </div>
             <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Resend / Email Outreach</label>
              <p className="text-xs text-slate-500 mb-2">Autonomous email sequence delivery.</p>
              <input 
                  type="password" 
                  value={keys.RESEND}
                  onChange={e => handleChangeKey('RESEND', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                  placeholder="re_..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">Vapi.ai (Voice AI)</label>
              <p className="text-xs text-slate-500 mb-2">Public key for autonomous phone screening.</p>
              <input 
                  type="password" 
                  value={keys.VAPI}
                  onChange={e => handleChangeKey('VAPI', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                  placeholder="Enter API Key"
              />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
