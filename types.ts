

export enum StageType {
  Sourcing = 'SOURCING',
  EmailSequence = 'EMAIL_SEQUENCE',
  AIScreening = 'AI_SCREENING',
  HumanInterview = 'HUMAN_INTERVIEW',
  Offer = 'OFFER'
}

export enum UserRole {
  Owner = 'OWNER',
  Recruiter = 'RECRUITER'
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  stageId: string;
  matchScore: number; // 0-100
  aiSummary?: string;
  skills: string[];
  lastActivity: string;
  avatarUrl: string;
  companyId?: string; // Links to CRMClient
  portalToken?: string; // For self-service link
}

export interface Job {
  id: string;
  title: string;
  client: string; // Display name
  clientId?: string; // ID Link
  department: string;
  location: string;
  candidatesCount: number;
  pipeline: PipelineStage[];
  status: 'Active' | 'Draft' | 'Closed';
}

export interface CRMClient {
  id: string;
  name: string;
  industry: string;
  logoUrl: string;
  website: string;
  contactName: string;
  contactEmail: string;
  status: 'Active' | 'Target' | 'Churned';
  activeDeals: number;
  location: string;
}

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  stage: 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  assignedTo: string;
  probability: number; // 0-100
  expectedCloseDate: string;
}

export interface Activity {
  id: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note' | 'StageChange';
  subject: string;
  content: string;
  timestamp: string;
  author: string;
  entityId: string; // Candidate ID or Client ID
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
  // Added salary property to resolve type errors in TalentMatch and JobAggregator components
  salary?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  experience: number; 
  skills: string[];
  location: string;
  bio: string;
  status: 'Bench' | 'Placed' | 'Interviewing';
  avatarUrl: string;
  resumeUrl?: string;
}

export interface Placement {
  id: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
  placedDate: string;
  recruiterName: string;
  status: 'Confirmed' | 'Pending' | 'Canceled';
}

export interface RecruiterStats {
  id: string;
  name: string;
  avatarUrl: string;
  placements: number;
  activityScore: number; 
  emailsSent: number;
  callsLogged: number;
  conversionRate: number; // Percentage
  activeJobs: number;
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
