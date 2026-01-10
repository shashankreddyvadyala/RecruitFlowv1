
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, GeneratedEmail, ApplicationMaterials, OptimizationInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const isApiConfigured = () => !!process.env.API_KEY;

export const generateOutreachEmail = async (
  candidate: Candidate,
  companyName: string,
  senderName: string
): Promise<GeneratedEmail> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `
    Write a personalized cold outreach email to ${candidate.firstName} ${candidate.lastName} 
    for the ${candidate.role} position at ${companyName}.
    The sender is ${senderName}.
    Candidate Skills: ${candidate.skills.join(', ')}.
    Return JSON with 'subject' and 'body' fields.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          body: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}') as GeneratedEmail;
};

export const getHiringOptimization = async (
    candidate: Candidate,
    jobTitle: string,
    location: string
): Promise<OptimizationInsight[]> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const prompt = `
      Analyze this international hire strategy.
      Candidate: ${candidate.firstName} ${candidate.lastName} (${candidate.skills.join(', ')})
      Job: ${jobTitle}
      Client Location: ${location}

      1. Suggest a relevant HTS (Harmonized Tariff Schedule) classification code for this professional service (Schedule B).
      2. Identify 2 Tax Optimization strategies (e.g. R&D credits, regional incentives).
      3. Quantify potential annual savings.

      Return JSON array of objects with: 
      id, category (Tax/HTS/Compliance), title, description, savingsPotential, htsCode, actionLabel, severity (high/medium/low).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                savingsPotential: { type: Type.STRING },
                htsCode: { type: Type.STRING },
                actionLabel: { type: Type.STRING },
                severity: { type: Type.STRING }
              }
            }
          }
        }
    });

    return JSON.parse(response.text || '[]');
};

export const suggestInterviewSlots = async (
  candidateName: string,
  candidateTimezone: string,
  candidateAvailability: string,
  recruiterTimezone: string
): Promise<{ date: string; time: string; reason: string; score: number }[]> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `Suggest 3 ideal interview slots for ${candidateName}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            reason: { type: Type.STRING },
            score: { type: Type.NUMBER }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const analyzeCandidate = async (
  resumeText: string,
  jobDescription: string
): Promise<{ score: number; summary: string; skills: string[] }> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `Analyze this candidate resume against the job description.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateJobDescription = async (
  title: string, 
  department: string, 
  location: string, 
  keywords: string
): Promise<string> => {
   const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a job description for ${title}.`
   });
   return response.text || "";
}

export const generateApplicationMaterials = async (
    candidate: Candidate,
    jobTitle: string,
    company: string
): Promise<ApplicationMaterials> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write materials for ${candidate.firstName} for ${jobTitle}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coverLetter: { type: Type.STRING },
              tailoredResumeSummary: { type: Type.STRING }
            }
          }
        }
    });
    return JSON.parse(response.text || '{}');
};
