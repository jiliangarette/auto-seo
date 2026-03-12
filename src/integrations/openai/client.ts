import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing VITE_OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});
