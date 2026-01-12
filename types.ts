
export enum StageType {
  Sourcing = 'SOURCING',
  EmailSequence = 'EMAIL_SEQUENCE',
  AIScreening = 'AI_SCREENING',
  HumanInterview = 'HUMAN_INTERVIEW',
  Offer = 'OFFER'
}

export enum UserRole {
  Owner = 'OWNER',
  Recruiter = 'RECRUITER',
  Candidate = 'CANDIDATE'
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
}

export interface OptimizationInsight {
  id: string;
  category: 'Tax' | 'Compliance' | 'HTS';
  title: string;
  description: string;
  savingsPotential?: string;
  htsCode?: string;
  actionLabel: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface Skill {
  name: string;
  years: number;
}

export interface ResumeFile {
  id: string;
  name: string;
  url: string;
  updatedAt: string;
  type: 'PDF' | 'DOCX';
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  stageId: string;
  matchScore: number; 
  aiSummary?: string;
  skills: Skill[];
  lastActivity: string;
  avatarUrl: string;
  companyId?: string;
  portalToken?: string; 
  notes?: string; 
  candidateTimezone?: string;
  availability?: string;
  isOpenToWork?: boolean;

  // Added Fields
  yearsOfExperience?: number;
  education?: Education[];

  // Global Compliance
  htsClassification?: string;
  taxOptimizationApplied?: boolean;
  
  preferredRoles?: string[];
  preferredLocations?: string[];
  employmentType?: 'Full-time' | 'Contract' | 'Any';
  workMode?: 'Remote' | 'Hybrid' | 'On-site' | 'Any';
  salaryExpectation?: string;

  sharedJobIds?: string[]; 
  resumes?: ResumeFile[];
}

export interface Job {
  id: string;
  title: string;
  client: string; 
  clientId?: string; 
  department: string;
  location: string;
  candidatesCount: number;
  pipeline: PipelineStage[];
  status: 'Active' | 'Draft' | 'Closed';
}

export interface Activity {
  id: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note' | 'StageChange' | 'ProfileUpdate' | 'ResumeUpload' | 'JobShared' | 'Optimization' | 'JobApplication';
  subject: string;
  content: string;
  timestamp: string;
  author: string;
  entityId: string; 
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  interviewerName: string;
  startTime: string; 
  endTime: string; 
  location?: string; 
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  type: 'Screening' | 'Technical' | 'Behavioral' | 'Culture' | 'Final';
  notes?: string;
  reminderSent?: boolean;
  candidateTimezone?: string;
  lastPingSent?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  source: 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'Wellfound';
  url: string;
  type: 'Remote' | 'On-site' | 'Hybrid';
  logoUrl?: string;
  salary?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  experience: number; 
  skills: Skill[];
  location: string;
  bio: string;
  status: 'Bench' | 'Placed' | 'Interviewing';
  avatarUrl: string;
  resumeUrl?: string;
}

export interface Placement {
  candidateName: string;
  jobTitle: string;
  clientName: string;
  placedDate: string;
  recruiterName: string;
  status: 'Confirmed' | 'Pending' | 'Canceled';
  id: string;
}

export interface RecruiterStats {
  id: string;
  name: string;
  avatarUrl: string;
  placements: number;
  applications: number; // Candidate submissions
  stageProgressions: number; // Movements within a pipeline
  conversionRate: number; 
  activeJobs: number;
  activityScore: number; 
}

export interface AgencyBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  tagline: string;
}

export interface Portal {
  id: string;
  name: string;
  type: 'Web' | 'Email';
  baseUrl: string;
  logoInitial: string;
  color: string;
}

export interface ApplicationMaterials {
  coverLetter: string;
  tailoredResumeSummary: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface SubmissionTracker {
  portalId: string;
  status: 'Pending' | 'Opened' | 'Submitted';
  timestamp?: string;
}
