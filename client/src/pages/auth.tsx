import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, ArrowRight, Brain, Upload, Users, Trophy, BookOpen, FileText, Image, CheckCircle2, Circle, ChevronLeft, ChevronRight, Sparkles, BarChart3, Share2 } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/image_1765894870887.png";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function UploadMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm">
      <div className="border-2 border-dashed border-white/40 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <p className="text-white font-medium mb-2">Drop your files here</p>
        <p className="text-white/60 text-sm mb-4">PDF, Word, PowerPoint, Images</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-xs text-white">
            <FileText className="w-3 h-3" /> PDF
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-xs text-white">
            <FileText className="w-3 h-3" /> DOCX
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-xs text-white">
            <Image className="w-3 h-3" /> PNG
          </div>
        </div>
      </div>
    </div>
  );
}

function AIGenerationMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium">AI is generating...</p>
          <p className="text-white/60 text-sm">10 questions from your content</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse" />
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse delay-100" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse delay-200" />
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse delay-300" />
        </div>
      </div>
    </div>
  );
}

function QuestionTypesMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm">
      <p className="text-white/80 text-sm mb-3">What is the capital of France?</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
          <Circle className="w-4 h-4 text-white/60" />
          <span className="text-white/80 text-sm">London</span>
        </div>
        <div className="flex items-center gap-3 bg-green-500/30 border border-green-400/50 p-3 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-white text-sm font-medium">Paris</span>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
          <Circle className="w-4 h-4 text-white/60" />
          <span className="text-white/80 text-sm">Berlin</span>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
          <Circle className="w-4 h-4 text-white/60" />
          <span className="text-white/80 text-sm">Madrid</span>
        </div>
      </div>
    </div>
  );
}

function ProgressMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-medium">Your Progress</p>
          <p className="text-white/60 text-sm">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">85%</p>
          <p className="text-green-400 text-xs">+12% this week</p>
        </div>
      </div>
      <div className="flex items-end gap-2 h-24">
        {[40, 55, 45, 70, 65, 80, 85].map((height, i) => (
          <div key={i} className="flex-1 bg-white/20 rounded-t-sm overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-green-400 to-emerald-300 rounded-t-sm transition-all duration-500"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/50">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

function ShareMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">Share Quiz</p>
          <p className="text-white/60 text-sm">Biology Chapter 5</p>
        </div>
      </div>
      <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2 mb-4">
        <span className="text-white/80 text-sm truncate flex-1">prepetual.com/share/abc123</span>
        <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs h-7">
          Copy
        </Button>
      </div>
      <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 border-2 border-white/20 flex items-center justify-center text-xs text-white font-medium">A</div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 border-2 border-white/20 flex items-center justify-center text-xs text-white font-medium">B</div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-white/20 flex items-center justify-center text-xs text-white font-medium">C</div>
        <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center text-xs text-white">+5</div>
      </div>
    </div>
  );
}

const slides = [
  {
    icon: Upload,
    title: "Upload Any Material",
    description: "PDFs, Word docs, images, PowerPoints - we handle it all",
    mockup: UploadMockup,
  },
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description: "Smart quiz generation tailored to your content",
    mockup: AIGenerationMockup,
  },
  {
    icon: BookOpen,
    title: "Multiple Question Types",
    description: "Multiple choice, true/false, and short answer",
    mockup: QuestionTypesMockup,
  },
  {
    icon: Trophy,
    title: "Track Your Progress",
    description: "See your improvement with detailed analytics",
    mockup: ProgressMockup,
  },
  {
    icon: Users,
    title: "Share & Collaborate",
    description: "Share quizzes with friends and classmates",
    mockup: ShareMockup,
  },
];

function FeatureSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isAutoPlaying]);
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  
  const CurrentMockup = slides[currentSlide].mockup;
  const CurrentIcon = slides[currentSlide].icon;
  
  return (
    <div className="flex flex-col h-full">
      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Mockup */}
        <div className="mb-8 transition-all duration-500 ease-out transform">
          <CurrentMockup />
        </div>
        
        {/* Text */}
        <div className="text-center max-w-md px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
            <CurrentIcon className="w-4 h-4 text-white" />
            <span className="text-white/90 text-sm font-medium">{slides[currentSlide].title}</span>
          </div>
          <p className="text-white/70 text-lg">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <button 
          onClick={prevSlide}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-white" 
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        
        <button 
          onClick={nextSlide}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  
  const initialMode = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("mode") === "signup" ? "register" : "login";
  }, []);
  
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const res = await apiRequest("POST", "/api/auth/google", { credential });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "You have signed in with Google." });
      setGoogleLoading(false);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Google Sign-In failed", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    },
  });

  useEffect(() => {
    let cancelled = false;
    
    const initializeGoogle = async () => {
      try {
        const res = await fetch("/api/config");
        const config = await res.json();
        const clientId = config.googleClientId;
        
        if (!clientId || cancelled) return;

        const tryInit = () => {
          if (window.google && hiddenGoogleButtonRef.current) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: (response) => {
                setGoogleLoading(true);
                googleMutation.mutate(response.credential);
              },
            });

            window.google.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
              type: "standard",
              size: "large",
            });
            
            setGoogleReady(true);
          }
        };

        if (window.google) {
          tryInit();
        } else {
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle);
              tryInit();
            }
          }, 100);

          setTimeout(() => clearInterval(checkGoogle), 5000);
        }
      } catch (error) {
        console.error("Failed to load Google config:", error);
      }
    };

    const timer = setTimeout(initializeGoogle, 100);
    
    return () => { 
      cancelled = true; 
      clearTimeout(timer);
    };
  }, []);

  const handleGoogleClick = () => {
    const hiddenButton = hiddenGoogleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (hiddenButton) {
      hiddenButton.click();
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account created!",
        description: data.message || "Please check your email to verify your account.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Feature Slider Gallery */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-primary/90 via-quiz-purple/80 to-quiz-orange/70 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="relative z-10 flex flex-col w-full p-8 xl:p-12">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 mb-8">
            <img 
              src={logoImage} 
              alt="Prepetual Logo" 
              className="w-12 h-12 rounded-xl object-cover shadow-lg"
            />
            <h1 className="text-3xl font-bold font-brand text-white">Prepetual</h1>
          </div>

          {/* Feature Slider */}
          <div className="flex-1">
            <FeatureSlider />
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img 
              src={logoImage} 
              alt="Prepetual Logo" 
              className="w-12 h-12 rounded-xl object-cover"
            />
            <span className="text-2xl font-bold font-brand">Prepetual</span>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login" 
                ? "Sign in to continue your learning journey" 
                : "Start creating quizzes in seconds"}
            </p>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-3 mb-6"
            onClick={handleGoogleClick}
            disabled={googleLoading || !googleReady}
            data-testid="button-google-signin"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <div ref={hiddenGoogleButtonRef} className="hidden" />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Email address"
                            className="pl-10 h-12 text-base"
                            data-testid="input-login-email"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Password"
                            className="pl-10 h-12 text-base"
                            data-testid="input-login-password"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Email address"
                            className="pl-10 h-12 text-base"
                            data-testid="input-register-email"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Password (min 8 characters)"
                            className="pl-10 h-12 text-base"
                            data-testid="input-register-password"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Switch Mode */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="text-primary hover:underline font-medium"
              data-testid={mode === "login" ? "link-switch-to-signup" : "link-switch-to-login"}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
