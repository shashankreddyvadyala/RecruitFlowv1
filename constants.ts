

import { Candidate, Job, StageType, ExternalJob, CandidateProfile, CRMClient, Deal, Activity, Placement, RecruiterStats, AgencyBranding } from "./types";

export const MOCK_PIPELINE = [
  { id: 's1', name: 'Sourced', type: StageType.Sourcing, order: 0 },
  { id: 's2', name: 'AI Outreach', type: StageType.EmailSequence, order: 1 },
  { id: 's3', name: 'AI Screening Call', type: StageType.AIScreening, order: 2 },
  { id: 's4', name: 'Final Interview', type: StageType.HumanInterview, order: 3 },
  { id: 's5', name: 'Offer Sent', type: StageType.Offer, order: 4 },
];

export const INITIAL_BRANDING: AgencyBranding = {
  companyName: 'RecruitFlow Agency',
  logoUrl: '',
  primaryColor: '#2563eb',
  tagline: 'Precision AI Recruiting'
};

export const MOCK_RECRUITER_STATS: RecruiterStats[] = [
  { 
    id: 'r1', 
    name: 'Alex Morgan', 
    placements: 12, 
    activityScore: 94, 
    avatarUrl: 'https://picsum.photos/100/100?random=20',
    emailsSent: 1240,
    callsLogged: 450,
    conversionRate: 22,
    activeJobs: 8
  },
  { 
    id: 'r2', 
    name: 'Sarah Jenkins', 
    placements: 9, 
    activityScore: 88, 
    avatarUrl: 'https://picsum.photos/100/100?random=21',
    emailsSent: 980,
    callsLogged: 320,
    conversionRate: 18,
    activeJobs: 5
  },
  { 
    id: 'r3', 
    name: 'Tom Harris', 
    placements: 6, 
    activityScore: 72, 
    avatarUrl: 'https://picsum.photos/100/100?random=22',
    emailsSent: 750,
    callsLogged: 180,
    conversionRate: 14,
    activeJobs: 4
  }
];

