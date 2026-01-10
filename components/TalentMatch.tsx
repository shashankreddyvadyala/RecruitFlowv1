import React, { useState } from 'react';
import { UploadCloud, CheckCircle, Search, MapPin, Briefcase, Zap, Star, ExternalLink, Send, ArrowRight } from 'lucide-react';
import { ExternalJob, CandidateProfile } from '../types';
import { useStore } from '../context/StoreContext';
import { ResumeParserService } from '../services/externalServices';

const TalentMatch: React.FC = () => {
  const { talentProfiles, externalJobs, addTalentProfile } = useStore();
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate AI Matching logic against GLOBAL external jobs
  const getMatchedJobs = (profile: CandidateProfile): ExternalJob[] => {
    // Logic: match based on role/title keywords
    if (!profile) return [];
    
    return externalJobs.filter(job => {
        const titleMatch = job.title.toLowerCase().includes(profile.title.split(' ')[1]?.toLowerCase() || 'engineer');
        // Return mostly valid matches for demo
        return titleMatch || Math.random() > 0.6;
    });
  };

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
        // Create a dummy file for the simulation/demo
        const dummyFile = new File(["content"], "james_resume.pdf", { type: "application/pdf" });
        const newProfile = await ResumeParserService.parseResume(dummyFile);
        
        addTalentProfile(newProfile);
        setSelectedProfile(newProfile);
    } catch(e) {
        console.error("Upload failed", e);
    } finally {
        setIsProcessing(false);
    }
  };

  const matchedJobs = selectedProfile ? getMatchedJobs(selectedProfile) : [];

  return (
    <div className="flex h-full gap-6">
      {/* Left: Talent Inventory */}
      <div className="w-1/3 flex flex-col gap-4">
        {/* Upload Area */}
        <div 
          onClick={handleUpload}
          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all group"
        >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:text-brand-600">
                {isProcessing ? <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full"/> : <UploadCloud size={24} />}
            </div>
            <h3 className="font-semibold text-slate-900">Upload Resumes</h3>
            <p className="text-xs text-slate-500 mt-1">Drag PDF/Docx here to parse into profiles</p>
        </div>

        {/* Profile List */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Talent Bench ({talentProfiles.length})</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {talentProfiles.map(profile => (
                    <div 
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                            selectedProfile?.id === profile.id 
                            ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' 
                            : 'bg-white border-slate-200 hover:border-brand-300'
                        }`}
                    >
                        <img src={profile.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{profile.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{profile.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${profile.status === 'Bench' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-[10px] uppercase font-bold text-slate-400">{profile.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right: Matching Engine */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedProfile ? (
            <>
                {/* Profile Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <img src={selectedProfile.avatarUrl} className="w-16 h-16 rounded-xl shadow-sm" />
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedProfile.name}</h2>
                                <p className="text-slate-500 font-medium flex items-center gap-2">
                                    <Briefcase size={16}/> {selectedProfile.title} • {selectedProfile.experience}y Exp
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                OPEN TO WORK
                             </span>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-4">
                        {selectedProfile.skills.map(s => (
                            <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 font-medium">{s}</span>
                        ))}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {selectedProfile.bio}
                    </p>
                </div>

                {/* Match Feed */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="text-yellow-500 fill-yellow-500" size={18} />
                            AI Matched Opportunities ({matchedJobs.length})
                        </h3>
                        <span className="text-xs text-slate-400">Auto-refreshed 2m ago</span>
                    </div>

                    <div className="overflow-y-auto space-y-3 pr-2">
                        {matchedJobs.map((job, idx) => (
                            <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg border border-slate-100 bg-white flex items-center justify-center font-bold text-lg text-slate-700">
                                            {job.company[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{job.title}</h4>
                                            <p className="text-sm text-slate-600">{job.company} • {job.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-green-600 font-bold text-sm">
                                            <Star size={14} className="fill-green-600" />
                                            {98 - idx * 5}% Match
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">{job.salary}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        Source: {job.source} <ExternalLink size={10} />
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium">
                                            Ignore
                                        </button>
                                        <button className="px-4 py-1.5 bg-slate-900 text-white text-sm rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                                            <Send size={14} /> Auto-Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="text-brand-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Select a Candidate</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    Click on a candidate from your bench to instantly find perfect job matches from across the web.
                </p>
                <button 
                  onClick={handleUpload}
                  className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2"
                >
                    <UploadCloud size={18} /> Upload New Resume
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TalentMatch;