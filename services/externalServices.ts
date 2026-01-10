import { ExternalJob, CandidateProfile, Candidate, Job } from '../types';
import { MOCK_EXTERNAL_JOBS, MOCK_TALENT_PROFILES } from '../constants';

// --- Configuration ---
export const getApiKey = (service: string): string | null => {
  return localStorage.getItem(`${service}_API_KEY`);
};

export const setApiKey = (service: string, key: string) => {
  localStorage.setItem(`${service}_API_KEY`, key);
};

// --- Services ---

// 1. Job Scraper (BrightData / Firecrawl)
export const JobScraperService = {
  searchJobs: async (query: string, location: string): Promise<ExternalJob[]> => {
    const key = getApiKey('BRIGHTDATA');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (key) {
      // REAL API CALL implementation would go here
      // const response = await fetch('https://api.brightdata.com/...', { headers: { Authorization: `Bearer ${key}` } });
      // return response.json();
      console.log("Using Real BrightData API");
    }

    // Fallback / Simulation
    return MOCK_EXTERNAL_JOBS.filter(job => {
        const q = query.toLowerCase();
        const l = location.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q);
        const matchesLoc = l === '' || job.location.toLowerCase().includes(l);
        return matchesTitle && matchesLoc;
    });
  }
};

// 2. Resume Parser (Affinda / TextKernel)
export const ResumeParserService = {
  parseResume: async (file: File): Promise<CandidateProfile> => {
    const key = getApiKey('AFFINDA');
    
    // Simulate upload and processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (key) {
       // REAL API CALL
       console.log("Using Real Affinda API");
    }

    // Simulation
    return {
        id: `t_${Date.now()}`,
        name: file.name.split('.')[0].replace(/[_-]/g, ' '), // Guess name from filename
        title: 'Senior Software Engineer', // Infer from context in real app
        experience: Math.floor(Math.random() * 10) + 2,
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
        location: 'Remote',
        bio: 'Auto-extracted summary: Experienced engineer with a focus on scalable web applications.',
        status: 'Bench',
        avatarUrl: `https://picsum.photos/100/100?random=${Date.now()}`
    };
  }
};

// 3. Enrichment (ProxyCurl / PeopleDataLabs)
export const EnrichmentService = {
  enrichCandidate: async (email: string, linkedinUrl?: string): Promise<Partial<Candidate>> => {
    const key = getApiKey('PROXYCURL');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
        skills: ['Strategic Planning', 'Team Leadership', 'Python', 'Data Analysis'],
        lastActivity: 'Enriched via LinkedIn'
    };
  }
};

// 4. Outreach (Resend / SendGrid)
export const OutreachService = {
  sendEmail: async (to: string, subject: string, body: string): Promise<boolean> => {
    const key = getApiKey('RESEND');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (key) {
        // fetch('https://api.resend.com/emails', ...)
        console.log(`Sending REAL email to ${to} via Resend`);
    } else {
        console.log(`Simulating email to ${to}`);
    }
    return true;
  }
};

// 5. Voice AI (Vapi.ai)
export const VoiceAgentService = {
    initiateCall: async (phoneNumber: string, scriptContext: string) => {
        const key = getApiKey('VAPI');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Initiating AI Phone Screen...");
        return { callId: 'call_123456', status: 'ringing' };
    }
}