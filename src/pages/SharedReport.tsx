import { useParams } from 'react-router-dom';
import { useReportByToken } from '@/hooks/useReports';

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const { data: report, isLoading, error } = useReportByToken(token!);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Report not found or not public.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      dangerouslySetInnerHTML={{ __html: report.html_content }}
    />
  );
}
