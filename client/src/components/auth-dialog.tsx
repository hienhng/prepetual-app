import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, ArrowRight, User } from "lucide-react";
import logoImage from "@assets/image_1765894870887.png";
import { Link } from "wouter";

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

type LoginFormType = z.infer<typeof loginSchema>;
type RegisterFormType = z.infer<typeof registerSchema>;

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
}

export function LoginDialog({ open, onOpenChange, onSwitchToSignUp }: LoginDialogProps) {
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormType) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const res = await apiRequest("POST", "/api/auth/google", { credential });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "You have signed in with Google." });
      onOpenChange(false);
      setGoogleLoading(false);
    },
    onError: (error: Error) => {
      toast({ title: "Google Sign-In failed", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    
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
  }, [open]);

  const handleGoogleClick = () => {
    const hiddenButton = hiddenGoogleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (hiddenButton) {
      hiddenButton.click();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setGoogleLoading(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-full h-full max-h-full sm:max-w-[440px] sm:h-auto sm:max-h-[90vh] p-0 gap-0 overflow-auto rounded-none sm:rounded-lg">
        <div className="bg-gradient-to-br from-primary/10 via-quiz-purple/10 to-quiz-orange/10 p-5 sm:p-6 text-center">
          <img 
            src={logoImage} 
            alt="Prepetual Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mx-auto mb-2 sm:mb-3"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground font-brand">prepetual</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Welcome back! Sign in to continue
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
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
                          className="pl-10 h-12 sm:h-11 text-base"
                          data-testid="input-login-email"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                          className="pl-10 h-12 sm:h-11 text-base"
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
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full h-12 sm:h-11 text-base"
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 sm:h-11 text-base gap-3"
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

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-primary hover:underline font-medium"
              data-testid="link-switch-to-signup"
            >
              Sign up
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground" onClick={() => onOpenChange(false)}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground" onClick={() => onOpenChange(false)}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function SignUpDialog({ open, onOpenChange, onSwitchToLogin }: SignUpDialogProps) {
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  const form = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormType) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account created!",
        description: data.message || "Please check your email to verify your account.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const res = await apiRequest("POST", "/api/auth/google", { credential });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: "You have signed up with Google." });
      onOpenChange(false);
      setGoogleLoading(false);
    },
    onError: (error: Error) => {
      toast({ title: "Google Sign-Up failed", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    },
  });

  useEffect(() => {
    if (!open) return;
    
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
  }, [open]);

  const handleGoogleClick = () => {
    const hiddenButton = hiddenGoogleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (hiddenButton) {
      hiddenButton.click();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setGoogleLoading(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-full h-full max-h-full sm:max-w-[440px] sm:h-auto sm:max-h-[90vh] p-0 gap-0 overflow-auto rounded-none sm:rounded-lg">
        <div className="bg-gradient-to-br from-primary/10 via-quiz-purple/10 to-quiz-orange/10 p-5 sm:p-6 text-center">
          <img 
            src={logoImage} 
            alt="Prepetual Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mx-auto mb-2 sm:mb-3"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground font-brand">prepetual</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create an account to get started
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
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
                          className="pl-10 h-12 sm:h-11 text-base"
                          data-testid="input-register-email"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                          className="pl-10 h-12 sm:h-11 text-base"
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
                className="w-full h-12 sm:h-11 text-base"
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 sm:h-11 text-base gap-3"
            onClick={handleGoogleClick}
            disabled={googleLoading || !googleReady}
            data-testid="button-google-signup"
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
            {googleLoading ? "Signing up..." : "Sign up with Google"}
          </Button>
          <div ref={hiddenGoogleButtonRef} className="hidden" />

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
              data-testid="link-switch-to-login"
            >
              Sign in
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground" onClick={() => onOpenChange(false)}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground" onClick={() => onOpenChange(false)}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
