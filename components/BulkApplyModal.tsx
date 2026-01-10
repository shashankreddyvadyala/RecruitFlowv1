
import React, { useState, useEffect } from 'react';
import { Candidate, Portal, SubmissionTracker, ApplicationMaterials } from '../types';
import { generateApplicationMaterials } from '../services/geminiService';
import { CheckCircle, ExternalLink, Loader, X, Shield, Play, Send, Copy, AlertCircle, FileText } from 'lucide-react';

interface BulkApplyModalProps {
  candidate: Candidate;
  onClose: () => void;
}

// The 11 Portals defined in the spec
const PORTALS: Portal[] = [
    { id: 'dice', name: 'Dice', type: 'Web', baseUrl: 'https://www.dice.com/jobs?q=', logoInitial: 'D', color: 'bg-red-600' },
    { id: 'indeed', name: 'Indeed', type: 'Web', baseUrl: 'https://www.indeed.com/jobs?q=', logoInitial: 'I', color: 'bg-blue-600' },
    { id: 'zip', name: 'ZipRecruiter', type: 'Web', baseUrl: 'https://www.ziprecruiter.com/jobs-search?search=', logoInitial: 'Z', color: 'bg-green-600' },
    { id: 'monster', name: 'Monster', type: 'Web', baseUrl: 'https://www.monster.com/jobs/search?q=', logoInitial: 'M', color: 'bg-purple-600' },
    { id: 'glassdoor', name: 'Glassdoor', type: 'Web', baseUrl: 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=', logoInitial: 'G', color: 'bg-emerald-600' },
    { id: 'linkedin', name: 'LinkedIn', type: 'Web', baseUrl: 'https://www.linkedin.com/jobs/search?keywords=', logoInitial: 'L', color: 'bg-blue-700' },
    { id: 'judge', name: 'The Judge Group', type: 'Email', baseUrl: 'mailto:recruiting@judge.com', logoInitial: 'J', color: 'bg-slate-700' },
    { id: 'horizontal', name: 'Horizontal IT', type: 'Web', baseUrl: 'https://www.horizontal.com/staffing/find-jobs?q=', logoInitial: 'H', color: 'bg-orange-500' },
    { id: 'tek', name: 'TEKsystems', type: 'Web', baseUrl: 'https://www.teksystems.com/en/careers/search-jobs?keyword=', logoInitial: 'T', color: 'bg-blue-900' },
    { id: 'yoh', name: 'Yoh', type: 'Web', baseUrl: 'https://jobs.yoh.com/jobs?keywords=', logoInitial: 'Y', color: 'bg-cyan-600' },
    { id: 'c4', name: 'C4 TechServices', type: 'Email', baseUrl: 'mailto:jobs@c4techservices.com', logoInitial: 'C', color: 'bg-indigo-600' },
];

const BulkApplyModal: React.FC<BulkApplyModalProps> = ({ candidate, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Consent, 2: AI Prep, 3: Execution
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<ApplicationMaterials | null>(null);
  
  const [submissions, setSubmissions] = useState<SubmissionTracker[]>(
    PORTALS.map(p => ({ portalId: p.id, status: 'Pending' }))
  );

  // --- Step 2: AI Generation ---
  const handleGenerateAssets = async () => {
    setStep(2);
    setIsLoading(true);
    try {
        // Simulating context of "Generic Software Role" for this bulk apply
        const mat = await generateApplicationMaterials(candidate, candidate.role, "Tech Companies (Bulk)");
        setMaterials(mat);
        setTimeout(() => {
            setIsLoading(false);
            setStep(3);
        }, 1500); // Slight delay for UX
    } catch (e) {
        console.error(e);
        alert("Failed to generate assets. Check API Key.");
        setIsLoading(false);
        setStep(1); // Go back
    }
  };

  // --- Step 3: Execution ---
  const handleOpenLink = (portal: Portal) => {
    let url = '';
    
    if (portal.type === 'Email') {
        const subject = encodeURIComponent(`Application for ${candidate.role} - ${candidate.firstName} ${candidate.lastName}`);
        const body = encodeURIComponent(materials?.coverLetter || '');
        url = `${portal.baseUrl}?subject=${subject}&body=${body}`;
    } else {
        // Simulate pre-filling via query params where possible, or just search query
        const query = encodeURIComponent(`${candidate.role}`);
        // In a real implementation with known params: &prefill_name=${...}
        url = `${portal.baseUrl}${query}`;
    }

    window.open(url, '_blank');

    // Update status to Opened
    setSubmissions(prev => prev.map(s => 
        s.portalId === portal.id && s.status === 'Pending' 
            ? { ...s, status: 'Opened' } 
            : s
    ));
  };

  const markSubmitted = (portalId: string) => {
    setSubmissions(prev => prev.map(s => 
        s.portalId === portalId 
            ? { ...s, status: 'Submitted', timestamp: new Date().toISOString() } 
            : s
    ));
  };

  const handleOpenAllPending = () => {
     // Batch opening to avoid popup blocker issues (open first 3)
     const pending = submissions.filter(s => s.status === 'Pending').slice(0, 3);
     pending.forEach(s => {
         const p = PORTALS.find(portal => portal.id === s.portalId);
         if (p) handleOpenLink(p);
     });
  };

  const progress = Math.round((submissions.filter(s => s.status === 'Submitted').length / PORTALS.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Send size={20} className="text-brand-600" />
                    Bulk Application Submission
                </h2>
                <p className="text-xs text-slate-500">Candidate: {candidate.firstName} {candidate.lastName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            
            {/* STEP 1: CONSENT */}
            {step === 1 && (
                <div className="max-w-xl mx-auto text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Confirm Representation</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        You are about to utilize automated agents to submit <b>{candidate.firstName}</b> to <b>{PORTALS.length} different job portals</b> simultaneously.
                        <br/><br/>
                        Ensure you have written or verbal consent (Right to Represent) before proceeding to comply with platform Terms of Service.
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-left mb-8 shadow-sm">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                checked={consentGiven}
                                onChange={e => setConsentGiven(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-slate-700">
                                I verify that I have received explicit permission from the candidate to submit their application to these portals on their behalf.
                            </span>
                        </label>
                    </div>

                    <button 
                        onClick={handleGenerateAssets}
                        disabled={!consentGiven}
                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/20"
                    >
                        Initiate Application Sequence
                    </button>
                </div>
            )}

            {/* STEP 2: AI GENERATION */}
            {step === 2 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText size={24} className="text-brand-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-6 mb-2">Tailoring Application Docs</h3>
                    <p className="text-slate-500 animate-pulse">Gemini is writing a custom cover letter...</p>
                    <div className="mt-8 flex gap-2">
                        <div className="h-1.5 w-12 bg-brand-600 rounded-full"></div>
                        <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                        <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                    </div>
                </div>
            )}

            {/* STEP 3: EXECUTION */}
            {step === 3 && materials && (
                <div className="h-full flex gap-6">
                    {/* Left: Tracker */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                         <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-slate-900">Portal Status</h4>
                                 <p className="text-xs text-slate-500">{submissions.filter(s => s.status === 'Submitted').length} / {PORTALS.length} Submitted</p>
                             </div>
                             <button 
                                onClick={handleOpenAllPending}
                                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 font-medium"
                             >
                                Batch Open Pending
                             </button>
                         </div>
                         <div className="flex-1 overflow-y-auto">
                             {PORTALS.map(portal => {
                                 const status = submissions.find(s => s.portalId === portal.id)?.status || 'Pending';
                                 return (
                                     <div key={portal.id} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-lg ${portal.color} flex items-center justify-center text-white font-bold text-sm`}>
                                                 {portal.logoInitial}
                                             </div>
                                             <div>
                                                 <p className="font-semibold text-sm text-slate-900">{portal.name}</p>
                                                 <p className="text-xs text-slate-500">{portal.type} Application</p>
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-3">
                                             {status === 'Pending' && (
                                                 <button 
                                                    onClick={() => handleOpenLink(portal)}
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                    title="Open Application"
                                                 >
                                                     <ExternalLink size={18} />
                                                 </button>
                                             )}
                                             
                                             {status === 'Opened' && (
                                                 <button 
                                                    onClick={() => markSubmitted(portal.id)}
                                                    className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200 hover:bg-green-200 transition-colors"
                                                 >
                                                     Mark Submitted
                                                 </button>
                                             )}

                                             {status === 'Submitted' && (
                                                 <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                     <CheckCircle size={14} /> Done
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                    </div>

                    {/* Right: Docs */}
                    <div className="w-80 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                AI Tailored Materials
                            </h4>
                            
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Cover Letter</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(materials.coverLetter)}
                                        className="text-brand-600 hover:text-brand-700" title="Copy"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 h-32 overflow-y-auto whitespace-pre-wrap">
                                    {materials.coverLetter}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-slate-500">Resume Summary</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(materials.tailoredResumeSummary)}
                                        className="text-brand-600 hover:text-brand-700" title="Copy"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 h-24 overflow-y-auto whitespace-pre-wrap">
                                    {materials.tailoredResumeSummary}
                                </div>
                            </div>
                        </div>

                        {progress === 100 ? (
                             <button 
                                onClick={onClose}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20"
                             >
                                Finish & Close
                             </button>
                        ) : (
                             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                 <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                 <p className="text-xs text-blue-800 leading-relaxed">
                                     Keep this window open while you submit applications in the opened tabs. Mark them as "Submitted" to track progress.
                                 </p>
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BulkApplyModal;
