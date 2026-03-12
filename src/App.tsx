import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import Sidebar from '@/components/Sidebar';
import { PageSkeleton } from '@/components/LoadingSkeleton';

// Code-split all page routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Projects = lazy(() => import('@/pages/Projects'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const Analyzer = lazy(() => import('@/pages/Analyzer'));
const Generator = lazy(() => import('@/pages/Generator'));
const SiteAudit = lazy(() => import('@/pages/SiteAudit'));
const ContentCalendar = lazy(() => import('@/pages/ContentCalendar'));
const Reports = lazy(() => import('@/pages/Reports'));
const SharedReport = lazy(() => import('@/pages/SharedReport'));
const MetaTagGenerator = lazy(() => import('@/pages/MetaTagGenerator'));
const InternalLinks = lazy(() => import('@/pages/InternalLinks'));
const Settings = lazy(() => import('@/pages/Settings'));
const ContentOptimizer = lazy(() => import('@/pages/ContentOptimizer'));
const SerpPreview = lazy(() => import('@/pages/SerpPreview'));
const BulkOperations = lazy(() => import('@/pages/BulkOperations'));
const ContentBrief = lazy(() => import('@/pages/ContentBrief'));
const PageSpeed = lazy(() => import('@/pages/PageSpeed'));
const SchemaGenerator = lazy(() => import('@/pages/SchemaGenerator'));
const ReadabilityAnalyzer = lazy(() => import('@/pages/ReadabilityAnalyzer'));
const SocialPreview = lazy(() => import('@/pages/SocialPreview'));
const MultiProjectDashboard = lazy(() => import('@/pages/MultiProjectDashboard'));
const CompetitiveResearch = lazy(() => import('@/pages/CompetitiveResearch'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const KeywordClustering = lazy(() => import('@/pages/KeywordClustering'));
const ContentScoring = lazy(() => import('@/pages/ContentScoring'));
const TopicAuthority = lazy(() => import('@/pages/TopicAuthority'));
const BacklinkQuality = lazy(() => import('@/pages/BacklinkQuality'));
const WritingAssistant = lazy(() => import('@/pages/WritingAssistant'));
const TeamCollaboration = lazy(() => import('@/pages/TeamCollaboration'));
const ReportBuilder = lazy(() => import('@/pages/ReportBuilder'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Sidebar>
        {children}
      </Sidebar>
    </ErrorBoundary>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
            <Route path="/signup" element={<LazyPage><Signup /></LazyPage>} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Dashboard /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Projects /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ProjectDetail /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Analyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Generator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SiteAudit /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentCalendar /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Reports /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meta-tags"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><MetaTagGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BulkOperations /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/serp-preview"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SerpPreview /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/internal-links"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><InternalLinks /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Settings /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schema"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SchemaGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/speed"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><PageSpeed /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/brief"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentBrief /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/writer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><WritingAssistant /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backlink-quality"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BacklinkQuality /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/topic-authority"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><TopicAuthority /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-scoring"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentScoring /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clustering"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordClustering /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Analytics /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitive"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitiveResearch /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/multi-dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><MultiProjectDashboard /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SocialPreview /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/readability"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ReadabilityAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-builder"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ReportBuilder /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><TeamCollaboration /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/report/:token" element={<LazyPage><SharedReport /></LazyPage>} />
            <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
