import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Auto-reload on stale chunk errors (happens after new deployments)
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError')
    ) {
      const key = 'autoseo_chunk_reload';
      const lastReload = sessionStorage.getItem(key);
      // Only auto-reload once per session to avoid infinite loops
      if (!lastReload) {
        sessionStorage.setItem(key, Date.now().toString());
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk');

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8">
          <AlertTriangle className="size-8 text-destructive" />
          <div className="text-center">
            <h3 className="font-semibold">
              {isChunkError ? 'New version available' : 'Something went wrong'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isChunkError
                ? 'A new version was deployed. Click reload to get the latest.'
                : (this.state.error?.message || 'An unexpected error occurred')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="size-4" />
            {isChunkError ? 'Reload' : 'Try Again'}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
