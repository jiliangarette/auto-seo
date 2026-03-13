import { Input } from '@/components/ui/input';
import { useSiteContext } from '@/contexts/SiteContext';
import { Globe } from 'lucide-react';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'e.g., mybusiness.com',
  disabled = false,
  className = '',
}: UrlInputProps) {
  const { selectedProject } = useSiteContext();

  return (
    <div className={`relative ${className}`}>
      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 bg-background/60 border-border/30 h-11"
      />
      {selectedProject && !value && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {selectedProject.name}
        </span>
      )}
    </div>
  );
}
