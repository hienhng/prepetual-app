import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowUp, ArrowDown, CheckCircle2, Upload, Brain, Zap, BookOpen,
  Share2, RotateCcw, Sparkles, Target, Star,
  Layers, GraduationCap, Flame, MessageCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion, useInView } from "framer-motion";
import { Footer } from "@/components/footer";
import { useRef } from "react";

function cn(...classes: (string | undefined)[]) { return classes.filter(Boolean).join(" "); }

function Doodle({ d, color, className, delay = 0, width, height, viewBox = "0 0 100 100", strokeW = 2.5, fill = false }: {
  d: string; color: string; className?: string; delay?: number; width?: number; height?: number; viewBox?: string; strokeW?: number; fill?: boolean;
}) {
  return (
    <motion.svg
      {...(width ? { width, height: height || width } : {})}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="none"
      className={cn("pointer-events-none", color, className)}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
    >
      <motion.path d={d} stroke="currentColor" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" fill={fill ? "currentColor" : "none"} fillOpacity={fill ? 0.12 : 0}
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay, duration: 0.8, ease: "easeOut" }} />
    </motion.svg>
  );
}

const D = {
  loopUnderline: "M5 12C15 4 25 4 30 12C35 20 45 4 55 4C65 4 70 16 80 12C90 8 95 4 100 8C110 12 120 4 130 8C140 12 155 4 165 8C175 12 185 6 195 8",
};

function AnimatedCounter({ value, duration = 2 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    if (value === "∞" || value === "100%") {
      setDisplayValue(value);
      return;
    }

    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');

    let startTime: number;
    const anim = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(numericValue * easeOutQuart);
      setDisplayValue(current + suffix);
      if (progress < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [isInView, value, duration]);

  return <div ref={ref}>{displayValue}</div>;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    setExtractedText("");
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    if (isAuthenticated) {
      setLocation("/generate");
    } else {
      openLoginDialog();
    }
  };

  const handleGetStarted = () => {
    openSignUpDialog();
  };

  const steps = [
    { num: "1", icon: Upload, title: "Upload", desc: "Drop your PDFs, images, Word docs, or slides" },
    { num: "2", icon: Brain, title: "Generate", desc: "AI creates personalized quiz questions instantly" },
    { num: "3", icon: GraduationCap, title: "Learn", desc: "Take quizzes, study flashcards, track progress" },
  ];

  const features = [
    { icon: Upload, title: "Multi-Format Upload", desc: "PDFs, images, Word, PowerPoint, and Excel documents supported with intelligent text extraction and OCR." },
    { icon: Brain, title: "AI Quiz Generation", desc: "Multiple choice, true/false, and short answer questions with adjustable difficulty levels." },
    { icon: BookOpen, title: "Study Mode", desc: "Interactive flashcards with swipe gestures. Mark cards as known or still learning." },
    { icon: RotateCcw, title: "Spaced Repetition", desc: "Missed questions automatically appear in retry rounds until you master them." },
    { icon: Share2, title: "Quiz Sharing", desc: "Share quizzes with friends via link or discover public quizzes from the community." },
    { icon: Flame, title: "Streak Tracking", desc: "Build daily study habits with streak tracking and friendly reminders." },
    { icon: MessageCircle, title: "Pip AI Assistant", desc: "Your study companion explains concepts and gives hints without revealing answers." },
    { icon: Target, title: "Progress Tracking", desc: "Monitor accuracy, streaks, and quiz history in a personal dashboard." },
  ];

  const stats = [
    { value: "100%", label: "Free Forever", icon: Star },
    { value: "5+", label: "File Formats", icon: FileText },
    { value: "∞", label: "Unlimited Quizzes", icon: Layers },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span>AI-Powered Exam Prep</span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[1.15] tracking-tight"
          >
            Study smarter with{" "}
            <span className="relative inline-block">
              <span className="text-primary">AI quizzes</span>
              <Doodle d={D.loopUnderline} color="text-primary/40" className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 20" delay={0.8} />
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Upload your notes, textbooks, or slides. Get instant practice tests tailored to your content.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2.5 px-8 text-base h-13 w-full sm:w-auto shadow-lg shadow-primary/20 font-semibold"
              data-testid="button-hero-get-started"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="gap-2 w-full sm:w-auto h-13 text-base font-medium text-muted-foreground"
              data-testid="button-hero-learn-more"
            >
              <ArrowDown className="h-4 w-4" />
              How It Works
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              { icon: CheckCircle2, text: "Free forever" },
              { icon: CheckCircle2, text: "No account needed to try" },
              { icon: CheckCircle2, text: "PDF, Word, Images" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 md:py-16 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-primary" />
                  <span className="text-3xl md:text-4xl font-bold text-foreground">
                    <AnimatedCounter value={stat.value} />
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From notes to quizzes in just a few clicks</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                {...fadeUp}
                transition={{ delay: 0.1 + i * 0.12 }}
              >
                <Card className="h-full border hover-elevate">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-5">
                      {step.num}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="hidden md:flex justify-center mt-6 gap-4">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-1 text-muted-foreground/40"
              >
                <div className="w-16 h-px bg-border" />
                <ArrowRight className="w-4 h-4" />
                <div className="w-16 h-px bg-border" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need to Ace Your Exams</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Powerful tools designed to make studying effective and enjoyable</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ delay: 0.05 + i * 0.06 }}
              >
                <Card className="h-full border hover-elevate">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upload Section ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Try It Now</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Upload a document and see the magic happen. No sign-up required to try.</p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
            <Card className="border">
              <CardContent className="p-6">
                <FileUpload onTextExtracted={handleTextExtracted} />
                {extractedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <Button
                      size="lg"
                      onClick={handleContinueToGenerate}
                      className="gap-2 px-8 font-semibold shadow-lg shadow-primary/20"
                      data-testid="button-continue-generate"
                    >
                      <Zap className="h-4 w-4" />
                      Continue to Generate Quiz
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Study Smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Join students who are transforming their study materials into interactive quizzes.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2.5 px-8 text-base h-13 shadow-lg shadow-primary/20 font-semibold"
              data-testid="button-cta-get-started"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            size="icon"
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="rounded-full shadow-lg"
            data-testid="button-scroll-top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