export const MOCK_CRM_CLIENTS: CRMClient[] = [
  {
    id: 'client_1',
    name: 'TechFlow Inc',
    industry: 'Software',
    logoUrl: 'https://logo.clearbit.com/spotify.com',
    website: 'https://techflow.io',
    contactName: 'Sarah Miller',
    contactEmail: 's.miller@techflow.io',
    status: 'Active',
    activeDeals: 2,
    location: 'San Francisco, CA'
  },
  {
    id: 'client_2',
    name: 'Designify',
    industry: 'Creative Agency',
    logoUrl: 'https://logo.clearbit.com/airbnb.com',
    website: 'https://designify.com',
    contactName: 'Tom Baker',
    contactEmail: 'tom@designify.com',
    status: 'Active',
    activeDeals: 1,
    location: 'New York, NY'
  },
  {
    id: 'client_3',
    name: 'HealthPlus',
    industry: 'Healthcare',
    logoUrl: 'https://logo.clearbit.com/headspace.com',
    website: 'https://healthplus.com',
    contactName: 'Jessica Wu',
    contactEmail: 'jwu@healthplus.com',
    status: 'Target',
    activeDeals: 1,
    location: 'Austin, TX'
  }
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'deal_1',
    title: 'Q1 Staffing Contract',
    clientId: 'client_1',
    clientName: 'TechFlow Inc',
    stage: 'Negotiation',
    assignedTo: 'Alex Morgan',
    probability: 80,
    expectedCloseDate: '2026-02-28'
  },
  {
    id: 'deal_2',
    title: 'Product Designer Expansion',
    clientId: 'client_2',
    clientName: 'Designify',
    stage: 'Discovery',
    assignedTo: 'Sarah Jenkins',
    probability: 30,
    expectedCloseDate: '2026-04-15'
  },
  {
    id: 'deal_3',
    title: 'Global Healthcare Partnership',
    clientId: 'client_3',
    clientName: 'HealthPlus',
    stage: 'Proposal',
    assignedTo: 'Alex Morgan',
    probability: 50,
    expectedCloseDate: '2026-06-10'
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    type: 'Email',
    subject: 'Follow up on interview',
    content: 'Sent summary of Sarah\'s technical test results to the hiring manager.',
    timestamp: '2026-01-20T14:30:00Z',
    author: 'Alex Morgan',
    entityId: 'c1'
  },
  {
    id: 'act_2',
    type: 'Call',
    subject: 'Screening Call',
    content: 'Autonomous voice agent completed screening. Candidate is highly motivated.',
    timestamp: '2026-01-20T10:00:00Z',
    author: 'AI Agent',
    entityId: 'c1'
  },
  {
    id: 'act_3',
    type: 'Note',
    subject: 'Contract update',
    content: 'TechFlow requested a revision of the MSA terms regarding volume discounts.',
    timestamp: '2026-01-19T16:45:00Z',
    author: 'Alex Morgan',
    entityId: 'client_1'
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@example.com',
    role: 'Senior React Engineer',
    status: 'Active',
    stageId: 's3',
    matchScore: 92,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    lastActivity: 'AI Call completed 2h ago',
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    aiSummary: 'Strong technical depth in frontend architecture. Communication score 9/10.',
    companyId: 'client_1',
    portalToken: 't123_sarah'
  },
  {
    id: 'c2',
    firstName: 'Marcus',
    lastName: 'Reynolds',
    email: 'm.reynolds@example.com',
    role: 'Senior React Engineer',
    status: 'Active',
    stageId: 's2',
    matchScore: 85,
    skills: ['JavaScript', 'Vue', 'Firebase'],
    lastActivity: 'Email opened 1d ago',
    avatarUrl: 'https://picsum.photos/100/100?random=2',
    aiSummary: 'Good generalist, but lacks specific TypeScript experience needed for senior role.',
    portalToken: 't123_marcus'
  },
  {
    id: 'c3',
    firstName: 'Elena',
    lastName: 'Vovas',
    email: 'elena.v@example.com',
    role: 'Product Designer',
    status: 'New',
    stageId: 's1',
    matchScore: 78,
    skills: ['Figma', 'UI/UX', 'User Research'],
    lastActivity: 'Imported via LinkedIn',
    avatarUrl: 'https://picsum.photos/100/100?random=3'
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1',
    title: 'Senior React Engineer',
    client: 'TechFlow Inc',
    clientId: 'client_1',
    department: 'Engineering',
    location: 'Remote',
    candidatesCount: 142,
    pipeline: MOCK_PIPELINE,
    status: 'Active'
  },
  {
    id: 'j2',
    title: 'Product Designer',
    client: 'Designify',
    clientId: 'client_2',
    department: 'Design',
    location: 'New York, NY',
    candidatesCount: 56,
    pipeline: MOCK_PIPELINE,
    status: 'Active'
  }
];

export const MOCK_EXTERNAL_JOBS: ExternalJob[] = [
  {
    id: 'ej1',
    title: 'Staff Software Engineer, AI Platform',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    postedAt: '2 days ago',
    source: 'LinkedIn',
    url: '#',
    type: 'Hybrid',
    logoUrl: 'https://logo.clearbit.com/anthropic.com',
    // Added mock salary to conform to the updated ExternalJob interface
    salary: '$180k - $250k'
  }
];

export const MOCK_TALENT_PROFILES: CandidateProfile[] = [
  {
    id: 't1',
    name: 'James Wilson',
    title: 'Staff Software Engineer',
    experience: 8,
    skills: ['Python', 'PyTorch', 'AWS', 'System Design'],
    location: 'San Francisco, CA',
    bio: 'Ex-Google engineer specializing in scalable ML infrastructure.',
    status: 'Bench',
    avatarUrl: 'https://picsum.photos/100/100?random=10'
  }
];

export const MOCK_PLACEMENTS: Placement[] = [
  {
    id: 'p1',
    candidateName: 'Julia Zhang',
    jobTitle: 'Senior Product Manager',
    clientName: 'TechFlow Inc',
    placedDate: '2024-03-15',
    recruiterName: 'Alex Morgan',
    status: 'Confirmed'
  }
];
