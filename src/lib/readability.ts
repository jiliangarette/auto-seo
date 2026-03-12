import { openai } from '@/integrations/openai/client';

interface ReadabilityResult {
  fleschKincaid: { score: number; gradeLevel: string };
  avgSentenceLength: number;
  avgParagraphLength: number;
  wordCount: number;
  sentenceCount: number;
  complexSentences: { text: string; reason: string }[];
  simplifications: { original: string; simplified: string; reason: string }[];
  overallLevel: 'easy' | 'moderate' | 'difficult';
}

export function calculateBasicMetrics(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgSentenceLen = sentences.length ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length ? syllables / words.length : 0;

  // Flesch-Kincaid Grade Level
  const fkGrade = 0.39 * avgSentenceLen + 11.8 * avgSyllablesPerWord - 15.59;
  // Flesch Reading Ease
  const fkScore = 206.835 - 1.015 * avgSentenceLen - 84.6 * avgSyllablesPerWord;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgSentenceLength: Math.round(avgSentenceLen * 10) / 10,
    avgParagraphLength: Math.round((paragraphs.length ? words.length / paragraphs.length : 0) * 10) / 10,
    fleschScore: Math.round(Math.max(0, Math.min(100, fkScore))),
    gradeLevel: Math.round(Math.max(0, fkGrade) * 10) / 10,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (word.endsWith('e')) count--;
  return Math.max(1, count);
}

export async function analyzeReadability(text: string): Promise<ReadabilityResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: 'You are a readability expert. Analyze text for readability issues. Return JSON only.',
      },
      {
        role: 'user',
        content: `Analyze readability:

${text}

Return JSON:
- fleschKincaid: { score (0-100, higher=easier), gradeLevel (e.g., "8th Grade") }
- avgSentenceLength, avgParagraphLength, wordCount, sentenceCount
- complexSentences: [{ text, reason }] — max 5 hardest to read sentences
- simplifications: [{ original, simplified, reason }] — max 5 suggested simplifications
- overallLevel: "easy", "moderate", or "difficult"`,
      },
    ],
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as ReadabilityResult;
}
