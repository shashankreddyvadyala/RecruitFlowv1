
import React, { createContext, useContext, useState } from 'react';
import { Job, Candidate, ExternalJob, CandidateProfile, Activity, Placement, RecruiterStats, UserRole, AgencyBranding, Interview, Notification } from '../types';
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
  interviews: Interview[];
  externalJobs: ExternalJob[];
  talentProfiles: CandidateProfile[];
  activities: Activity[];
  placements: Placement[];
  recruiterStats: RecruiterStats[];
  notifications: Notification[];

  // Actions
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
  
  // Interview Management
  addInterview: (interview: Interview) => void;
  updateInterviewStatus: (id: string, status: Interview['status']) => void;
  
  // Team Management
  addRecruiter: (recruiter: RecruiterStats) => void;
  removeRecruiter: (id: string) => void;

  // Notification Management
  notify: (title: string, message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Owner);
  const [branding, setBranding] = useState<AgencyBranding>(Constants.INITIAL_BRANDING);
  
  const [jobs, setJobs] = useState<Job[]>(Constants.MOCK_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(Constants.MOCK_CANDIDATES);
  const [interviews, setInterviews] = useState<Interview[]>(Constants.MOCK_INTERVIEWS.map(i => ({...i, type: 'Technical'})));
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>(Constants.MOCK_EXTERNAL_JOBS);
  const [talentProfiles, setTalentProfiles] = useState<CandidateProfile[]>(Constants.MOCK_TALENT_PROFILES);
  const [activities, setActivities] = useState<Activity[]>(Constants.MOCK_ACTIVITIES);
  const [placements, setPlacements] = useState<Placement[]>(Constants.MOCK_PLACEMENTS);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStats[]>(Constants.MOCK_RECRUITER_STATS);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      subject: 'Candidate Notes Updated',
      content: 'Manual internal notes updated for this candidate.',
      timestamp: new Date().toISOString(),
      author: 'Current User',
      entityId: id
    });
    notify("Notes Saved", "Candidate records updated successfully.", "success");
  };

  const updateCandidateProfile = (id: string, updates: Partial<Candidate>) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const cand = candidates.find(c => c.id === id);
    if (cand) {
        const type = updates.resumeName ? 'ResumeUpload' : 'ProfileUpdate';
        const subject = updates.resumeName ? 'New Resume Uploaded' : 'Profile Skills Updated';
        const content = updates.resumeName 
            ? `${cand.firstName} uploaded a new resume: ${updates.resumeName}`
            : `${cand.firstName} updated their profile skills: ${updates.skills?.join(', ')}`;

        addActivity({
            id: `act_upd_${Date.now()}`,
            type,
            subject,
            content,
            timestamp: new Date().toISOString(),
            author: `${cand.firstName} ${cand.lastName}`,
            entityId: id
        });

        // Notify Recruiter
        notify(
            "Candidate Update", 
            `${cand.firstName} ${cand.lastName} just updated their profile materials.`, 
            "info"
        );
    }
  };

  const addActivity = (activity: Activity) => setActivities(prev => [activity, ...prev]);

  const addInterview = (interview: Interview) => {
    setInterviews(prev => [...prev, interview]);
    addActivity({
      id: `act_int_${Date.now()}`,
      type: 'Meeting',
      subject: 'Interview Scheduled',
      content: `${interview.interviewerName} scheduled a ${interview.type} interview with ${interview.candidateName} for ${interview.jobTitle}.`,
      timestamp: new Date().toISOString(),
      author: interview.interviewerName,
      entityId: interview.candidateId
    });
    notify("Interview Scheduled", `Invite sent to ${interview.candidateName} and ${interview.interviewerName}.`, "success");
  };

  const updateInterviewStatus = (id: string, status: Interview['status']) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    const int = interviews.find(i => i.id === id);
    if (int) {
      notify("Status Updated", `Interview for ${int.candidateName} is now marked as ${status}.`, "info");
    }
  };

  const addRecruiter = (recruiter: RecruiterStats) => setRecruiterStats(prev => [recruiter, ...prev]);
  const removeRecruiter = (id: string) => setRecruiterStats(prev => prev.filter(r => r.id !== id));

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
    notify("Sourcing Complete", `Found 3 new candidates for ${exJob.title}.`, "success");
  };

  return (
    <StoreContext.Provider value={{
      userRole,
      branding,
      setUserRole,
      updateBranding,
      jobs,
      candidates,
      interviews,
      externalJobs,
      talentProfiles,
      activities,
      placements,
      recruiterStats,
      notifications,
      addJob,
      addCandidate,
      removeCandidate,
      addTalentProfile,
      updateJobStatus,
      updateCandidateStatus,
      updateCandidateNotes,
      updateCandidateProfile,
      addActivity,
      sourceCandidatesForJob,
      addInterview,
      updateInterviewStatus,
      addRecruiter,
      removeRecruiter,
      notify,
      removeNotification
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
