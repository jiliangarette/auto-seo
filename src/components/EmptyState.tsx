import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
}: EmptyStateProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) onAction();
    else if (actionPath) navigate(actionPath);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-2xl bg-muted/50 p-6">
        <Icon className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && (
        <Button className="mt-4" onClick={handleClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
