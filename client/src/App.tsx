import React, { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/lib/quiz-context";
import { QuizNavigationGuardProvider } from "@/lib/quiz-navigation-guard";
import { UploadProvider } from "@/lib/upload-context";
import { AuthDialogProvider, useAuthDialog } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import logoImage from "@assets/image_1765894870887.png";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VerificationPrompt } from "@/components/verification-prompt";
import { Footer } from "@/components/footer";
import { GoogleOneTap } from "@/components/google-one-tap";
import { LanguageProvider, useLanguage } from "@/lib/language-context";

const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Create = lazy(() => import("@/pages/create"));
const Feed = lazy(() => import("@/pages/feed"));
const Generate = lazy(() => import("@/pages/generate"));
const Quiz = lazy(() => import("@/pages/quiz"));
const QuizComplete = lazy(() => import("@/pages/quiz-complete"));
const Results = lazy(() => import("@/pages/results"));
const HistoryPage = lazy(() => import("@/pages/history"));
const Study = lazy(() => import("@/pages/study"));
const Share = lazy(() => import("@/pages/share"));
const EditQuiz = lazy(() => import("@/pages/edit-quiz"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const TermsOfService = lazy(() => import("@/pages/terms"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const FAQ = lazy(() => import("@/pages/faq"));
const HelpCenter = lazy(() => import("@/pages/help-center"));
const RevisionSummary = lazy(() => import("@/pages/revision-summary"));
const Settings = lazy(() => import("@/pages/settings"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const FolderPage = lazy(() => import("@/pages/folder"));
const ProgressPage = lazy(() => import("@/pages/progress"));
const InProgressPage = lazy(() => import("@/pages/in-progress"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth"));

function PageLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label={t("common.loading")}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/auth");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function AuthenticatedRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create" component={Create} />
      <Route path="/feed" component={Feed} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/generate" component={Generate} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/quiz-results" component={QuizComplete} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/folder/:id" component={FolderPage} />
      <Route path="/study" component={Study} />
      <Route path="/share/:id" component={Share} />
      <Route path="/edit-quiz" component={EditQuiz} />
      <Route path="/revision-summary" component={RevisionSummary} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/in-progress" component={InProgressPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/help" component={HelpCenter} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function PublicRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
    <Switch>
      {/* Public pages accessible to guests */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/share/:id" component={Share} />
      {/* Guest-accessible quiz experience (from shared links) */}
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/quiz-results" component={QuizComplete} />
      <Route path="/revision-summary" component={RevisionSummary} />
      {/* Auth flow pages */}
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      {/* Protected pages - redirect to home with login prompt */}
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/create">{() => <ProtectedRoute component={Create} />}</Route>
      <Route path="/feed">{() => <ProtectedRoute component={Feed} />}</Route>
      <Route path="/generate">{() => <ProtectedRoute component={Generate} />}</Route>
      <Route path="/history">{() => <ProtectedRoute component={HistoryPage} />}</Route>
      <Route path="/folder/:id">{() => <ProtectedRoute component={FolderPage} />}</Route>
      <Route path="/study">{() => <ProtectedRoute component={Study} />}</Route>
      <Route path="/edit-quiz">{() => <ProtectedRoute component={EditQuiz} />}</Route>
      <Route path="/progress">{() => <ProtectedRoute component={ProgressPage} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/in-progress">{() => <ProtectedRoute component={InProgressPage} />}</Route>
      <Route path="/onboarding">{() => <ProtectedRoute component={OnboardingPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function PublicHeader() {
  const { isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-[clamp(0.5rem,1.4svh,1rem)] left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-6xl transition-all duration-300">
      <div className="bg-background/50 backdrop-blur-xl border border-border/20 shadow-[0_2px_12px_0_rgba(0,0,0,0.03)] rounded-full px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.25rem,0.7svh,0.5rem)] min-h-[clamp(2.75rem,5svh,3.5rem)] flex items-center justify-between gap-[clamp(0.5rem,1.5vw,1rem)]">
        <Link href="/" className="flex items-center gap-[clamp(0.5rem,1vw,0.75rem)] group select-none" data-testid="link-logo">
          <div className="relative">
            <img
              src={logoImage}
              alt="Prepetual Logo"
              draggable={false}
              className="w-[clamp(1.75rem,3vw,2.25rem)] h-[clamp(1.75rem,3vw,2.25rem)] rounded-full object-cover transition-transform duration-500"
            />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <span className="pb-1 text-[clamp(1rem,1.8vw,1.5rem)] font-brand font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text tracking-tight custom-highlight">
            prepetual
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />
          <ThemeToggle />
          {!isLoading && (
            <>
              <div className="hidden md:flex items-center gap-2 sm:gap-4 border-l border-border/40 pl-3 sm:pl-6 ml-1 sm:ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={openLoginDialog}
                className="rounded-full text-[clamp(0.7rem,0.9vw,0.875rem)] font-semibold hover:bg-foreground/5 hover:text-primary transition-all duration-100 px-[clamp(0.5rem,1.5vw,1.25rem)] py-2"
                data-testid="button-login"
              >
                {t("publicHeader.login")}
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={openSignUpDialog}
                className="rounded-full text-[clamp(0.7rem,0.9vw,0.875rem)] font-bold shadow-[0_4px_12px_rgba(var(--primary),0.2)] px-[clamp(0.75rem,1.8vw,1.5rem)] bg-primary hover:bg-primary/90 text-primary-foreground border-none transition-all duration-300 hover:scale-[1.03] active:scale-95"
                data-testid="button-signup"
              >
                {t("publicHeader.signup")}
              </Button>
              </div>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full" aria-label={t("sidebar.menu")} data-testid="button-public-menu-mobile">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(88vw,24rem)] sm:max-w-sm flex flex-col">
                  <SheetHeader className="text-left">
                    <SheetTitle>{t("sidebar.menu")}</SheetTitle>
                    <SheetDescription>{t("footer.about")} · Prepetual</SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-6" aria-label={t("sidebar.menu")}>
                    {[
                      ["/about", t("footer.about")],
                      ["/blog", t("footer.blog")],
                      ["/faq", t("footer.faq")],
                      ["/help", t("common.helpCenter")],
                      ["/contact", t("footer.contact")],
                      ["/privacy", t("footer.privacy")],
                      ["/terms", t("footer.terms")],
                    ].map(([href, label]) => (
                      <SheetClose asChild key={href}>
                        <Link href={href} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors" data-testid={`mobile-menu-${href.slice(1)}`}>
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-auto border-t pt-5 flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full" onClick={openLoginDialog} data-testid="button-login-mobile">
                        {t("publicHeader.login")}
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="w-full" onClick={openSignUpDialog} data-testid="button-signup-mobile">
                        {t("publicHeader.signup")}
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthenticatedHeader() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const getPageTitle = () => {
    switch (location) {
      case "/": return t("routeTitles.home");
      case "/create": return t("routeTitles.create");
      case "/feed": return t("routeTitles.feed");
      case "/dashboard": return t("routeTitles.dashboard");
      case "/history": return t("routeTitles.history");
      case "/generate": return t("routeTitles.generate");
      case "/quiz": return t("routeTitles.quiz");
      case "/results": return t("routeTitles.results");
      case "/quiz-results": return t("routeTitles.quizResults");
      case "/study": return t("routeTitles.study");
      case "/edit-quiz": return t("routeTitles.editQuiz");
      case "/progress": return t("routeTitles.progress");
      case "/in-progress": return t("routeTitles.inProgress");
      case "/about": return t("routeTitles.about");
      case "/contact": return t("routeTitles.contact");
      case "/terms": return t("routeTitles.terms");
      case "/privacy": return t("routeTitles.privacy");
      default: return t("routeTitles.default");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex md:hidden h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("sidebar.menu")} data-testid="button-user-menu-mobile">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(88vw,24rem)] sm:max-w-sm flex flex-col">
            <SheetHeader className="text-left">
              <SheetTitle>{t("sidebar.menu")}</SheetTitle>
              <SheetDescription>{user?.username || user?.email || t("common.user")}</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6" aria-label={t("sidebar.menu")}>
              <SheetClose asChild>
                <Link href="/settings" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors" data-testid="link-settings-mobile">
                  <SettingsIcon className="h-4 w-4 inline mr-2" />{t("common.settings")}
                </Link>
              </SheetClose>
              {[
                ["/about", t("footer.about")],
                ["/blog", t("footer.blog")],
                ["/faq", t("footer.faq")],
                ["/help", t("common.helpCenter")],
                ["/contact", t("footer.contact")],
                ["/privacy", t("footer.privacy")],
                ["/terms", t("footer.terms")],
              ].map(([href, label]) => (
                <SheetClose asChild key={href}>
                  <Link href={href} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors" data-testid={`mobile-menu-${href.slice(1)}`}>
                    {label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto border-t pt-5">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                    window.location.href = "/";
                  }}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("common.signOut")}
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}


function AuthenticatedLayout() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const showFooter = location === "/about" || location === "/terms" || location === "/privacy" || location === "/contact";
  const hideSidebar = location === "/quiz" || location === "/quiz-results" || location === "/revision-summary" || location === "/onboarding" || location === "/study";

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (user && !user.onboardingCompleted && location !== "/onboarding" && location !== "/settings") {
      setLocation("/onboarding");
    }
  }, [user, location, setLocation]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  if (hideSidebar) {
    return (
      <>
        <div className="min-h-screen w-full">
          <main className="flex-1">
            <AuthenticatedRouter />
          </main>
        </div>
        {user && !user.emailVerified && (
          <VerificationPrompt email={user.email} open={true} />
        )}
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={sidebarStyle}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 pb-20 md:pb-0">
            <AuthenticatedHeader />
            <main className="flex-1">
              <AuthenticatedRouter />
            </main>
            {showFooter && <Footer />}
          </SidebarInset>
        </div>
      </SidebarProvider>
      {user && !user.emailVerified && location !== "/settings" && (
        <VerificationPrompt email={user.email} open={true} />
      )}
    </>
  );
}

function PublicLayout() {
  const { isLoading } = useAuth();
  const [location] = useLocation();
  const showFooter = location === "/about" || location === "/terms" || location === "/privacy" || location === "/contact";
  const isAuthPage = location === "/auth";
  const hidePublicHeader = location === "/quiz" || location.startsWith("/share/");

  if (isAuthPage) {
    return <PublicRouter />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {location === "/" && !isLoading && <GoogleOneTap />}
      {!hidePublicHeader && <PublicHeader />}
      <main className="flex-1">
        <PublicRouter />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AuthenticatedLayout /> : <PublicLayout />;
}

function AppWithAuth() {
  const [, setLocation] = useLocation();

  return (
    <AuthDialogProvider navigate={setLocation}>
      <QuizProvider>
        <UploadProvider>
          <QuizNavigationGuardProvider>
            <AppContent />
            <Toaster />
          </QuizNavigationGuardProvider>
        </UploadProvider>
      </QuizProvider>
    </AuthDialogProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AppWithAuth />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
