import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HelpCircle,
  Loader2,
  Copy,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface FaqPair {
  question: string;
  answer: string;
}

export default function FaqSchemaGenerator() {
  const [topic, setTopic] = useState('');
  const [faqs, setFaqs] = useState<FaqPair[]>([{ question: '', answer: '' }]);
  const [loading, setLoading] = useState(false);
  const [generatedFaqs, setGeneratedFaqs] = useState<FaqPair[]>([]);

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFaq = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    const next = [...faqs];
    next[idx] = { ...next[idx], [field]: val };
    setFaqs(next);
  };

  const generateAiFaqs = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic to generate FAQs');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an FAQ content expert. Return JSON only.' },
          { role: 'user', content: `Generate 6-8 relevant FAQ pairs for: "${topic}"

Return JSON:
{ "faqs": [{ "question": "Q?", "answer": "Concise answer (2-3 sentences)" }] }

Make questions natural and answer-worthy. Answers should be informative but concise.` },
        ],
        temperature: 0.5,
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setGeneratedFaqs(parsed.faqs || []);
      toast.success('FAQs generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const useGeneratedFaq = (faq: FaqPair) => {
    setFaqs([...faqs.filter((f) => f.question || f.answer), faq]);
  };

  const useAllGenerated = () => {
    setFaqs(generatedFaqs);
  };

  const allFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }, null, 2);

  const scriptTag = `<script type="application/ld+json">\n${jsonLd}\n</script>`;

  const copyJsonLd = () => {
    navigator.clipboard.writeText(scriptTag);
    toast.success('FAQ schema copied');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="size-6" />
            FAQ Schema Generator
          </h1>
          <p className="text-muted-foreground">Generate FAQ rich result schema with AI-powered question generation</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI FAQ Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic (e.g., SEO best practices)" />
              <Button onClick={generateAiFaqs} disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedFaqs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">AI-Generated FAQs</CardTitle>
                <Button variant="outline" size="sm" onClick={useAllGenerated}>Use All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {generatedFaqs.map((faq, idx) => (
                <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{faq.question}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{faq.answer}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => useGeneratedFaq(faq)} className="shrink-0">
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FAQ Pairs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-md border border-border/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Question?"
                    className="text-xs"
                  />
                  {faqs.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeFaq(idx)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                  value={faq.answer}
                  onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                  placeholder="Answer..."
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFaq}>
              <Plus className="size-3.5" /> Add FAQ
            </Button>
          </CardContent>
        </Card>

        {allFaqs.length > 0 && (
          <>
            {/* Google Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Google FAQ Rich Result Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border/30 bg-white p-4 text-black">
                  {allFaqs.map((faq, idx) => (
                    <div key={idx} className="border-b border-gray-200 last:border-0 py-2">
                      <p className="text-sm font-medium text-blue-800">{faq.question}</p>
                      <p className="text-xs text-gray-600 mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* JSON-LD Output */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">FAQ Schema JSON-LD</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyJsonLd}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted/30 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {scriptTag}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
