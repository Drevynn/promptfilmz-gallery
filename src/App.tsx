import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePageTracking } from "@/hooks/usePageTracking";
import Landing from "./pages/Landing";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScriptEditor = lazy(() => import("./pages/ScriptEditor"));
const Storyboard = lazy(() => import("./pages/Storyboard"));
const ShotList = lazy(() => import("./pages/ShotList"));
const CharacterBible = lazy(() => import("./pages/CharacterBible"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const AIMusic = lazy(() => import("./pages/AIMusic"));
const Veo3 = lazy(() => import("./pages/Veo3"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Help = lazy(() => import("./pages/Help"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnalyticsDocs = lazy(() => import("./pages/AnalyticsDocs"));
const Learn = lazy(() => import("./pages/Learn"));
const DirectorAI = lazy(() => import("./pages/DirectorAI"));
const FestivalGallery = lazy(() => import("./pages/FestivalGallery"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop";
import PWAInstallBanner from "./components/PWAInstallBanner";
import RouteTransition from "./components/RouteTransition";
import DeepLinkHandler from "./components/DeepLinkHandler";
import AuthLoadingScreen from "./components/AuthLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  usePageTracking();
  return null;
}

/** Defers a child until Supabase has restored the session — prevents iOS flash of "logged out" state. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { initialized } = useAuth();
  if (!initialized) return <AuthLoadingScreen />;
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <DeepLinkHandler />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
              <RouteTransition>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<AuthGate><Auth /></AuthGate>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/script" element={<ProtectedRoute><ScriptEditor /></ProtectedRoute>} />
                  <Route path="/storyboard" element={<ProtectedRoute><Storyboard /></ProtectedRoute>} />
                  <Route path="/shots" element={<ProtectedRoute><ShotList /></ProtectedRoute>} />
                  <Route path="/characters" element={<ProtectedRoute><CharacterBible /></ProtectedRoute>} />
                  <Route path="/editor" element={<ProtectedRoute><VideoEditor /></ProtectedRoute>} />
                  <Route path="/veo3" element={<ProtectedRoute><Veo3 /></ProtectedRoute>} />
                  <Route path="/ai-studio" element={<ProtectedRoute><Veo3 /></ProtectedRoute>} />
                  <Route path="/music" element={<ProtectedRoute><AIMusic /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/analytics-docs" element={<ProtectedRoute><AnalyticsDocs /></ProtectedRoute>} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/director" element={<DirectorAI />} />
                  <Route path="/festival" element={<ProtectedRoute><FestivalGallery /></ProtectedRoute>} />
                  <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteTransition>
            </Suspense>
            <ChatWidget />
            <ScrollToTop />
            <PWAInstallBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
