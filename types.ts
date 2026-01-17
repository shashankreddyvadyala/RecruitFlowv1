
export enum StageType {
  Sourcing = 'SOURCING',
  AIScreening = 'AI_SCREENING',
  Interview = 'INTERVIEW',
  Offer = 'OFFER',
  Hired = 'HIRED',
  EmailSequence = 'EMAIL_SEQUENCE',
  HumanInterview = 'HUMAN_INTERVIEW'
}

export enum UserRole {
  Owner = 'OWNER',
  Recruiter = 'RECRUITER',
  Candidate = 'CANDIDATE'
}

export interface Skill {
  name: string;
  years: number;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface ApplicationHistory {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  outcomeDate?: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  stageId: string;
  matchScore: number;
  aiSummary?: string;
  skills: Skill[];
  lastActivity: string;
  avatarUrl: string;
  notes?: string;
  isOpenToWork?: boolean;
  salaryExpectation?: string;
  workMode?: string;
  noticePeriod?: string;
  workAuthorization?: string;
  sharedJobIds?: string[];
  education?: Education[];
  workHistory?: WorkExperience[];
  applicationHistory?: ApplicationHistory[];
  likedJobIds?: string[];
  rejectedJobIds?: string[];
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  source: string;
  type: string;
  salary?: string;
  matchScore?: number;
  url?: string;
  visaSponsorship?: boolean; // New property
}

export interface Activity {
  id: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note' | 'StatusChange' | 'ProfileUpdate' | 'JobShared' | 'CandidateFeedback';
  subject: string;
  content: string;
  timestamp: string;
  author: string;
  entityId: string;
}

export interface AgencyBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  tagline: string;
  senderEmail?: string;
  signature?: string;
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
  type: string;
  notes?: string;
  candidateTimezone?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  department: string;
  location: string;
  candidatesCount: number;
  pipeline: PipelineStage[];
  status: 'Active' | 'Draft' | 'Closed' | 'On Hold';
}

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  experience: number;
  skills: Skill[];
  location: string;
  bio: string;
  status: string;
  avatarUrl: string;
}

export interface Placement {
  id: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
  placedDate: string;
  recruiterName: string;
  status: string;
}

export interface RecruiterStats {
  id: string;
  name: string;
  jobTitle?: string;
  placements: number;
  applications: number;
  stageProgressions: number;
  activityScore: number;
  avatarUrl: string;
  conversionRate: number;
  activeJobs: number;
}

export interface RecruiterSettings {
  fullName: string;
  jobTitle: string;
  email: string;
  signature: string;
  avatarUrl: string;
}

export interface Portal {
  id: string;
  name: string;
  type: 'Web' | 'Email';
  baseUrl: string;
  logoInitial: string;
  color: string;
}

export interface SubmissionTracker {
  portalId: string;
  status: 'Pending' | 'Opened' | 'Submitted';
  timestamp?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface ApplicationMaterials {
  coverLetter: string;
  tailoredResumeSummary: string;
}

export interface OptimizationInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  savingsPotential: string;
  htsCode: string;
  actionLabel: string;
  severity: string;
}

export interface ResumeFile {
  id: string;
  fileName: string;
  uploadDate: string;
  content: string;
}
