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
const ApiPlayground = lazy(() => import('@/pages/ApiPlayground'));
const Internationalization = lazy(() => import('@/pages/Internationalization'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const SearchConsole = lazy(() => import('@/pages/SearchConsole'));
const CompetitorMonitoring = lazy(() => import('@/pages/CompetitorMonitoring'));
const ContentAbTest = lazy(() => import('@/pages/ContentAbTest'));
const LinkOutreach = lazy(() => import('@/pages/LinkOutreach'));
const DashboardWidgets = lazy(() => import('@/pages/DashboardWidgets'));
const AiKeywordResearch = lazy(() => import('@/pages/AiKeywordResearch'));
const ContentRepurposer = lazy(() => import('@/pages/ContentRepurposer'));
const AuditScheduler = lazy(() => import('@/pages/AuditScheduler'));
const SitemapAnalyzer = lazy(() => import('@/pages/SitemapAnalyzer'));
const Benchmarking = lazy(() => import('@/pages/Benchmarking'));
const KeywordGap = lazy(() => import('@/pages/KeywordGap'));
const ContentDecay = lazy(() => import('@/pages/ContentDecay'));
const StructuredDataValidator = lazy(() => import('@/pages/StructuredDataValidator'));
const ImageSeoOptimizer = lazy(() => import('@/pages/ImageSeoOptimizer'));
const SeoScoringDashboard = lazy(() => import('@/pages/SeoScoringDashboard'));
const CtaOptimizer = lazy(() => import('@/pages/CtaOptimizer'));
const ContentRoi = lazy(() => import('@/pages/ContentRoi'));
const AnchorTextAnalyzer = lazy(() => import('@/pages/AnchorTextAnalyzer'));
const CannibalizationDetector = lazy(() => import('@/pages/CannibalizationDetector'));
const FeaturedSnippetOptimizer = lazy(() => import('@/pages/FeaturedSnippetOptimizer'));
const RobotsTxtAnalyzer = lazy(() => import('@/pages/RobotsTxtAnalyzer'));
const RedirectChainChecker = lazy(() => import('@/pages/RedirectChainChecker'));
const ContentFreshnessPlanner = lazy(() => import('@/pages/ContentFreshnessPlanner'));
const EeatAnalyzer = lazy(() => import('@/pages/EeatAnalyzer'));
const LogFileAnalyzer = lazy(() => import('@/pages/LogFileAnalyzer'));
const CoreWebVitals = lazy(() => import('@/pages/CoreWebVitals'));
const ContentGapFinder = lazy(() => import('@/pages/ContentGapFinder'));
const LinkIntersection = lazy(() => import('@/pages/LinkIntersection'));
const FaqSchemaGenerator = lazy(() => import('@/pages/FaqSchemaGenerator'));
const HeadingAnalyzer = lazy(() => import('@/pages/HeadingAnalyzer'));
const ParagraphRewriter = lazy(() => import('@/pages/ParagraphRewriter'));
const TitleTagTester = lazy(() => import('@/pages/TitleTagTester'));
const KeywordDensityChecker = lazy(() => import('@/pages/KeywordDensityChecker'));
const CompetitorBacklinkSpy = lazy(() => import('@/pages/CompetitorBacklinkSpy'));
const SeoTaskManager = lazy(() => import('@/pages/SeoTaskManager'));
const LocalSeoChecker = lazy(() => import('@/pages/LocalSeoChecker'));
const BrokenLinkFinder = lazy(() => import('@/pages/BrokenLinkFinder'));
const ContentPillarPlanner = lazy(() => import('@/pages/ContentPillarPlanner'));
const CompetitorContentTracker = lazy(() => import('@/pages/CompetitorContentTracker'));
const SeoChecklistGenerator = lazy(() => import('@/pages/SeoChecklistGenerator'));
const XmlSitemapGenerator = lazy(() => import('@/pages/XmlSitemapGenerator'));
const CanonicalTagChecker = lazy(() => import('@/pages/CanonicalTagChecker'));
const ContentReadabilityGrader = lazy(() => import('@/pages/ContentReadabilityGrader'));
const BacklinkOutreachEmails = lazy(() => import('@/pages/BacklinkOutreachEmails'));
const SeoAuditReportBuilder = lazy(() => import('@/pages/SeoAuditReportBuilder'));
const ContentBriefTemplates = lazy(() => import('@/pages/ContentBriefTemplates'));
const TopicalMapGenerator = lazy(() => import('@/pages/TopicalMapGenerator'));
const SerpFeatureTracker = lazy(() => import('@/pages/SerpFeatureTracker'));
const DuplicateContentChecker = lazy(() => import('@/pages/DuplicateContentChecker'));
const MetaDescriptionBulk = lazy(() => import('@/pages/MetaDescriptionBulk'));
const KeywordIntentClassifier = lazy(() => import('@/pages/KeywordIntentClassifier'));
const PageTitleOptimizer = lazy(() => import('@/pages/PageTitleOptimizer'));
const InternalLinkAudit = lazy(() => import('@/pages/InternalLinkAudit'));
const ContentLengthAnalyzer = lazy(() => import('@/pages/ContentLengthAnalyzer'));
const SeoDashboardSummary = lazy(() => import('@/pages/SeoDashboardSummary'));
const UrlSlugOptimizer = lazy(() => import('@/pages/UrlSlugOptimizer'));
const ContentToneAnalyzer = lazy(() => import('@/pages/ContentToneAnalyzer'));
const KeywordCannibalizationMap = lazy(() => import('@/pages/KeywordCannibalizationMap'));
const SeoWorkflowAutomator = lazy(() => import('@/pages/SeoWorkflowAutomator'));
const CompetitorSerpTracker = lazy(() => import('@/pages/CompetitorSerpTracker'));
const ContentCalendarAi = lazy(() => import('@/pages/ContentCalendarAi'));
const SeoAbTestPlanner = lazy(() => import('@/pages/SeoAbTestPlanner'));
const BacklinkGapAnalyzer = lazy(() => import('@/pages/BacklinkGapAnalyzer'));
const ContentSummarizer = lazy(() => import('@/pages/ContentSummarizer'));
const SeoKnowledgeBase = lazy(() => import('@/pages/SeoKnowledgeBase'));
const SeoRoiDashboard = lazy(() => import('@/pages/SeoRoiDashboard'));
const ContentDecayDetector = lazy(() => import('@/pages/ContentDecayDetector'));
const SerpVolatilityMonitor = lazy(() => import('@/pages/SerpVolatilityMonitor'));
const EntitySeoOptimizer = lazy(() => import('@/pages/EntitySeoOptimizer'));
const SeoCompetitorPlaybook = lazy(() => import('@/pages/SeoCompetitorPlaybook'));
const TopicalAuthorityScore = lazy(() => import('@/pages/TopicalAuthorityScore'));
const SeoForecaster = lazy(() => import('@/pages/SeoForecaster'));
const SearchIntentMapper = lazy(() => import('@/pages/SearchIntentMapper'));
const SeoMigrationPlanner = lazy(() => import('@/pages/SeoMigrationPlanner'));
const KeywordClusteringPro = lazy(() => import('@/pages/KeywordClusteringPro'));
const ContentAuditScorer = lazy(() => import('@/pages/ContentAuditScorer'));
const AnchorTextPlanner = lazy(() => import('@/pages/AnchorTextPlanner'));
const SeoExperimentLog = lazy(() => import('@/pages/SeoExperimentLog'));
const RichSnippetTester = lazy(() => import('@/pages/RichSnippetTester'));
const BulkPageAnalyzer = lazy(() => import('@/pages/BulkPageAnalyzer'));
const HreflangTagGenerator = lazy(() => import('@/pages/HreflangTagGenerator'));
const ContentPerformanceTracker = lazy(() => import('@/pages/ContentPerformanceTracker'));
const SeoBudgetAllocator = lazy(() => import('@/pages/SeoBudgetAllocator'));
const CompetitorAlertSystem = lazy(() => import('@/pages/CompetitorAlertSystem'));
const SeoClientReport = lazy(() => import('@/pages/SeoClientReport'));
const KeywordOpportunityFinder = lazy(() => import('@/pages/KeywordOpportunityFinder'));
const ContentVelocityCalc = lazy(() => import('@/pages/ContentVelocityCalc'));
const SeoPenaltyChecker = lazy(() => import('@/pages/SeoPenaltyChecker'));
const BrandSerpManager = lazy(() => import('@/pages/BrandSerpManager'));
const SeoDashboardWidgets = lazy(() => import('@/pages/SeoDashboardWidgets'));
const LinkBuildingOutreach = lazy(() => import('@/pages/LinkBuildingOutreach'));
const SeoTrendAnalyzer = lazy(() => import('@/pages/SeoTrendAnalyzer'));
const ContentFreshnessMonitor = lazy(() => import('@/pages/ContentFreshnessMonitor'));
const SeoSplitTestRunner = lazy(() => import('@/pages/SeoSplitTestRunner'));
const KeywordCannibalizationDetector = lazy(() => import('@/pages/KeywordCannibalizationDetector'));
const ContentLocalizationPlanner = lazy(() => import('@/pages/ContentLocalizationPlanner'));
const SeoComplianceChecker = lazy(() => import('@/pages/SeoComplianceChecker'));
const SeoTaskPrioritizer = lazy(() => import('@/pages/SeoTaskPrioritizer'));
const ContentSentimentAnalyzer = lazy(() => import('@/pages/ContentSentimentAnalyzer'));
const BacklinkQualityScorer = lazy(() => import('@/pages/BacklinkQualityScorer'));
const SeoRevenueCalculator = lazy(() => import('@/pages/SeoRevenueCalculator'));
const ContentDistributionPlanner = lazy(() => import('@/pages/ContentDistributionPlanner'));
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
              path="/keyword-gap"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordGap /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/benchmarking"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Benchmarking /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sitemap"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SitemapAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-scheduler"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><AuditScheduler /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/repurpose"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentRepurposer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-research"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><AiKeywordResearch /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/widgets"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><DashboardWidgets /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/outreach"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><LinkOutreach /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ab-test"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentAbTest /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-monitoring"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitorMonitoring /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search-console"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SearchConsole /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/changelog"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Changelog /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/i18n"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><Internationalization /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-playground"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ApiPlayground /></LazyPage>
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
            <Route
              path="/structured-data"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><StructuredDataValidator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-tasks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoTaskManager /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backlink-spy"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitorBacklinkSpy /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-density"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordDensityChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/title-tester"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><TitleTagTester /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewriter"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ParagraphRewriter /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/heading-analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><HeadingAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq-schema"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><FaqSchemaGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/link-intersection"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><LinkIntersection /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-gaps"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentGapFinder /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cwv"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CoreWebVitals /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><LogFileAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/eeat"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><EeatAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/freshness-planner"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentFreshnessPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/redirect-checker"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><RedirectChainChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/robots-txt"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><RobotsTxtAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/featured-snippet"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><FeaturedSnippetOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cannibalization"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CannibalizationDetector /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/anchor-text"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><AnchorTextAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-roi"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentRoi /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cta-optimizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CtaOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-score"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoScoringDashboard /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/image-seo"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ImageSeoOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-decay"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentDecay /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/serp-tracker"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitorSerpTracker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-calendar-ai"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentCalendarAi /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penalty-checker"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoPenaltyChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/brand-serp"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BrandSerpManager /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-widgets"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoDashboardWidgets /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/link-outreach"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><LinkBuildingOutreach /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-trends"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoTrendAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-freshness"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentFreshnessMonitor /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/split-tests"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoSplitTestRunner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cannibalization"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordCannibalizationDetector /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/localization"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentLocalizationPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compliance"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoComplianceChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/task-priority"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoTaskPrioritizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sentiment"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentSentimentAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/link-scorer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BacklinkQualityScorer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/revenue-calc"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoRevenueCalculator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/distribution"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentDistributionPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-velocity"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentVelocityCalc /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-opportunities"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordOpportunityFinder /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-report"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoClientReport /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-alerts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitorAlertSystem /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-budget"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoBudgetAllocator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-performance"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentPerformanceTracker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hreflang-generator"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><HreflangTagGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk-page-analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BulkPageAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rich-snippet-tester"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><RichSnippetTester /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-experiment-log"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoExperimentLog /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/anchor-text-planner"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><AnchorTextPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-audit-scorer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentAuditScorer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-clustering-pro"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordClusteringPro /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-migration"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoMigrationPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search-intent-mapper"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SearchIntentMapper /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-forecaster"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoForecaster /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/topical-authority-score"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><TopicalAuthorityScore /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-playbook"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoCompetitorPlaybook /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/entity-seo"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><EntitySeoOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/serp-volatility"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SerpVolatilityMonitor /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-decay-detector"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentDecayDetector /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-roi"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoRoiDashboard /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-knowledge-base"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoKnowledgeBase /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-summarizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentSummarizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backlink-gap"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BacklinkGapAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-ab-test"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoAbTestPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflows"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoWorkflowAutomator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cannibalization-map"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordCannibalizationMap /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tone-analyzer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentToneAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/slug-optimizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><UrlSlugOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-summary"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoDashboardSummary /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-length"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentLengthAnalyzer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/link-audit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><InternalLinkAudit /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/title-optimizer"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><PageTitleOptimizer /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-intent"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><KeywordIntentClassifier /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meta-bulk"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><MetaDescriptionBulk /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/duplicate-checker"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><DuplicateContentChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/serp-features"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SerpFeatureTracker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/topical-map"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><TopicalMapGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/brief-templates"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentBriefTemplates /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-report"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoAuditReportBuilder /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/outreach-emails"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BacklinkOutreachEmails /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/readability-grader"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentReadabilityGrader /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/canonical-checker"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CanonicalTagChecker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/xml-sitemap"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><XmlSitemapGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo-checklist"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><SeoChecklistGenerator /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitor-content"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><CompetitorContentTracker /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-pillars"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><ContentPillarPlanner /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/broken-links"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><BrokenLinkFinder /></LazyPage>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/local-seo"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyPage><LocalSeoChecker /></LazyPage>
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
