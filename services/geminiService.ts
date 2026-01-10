

import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, GeneratedEmail, ApplicationMaterials } from "../types";

// Always use a named parameter for apiKey and direct access to process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to check if API key is present
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
    
    Make it professional but engaging. 
    Return JSON with 'subject' and 'body' fields.
  `;

  // Use recommended gemini-3-flash-preview for text tasks
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

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as GeneratedEmail;
};

export const analyzeCandidate = async (
  resumeText: string,
  jobDescription: string
): Promise<{ score: number; summary: string; skills: string[] }> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `
    Analyze this candidate's resume against the job description.
    
    Resume: "${resumeText.substring(0, 1000)}..."
    Job Description: "${jobDescription.substring(0, 500)}..."
    
    Provide:
    1. A match score from 0 to 100.
    2. A brief 2-sentence summary of why they fit or don't fit.
    3. A list of top 5 extracted skills.
  `;

  // Use recommended gemini-3-flash-preview for text analysis tasks
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

   const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text);
};

export const generateJobDescription = async (
  title: string, 
  department: string, 
  location: string, 
  keywords: string
): Promise<string> => {
   if (!process.env.API_KEY) throw new Error("API Key missing");
   
   let prompt = `Write a concise, exciting job description for a ${title}`;
   if (department) prompt += ` in the ${department} department`;
   if (location) prompt += ` located in ${location}`;
   prompt += `.`;
   
   if (keywords) prompt += ` Focus on these keywords: ${keywords}.`;
   prompt += ` Format with Markdown. Structure with Responsibilities and Requirements.`;

   // Use recommended gemini-3-flash-preview for text generation tasks
   const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
   });

   return response.text || "Could not generate description.";
}

export const generateApplicationMaterials = async (
    candidate: Candidate,
    jobTitle: string,
    company: string
): Promise<ApplicationMaterials> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const prompt = `
      You are an expert recruiter.
      Prepare application materials for:
      Candidate: ${candidate.firstName} ${candidate.lastName}
      Role: ${jobTitle} at ${company}
      Skills: ${candidate.skills.join(', ')}

      1. Write a short, punchy cover letter (max 200 words).
      2. Write a 3-bullet point summary of why they are the perfect fit (to paste into "Why should we hire you?" boxes).
      
      Return JSON with 'coverLetter' and 'tailoredResumeSummary'.
    `;

    // Use recommended gemini-3-flash-preview for text assistant tasks
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coverLetter: { type: Type.STRING },
              tailoredResumeSummary: { type: Type.STRING }
            }
          }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ApplicationMaterials;
};