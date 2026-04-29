import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  GraduationCap, BookOpen, MessageSquare, BrainCircuit,
  ArrowRight, Loader2, Sparkles, Check
} from "lucide-react";

const STEPS = [
  {
    id: "persona",
    title: "Tell us about yourself",
    description: "What is your current academic level? This helps us tailor the vocabulary and complexity.",
    icon: GraduationCap,
    options: [
      { value: "Middle School Student", label: "Middle School Student", hint: "Simplifies complex concepts using relatable analogies." },
      { value: "High School Student", label: "High School Student", hint: "Focuses on exam readiness and standard curricula." },
      { value: "College / University Student", label: "College / University Student", hint: "Prioritizes high-level technical accuracy and depth." },
      { value: "Educator", label: "Educator", hint: "Provides structured summaries and rubric-ready insights." }
    ]
  },
  {
    id: "subjectInclination",
    title: "What's your focus?",
    description: "Which field are you primarily focused on?",
    icon: BookOpen,
    options: [
      { value: "Science & STEM", label: "Science & STEM", hint: "Activates technical engine for formulas and logical proofs." },
      { value: "Social Studies & Languages", label: "Social Studies & Languages", hint: "Activates narrative engine for thematic analysis." }
    ]
  },
  {
    id: "feedbackStyle",
    title: "Communication Style",
    description: "How would you like the AI to communicate with you?",
    icon: MessageSquare,
    options: [
      { value: "Encouraging & Patient", label: "Encouraging & Patient", hint: "Uses positive reinforcement and a supportive tutor voice." },
      { value: "Direct & Concise", label: "Direct & Concise", hint: "Minimalist no-nonsense feedback focused on speed." },
      { value: "Professional & Academic", label: "Professional & Academic", hint: "Formal tone suitable for high-level study." }
    ]
  },
  {
    id: "aiPartnership",
    title: "AI Partnership",
    description: "How should the AI guide you through solving a problem?",
    icon: BrainCircuit,
    options: [
      { value: "The Socratic Guide (Hints First)", label: "The Socratic Guide", hint: "Never gives the answer immediately; provides clues." },
      { value: "The Strategic Breakdown (Step-by-Step)", label: "The Strategic Breakdown", hint: "Deconstructs problems into smaller, manageable chunks." },
      { value: "The Solution Architect (Direct Explanation)", label: "The Solution Architect", hint: "Provides the full solution immediately, then explains." }
    ]
  }
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [preferences, setPreferences] = useState({
    persona: "High School Student",
    subjectInclination: "Science & STEM",
    feedbackStyle: "Encouraging & Patient",
    aiPartnership: "The Strategic Breakdown (Step-by-Step)"
  });

  // If they somehow get here after completing it, redirect
  useEffect(() => {
    console.log("User state:", user);
    if (user?.onboardingCompleted) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/user/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...preferences, onboardingCompleted: true };
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      setLocation("/dashboard");
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    updateSettingsMutation.mutate({
      ...preferences,
      onboardingCompleted: true
    });
  };

  const handleSkip = () => {
    updateSettingsMutation.mutate({
      onboardingCompleted: true
    });
  };

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const currentKey = step.id as keyof typeof preferences;

  return (
    <div className="p-4">
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Premium Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(var(--background),1)_100%)] opacity-40" />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <motion.div 
            className="bg-card/80 backdrop-blur-xl border shadow-2xl rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
          >
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-muted/50">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary"
                initial={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            <div className="p-8 sm:p-12">
              <div className="flex flex-col items-center text-center mb-10">
                <motion.div
                  key={`icon-${currentStep}`}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary shadow-inner"
                >
                  <StepIcon className="w-8 h-8" />
                </motion.div>
                <h2 className="text-sm font-bold tracking-widest uppercase text-primary/80 mb-3">
                  Step {currentStep + 1} of {STEPS.length}
                </h2>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
                  {step.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-lg">
                  {step.description}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <RadioGroup 
                    value={preferences[currentKey]} 
                    onValueChange={(val) => setPreferences(p => ({ ...p, [currentKey]: val }))}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {step.options.map((opt, i) => {
                      const isSelected = preferences[currentKey] === opt.value;
                      return (
                        <div key={i} className="relative">
                          <RadioGroupItem
                            value={opt.value}
                            id={`${step.id}-${i}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${step.id}-${i}`}
                            className={`flex flex-col cursor-pointer rounded-2xl border-2 p-5 h-full transition-all duration-200 ${
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]" 
                                : "border-muted/60 bg-card hover:bg-muted/30 hover:border-muted"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg leading-tight">{opt.label}</span>
                              {isSelected && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-3"
                                >
                                  <Check className="w-3 h-3" />
                                </motion.div>
                              )}
                            </div>
                            <span className="font-medium text-sm text-muted-foreground leading-relaxed mt-auto">{opt.hint}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground px-6" 
                  onClick={handleSkip} 
                  disabled={updateSettingsMutation.isPending}
                >
                  Skip survey
                </Button>
                <Button 
                  size="lg"
                  onClick={handleNext} 
                  disabled={updateSettingsMutation.isPending} 
                  className="min-w-[140px] h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentStep === STEPS.length - 1 ? (
                    "Complete Setup"
                  ) : (
                    <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
