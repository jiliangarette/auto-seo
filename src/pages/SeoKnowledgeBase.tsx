import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Search } from 'lucide-react';
import { toast } from 'sonner';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  example: string;
}

interface GuideCard {
  title: string;
  topic: string;
  steps: string[];
  tip: string;
}

const defaultTerms: GlossaryTerm[] = [
  { term: 'SERP', definition: 'Search Engine Results Page — the page displayed by search engines in response to a query.', category: 'General', example: 'Google SERP for "best CRM software"' },
  { term: 'Backlink', definition: 'A link from one website to another. High-quality backlinks improve domain authority.', category: 'Link Building', example: 'A blog post linking to your product page' },
  { term: 'Crawl Budget', definition: 'The number of pages a search engine bot will crawl on your site within a given timeframe.', category: 'Technical SEO', example: 'Googlebot crawling 500 pages/day on your site' },
  { term: 'E-E-A-T', definition: 'Experience, Expertise, Authoritativeness, Trustworthiness — Google\'s quality rater guidelines framework.', category: 'Content Quality', example: 'Medical articles written by certified doctors' },
  { term: 'Canonical Tag', definition: 'HTML element that tells search engines the preferred version of a duplicate or similar page.', category: 'Technical SEO', example: '<link rel="canonical" href="https://example.com/page" />' },
  { term: 'Long-tail Keyword', definition: 'A specific, multi-word search phrase with lower volume but higher conversion intent.', category: 'Keywords', example: '"best CRM for small law firms" vs "CRM"' },
  { term: 'Schema Markup', definition: 'Structured data vocabulary that helps search engines understand page content for rich results.', category: 'Technical SEO', example: 'FAQ schema generating expandable questions in SERPs' },
  { term: 'Domain Authority', definition: 'A score (1-100) predicting how well a domain will rank, based on link profile and other signals.', category: 'Link Building', example: 'Wikipedia has DA 99, a new blog might have DA 5' },
  { term: 'Core Web Vitals', definition: 'Google\'s set of user experience metrics: LCP (loading), INP (interactivity), CLS (visual stability).', category: 'Technical SEO', example: 'LCP under 2.5s is considered good' },
  { term: 'Keyword Cannibalization', definition: 'When multiple pages on the same site compete for the same keyword, diluting ranking potential.', category: 'Keywords', example: 'Two blog posts both targeting "email marketing tips"' },
  { term: 'Meta Description', definition: 'HTML attribute providing a brief summary of a page, displayed in SERP snippets (155-160 chars).', category: 'On-Page SEO', example: '"Learn how to optimize your site for search engines with our step-by-step guide."' },
  { term: 'Internal Linking', definition: 'Links between pages on the same website, distributing page authority and helping navigation.', category: 'On-Page SEO', example: 'A pillar page linking to cluster content articles' },
];

const defaultGuides: GuideCard[] = [
  { title: 'On-Page SEO Checklist', topic: 'On-Page', steps: ['Optimize title tag with target keyword', 'Write compelling meta description (155-160 chars)', 'Use H1 for main heading, H2-H6 for subheadings', 'Include target keyword in first 100 words', 'Optimize images with alt text and compression'], tip: 'Focus on user intent first, keyword placement second.' },
  { title: 'Technical SEO Basics', topic: 'Technical', steps: ['Submit XML sitemap to Search Console', 'Ensure robots.txt allows important pages', 'Fix broken links and redirect chains', 'Implement canonical tags for duplicate content', 'Optimize Core Web Vitals scores'], tip: 'Run a crawl audit monthly to catch new issues early.' },
  { title: 'Link Building Strategy', topic: 'Link Building', steps: ['Create link-worthy content (research, tools, guides)', 'Find relevant sites with backlink gap analysis', 'Send personalized outreach emails', 'Guest post on industry-relevant blogs', 'Monitor new and lost backlinks weekly'], tip: 'Quality over quantity — one DA 60+ link beats ten DA 10 links.' },
];

export default function SeoKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredTerms = defaultTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const askAi = async () => {
    if (!aiQuery.trim()) { toast.error('Enter a question'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Give concise, practical answers about SEO concepts, best practices, and strategies. Use bullet points where helpful. Keep answers under 200 words.' },
          { role: 'user', content: aiQuery },
        ],
      });
      setAiAnswer(response.choices[0].message.content ?? 'No answer generated.');
      toast.success('Answer generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(defaultTerms.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="size-6" />
            SEO Knowledge Base
          </h1>
          <p className="text-muted-foreground">Searchable glossary, best practices, and interactive explanations</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ask SEO Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask anything about SEO (e.g., How does PageRank work?)" onKeyDown={(e) => e.key === 'Enter' && askAi()} />
              <Button onClick={askAi} disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
            {aiAnswer && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">SEO Glossary ({filteredTerms.length} terms)</CardTitle>
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSearch(search === cat ? '' : cat)}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${search === cat ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search terms..." className="h-8 text-xs" />
            <div className="space-y-1.5">
              {filteredTerms.map((term, idx) => (
                <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{term.term}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{term.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{term.definition}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Example: {term.example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Reference Guides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {defaultGuides.map((guide, idx) => (
                <div key={idx} className="rounded-md border border-border/50 p-3 space-y-2">
                  <h3 className="text-sm font-bold">{guide.title}</h3>
                  <ol className="space-y-1">
                    {guide.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-primary font-bold shrink-0">{sIdx + 1}.</span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-[10px] text-primary/70 italic border-t border-border/30 pt-1.5">{guide.tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
