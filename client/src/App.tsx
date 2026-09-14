import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/app-layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AdminSetup from "@/pages/admin-setup";
import Dashboard from "@/pages/dashboard";
import EventDetail from "@/pages/event-detail";
import AudienceBuilder from "@/pages/audience-builder";
import CampaignStudio from "@/pages/campaign-studio";
import Journeys from "@/pages/journeys";
import Sponsors from "@/pages/sponsors";
import SocialMedia from "@/pages/social-media";
import DataImport from "@/pages/data-import";
import LeadFinder from "@/pages/lead-finder";
import NotFound from "@/pages/not-found";

// Auth guard wrapper — redirects to home if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Redirect to="/" />;
  return <>{children}</>;
}

// Public routes (no layout, no auth)
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin-setup" component={AdminSetup} />
    </Switch>
  );
}

// Protected routes (with layout, require auth)
function ProtectedRoutes() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/audience" component={AudienceBuilder} />
          <Route path="/campaigns" component={CampaignStudio} />
          <Route path="/journeys" component={Journeys} />
          <Route path="/sponsors" component={Sponsors} />
          <Route path="/social" component={SocialMedia} />
          <Route path="/import" component={DataImport} />
          <Route path="/leads" component={LeadFinder} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProtectedRoute>
  );
}

function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  // If authenticated, all routes go through ProtectedRoutes (which includes layout)
  // If not authenticated, only public routes are accessible, others redirect to home
  if (isAuthenticated) {
    return (
      <Switch>
        {/* Authenticated user hitting /login or /signup → redirect to dashboard */}
        <Route path="/login"><Redirect to="/dashboard" /></Route>
        <Route path="/signup"><Redirect to="/dashboard" /></Route>
        <Route path="/admin-setup"><Redirect to="/dashboard" /></Route>
        <Route path="/"><Redirect to="/dashboard" /></Route>
        <Route>
          <ProtectedRoutes />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/dashboard"><Redirect to="/" /></Route>
      <Route path="/audience"><Redirect to="/" /></Route>
      <Route path="/campaigns"><Redirect to="/" /></Route>
      <Route path="/journeys"><Redirect to="/" /></Route>
      <Route path="/sponsors"><Redirect to="/" /></Route>
      <Route path="/social"><Redirect to="/" /></Route>
      <Route path="/import"><Redirect to="/" /></Route>
      <Route path="/leads"><Redirect to="/" /></Route>
      <Route path="/events/:id"><Redirect to="/" /></Route>
      <PublicRoutes />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
