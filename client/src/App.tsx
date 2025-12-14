import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/lib/quiz-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Archive, LogIn, LogOut, User } from "lucide-react";
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
import AuthPage from "@/pages/auth";
import VerifyEmailPage from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import ForgotPasswordPage from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();

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
      <div className="container mx
         -auto px-
         4 h-16 flex items-center justify-bet
         ween gap-4">
        <Li
        nk href="/" className="flex items-center gap-2" data-testid="link-logo">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-quiz-purple flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Prepetual</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link href="/history">
              <Button variant="ghost" size="sm" data-testid="link-history">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            Link>
       (   )}
          <ThemeToggle />
          {!isLoading && (
            isAuthenticated ? (
              <DropdownMenu>

                                   
                   <DropdownMen
                   uTrigger asChild>
       
                              <Button variant="gho
                  st" size="icon" className="rounded-full" data-testid="button-user-menu">
            
                               <Avatar className="h-8 w-8">
    
                                         <AvatarImage s
                       rc={user?.profileImageUrl
                      || undefined} alt={user?.firstName || "User"} className="object-cover" />
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
                    onClick
                       ={async () => {

                                             a,
                     wait fetch("/api/auth/logout", { method: "POST", credentia
                       ls: "include" });
           ,
                                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                      window.location.href = "/";
                    className="h-4 w-4 mr-2"
                                 >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
    
                         ) : (
    
                           
                 <Link href="/auth">
       
                  className="h-4 w-4 mr-1"        <Button v>id="button-login">
                  <LogIn className="h-4 w-4 mr-1" />
                               </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
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
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QuizProvider>
          <AppContent />
          <Toaster />
        </QuizProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
