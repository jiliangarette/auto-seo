import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe,
  Loader2,
  Copy,
  Check,
  Languages,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface LanguageAnalysis {
  detectedLanguage: string;
  confidence: number;
  suggestions: string[];
}

interface HreflangTag {
  lang: string;
  region: string;
  url: string;
}

interface TranslationIssue {
  type: 'grammar' | 'fluency' | 'seo' | 'cultural';
  text: string;
  severity: 'low' | 'medium' | 'high';
}

interface SerpPreviewData {
  region: string;
  title: string;
  description: string;
  url: string;
}

const regions = [
  { code: 'us', name: 'United States', lang: 'en' },
  { code: 'gb', name: 'United Kingdom', lang: 'en' },
  { code: 'de', name: 'Germany', lang: 'de' },
  { code: 'fr', name: 'France', lang: 'fr' },
  { code: 'es', name: 'Spain', lang: 'es' },
  { code: 'jp', name: 'Japan', lang: 'ja' },
  { code: 'br', name: 'Brazil', lang: 'pt' },
  { code: 'mx', name: 'Mexico', lang: 'es' },
  { code: 'it', name: 'Italy', lang: 'it' },
  { code: 'nl', name: 'Netherlands', lang: 'nl' },
];

export default function Internationalization() {
  const [activeTab, setActiveTab] = useState<'detect' | 'hreflang' | 'serp' | 'translate'>('detect');

  // Language detection
  const [contentInput, setContentInput] = useState('');
  const [langResult, setLangResult] = useState<LanguageAnalysis | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Hreflang
  const [baseUrl, setBaseUrl] = useState('');
  const [hreflangTags, setHreflangTags] = useState<HreflangTag[]>([
    { lang: 'en', region: 'us', url: '' },
  ]);
  const [hreflangCopied, setHreflangCopied] = useState(false);

  // SERP preview
  const [serpUrl, setSerpUrl] = useState('');
  const [serpKeyword, setSerpKeyword] = useState('');
  const [serpPreviews, setSerpPreviews] = useState<SerpPreviewData[]>([]);
  const [serpLoading, setSerpLoading] = useState(false);

  // Translation checker
  const [translateContent, setTranslateContent] = useState('');
  const [translateLang, setTranslateLang] = useState('es');
  const [translationIssues, setTranslationIssues] = useState<TranslationIssue[]>([]);
  const [checkingTranslation, setCheckingTranslation] = useState(false);

  const detectLanguage = async () => {
    if (!contentInput.trim()) return;
    setDetecting(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'Detect the language of the content. Return JSON only.' },
          { role: 'user', content: `Detect language and provide SEO suggestions for multi-language optimization:\n\n${contentInput.slice(0, 2000)}\n\nReturn: { "detectedLanguage": "language name", "confidence": 0-100, "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setLangResult(JSON.parse(cleaned));
      toast.success('Language detected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const addHreflangTag = () => {
    setHreflangTags((prev) => [...prev, { lang: 'en', region: 'us', url: '' }]);
  };

  const updateHreflangTag = (index: number, field: keyof HreflangTag, value: string) => {
    setHreflangTags((prev) => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const removeHreflangTag = (index: number) => {
    setHreflangTags((prev) => prev.filter((_, i) => i !== index));
  };

  const generateHreflangHtml = () => {
    const tags = hreflangTags
      .filter((t) => t.url)
      .map((t) => `<link rel="alternate" hreflang="${t.lang}-${t.region}" href="${t.url}" />`)
      .join('\n');
    const xDefault = baseUrl ? `<link rel="alternate" hreflang="x-default" href="${baseUrl}" />` : '';
    return [xDefault, tags].filter(Boolean).join('\n');
  };

  const copyHreflang = () => {
    navigator.clipboard.writeText(generateHreflangHtml());
    setHreflangCopied(true);
    toast.success('Hreflang tags copied');
    setTimeout(() => setHreflangCopied(false), 2000);
  };

  const generateSerpPreviews = async () => {
    if (!serpUrl.trim() || !serpKeyword.trim()) {
      toast.error('Enter URL and keyword');
      return;
    }
    setSerpLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'Generate region-specific SERP previews. Return JSON only.' },
          { role: 'user', content: `Generate SERP previews for "${serpKeyword}" targeting URL "${serpUrl}" for these regions: US, UK, Germany, France, Japan.\n\nReturn JSON array: [{ "region": "region name", "title": "localized title tag", "description": "localized meta description", "url": "display URL" }]` },
        ],
      });
      const raw = response.choices[0].message.content ?? '[]';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setSerpPreviews(JSON.parse(cleaned));
      toast.success('SERP previews generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setSerpLoading(false);
    }
  };

  const checkTranslation = async () => {
    if (!translateContent.trim()) return;
    setCheckingTranslation(true);
    try {
      const langName = regions.find((r) => r.lang === translateLang)?.name ?? translateLang;
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a translation quality checker. Return JSON only.' },
          { role: 'user', content: `Check this ${langName} content for translation quality issues:\n\n${translateContent.slice(0, 2000)}\n\nReturn JSON array: [{ "type": "grammar"|"fluency"|"seo"|"cultural", "text": "issue description", "severity": "low"|"medium"|"high" }]` },
        ],
      });
      const raw = response.choices[0].message.content ?? '[]';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setTranslationIssues(JSON.parse(cleaned));
      toast.success('Translation checked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setCheckingTranslation(false);
    }
  };

  const severityColor = {
    low: 'text-blue-400 bg-blue-950/30',
    medium: 'text-yellow-400 bg-yellow-950/30',
    high: 'text-red-400 bg-red-950/30',
  };

  const typeIcon = {
    grammar: 'G',
    fluency: 'F',
    seo: 'S',
    cultural: 'C',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="size-6" />
            Internationalization
          </h1>
          <p className="text-muted-foreground">Multi-language SEO analysis, hreflang tags, and regional SERP previews</p>
        </div>

        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'detect', label: 'Language Detection', icon: Languages },
            { key: 'hreflang', label: 'Hreflang Generator', icon: Globe },
            { key: 'serp', label: 'Regional SERP', icon: MapPin },
            { key: 'translate', label: 'Translation Check', icon: AlertTriangle },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Language Detection */}
        {activeTab === 'detect' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Languages className="size-4" />
                Detect Content Language
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
                placeholder="Paste your content here to detect its language..."
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
              />
              <Button onClick={detectLanguage} disabled={detecting || !contentInput.trim()}>
                {detecting ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
                Detect Language
              </Button>
              {langResult && (
                <div className="rounded-md border border-border/50 p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-bold">{langResult.detectedLanguage}</p>
                      <p className="text-xs text-muted-foreground">Detected Language</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${langResult.confidence >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {langResult.confidence}%
                      </p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">SEO Suggestions</p>
                    <ul className="space-y-1">
                      {langResult.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hreflang Generator */}
        {activeTab === 'hreflang' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="size-4" />
                Hreflang Tag Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Default URL (x-default)</label>
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                {hreflangTags.map((tag, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm w-[80px]"
                      value={tag.lang}
                      onChange={(e) => updateHreflangTag(i, 'lang', e.target.value)}
                    >
                      {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'nl', 'ru', 'ar'].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm w-[80px]"
                      value={tag.region}
                      onChange={(e) => updateHreflangTag(i, 'region', e.target.value)}
                    >
                      {regions.map((r) => (
                        <option key={r.code} value={r.code}>{r.code.toUpperCase()}</option>
                      ))}
                    </select>
                    <Input
                      value={tag.url}
                      onChange={(e) => updateHreflangTag(i, 'url', e.target.value)}
                      placeholder={`https://example.com/${tag.lang}/`}
                      className="flex-1 text-xs font-mono"
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={() => removeHreflangTag(i)}>
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addHreflangTag}>+ Add Tag</Button>
                <Button size="sm" onClick={copyHreflang}>
                  {hreflangCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {hreflangCopied ? 'Copied' : 'Copy HTML'}
                </Button>
              </div>
              {hreflangTags.some((t) => t.url) && (
                <pre className="rounded-md border border-border bg-muted/20 p-3 text-xs font-mono overflow-auto">
                  {generateHreflangHtml()}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Regional SERP Preview */}
        {activeTab === 'serp' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="size-4" />
                Region-Specific SERP Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Target URL</label>
                  <Input value={serpUrl} onChange={(e) => setSerpUrl(e.target.value)} placeholder="https://example.com/page" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Target Keyword</label>
                  <Input value={serpKeyword} onChange={(e) => setSerpKeyword(e.target.value)} placeholder="best seo tools" />
                </div>
              </div>
              <Button onClick={generateSerpPreviews} disabled={serpLoading}>
                {serpLoading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                Generate Previews
              </Button>
              {serpPreviews.length > 0 && (
                <div className="space-y-3">
                  {serpPreviews.map((p, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-3">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="size-2.5" /> {p.region}
                      </p>
                      <div className="rounded bg-white p-3 text-black dark:bg-gray-50">
                        <p className="text-xs text-green-700 truncate">{p.url}</p>
                        <p className="text-sm font-medium text-blue-700 hover:underline cursor-pointer">{p.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Translation Quality Checker */}
        {activeTab === 'translate' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Translation Quality Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Content Language</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                >
                  {regions.map((r) => (
                    <option key={`${r.lang}-${r.code}`} value={r.lang}>{r.name} ({r.lang})</option>
                  ))}
                </select>
              </div>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] resize-y"
                placeholder="Paste translated content to check for quality issues..."
                value={translateContent}
                onChange={(e) => setTranslateContent(e.target.value)}
              />
              <Button onClick={checkTranslation} disabled={checkingTranslation || !translateContent.trim()}>
                {checkingTranslation ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                Check Translation
              </Button>
              {translationIssues.length > 0 && (
                <div className="space-y-2">
                  {translationIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-border/50 p-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${severityColor[issue.severity]}`}>
                        {typeIcon[issue.type]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium capitalize">{issue.type}</span>
                          <span className={`text-[10px] ${severityColor[issue.severity].split(' ')[0]} rounded px-1 py-0.5`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{issue.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
