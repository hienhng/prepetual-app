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
    description: "What is your current academic level?",
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
      { value: "Social Studies & Languages", label: "Social Studies & Languages", hint: "Activates narrative engine for thematic analysis." },
      { value: "Business & Economics", label: "Business & Economics", hint: "Focuses on market logic, case studies, and quantitative data." },
      { value: "Creative Arts & Design", label: "Creative Arts & Design", hint: "Emphasizes visual theory, history, and expressive critique." }
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
      { value: "Professional & Academic", label: "Professional & Academic", hint: "Formal tone suitable for high-level study." },
      { value: "Creative & Witty", label: "Creative & Witty", hint: "Engaging and clever responses to keep learning fun." }
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
      { value: "The Solution Architect (Direct Explanation)", label: "The Solution Architect", hint: "Provides the full solution immediately, then explains." },
      { value: "The Critical Reviewer (Feedback)", label: "The Critical Reviewer", hint: "Analyze your existing work and suggests improvements." }
    ]
  }
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [preferences, setPreferences] = useState({
    persona: "",
    subjectInclination: "",
    feedbackStyle: "",
    aiPartnership: ""
  });

  // If they somehow get here after completing it, redirect
  useEffect(() => {
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
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
      persona: "General",
      subjectInclination: "General",
      feedbackStyle: "General",
      aiPartnership: "General",
      onboardingCompleted: true
    });
  };

// 1. Ensure your variants match the property names used in the motion.div
const variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const step = STEPS[currentStep];
const StepIcon = step.icon;
const currentKey = step.id as keyof typeof preferences;

return (
    <div className="p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Static Progress Bar (Top) */}
        <div className="h-1 w-full bg-muted/20 mb-8 rounded-full">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={currentStep} // This triggers the animation when currentStep changes
            variants={variants} 
            initial="enter"   // Matches your variants object
            animate="center"  // Matches your variants object
            exit="exit"      // Matches your variants object
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {/* 2. Move the Header INSIDE the motion.div so it fades too */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <StepIcon className="w-7 h-7" />
              </div>
              
              <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary/60 mb-2">
                Step {currentStep + 1} of {STEPS.length}
              </h2>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {step.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>

            <RadioGroup 
              value={preferences[currentKey]} 
              onValueChange={(val) => setPreferences(p => ({ ...p, [currentKey]: val }))}
              className="grid grid-cols-1 gap-3"
            >
              {step.options.map((opt, i) => {
                const isSelected = preferences[currentKey] === opt.value;
                return (
                  <div key={i}>
                    <RadioGroupItem value={opt.value} id={`opt-${i}`} className="sr-only" />
                    <Label
                      htmlFor={`opt-${i}`}
                      className={`flex items-center justify-between cursor-pointer rounded-xl p-4 transition-all ${
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                          : "bg-muted/20 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">{opt.label}</p>
                        <p className={`text-xs ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                          {opt.hint}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4" />}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        {/* Static Footer (Stays put while content fades) */}
        <div className="flex items-center justify-between mt-10">
          <Button 
            variant="ghost" 
            className="text-muted-foreground" 
            onClick={handleSkip}
          >
            Skip
          </Button>
          <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="rounded-full px-6"
                disabled={currentStep === 0}
              >
                Back
              </Button>
              <Button
                onClick={handleNext} 
                className="rounded-full px-6"
                disabled={!preferences[currentKey]}
              >
                {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}