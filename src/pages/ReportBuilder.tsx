import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileBarChart,
  GripVertical,
  Plus,
  Trash2,
  Palette,
  Image,
  Download,
  Clock,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportSection {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
}

interface BrandConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

interface ScheduleConfig {
  frequency: 'none' | 'weekly' | 'monthly';
  email: string;
  dayOfWeek: number;
  dayOfMonth: number;
}

const defaultSections: ReportSection[] = [
  { id: '1', type: 'summary', label: 'Executive Summary', enabled: true },
  { id: '2', type: 'keywords', label: 'Keyword Rankings', enabled: true },
  { id: '3', type: 'traffic', label: 'Traffic Overview', enabled: true },
  { id: '4', type: 'backlinks', label: 'Backlink Profile', enabled: true },
  { id: '5', type: 'audit', label: 'Site Audit Results', enabled: false },
  { id: '6', type: 'content', label: 'Content Performance', enabled: false },
  { id: '7', type: 'competitors', label: 'Competitor Analysis', enabled: false },
  { id: '8', type: 'recommendations', label: 'Recommendations', enabled: true },
];

const sectionPreview: Record<string, string> = {
  summary: 'High-level project metrics: SEO score, keyword count, backlink health, and month-over-month trends.',
  keywords: 'Ranking positions for tracked keywords with change indicators and search volume data.',
  traffic: 'Estimated organic traffic trends, top landing pages, and session duration metrics.',
  backlinks: 'Total backlinks, domain authority distribution, new/lost links, and toxic link warnings.',
  audit: 'Technical SEO issues categorized by severity with fix recommendations.',
  content: 'Content scores, readability metrics, and optimization opportunities.',
  competitors: 'Side-by-side comparison with top competitors across key SEO metrics.',
  recommendations: 'Prioritized action items based on current data and industry best practices.',
};

