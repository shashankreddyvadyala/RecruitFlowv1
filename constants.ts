
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
    timestamp: '2024-05-20T14:30:00Z',
    author: 'AI Outreach Bot',
    entityId: 'c1'
  },
  {
    id: 'act_2',
    type: 'Call',
    subject: 'Screening Completed',
    content: 'Autonomous voice agent completed 15-minute technical screen with Sarah Chen. Technical score: 92/100.',
    timestamp: '2024-05-20T10:00:00Z',
    author: 'Voice AI Agent',
    entityId: 'c1'
  },
  {
    id: 'act_3',
    type: 'StageChange',
    subject: 'Moved to Final Interview',
    content: 'Alex Morgan approved screening results and moved Marcus Reynolds to Final Interview stage.',
    timestamp: '2024-05-19T16:45:00Z',
    author: 'Alex Morgan',
    entityId: 'c2'
  },
  {
    id: 'act_4',
    type: 'Meeting',
    subject: 'Hiring Manager Review',
    content: 'Client feedback session completed for the Product Designer role. Elena Vovas is top priority.',
    timestamp: '2024-05-19T09:15:00Z',
    author: 'Sarah Jenkins',
    entityId: 'c3'
  },
  {
    id: 'act_5',
    type: 'Note',
    subject: 'Salary Expectations',
    content: 'Candidate mentioned they are looking for $180k+ base. Need to check client budget.',
    timestamp: '2024-05-18T11:20:00Z',
    author: 'Tom Harris',
    entityId: 'c2'
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
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    location: 'https://meet.google.com/abc-defg-hij',
    status: 'Scheduled',
    type: 'Technical',
    notes: 'Technical architecture deep dive.'
  },
  {
    id: 'int_2',
    candidateId: 'c2',
    candidateName: 'Marcus Reynolds',
    jobId: 'j1',
    jobTitle: 'Senior React Engineer',
    interviewerName: 'Sarah Jenkins',
    startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    location: 'https://meet.google.com/xyz-pdq-rst',
    status: 'Completed',
    type: 'Technical',
    notes: 'Candidate showed great cultural fit. Strong coding skills.'
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
      { name: 'Node.js', years: 4 },
      { name: 'AWS', years: 3 }
    ],
    lastActivity: 'AI Call completed 2h ago',
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    aiSummary: 'Strong technical depth in frontend architecture. Communication score 9/10.',
    portalToken: 't123_sarah',
    notes: 'Highly recommended by former colleague. Great with architectural tradeoffs.',
    preferredRoles: ['Senior Frontend Engineer', 'Fullstack Developer'],
    preferredLocations: ['Remote', 'San Francisco', 'New York'],
    employmentType: 'Full-time',
    workMode: 'Remote',
    salaryExpectation: '$180k - $210k',
    availability: 'Immediate',
    yearsOfExperience: 8,
    education: [
      { degree: 'B.S. Computer Science', institution: 'UC Berkeley', year: '2016' },
      { degree: 'M.S. Software Engineering', institution: 'Stanford University', year: '2018' }
    ],
    resumes: [
      { id: 'res_1', name: 'sarah_chen_cv_2025.pdf', url: '#', updatedAt: '2025-01-15T10:00:00Z', type: 'PDF' },
      { id: 'res_2', name: 'sarah_chen_v1_legacy.pdf', url: '#', updatedAt: '2024-11-02T14:30:00Z', type: 'PDF' }
    ],
    isOpenToWork: true,
    applicationHistory: [
      {
        id: 'hist_1',
        jobTitle: 'Senior Frontend Architect',
        company: 'Stripe',
        status: 'Rejected',
        appliedDate: '2024-11-12',
        outcomeDate: '2024-12-05',
        notes: 'REASON: Candidate passed all technical rounds but selected another candidate with more specific experience in global payment regulations.'
      },
      {
        id: 'hist_2',
        jobTitle: 'Staff Engineer',
        company: 'Vercel',
        status: 'Withdrawn',
        appliedDate: '2025-01-02',
        notes: 'REASON: Candidate withdrew during offer stage due to location requirements change on the employer side.'
      }
    ]
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
    skills: [
      { name: 'JavaScript', years: 7 },
      { name: 'Vue', years: 3 },
      { name: 'Firebase', years: 2 }
    ],
    lastActivity: 'Email opened 1d ago',
    avatarUrl: 'https://picsum.photos/100/100?random=2',
    aiSummary: 'Good generalist, but lacks specific TypeScript experience needed for senior role.',
    portalToken: 't123_marcus',
    notes: 'Interested in transitioning from Vue to React. Willing to learn fast.',
    preferredRoles: ['React Developer', 'Vue Developer'],
    preferredLocations: ['London', 'Hybrid'],
    employmentType: 'Contract',
    workMode: 'Hybrid',
    salaryExpectation: '£600/day',
    availability: '2 weeks notice',
    yearsOfExperience: 5,
    education: [
      { degree: 'B.A. Graphic Design', institution: 'University of Arts London', year: '2019' }
    ],
    resumes: [
      { id: 'res_3', name: 'marcus_reynolds_cv.pdf', url: '#', updatedAt: '2025-02-10T09:00:00Z', type: 'PDF' }
    ],
    isOpenToWork: false,
    applicationHistory: [
      {
        id: 'hist_3',
        jobTitle: 'Lead Vue Developer',
        company: 'Deliveroo',
        status: 'Rejected',
        appliedDate: '2024-09-15',
        outcomeDate: '2024-10-01',
        notes: 'REASON: Insufficient experience with large-scale TypeScript migrations which was a core project requirement.'
      }
    ]
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
    skills: [
      { name: 'Figma', years: 5 },
      { name: 'UI/UX', years: 6 },
      { name: 'User Research', years: 3 }
    ],
    lastActivity: 'Imported via LinkedIn',
    avatarUrl: 'https://picsum.photos/100/100?random=3',
    notes: 'Excellent portfolio. Previously worked at high-growth fintech startups.',
    preferredRoles: ['Senior Product Designer', 'UX Lead'],
    preferredLocations: ['Berlin', 'Amsterdam'],
    employmentType: 'Full-time',
    workMode: 'On-site',
    salaryExpectation: '€95k+',
    availability: '1 month notice',
    yearsOfExperience: 6,
    education: [
      { degree: 'B.Des. Interaction Design', institution: 'TU Delft', year: '2017' }
    ],
    resumes: [
      { id: 'res_4', name: 'elena_vovas_portfolio_cv.pdf', url: '#', updatedAt: '2025-03-01T11:20:00Z', type: 'PDF' }
    ],
    isOpenToWork: true
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
    salary: '$180k - $250k'
  }
];

export const MOCK_TALENT_PROFILES: CandidateProfile[] = [
  {
    id: 't1',
    name: 'James Wilson',
    title: 'Staff Software Engineer',
    experience: 8,
    skills: [
      { name: 'Python', years: 6 },
      { name: 'PyTorch', years: 3 },
      { name: 'AWS', years: 4 },
      { name: 'System Design', years: 5 }
    ],
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
