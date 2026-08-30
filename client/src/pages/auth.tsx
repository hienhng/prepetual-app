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
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, Brain, Upload, Users, Trophy, BookOpen, FileText, Image, CheckCircle2, Circle, ChevronLeft, ChevronRight, Sparkles, BarChart3, Share2 } from "lucide-react";
import { motion } from "framer-motion";
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
          cancel?: () => void;
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
    <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-5 w-full max-w-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg flex-shrink-0">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-0.5">Upload Material</h3>
          <p className="text-sm text-muted-foreground font-medium">Support PDF, images, Word docs</p>
        </div>
      </div>
      <div className="border-2 border-dashed border-border/50 rounded-2xl p-6 text-center bg-muted/30 relative overflow-hidden">
        <motion.div 
          className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Upload className="w-6 h-6 text-primary" />
        </motion.div>
        <p className="text-sm font-semibold text-foreground mb-1">Drag & drop here</p>
        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
          {["PDF", "PNG", "DOCX"].map((fmt) => (
            <span key={fmt} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{fmt}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIGenerationMockup() {
  return (
    <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-5 w-full max-w-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-lg flex-shrink-0">
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-0.5">AI Generation</h3>
          <p className="text-sm text-muted-foreground font-medium">Smart quiz creation in seconds</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">Generating questions...</span>
            <motion.span 
              className="text-xs font-bold text-purple-600"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >65%</motion.span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-purple-500 rounded-full"
              animate={{ width: ["20%", "65%", "40%", "65%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        <div className="bg-muted/40 rounded-2xl p-3 space-y-1.5">
          <motion.div className="h-2.5 bg-muted rounded w-3/4" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.div className="h-2.5 bg-muted rounded w-1/2" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }} />
        </div>
      </div>
    </div>
  );
}

function QuestionTypesMockup() {
  const options = ["Paris", "London", "Berlin", "Madrid"];
  const [selectedIndex, setSelectedIndex] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % options.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-5 w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-0.5">Question 2 of 10</p>
          <h3 className="font-bold text-foreground">What is the capital of France?</h3>
        </div>
        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-bold">Medium</span>
      </div>
      <div className="space-y-2">
        {options.map((option, i) => (
          <motion.div 
            key={option}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              selectedIndex === i 
                ? "bg-primary/20 border-2 border-primary" 
                : "bg-muted hover:bg-muted/80 border border-border/50"
            }`}
            animate={selectedIndex === i ? { scale: 1.02 } : { scale: 1 }}
          >
            <motion.div
              animate={selectedIndex === i ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {selectedIndex === i ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40" />
              )}
            </motion.div>
            <span className={`text-sm font-medium transition-colors ${
              selectedIndex === i ? "text-primary" : "text-foreground/70"
            }`}>{option}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProgressMockup() {
  const baseHeights = [40, 55, 45, 70, 65, 80, 85];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return (
    <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-5 w-full max-w-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shadow-lg flex-shrink-0">
          <Trophy className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-0.5">Your Progress</h3>
          <p className="text-sm text-muted-foreground font-medium">Last 7 days</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1 h-28 bg-muted/30 rounded-2xl p-3 mb-3">
        {baseHeights.map((height, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t overflow-hidden h-full flex items-end justify-center">
            <motion.div 
              className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
              animate={{ height: [`${height * 0.7}%`, `${height}%`, `${height * 0.85}%`, `${height}%`] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        {days.map((day) => (<span key={day}>{day}</span>))}
      </div>
    </div>
  );
}

function ShareMockup() {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-card rounded-3xl border border-border/70 shadow-sm p-5 w-full max-w-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-lg flex-shrink-0">
          <Share2 className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-0.5">Share & Collaborate</h3>
          <p className="text-sm text-muted-foreground font-medium">Quiz: Biology Chapter 5</p>
        </div>
      </div>
      <div className="bg-muted/50 border border-border/50 rounded-2xl p-3 flex items-center gap-2 mb-5">
        <span className="text-foreground/60 text-xs truncate flex-1 font-mono">prep.io/share/bio5</span>
        <motion.div animate={copied ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }}>
          <Button size="sm" className={`text-xs h-7 px-2.5 ${
            copied ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
          } text-white font-medium`}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </motion.div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {[
            { bg: "bg-pink-500", letter: "A", delay: 0 },
            { bg: "bg-blue-500", letter: "B", delay: 0.1 },
            { bg: "bg-purple-500", letter: "C", delay: 0.2 },
          ].map((avatar) => (
            <motion.div 
              key={avatar.letter}
              className={`w-7 h-7 rounded-full ${avatar.bg} border border-card flex items-center justify-center text-xs text-white font-bold shadow-md`}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: avatar.delay }}
            >
              {avatar.letter}
            </motion.div>
          ))}
          <div className="w-7 h-7 rounded-full bg-muted border border-card flex items-center justify-center text-xs text-muted-foreground font-bold">
            +8
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">with 11 friends</span>
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
          <div className="flex items-center gap-3 mb-8 rounded-3xl">
            <img 
              src={logoImage} 
              alt="Prepetual Logo" 
              className="w-12 h-12 rounded-2xl object-cover shadow-lg"
            />
            <h1 className="pb-2 text-3xl font-bold font-brand text-white">prepetual</h1>
          </div>

          {/* Feature Slider */}
          <div className="flex-1">
            <FeatureSlider />
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col p-6 sm:p-8 lg:p-12 bg-background">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img 
              src={logoImage} 
              alt="Prepetual Logo" 
              className="w-10 h-10 rounded-2xl object-cover"
            />
            <span className="pb-2 text-2xl font-bold font-brand">prepetual</span>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
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
                            className="pl-10 h-12 text-base bg-foreground/[0.06] auth-input"
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
                            className="pl-10 h-12 text-base bg-foreground/[0.06] auth-input"
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
                            className="pl-10 h-12 text-base bg-foreground/[0.06] auth-input"
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
                            className="pl-10 h-12 text-base bg-foreground/[0.06] auth-input"
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
