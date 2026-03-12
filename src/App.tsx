import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Analyzer from '@/pages/Analyzer';
import Generator from '@/pages/Generator';
import SiteAudit from '@/pages/SiteAudit';
import ContentCalendar from '@/pages/ContentCalendar';
import Reports from '@/pages/Reports';
import SharedReport from '@/pages/SharedReport';
import MetaTagGenerator from '@/pages/MetaTagGenerator';
import InternalLinks from '@/pages/InternalLinks';
import Settings from '@/pages/Settings';
import ContentOptimizer from '@/pages/ContentOptimizer';
import NotFound from '@/pages/NotFound';

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
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projects />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analyzer />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Generator />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SiteAudit />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContentCalendar />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meta-tags"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MetaTagGenerator />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContentOptimizer />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/internal-links"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <InternalLinks />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/report/:token" element={<SharedReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
