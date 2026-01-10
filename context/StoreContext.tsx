
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
  sourceCandidatesForJob: (externalJobId: string) => Promise<void>;
  addInterview: (interview: Interview) => void;
  updateInterviewStatus: (id: string, status: Interview['status']) => void;
  addRecruiter: (recruiter: RecruiterStats) => void;
  removeRecruiter: (id: string) => void;
  notify: (title: string, message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'recruitflow_persistence_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Constants
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

  // Persistence side-effect: Save state whenever it changes
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
    const cand = candidates.find(c => c.id === id);
    if (cand) {
        addActivity({
            id: `act_upd_${Date.now()}`,
            type: updates.resumeName ? 'ResumeUpload' : 'ProfileUpdate',
            subject: updates.resumeName ? 'Dossier Artifact Uploaded' : 'Profile Synchronized',
            content: updates.resumeName ? `New resume uploaded: ${updates.resumeName}` : `Skills updated by candidate.`,
            timestamp: new Date().toISOString(),
            author: `${cand.firstName} ${cand.lastName}`,
            entityId: id
        });
    }
  };

  const addActivity = (activity: Activity) => setActivities(prev => [activity, ...prev]);

  const addInterview = (interview: Interview) => {
    setInterviews(prev => [...prev, interview]);
    addActivity({
      id: `act_int_${Date.now()}`,
      type: 'Meeting',
      subject: 'Temporal Sync Locked',
      content: `${interview.type} session scheduled for ${interview.candidateName}.`,
      timestamp: new Date().toISOString(),
      author: 'Scheduling Agent',
      entityId: interview.candidateId
    });
  };

  const updateInterviewStatus = (id: string, status: Interview['status']) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const addRecruiter = (recruiter: RecruiterStats) => setRecruiterStats(prev => [recruiter, ...prev]);
  const removeRecruiter = (id: string) => setRecruiterStats(prev => prev.filter(r => r.id !== id));

  const sourceCandidatesForJob = async (externalJobId: string) => {
    const exJob = externalJobs.find(j => j.id === externalJobId);
    if (!exJob) return;

    const newCandidates: Candidate[] = Array.from({ length: 2 }).map((_, i) => ({
        id: `sourced_${Date.now()}_${i}`,
        firstName: ['Alex', 'Jordan'][i],
        lastName: ['Smith', 'Doe'][i],
        email: `candidate.${Date.now()}.${i}@example.com`,
        role: exJob.title,
        status: 'New',
        stageId: 's1',
        matchScore: 80 + Math.floor(Math.random() * 15),
        skills: ['Sourced via AI', exJob.title.split(' ')[0]],
        lastActivity: 'Just discovered',
        avatarUrl: `https://picsum.photos/100/100?random=${Date.now() + i}`
    }));

    for (const c of newCandidates) {
        await new Promise(r => setTimeout(r, 500));
        addCandidate(c);
    }
    notify("Search Protocol Success", `Identified ${newCandidates.length} high-resonance targets.`, "success");
  };

  return (
    <StoreContext.Provider value={{
      userRole, branding, setUserRole, updateBranding, jobs, candidates, interviews, externalJobs, talentProfiles, activities, placements, recruiterStats, notifications,
      addJob, addCandidate, removeCandidate, addTalentProfile, updateJobStatus, updateCandidateStatus, updateCandidateNotes, updateCandidateProfile, addActivity, sourceCandidatesForJob, addInterview, updateInterviewStatus, addRecruiter, removeRecruiter, notify, removeNotification
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
