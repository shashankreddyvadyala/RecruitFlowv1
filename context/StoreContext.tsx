
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, Candidate, ExternalJob, CandidateProfile, CRMClient, Deal, Activity, Placement, RecruiterStats, UserRole, AgencyBranding } from '../types';
import * as Constants from '../constants';

interface StoreContextType {
  // Roles & Identity
  userRole: UserRole;
  branding: AgencyBranding;
  setUserRole: (role: UserRole) => void;
  updateBranding: (branding: Partial<AgencyBranding>) => void;

  // Data
  jobs: Job[];
  candidates: Candidate[];
  externalJobs: ExternalJob[];
  talentProfiles: CandidateProfile[];
  crmClients: CRMClient[];
  deals: Deal[];
  activities: Activity[];
  placements: Placement[];
  recruiterStats: RecruiterStats[];

  // Actions
  addJob: (job: Job) => void;
  addCandidate: (candidate: Candidate) => void;
  addTalentProfile: (profile: CandidateProfile) => void;
  updateJobStatus: (id: string, status: Job['status']) => void;
  updateCandidateStatus: (id: string, status: string, stageId: string) => void;
  addClient: (client: CRMClient) => void;
  addDeal: (deal: Deal) => void;
  addActivity: (activity: Activity) => void;
  updateDealStage: (id: string, stage: Deal['stage']) => void;
  sourceCandidatesForJob: (externalJobId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Owner);
  const [branding, setBranding] = useState<AgencyBranding>(Constants.INITIAL_BRANDING);
  
  const [jobs, setJobs] = useState<Job[]>(Constants.MOCK_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(Constants.MOCK_CANDIDATES);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>(Constants.MOCK_EXTERNAL_JOBS);
  const [talentProfiles, setTalentProfiles] = useState<CandidateProfile[]>(Constants.MOCK_TALENT_PROFILES);
  const [crmClients, setCrmClients] = useState<CRMClient[]>(Constants.MOCK_CRM_CLIENTS);
  const [deals, setDeals] = useState<Deal[]>(Constants.MOCK_DEALS);
  const [activities, setActivities] = useState<Activity[]>(Constants.MOCK_ACTIVITIES);
  const [placements, setPlacements] = useState<Placement[]>(Constants.MOCK_PLACEMENTS);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStats[]>(Constants.MOCK_RECRUITER_STATS);

  const updateBranding = (newBranding: Partial<AgencyBranding>) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  const addJob = (job: Job) => setJobs(prev => [job, ...prev]);
  const addCandidate = (candidate: Candidate) => setCandidates(prev => [candidate, ...prev]);
  const addTalentProfile = (profile: CandidateProfile) => setTalentProfiles(prev => [profile, ...prev]);
  const updateJobStatus = (id: string, status: Job['status']) => setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  const updateCandidateStatus = (id: string, status: string, stageId: string) => setCandidates(prev => prev.map(c => c.id === id ? { ...c, status, stageId } : c));
  const addClient = (client: CRMClient) => setCrmClients(prev => [client, ...prev]);
  const addDeal = (deal: Deal) => setDeals(prev => [deal, ...prev]);
  const addActivity = (activity: Activity) => setActivities(prev => [activity, ...prev]);
  const updateDealStage = (id: string, stage: Deal['stage']) => setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d));

  const sourceCandidatesForJob = async (externalJobId: string) => {
    const exJob = externalJobs.find(j => j.id === externalJobId);
    if (!exJob) return;

    const newCandidates: Candidate[] = Array.from({ length: 3 }).map((_, i) => ({
        id: `sourced_${Date.now()}_${i}`,
        firstName: ['Alex', 'Jordan', 'Taylor'][i],
        lastName: ['Smith', 'Doe', 'Lee'][i],
        email: `candidate.${Date.now()}.${i}@example.com`,
        role: exJob.title,
        status: 'New',
        stageId: 's1',
        matchScore: 75 + Math.floor(Math.random() * 20),
        skills: ['Sourced via AI', exJob.title.split(' ')[0]],
        lastActivity: 'Just sourced',
        avatarUrl: `https://picsum.photos/100/100?random=${Date.now() + i}`
    }));

    for (const c of newCandidates) {
        await new Promise(r => setTimeout(r, 500));
        addCandidate(c);
    }
  };

  return (
    <StoreContext.Provider value={{
      userRole,
      branding,
      setUserRole,
      updateBranding,
      jobs,
      candidates,
      externalJobs,
      talentProfiles,
      crmClients,
      deals,
      activities,
      placements,
      recruiterStats,
      addJob,
      addCandidate,
      addTalentProfile,
      updateJobStatus,
      updateCandidateStatus,
      addClient,
      addDeal,
      addActivity,
      updateDealStage,
      sourceCandidatesForJob
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
