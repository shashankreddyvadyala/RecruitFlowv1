
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, Candidate, ExternalJob, CandidateProfile, Activity, Placement, RecruiterStats, UserRole, AgencyBranding, Interview, Notification } from '../types';
import * as Constants from '../constants';

interface StoreContextType {
  userRole: UserRole;
  branding: AgencyBranding;
  setUserRole: (role: UserRole) => void;
  updateBranding: (branding: Partial<AgencyBranding>) => void;
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  externalJobs: ExternalJob[];
  talentProfiles: CandidateProfile[];
  activities: Activity[];
  placements: Placement[];
  recruiterStats: RecruiterStats[];
  notifications: Notification[];
  addJob: (job: Job) => void;
  addCandidate: (candidate: Candidate) => void;
  removeCandidate: (id: string) => void;
  addTalentProfile: (profile: CandidateProfile) => void;
  updateJobStatus: (id: string, status: Job['status']) => void;
  updateCandidateStatus: (id: string, status: string, stageId: string) => void;
  updateCandidateNotes: (id: string, notes: string) => void;
  updateCandidateProfile: (id: string, updates: Partial<Candidate>) => void;
  addActivity: (activity: Activity) => void;
  sourceCandidatesForJob: (externalJobId: string, onPhaseChange?: (phase: string) => void) => Promise<void>;
  shareJobWithCandidate: (candidateId: string, externalJob: ExternalJob) => Promise<void>;
  addInterview: (interview: Interview) => void;
  updateInterviewStatus: (id: string, status: Interview['status']) => void;
  addRecruiter: (recruiter: RecruiterStats) => void;
  removeRecruiter: (id: string) => void;
  notify: (title: string, message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'recruitflow_persistence_v2';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse persisted data", e);
      }
    }
    return null;
  };

  const persisted = getInitialData();

  const [userRole, setUserRole] = useState<UserRole>(persisted?.userRole || UserRole.Owner);
  const [branding, setBranding] = useState<AgencyBranding>(persisted?.branding || Constants.INITIAL_BRANDING);
  const [jobs, setJobs] = useState<Job[]>(persisted?.jobs || Constants.MOCK_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(persisted?.candidates || Constants.MOCK_CANDIDATES);
  const [interviews, setInterviews] = useState<Interview[]>(persisted?.interviews || Constants.MOCK_INTERVIEWS);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>(persisted?.externalJobs || Constants.MOCK_EXTERNAL_JOBS);
  const [talentProfiles, setTalentProfiles] = useState<CandidateProfile[]>(persisted?.talentProfiles || Constants.MOCK_TALENT_PROFILES);
  const [activities, setActivities] = useState<Activity[]>(persisted?.activities || Constants.MOCK_ACTIVITIES);
  const [placements, setPlacements] = useState<Placement[]>(persisted?.placements || Constants.MOCK_PLACEMENTS);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStats[]>(persisted?.recruiterStats || Constants.MOCK_RECRUITER_STATS);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const dataToSave = {
      userRole,
      branding,
      jobs,
      candidates,
      interviews,
      externalJobs,
      talentProfiles,
      activities,
      placements,
      recruiterStats
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [userRole, branding, jobs, candidates, interviews, externalJobs, talentProfiles, activities, placements, recruiterStats]);

  const notify = (title: string, message: string, type: Notification['type'] = 'info') => {
    const id = `notif_${Date.now()}`;
    setNotifications(prev => [{ id, title, message, type, timestamp: new Date().toISOString() }, ...prev]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateBranding = (newBranding: Partial<AgencyBranding>) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  const addJob = (job: Job) => setJobs(prev => [job, ...prev]);
  const addCandidate = (candidate: Candidate) => setCandidates(prev => [candidate, ...prev]);
  const removeCandidate = (id: string) => setCandidates(prev => prev.filter(c => c.id !== id));
  const addTalentProfile = (profile: CandidateProfile) => setTalentProfiles(prev => [profile, ...prev]);
  const updateJobStatus = (id: string, status: Job['status']) => setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  const updateCandidateStatus = (id: string, status: string, stageId: string) => setCandidates(prev => prev.map(c => c.id === id ? { ...c, status, stageId } : c));
  
  const updateCandidateNotes = (id: string, notes: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
    addActivity({
      id: `act_note_${Date.now()}`,
      type: 'Note',
      subject: 'Intelligence Synced',
      content: 'Classified notes updated for candidate dossier.',
      timestamp: new Date().toISOString(),
      author: 'System Admin',
      entityId: id
    });
  };

  const updateCandidateProfile = (id: string, updates: Partial<Candidate>) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addActivity = (activity: Activity) => setActivities(prev => [activity, ...prev]);

  const addInterview = (interview: Interview) => {
    setInterviews(prev => [...prev, interview]);
  };

  const updateInterviewStatus = (id: string, status: Interview['status']) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const addRecruiter = (recruiter: RecruiterStats) => setRecruiterStats(prev => [recruiter, ...prev]);
  const removeRecruiter = (id: string) => setRecruiterStats(prev => prev.filter(r => r.id !== id));

  const sourceCandidatesForJob = async (externalJobId: string, onPhaseChange?: (phase: string) => void) => {
    const exJob = externalJobs.find(j => j.id === externalJobId);
    if (!exJob) return;

    // PROTOCOL START
    onPhaseChange?.('Elite Bench (Open to Work)');
    await new Promise(r => setTimeout(r, 1200));

    // Phase 1: Elite Bench Scan
    const benchMatches = talentProfiles.filter(p => 
      p.status === 'Bench' && 
      (p.title.toLowerCase().includes(exJob.title.toLowerCase().split(' ')[0]) || 
       exJob.title.toLowerCase().includes(p.title.toLowerCase()))
    );

    // Phase 2: Active Pool Scan
    onPhaseChange?.('Neural Pool (Passive Scan)');
    await new Promise(r => setTimeout(r, 1500));
    const poolMatches = candidates.filter(c => 
      c.role.toLowerCase().includes(exJob.title.toLowerCase().split(' ')[0]) &&
      !benchMatches.some(b => b.name === `${c.firstName} ${c.lastName}`)
    );

    // Phase 3: External Discovery
    onPhaseChange?.('Market Discovery (Discovery Tier)');
    await new Promise(r => setTimeout(r, 1800));

    const finalCandidates: Candidate[] = [];

    // Map Elite Bench (Top Priority)
    benchMatches.forEach(p => {
        finalCandidates.push({
            id: `sourced_bench_${Date.now()}_${p.id}`,
            firstName: p.name.split(' ')[0],
            lastName: p.name.split(' ').slice(1).join(' ') || 'Sourced',
            email: `${p.name.toLowerCase().replace(' ', '.')}@bench.agency.ai`,
            role: p.title,
            status: 'Active',
            stageId: 's1',
            matchScore: 94 + Math.floor(Math.random() * 5),
            skills: p.skills,
            lastActivity: 'Sourced: Elite Bench (Preference 1)',
            avatarUrl: p.avatarUrl,
            notes: 'SYSTEM PRIORITY 1: This candidate is ON BENCH and actively seeking a new mission.'
        });
    });

    // Map Active Pool (Preference 2)
    poolMatches.slice(0, 2).forEach(c => {
        finalCandidates.push({
            ...c,
            id: `sourced_pool_${Date.now()}_${c.id}`,
            matchScore: 82 + Math.floor(Math.random() * 8),
            lastActivity: 'Sourced: Passive Pool (Preference 2)',
            notes: (c.notes || '') + '\nSYSTEM PRIORITY 2: Re-sourced from passive agency pool.'
        });
    });

    // Final supplementary Discovery
    if (finalCandidates.length < 3) {
        finalCandidates.push({
            id: `sourced_ext_${Date.now()}`,
            firstName: 'Market',
            lastName: 'Operative',
            email: `discovery.${Date.now()}@global.ai`,
            role: exJob.title,
            status: 'New',
            stageId: 's1',
            matchScore: 71 + Math.floor(Math.random() * 9),
            skills: ['Sourced via Neural Search'],
            lastActivity: 'Market Discovery (Tier 3)',
            avatarUrl: `https://picsum.photos/100/100?u=${Date.now()}`
        });
    }

    for (const cand of finalCandidates) {
        addCandidate(cand);
    }

    notify("Sourcing Protocol Finished", `Pipeline built: ${benchMatches.length} Bench, ${poolMatches.length} Pool resonance found.`, "success");
  };

  const shareJobWithCandidate = async (candidateId: string, externalJob: ExternalJob) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const currentShared = c.sharedJobIds || [];
        if (!currentShared.includes(externalJob.id)) {
          return { ...c, sharedJobIds: [...currentShared, externalJob.id] };
        }
      }
      return c;
    }));
  };

  return (
    <StoreContext.Provider value={{
      userRole, branding, setUserRole, updateBranding, jobs, candidates, interviews, externalJobs, talentProfiles, activities, placements, recruiterStats, notifications,
      addJob, addCandidate, removeCandidate, addTalentProfile, updateJobStatus, updateCandidateStatus, updateCandidateNotes, updateCandidateProfile, addActivity, sourceCandidatesForJob, shareJobWithCandidate, addInterview, updateInterviewStatus, addRecruiter, removeRecruiter, notify, removeNotification
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
