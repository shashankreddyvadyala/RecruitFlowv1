
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, Candidate, ExternalJob, CandidateProfile, Activity, Placement, RecruiterStats, UserRole, AgencyBranding, RecruiterSettings, Interview, Notification, Skill } from '../types';
import * as Constants from '../constants';

interface StoreContextType {
  userRole: UserRole;
  branding: AgencyBranding;
  recruiterSettings: RecruiterSettings;
  setUserRole: (role: UserRole) => void;
  updateBranding: (branding: Partial<AgencyBranding>) => void;
  updateRecruiterSettings: (settings: Partial<RecruiterSettings>) => void;
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
  bulkShareJobs: (candidateIds: string[], externalJobs: ExternalJob[]) => Promise<void>;
  respondToJobFeedback: (candidateId: string, jobId: string, feedback: 'like' | 'reject') => void;
  addInterview: (interview: Interview) => void;
  updateInterviewStatus: (id: string, status: Interview['status']) => void;
  addRecruiter: (recruiter: RecruiterStats) => void;
  removeRecruiter: (id: string) => void;
  notify: (title: string, message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'recruitflow_persistence_v3';

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
  const [recruiterSettings, setRecruiterSettings] = useState<RecruiterSettings>(persisted?.recruiterSettings || {
    fullName: 'Alex Morgan',
    jobTitle: 'Lead Talent Partner',
    email: 'alex.m@recruitflow.ai',
    signature: 'Best regards,\nAlex Morgan\nLead Talent Partner',
    avatarUrl: 'https://picsum.photos/100/100?u=me'
  });
  
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
      recruiterSettings,
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
  }, [userRole, branding, recruiterSettings, jobs, candidates, interviews, externalJobs, talentProfiles, activities, placements, recruiterStats]);

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

  const updateRecruiterSettings = (newSettings: Partial<RecruiterSettings>) => {
    setRecruiterSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addJob = (job: Job) => setJobs(prev => [job, ...prev]);
  const addCandidate = (candidate: Candidate) => setCandidates(prev => [candidate, ...prev]);
  const removeCandidate = (id: string) => setCandidates(prev => prev.filter(c => c.id !== id));
  const addTalentProfile = (profile: CandidateProfile) => setTalentProfiles(prev => [profile, ...prev]);
  const updateJobStatus = (id: string, status: Job['status']) => setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  const updateCandidateStatus = (id: string, status: string, stageId: string) => setCandidates(prev => prev.map(c => c.id === id ? { ...c, status, stageId } : c));
  
  const updateCandidateNotes = (id: string, notes: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) return { ...c, notes };
      return c;
    }));
    addActivity({
      id: `act_note_${Date.now()}`,
      type: 'Note',
      subject: 'Notes Updated',
      content: 'Internal notes updated for candidate profile.',
      timestamp: new Date().toISOString(),
      author: 'System',
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

    onPhaseChange?.('Priority Seeker Pool (Open to Work)');
    await new Promise(r => setTimeout(r, 1200));

    const otWMatches = talentProfiles.filter(p => 
      p.status === 'Open to Work' && 
      (p.title.toLowerCase().includes(exJob.title.toLowerCase().split(' ')[0]) || 
       exJob.title.toLowerCase().includes(p.title.toLowerCase()))
    );

    onPhaseChange?.('Passive Talent Scan');
    await new Promise(r => setTimeout(r, 1500));
    const poolMatches = candidates.filter(c => 
      c.role.toLowerCase().includes(exJob.title.toLowerCase().split(' ')[0]) &&
      !otWMatches.some(b => b.name === `${c.firstName} ${c.lastName}`)
    );

    onPhaseChange?.('Market Discovery');
    await new Promise(r => setTimeout(r, 1800));

    const finalCandidates: Candidate[] = [];

    otWMatches.forEach(p => {
        finalCandidates.push({
            id: `sourced_otw_${Date.now()}_${p.id}`,
            firstName: p.name.split(' ')[0],
            lastName: p.name.split(' ').slice(1).join(' ') || 'Sourced',
            email: `${p.name.toLowerCase().replace(' ', '.')}@talent.agency.ai`,
            role: p.title,
            status: 'Active',
            stageId: 's1',
            matchScore: 94 + Math.floor(Math.random() * 5),
            skills: p.skills,
            lastActivity: 'Sourced: Open to Work',
            avatarUrl: p.avatarUrl,
            notes: 'PRIORITY: Candidate is Open to Work.',
            isOpenToWork: true 
        });
    });

    poolMatches.slice(0, 2).forEach(c => {
        const priorityBonus = c.isOpenToWork ? 10 : 0;
        finalCandidates.push({
            ...c,
            id: `sourced_pool_${Date.now()}_${c.id}`,
            matchScore: Math.min(100, 82 + Math.floor(Math.random() * 8) + priorityBonus),
            lastActivity: `Sourced: ${c.isOpenToWork ? 'Open to Work' : 'Passive'} Pool`,
            notes: (c.notes || '') + `\nRe-sourced from agency pool.`
        });
    });

    if (finalCandidates.length < 3) {
        finalCandidates.push({
            id: `sourced_ext_${Date.now()}`,
            firstName: 'Market',
            lastName: 'Discovery',
            email: `discovery.${Date.now()}@global.ai`,
            role: exJob.title,
            status: 'New',
            stageId: 's1',
            matchScore: 71 + Math.floor(Math.random() * 9),
            skills: [{ name: 'Sourced via Search', years: 0 }],
            lastActivity: 'Market Search',
            avatarUrl: `https://picsum.photos/100/100?u=${Date.now()}`
        });
    }

    for (const cand of finalCandidates) {
        addCandidate(cand);
    }

    notify("Sourcing Complete", `Pipeline built: ${otWMatches.length} Open to Work, ${poolMatches.length} Passive matches.`, "success");
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

  const bulkShareJobs = async (candidateIds: string[], externalJobs: ExternalJob[]) => {
    const jobIds = externalJobs.map(j => j.id);
    
    setCandidates(prev => prev.map(c => {
      if (candidateIds.includes(c.id)) {
        const currentShared = c.sharedJobIds || [];
        const newShared = Array.from(new Set([...currentShared, ...jobIds]));
        return { ...c, sharedJobIds: newShared };
      }
      return c;
    }));

    candidateIds.forEach(cId => {
      addActivity({
        id: `bulk_share_${Date.now()}_${cId}`,
        type: 'JobShared',
        subject: 'Job Opportunities Shared',
        content: `Recruiter shared ${externalJobs.length} selected jobs. Syncing to Candidate Portal.`,
        timestamp: new Date().toISOString(),
        author: 'Alex Morgan',
        entityId: cId
      });
    });

    notify("Sharing Complete", `Synced ${externalJobs.length} jobs to ${candidateIds.length} candidates.`, "success");
  };

  const respondToJobFeedback = (candidateId: string, jobId: string, feedback: 'like' | 'reject') => {
    const candidate = candidates.find(c => c.id === candidateId);
    const job = externalJobs.find(j => j.id === jobId);
    
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const liked = c.likedJobIds || [];
        const rejected = c.rejectedJobIds || [];
        
        if (feedback === 'like') {
            return { 
                ...c, 
                likedJobIds: [...liked.filter(id => id !== jobId), jobId],
                rejectedJobIds: rejected.filter(id => id !== jobId)
            };
        } else {
            return { 
                ...c, 
                likedJobIds: liked.filter(id => id !== jobId),
                rejectedJobIds: [...rejected.filter(id => id !== jobId), jobId]
            };
        }
      }
      return c;
    }));

    if (candidate && job) {
        addActivity({
            id: `fb_${Date.now()}`,
            type: 'CandidateFeedback',
            subject: `Feedback: ${feedback === 'like' ? 'Interested' : 'Not Interested'}`,
            content: `${candidate.firstName} ${feedback === 'like' ? 'flagged interest in' : 'dismissed'} the job: ${job.title} at ${job.company}.`,
            timestamp: new Date().toISOString(),
            author: candidate.firstName,
            entityId: candidateId
        });
    }
  };

  return (
    <StoreContext.Provider value={{
      userRole, branding, recruiterSettings, setUserRole, updateBranding, updateRecruiterSettings, jobs, candidates, interviews, externalJobs, talentProfiles, activities, placements, recruiterStats, notifications,
      addJob, addCandidate, removeCandidate, addTalentProfile, updateJobStatus, updateCandidateStatus, updateCandidateNotes, updateCandidateProfile, addActivity, sourceCandidatesForJob, shareJobWithCandidate, bulkShareJobs, respondToJobFeedback, addInterview, updateInterviewStatus, addRecruiter, removeRecruiter, notify, removeNotification
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
