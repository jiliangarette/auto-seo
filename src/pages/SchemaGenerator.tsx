import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

type SchemaType = 'Article' | 'Product' | 'FAQ' | 'HowTo' | 'LocalBusiness';

interface SchemaField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

const schemaFields: Record<SchemaType, SchemaField[]> = {
  Article: [
    { key: 'headline', label: 'Headline', placeholder: 'Article title', required: true },
    { key: 'description', label: 'Description', placeholder: 'Short description' },
    { key: 'author', label: 'Author', placeholder: 'Author name', required: true },
    { key: 'datePublished', label: 'Date Published', placeholder: '2024-01-15' },
    { key: 'image', label: 'Image URL', placeholder: 'https://...' },
    { key: 'publisher', label: 'Publisher', placeholder: 'Publisher name' },
  ],
  Product: [
    { key: 'name', label: 'Product Name', placeholder: 'Product name', required: true },
    { key: 'description', label: 'Description', placeholder: 'Product description' },
    { key: 'image', label: 'Image URL', placeholder: 'https://...' },
    { key: 'price', label: 'Price', placeholder: '29.99' },
    { key: 'currency', label: 'Currency', placeholder: 'USD' },
    { key: 'brand', label: 'Brand', placeholder: 'Brand name' },
    { key: 'sku', label: 'SKU', placeholder: 'SKU-12345' },
  ],
  FAQ: [
    { key: 'q1', label: 'Question 1', placeholder: 'First question', required: true },
    { key: 'a1', label: 'Answer 1', placeholder: 'Answer to first question', required: true },
    { key: 'q2', label: 'Question 2', placeholder: 'Second question' },
    { key: 'a2', label: 'Answer 2', placeholder: 'Answer to second question' },
    { key: 'q3', label: 'Question 3', placeholder: 'Third question' },
    { key: 'a3', label: 'Answer 3', placeholder: 'Answer to third question' },
  ],
  HowTo: [
    { key: 'name', label: 'Title', placeholder: 'How to...', required: true },
    { key: 'description', label: 'Description', placeholder: 'Brief description' },
    { key: 'step1', label: 'Step 1', placeholder: 'First step', required: true },
    { key: 'step2', label: 'Step 2', placeholder: 'Second step' },
    { key: 'step3', label: 'Step 3', placeholder: 'Third step' },
    { key: 'step4', label: 'Step 4', placeholder: 'Fourth step' },
    { key: 'totalTime', label: 'Total Time', placeholder: 'PT30M (30 minutes)' },
  ],
  LocalBusiness: [
    { key: 'name', label: 'Business Name', placeholder: 'My Business', required: true },
    { key: 'description', label: 'Description', placeholder: 'Business description' },
    { key: 'address', label: 'Address', placeholder: '123 Main St, City, State' },
    { key: 'phone', label: 'Phone', placeholder: '+1-555-0123' },
    { key: 'url', label: 'Website', placeholder: 'https://...' },
    { key: 'image', label: 'Image URL', placeholder: 'https://...' },
    { key: 'priceRange', label: 'Price Range', placeholder: '$$' },
  ],
};

function buildSchema(type: SchemaType, values: Record<string, string>): object {
  const base = { '@context': 'https://schema.org' };

  if (type === 'Article') {
    return {
      ...base,
      '@type': 'Article',
      headline: values.headline,
      description: values.description,
      author: { '@type': 'Person', name: values.author },
      datePublished: values.datePublished,
      image: values.image,
      publisher: values.publisher ? { '@type': 'Organization', name: values.publisher } : undefined,
    };
  }
  if (type === 'Product') {
    return {
      ...base,
      '@type': 'Product',
      name: values.name,
      description: values.description,
      image: values.image,
      brand: values.brand ? { '@type': 'Brand', name: values.brand } : undefined,
      sku: values.sku,
      offers: values.price ? {
        '@type': 'Offer',
        price: values.price,
        priceCurrency: values.currency || 'USD',
        availability: 'https://schema.org/InStock',
      } : undefined,
    };
  }
  if (type === 'FAQ') {
    const items = [];
    for (let i = 1; i <= 3; i++) {
      if (values[`q${i}`] && values[`a${i}`]) {
        items.push({
          '@type': 'Question',
          name: values[`q${i}`],
          acceptedAnswer: { '@type': 'Answer', text: values[`a${i}`] },
        });
      }
    }
    return { ...base, '@type': 'FAQPage', mainEntity: items };
  }
  if (type === 'HowTo') {
    const steps = [];
    for (let i = 1; i <= 4; i++) {
      if (values[`step${i}`]) {
        steps.push({ '@type': 'HowToStep', text: values[`step${i}`] });
      }
    }
    return {
      ...base,
      '@type': 'HowTo',
      name: values.name,
      description: values.description,
      totalTime: values.totalTime,
      step: steps,
    };
  }
  // LocalBusiness
  return {
    ...base,
    '@type': 'LocalBusiness',
    name: values.name,
    description: values.description,
    address: values.address,
    telephone: values.phone,
    url: values.url,
    image: values.image,
    priceRange: values.priceRange,
  };
}

export default function SchemaGenerator() {
  const [schemaType, setSchemaType] = useState<SchemaType>('Article');
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const fields = schemaFields[schemaType];
  const schema = buildSchema(schemaType, values);
  const jsonLd = JSON.stringify(schema, null, 2);
  const htmlSnippet = `<script type="application/ld+json">\n${jsonLd}\n</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlSnippet);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="size-6" />
            Schema Markup Generator
          </h1>
          <p className="text-muted-foreground">Generate JSON-LD structured data for rich search results</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Schema Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(schemaFields) as SchemaType[]).map((type) => (
                <Button
                  key={type}
                  variant={schemaType === type ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => { setSchemaType(type); setValues({}); }}
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{schemaType} Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <Input
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ''}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generated JSON-LD</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy HTML'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-green-400">
              <code>{htmlSnippet}</code>
            </pre>
          </CardContent>
        </Card>

        {/* Validation hints */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">
              Paste this snippet in your page's {'<head>'} tag. Validate at{' '}
              <span className="font-medium text-foreground">Google's Rich Results Test</span> or{' '}
              <span className="font-medium text-foreground">Schema.org Validator</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
