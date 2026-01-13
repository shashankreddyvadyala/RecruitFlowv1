
import { Candidate, Job, StageType, ExternalJob, CandidateProfile, Activity, Placement, RecruiterStats, AgencyBranding, Interview } from "./types";

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
  tagline: 'Precision AI Recruiting',
  senderEmail: 'outreach@recruitflow.ai',
  signature: 'Best regards,\n\nAlex Morgan\nLead Talent Partner'
};

export const MOCK_RECRUITER_STATS: RecruiterStats[] = [
  { 
    id: 'r1', 
    name: 'Alex Morgan', 
    placements: 12, 
    applications: 145,
    stageProgressions: 88,
    activityScore: 94, 
    avatarUrl: 'https://picsum.photos/100/100?random=20',
    conversionRate: 22,
    activeJobs: 8
  },
  { 
    id: 'r2', 
    name: 'Sarah Jenkins', 
    placements: 9, 
    applications: 110,
    stageProgressions: 64,
    activityScore: 82, 
    avatarUrl: 'https://picsum.photos/100/100?random=21',
    conversionRate: 18,
    activeJobs: 5
  },
  { 
    id: 'r3', 
    name: 'Tom Harris', 
    placements: 4, 
    applications: 190,
    stageProgressions: 32,
    activityScore: 58, 
    avatarUrl: 'https://picsum.photos/100/100?random=22',
    conversionRate: 14,
    activeJobs: 4
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    type: 'Email',
    subject: 'Outreach Sent',
    content: 'Initial AI sequence triggered for Sarah Chen regarding Senior React Engineer role.',
    timestamp: new Date().toISOString(),
    author: 'AI Outreach Bot',
    entityId: 'c1'
  }
];

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: 'int_1',
    candidateId: 'c1',
    candidateName: 'Sarah Chen',
    jobId: 'j1',
    jobTitle: 'Senior React Engineer',
    interviewerName: 'Alex Morgan',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    location: 'https://meet.google.com/abc-defg-hij',
    status: 'Scheduled',
    type: 'Technical',
    notes: 'Technical architecture deep dive.'
  }
];

export const MOCK_EXTERNAL_JOBS: ExternalJob[] = [
  {
    id: 'ej1',
    title: 'Staff Software Engineer, AI Platform',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    postedAt: '2h ago',
    source: 'LinkedIn',
    url: '#',
    type: 'Full-time',
    salary: '$180k - $250k'
  },
  {
    id: 'ej2',
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    location: 'Remote',
    postedAt: '5h ago',
    source: 'Indeed',
    url: '#',
    type: 'Full-time',
    salary: '$160k - $210k'
  },
  {
    id: 'ej3',
    title: 'Principal Product Designer',
    company: 'Linear',
    location: 'Remote',
    postedAt: '1d ago',
    source: 'Dribbble',
    url: '#',
    type: 'Full-time',
    salary: '$190k - $240k'
  },
  {
    id: 'ej4',
    title: 'DevOps Architect',
    company: 'HashiCorp',
    location: 'Hybrid',
    postedAt: '3d ago',
    source: 'Dice',
    url: '#',
    type: 'Contract',
    salary: '$220k - $280k'
  },
  {
    id: 'ej5',
    title: 'Fullstack Engineer (Typescript)',
    company: 'Stripe',
    location: 'Dublin, Ireland',
    postedAt: '12h ago',
    source: 'LinkedIn',
    url: '#',
    type: 'Full-time',
    salary: '$140k - $190k'
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
    skills: [
      { name: 'React', years: 6 },
      { name: 'TypeScript', years: 5 },
      { name: 'Node.js', years: 4 }
    ],
    lastActivity: 'AI Call completed 2h ago',
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    isOpenToWork: true,
    sharedJobIds: ['ej1', 'ej2'],
    applicationHistory: [
      {
        id: 'hist_1',
        jobTitle: 'Lead Frontend Architect',
        company: 'Stripe',
        status: 'In Progress',
        appliedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
        notes: 'Technical assessment passed. Moving to hiring manager review.'
      },
      {
        id: 'hist_2',
        jobTitle: 'Senior Systems Engineer',
        company: 'Vercel',
        status: 'Hired',
        appliedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days ago
        outcomeDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        notes: 'REASON: Candidate demonstrated exceptional proficiency in distributed systems and high-scale edge deployment.'
      }
    ]
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1',
    title: 'Senior React Engineer',
    client: 'TechFlow Inc',
    department: 'Engineering',
    location: 'Remote',
    candidatesCount: 142,
    pipeline: MOCK_PIPELINE,
    status: 'Active'
  }
];

export const MOCK_TALENT_PROFILES: CandidateProfile[] = [
  {
    id: 't1',
    name: 'James Wilson',
    title: 'Staff Software Engineer',
    experience: 8,
    skills: [{ name: 'Python', years: 6 }],
    location: 'San Francisco, CA',
    bio: 'Ex-Google engineer specializing in scalable ML infrastructure.',
    status: 'Open to Work',
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
