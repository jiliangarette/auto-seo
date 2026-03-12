import { openai } from '@/integrations/openai/client';

interface KeywordCluster {
  name: string;
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  keywords: string[];
  contentPillar: string;
  suggestedArticles: string[];
}

export interface ClusterResult {
  clusters: KeywordCluster[];
  unclustered: string[];
}

export async function clusterKeywords(keywords: string[]): Promise<ClusterResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO keyword clustering expert. Group keywords by search intent and topic. Return JSON only.',
      },
      {
        role: 'user',
        content: `Cluster these keywords by search intent and topic:

${keywords.join('\n')}

Return JSON:
- clusters: [{ name (cluster topic), intent (informational/navigational/transactional/commercial), keywords: [], contentPillar (main content pillar topic), suggestedArticles: [2-3 article titles] }]
- unclustered: [] (keywords that don't fit any cluster)

Group related keywords together. Aim for 3-8 clusters.`,
      },
    ],
  });

  const raw = response.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as ClusterResult;
}
