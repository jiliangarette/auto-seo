import { openai } from '@/integrations/openai/client';

export interface SEOAnalysisResult {
  score: number;
  suggestions: {
    title: { score: number; feedback: string };
    metaDescription: { score: number; feedback: string };
    headings: { score: number; feedback: string };
    keywordDensity: { score: number; feedback: string };
    readability: { score: number; feedback: string };
    contentLength: { score: number; feedback: string };
  };
}

const SYSTEM_PROMPT = `You are an SEO expert analyst. Analyze the provided webpage content and return a JSON object with the following structure:

{
  "score": <overall score 0-100>,
  "suggestions": {
    "title": { "score": <0-100>, "feedback": "<specific feedback>" },
    "metaDescription": { "score": <0-100>, "feedback": "<specific feedback>" },
    "headings": { "score": <0-100>, "feedback": "<specific feedback>" },
    "keywordDensity": { "score": <0-100>, "feedback": "<specific feedback>" },
    "readability": { "score": <0-100>, "feedback": "<specific feedback>" },
    "contentLength": { "score": <0-100>, "feedback": "<specific feedback>" }
  }
}

Be specific with actionable feedback. The overall score should be a weighted average.
Return ONLY valid JSON, no markdown or explanation.`;

export async function analyzeSEO(content: string, url: string): Promise<SEOAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyze the following webpage content from ${url}:\n\n${content.slice(0, 8000)}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  return JSON.parse(text) as SEOAnalysisResult;
}
