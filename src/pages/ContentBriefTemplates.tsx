import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Copy, Plus, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface BriefSection {
  heading: string;
  content: string;
}

interface Brief {
  id: string;
  templateName: string;
  topic: string;
  sections: BriefSection[];
}

const defaultTemplates = [
  { name: 'Blog Post', sections: ['Target Keyword', 'Search Intent', 'Outline', 'Word Count', 'Competitor Angles', 'Internal Links', 'CTA'] },
  { name: 'Pillar Page', sections: ['Core Topic', 'Cluster Keywords', 'Detailed Outline', 'Word Count', 'Internal Link Map', 'Content Gaps', 'Authority Signals'] },
  { name: 'Product Page', sections: ['Product Name', 'Target Keywords', 'USPs', 'Feature List', 'Schema Markup', 'FAQ Section', 'Conversion CTA'] },
  { name: 'Landing Page', sections: ['Campaign Goal', 'Target Audience', 'Headline Options', 'Value Proposition', 'Social Proof', 'CTA Variants', 'SEO Keywords'] },
];

let nextId = 1;

export default function ContentBriefTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0].name);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');

  const generate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setLoading(true);
    try {
      const template = defaultTemplates.find((t) => t.name === selectedTemplate);
      const sections = [...(template?.sections ?? []), ...customSections];
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a content strategist. Return JSON only.' },
          { role: 'user', content: `Generate a content brief for:\nTemplate: ${selectedTemplate}\nTopic: ${topic}\nSections to fill: ${sections.join(', ')}\n\nReturn JSON:\n{\n  "sections": [\n    { "heading": "section name", "content": "detailed content for this section" }\n  ]\n}\n\nFill each section with detailed, actionable content relevant to the topic.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setBriefs([{ id: String(nextId++), templateName: selectedTemplate, topic, sections: parsed.sections }, ...briefs]);
      toast.success('Brief generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    if (!newSection.trim()) return;
    setCustomSections([...customSections, newSection]);
    setNewSection('');
  };

  const removeSection = (idx: number) => {
    setCustomSections(customSections.filter((_, i) => i !== idx));
  };

  const copyBrief = (brief: Brief) => {
    const text = brief.sections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n');
    navigator.clipboard.writeText(`# ${brief.templateName} Brief — ${brief.topic}\n\n${text}`);
    toast.success('Brief copied');
  };

  const removeBrief = (id: string) => {
    setBriefs(briefs.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            Content Brief Templates
          </h1>
          <p className="text-muted-foreground">Pre-built and custom brief templates with AI population</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {defaultTemplates.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTemplate(t.name)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${selectedTemplate === t.name ? 'bg-primary/20 text-primary font-medium' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Sections: {defaultTemplates.find((t) => t.name === selectedTemplate)?.sections.join(' · ')}
              {customSections.length > 0 && ` · ${customSections.join(' · ')}`}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Add custom section" className="pl-10 bg-background/60 border-border/30 h-11" />
              </div>
              <Button variant="outline" size="sm" onClick={addSection}><Plus className="size-3.5" /></Button>
            </div>
            {customSections.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customSections.map((s, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSection(i)}><Trash2 className="size-2.5" /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic or keyword (e.g., 'SaaS email marketing')" className="pl-10 bg-background/60 border-border/30 h-11" />
            </div>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Generate Brief
            </Button>
          </CardContent>
        </Card>

        {briefs.map((brief) => (
          <Card key={brief.id} className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{brief.topic}</CardTitle>
                  <p className="text-[10px] text-muted-foreground">{brief.templateName} template</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyBrief(brief)}><Copy className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => removeBrief(brief.id)}><Trash2 className="size-3.5 text-muted-foreground" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brief.sections.map((section, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-medium text-primary mb-0.5">{section.heading}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {briefs.length === 0 && (
          <Card className="border-border/30 bg-card/40">
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">No briefs generated yet. Select a template and enter a topic to start.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
