import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/lib/quiz-context";
import { AuthDialogProvider, useAuthDialog } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Archive, LogIn, LogOut, User } from "lucide-react";
import logoImage from "@assets/image_1765894870887.png";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerificationPrompt } from "@/components/verification-prompt";
import Home from "@/pages/home";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openAuthDialog } = useAuthDialog();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          {isAuthenticated && (
            <Link href="/history">
              <Button variant="ghost" size="sm" data-testid="link-history">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </Link>
          )}
          <ThemeToggle />
          {!isLoading && (
            isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
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
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => openAuthDialog("login")} data-testid="button-login" className="h-4 w-auto mr-1">
                
                Sign in
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

function AuthDialogContainer() {
  const { isOpen, defaultTab, closeAuthDialog } = useAuthDialog();
  return <AuthDialog open={isOpen} onOpenChange={(open) => !open && closeAuthDialog()} defaultTab={defaultTab} />;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Router />
        </main>
      </div>
      {isAuthenticated && user && !user.emailVerified && (
        <VerificationPrompt email={user.email} open={true} />
      )}
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
