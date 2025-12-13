import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/lib/quiz-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, History as HistoryIcon, Archive } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import Generate from "@/pages/generate";
import Quiz from "@/pages/quiz";
import Results from "@/pages/results";
import HistoryPage from "@/pages/history";
import Study from "@/pages/study";
import Share from "@/pages/share";
import EditQuiz from "@/pages/edit-quiz";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-quiz-purple flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">Prepetual</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/history">
            <Button variant="ghost" size="sm" data-testid="link-history">
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QuizProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </QuizProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
