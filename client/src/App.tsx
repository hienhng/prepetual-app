import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/lib/quiz-context";
import { AuthDialogProvider, useAuthDialog } from "@/lib/auth-context";
import { LoginDialog, SignUpDialog } from "@/components/auth-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Menu } from "lucide-react";
import logoImage from "@assets/image_1765894870887.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VerificationPrompt } from "@/components/verification-prompt";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Create from "@/pages/create";
import Feed from "@/pages/feed";
import Generate from "@/pages/generate";
import Quiz from "@/pages/quiz";
import Results from "@/pages/results";
import HistoryPage from "@/pages/history";
import Study from "@/pages/study";
import Share from "@/pages/share";
import EditQuiz from "@/pages/edit-quiz";
import VerifyEmailPage from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import ForgotPasswordPage from "@/pages/forgot-password";
import TermsOfService from "@/pages/terms";
import PrivacyPolicy from "@/pages/privacy";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";
import { Footer } from "@/components/footer";

function Router() {
  return (
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
      <Route path="/history" component={HistoryPage} />
      <Route path="/study" component={Study} />
      <Route path="/share/:id" component={Share} />
      <Route path="/edit-quiz" component={EditQuiz} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicHeader() {
  const { isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <img 
            src={logoImage} 
            alt="Prepetual Logo" 
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="text-xl font-brand text-foreground">Prepetual</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && (
            <>
              <Button variant="ghost" onClick={openLoginDialog} data-testid="button-login">
                Log in
              </Button>
              <Button variant="default" onClick={openSignUpDialog} data-testid="button-signup">
                Sign up
              </Button>
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

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getPageTitle = () => {
    switch (location) {
      case "/": return "Home";
      case "/create": return "Create Quiz";
      case "/feed": return "Community Feed";
      case "/dashboard": return "Dashboard";
      case "/history": return "Archive";
      case "/generate": return "Generate Quiz";
      case "/quiz": return "Quiz";
      case "/results": return "Results";
      case "/study": return "Study Mode";
      case "/edit-quiz": return "Edit Quiz";
      case "/about": return "About";
      case "/contact": return "Contact";
      case "/terms": return "Terms of Service";
      case "/privacy": return "Privacy Policy";
      default: return "Prepetual";
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full md:hidden" data-testid="button-user-menu-mobile">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} className="object-cover" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-muted-foreground" disabled>
              <User className="h-4 w-4 mr-2" />
              {user?.email || "User"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                window.location.href = "/";
              }}
              data-testid="button-logout-mobile"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AuthDialogContainer() {
  const { isLoginOpen, isSignUpOpen, closeLoginDialog, closeSignUpDialog, switchToSignUp, switchToLogin } = useAuthDialog();
  return (
    <>
      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={(open) => !open && closeLoginDialog()} 
        onSwitchToSignUp={switchToSignUp}
      />
      <SignUpDialog 
        open={isSignUpOpen} 
        onOpenChange={(open) => !open && closeSignUpDialog()} 
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
}

function AuthenticatedLayout() {
  const { user } = useAuth();
  const [location] = useLocation();
  const showFooter = location === "/" || location === "/dashboard" || location === "/about" || location === "/terms" || location === "/privacy" || location === "/contact";

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <>
      <SidebarProvider style={sidebarStyle}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <AuthenticatedHeader />
            <main className="flex-1">
              <Router />
            </main>
            {showFooter && <Footer />}
          </SidebarInset>
        </div>
      </SidebarProvider>
      {user && !user.emailVerified && (
        <VerificationPrompt email={user.email} open={true} />
      )}
    </>
  );
}

function PublicLayout() {
  const [location] = useLocation();
  const showFooter = location === "/" || location === "/about" || location === "/terms" || location === "/privacy" || location === "/contact";

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <PublicHeader />
      <main className="flex-1">
        <Router />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <AuthenticatedLayout /> : <PublicLayout />}
      <AuthDialogContainer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthDialogProvider>
          <QuizProvider>
            <AppContent />
            <Toaster />
          </QuizProvider>
        </AuthDialogProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