export default function ReportBuilder() {
  const [sections, setSections] = useState<ReportSection[]>(defaultSections);
  const [brand, setBrand] = useState<BrandConfig>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
  });
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    frequency: 'none',
    email: '',
    dayOfWeek: 1,
    dayOfMonth: 1,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'brand' | 'schedule'>('sections');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const moveSection = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= sections.length) return;
    const updated = [...sections];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    setSections(updated);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...sections];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, removed);
    setSections(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const addCustomSection = () => {
    const newSection: ReportSection = {
      id: crypto.randomUUID(),
      type: 'custom',
      label: 'Custom Section',
      enabled: true,
    };
    setSections((prev) => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const renameSection = (id: string, label: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, label } : s));
  };

  const enabledSections = sections.filter((s) => s.enabled);

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Allow pop-ups to export PDF.');
      return;
    }
    const html = `<!DOCTYPE html>
<html><head><title>${brand.companyName || 'SEO'} Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; color: #1a1a1a; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; border-bottom: 3px solid ${brand.primaryColor}; padding-bottom: 16px; }
  .logo { max-height: 48px; }
  h1 { color: ${brand.primaryColor}; margin: 0; font-size: 24px; }
  h2 { color: ${brand.primaryColor}; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }
  .section { margin-bottom: 24px; }
  .preview-text { color: #6b7280; font-size: 14px; line-height: 1.6; }
  .badge { display: inline-block; background: ${brand.accentColor}20; color: ${brand.accentColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
</style></head><body>
<div class="header">
  ${brand.logoUrl ? `<img src="${brand.logoUrl}" class="logo" />` : ''}
  <h1>${brand.companyName || 'SEO'} Report</h1>
</div>
${enabledSections.map((s) => `<div class="section"><h2>${s.label}</h2><p class="preview-text">${sectionPreview[s.type] || 'Custom section content goes here.'}</p></div>`).join('')}
<div class="footer">Generated on ${new Date().toLocaleDateString()} ${brand.companyName ? `• ${brand.companyName}` : ''}</div>
</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success('PDF export opened — use browser print dialog');
  };

  const saveSchedule = () => {
    if (schedule.frequency !== 'none' && !schedule.email.trim()) {
      toast.error('Enter an email for scheduled delivery');
      return;
    }
    toast.success(schedule.frequency === 'none' ? 'Schedule cleared' : `Report scheduled ${schedule.frequency} to ${schedule.email}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileBarChart className="size-6" />
              Report Builder
            </h1>
            <p className="text-muted-foreground">Build custom reports with drag-and-drop sections</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="size-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={exportPdf}>
              <Download className="size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {previewMode ? (
          /* Preview mode */
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border p-6 bg-white text-black dark:bg-gray-50">
                <div className="flex items-center gap-3 mb-6 border-b-2 pb-4" style={{ borderColor: brand.primaryColor }}>
                  {brand.logoUrl && <img src={brand.logoUrl} alt="Logo" className="h-10 object-contain" />}
                  <h2 className="text-xl font-bold" style={{ color: brand.primaryColor }}>
                    {brand.companyName || 'SEO'} Report
                  </h2>
                </div>
                {enabledSections.map((s) => (
                  <div key={s.id} className="mb-6">
                    <h3 className="text-base font-semibold mb-1" style={{ color: brand.primaryColor }}>{s.label}</h3>
                    <p className="text-sm text-gray-600">{sectionPreview[s.type] || 'Custom section content will appear here.'}</p>
                  </div>
                ))}
                <div className="mt-8 pt-4 border-t text-xs text-gray-400 text-center">
                  Generated on {new Date().toLocaleDateString()} {brand.companyName ? `• ${brand.companyName}` : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              {(['sections', 'brand', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'sections' && 'Sections'}
                  {tab === 'brand' && 'Branding'}
                  {tab === 'schedule' && 'Schedule'}
                </button>
              ))}
            </div>

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Report Sections ({enabledSections.length} active)</CardTitle>
                    <Button variant="outline" size="sm" onClick={addCustomSection}>
                      <Plus className="size-3.5" />
                      Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {sections.map((s, i) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-center gap-2 rounded-md border border-border/50 p-2.5 cursor-grab active:cursor-grabbing ${
                        s.enabled ? 'bg-muted/20' : 'opacity-50'
                      } hover:bg-muted/40 transition-colors`}
                    >
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={() => toggleSection(s.id)}
                        className="rounded border-input"
                      />
                      {s.type === 'custom' ? (
                        <input
                          className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-primary"
                          value={s.label}
                          onChange={(e) => renameSection(s.id, e.target.value)}
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium">{s.label}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{s.type}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveSection(i, 'up')} className="p-0.5 text-muted-foreground hover:text-foreground" disabled={i === 0}>
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button onClick={() => moveSection(i, 'down')} className="p-0.5 text-muted-foreground hover:text-foreground" disabled={i === sections.length - 1}>
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>
                      {s.type === 'custom' && (
                        <button onClick={() => removeSection(s.id)} className="p-0.5 text-red-400 hover:text-red-300">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Branding Tab */}
            {activeTab === 'brand' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="size-4" />
                    White-Label Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Company Name</label>
                    <Input value={brand.companyName} onChange={(e) => setBrand({ ...brand, companyName: e.target.value })} placeholder="Acme SEO Agency" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1">
                      <Image className="size-3" /> Logo URL
                    </label>
                    <Input value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Primary Color</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} className="h-8 w-8 rounded cursor-pointer border-0" />
                        <Input value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} className="flex-1 font-mono text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Accent Color</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={brand.accentColor} onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })} className="h-8 w-8 rounded cursor-pointer border-0" />
                        <Input value={brand.accentColor} onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })} className="flex-1 font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                  {brand.companyName && (
                    <div className="rounded-lg border border-border p-4 mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Preview</p>
                      <div className="flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: brand.primaryColor }}>
                        {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-6 object-contain" />}
                        <span className="text-sm font-bold" style={{ color: brand.primaryColor }}>{brand.companyName}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="size-4" />
                    Scheduled Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Frequency</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={schedule.frequency}
                      onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as ScheduleConfig['frequency'] })}
                    >
                      <option value="none">No schedule</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  {schedule.frequency !== 'none' && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Delivery Email</label>
                        <Input
                          type="email"
                          value={schedule.email}
                          onChange={(e) => setSchedule({ ...schedule, email: e.target.value })}
                          placeholder="reports@company.com"
                        />
                      </div>
                      {schedule.frequency === 'weekly' && (
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Day of Week</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={schedule.dayOfWeek}
                            onChange={(e) => setSchedule({ ...schedule, dayOfWeek: Number(e.target.value) })}
                          >
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                              <option key={d} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {schedule.frequency === 'monthly' && (
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Day of Month</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={schedule.dayOfMonth}
                            onChange={(e) => setSchedule({ ...schedule, dayOfMonth: Number(e.target.value) })}
                          >
                            {Array.from({ length: 28 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  <Button onClick={saveSchedule}>
                    <Clock className="size-4" />
                    {schedule.frequency === 'none' ? 'Clear Schedule' : 'Save Schedule'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
