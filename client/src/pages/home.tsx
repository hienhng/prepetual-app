import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowRight, CheckCircle2, Upload, Brain, Zap, BookOpen, 
  Share2, RotateCcw, Sparkles, Play, Eye, Target, Users, Star,
  ChevronRight, Layers, GraduationCap, Trophy, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/footer";

function HeroIllustration() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      {/* Background glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-[3rem] blur-3xl"
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Decorative SVG circles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
        <motion.circle
          cx="250" cy="250" r="200"
          fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.1"
          strokeWidth="1" strokeDasharray="8 8"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
        <motion.circle
          cx="250" cy="250" r="160"
          fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.15"
          strokeWidth="1" strokeDasharray="4 6"
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-[380px] md:max-w-[450px] h-[320px] md:h-[380px]">
          
          {/* Generation Board Card (Back) */}
          <motion.div
            className="absolute top-0 left-0 w-[200px] md:w-[220px] rounded-xl bg-card border shadow-xl"
            initial={{ opacity: 0, x: -30, rotate: -8 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground">Generate Quiz</span>
              </div>
              
              {/* Settings mockup */}
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Questions</div>
                  <div className="flex gap-1">
                    {[5, 10, 15].map((n, i) => (
                      <div key={n} className={`px-2 py-1 rounded text-[10px] font-medium ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">Difficulty</div>
                  <div className="flex gap-1">
                    {['Easy', 'Medium', 'Hard'].map((d, i) => (
                      <div key={d} className={`px-2 py-1 rounded text-[10px] font-medium ${i === 1 ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className="mt-3 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-[11px] font-semibold text-primary-foreground">Generate</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Quiz Question Card (Front) */}
          <motion.div
            className="absolute top-4 right-0 w-[220px] md:w-[250px] rounded-xl bg-card border-2 border-primary/20 shadow-2xl"
            initial={{ opacity: 0, x: 30, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 3 }}
            transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
          >
            <div className="p-4">
              {/* Question header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    3
                  </div>
                  <span className="text-[10px] text-muted-foreground">of 10</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target className="w-3 h-3" />
                  <span>Multiple Choice</span>
                </div>
              </div>
              
              {/* Question text */}
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  What is the primary function of mitochondria in a cell?
                </p>
              </div>
              
              {/* Answer options */}
              <div className="space-y-2">
                {[
                  { text: 'Energy production', correct: true },
                  { text: 'Protein synthesis', correct: false },
                  { text: 'Cell division', correct: false },
                  { text: 'Waste removal', correct: false },
                ].map((opt, i) => (
                  <motion.div
                    key={i}
                    className={`p-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-2 ${
                      opt.correct 
                        ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400' 
                        : 'border-border bg-background text-foreground hover:border-primary/30'
                    }`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    {opt.correct && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    <span>{opt.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Floating sparkle decorations */}
          <motion.div
            className="absolute -top-4 left-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
            animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-8 left-8 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-16 right-4 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <Star className="w-3 h-3 text-amber-500" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TransformationDemo() {
  const [step, setStep] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [isInView]);

  const stages = [
    { icon: Upload, label: "Upload", desc: "Drop your document", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Zap, label: "Extract", desc: "AI reads content", color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Brain, label: "Generate", desc: "Creates questions", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: GraduationCap, label: "Learn", desc: "Study & master", color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-8">
        {stages.map((s, i) => (
          <div key={s.label} className="flex-1 flex items-center">
            <motion.div 
              className={`relative z-10 flex flex-col items-center ${i <= step ? 'opacity-100' : 'opacity-40'}`}
              animate={{ scale: i === step ? 1.1 : 1 }}
              transition={{ type: "spring" }}
            >
              <motion.div 
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-2 border-2 ${
                  i === step ? 'border-primary shadow-lg' : 'border-transparent'
                }`}
                animate={i === step ? { y: [0, -5, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <s.icon className={`w-6 h-6 md:w-7 md:h-7 ${s.color}`} />
              </motion.div>
              <span className="text-xs md:text-sm font-semibold text-foreground">{s.label}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{s.desc}</span>
            </motion.div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 md:mx-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-muted" />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < step ? 1 : 0 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[200px] flex items-center justify-center"
            >
              {step === 0 && (
                <div className="text-center">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-blue-500/10 border-2 border-dashed border-blue-500/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Upload className="w-10 h-10 text-blue-500" />
                  </motion.div>
                  <p className="text-lg font-semibold text-foreground mb-2">Drop your study materials</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['PDF', 'Images', 'Word', 'PowerPoint'].map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {step === 1 && (
                <div className="w-full max-w-md">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <motion.div 
                        key={i} 
                        className="h-4 bg-gradient-to-r from-muted to-transparent rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.2, duration: 0.5 }}
                        style={{ transformOrigin: "left" }}
                      />
                    ))}
                  </div>
                  <motion.div 
                    className="mt-6 flex items-center gap-2 text-amber-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-medium">Reading and analyzing...</span>
                  </motion.div>
                </div>
              )}
              
              {step === 2 && (
                <div className="w-full max-w-md space-y-3">
                  {[
                    { type: 'Multiple Choice', q: 'What is the main concept?' },
                    { type: 'True/False', q: 'This statement is correct?' },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.3 }}
                    >
                      <Badge variant="outline" className="mb-2 text-purple-500 border-purple-500/30 text-xs">
                        {item.type}
                      </Badge>
                      <p className="text-sm font-medium text-foreground">{item.q}</p>
                    </motion.div>
                  ))}
                  <motion.p 
                    className="text-sm text-purple-500 flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Brain className="w-4 h-4" />
                    Generating more questions...
                  </motion.p>
                </div>
              )}
              
              {step === 3 && (
                <div className="text-center">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <Trophy className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <p className="text-lg font-semibold text-foreground mb-2">Ready to learn!</p>
                  <div className="flex justify-center gap-3">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Play className="w-3 h-3 mr-1" /> Quiz
                    </Badge>
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                      <BookOpen className="w-3 h-3 mr-1" /> Study
                    </Badge>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureShowcase() {
  const features = [
    {
      icon: Upload,
      title: "Multi-Format Upload",
      description: "PDFs, images, Word, PowerPoint, Excel. Our OCR handles photos of textbooks too.",
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/5",
    },
    {
      icon: Brain,
      title: "AI Quiz Generation",
      description: "Intelligent AI creates meaningful questions that test real understanding.",
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/5",
    },
    {
      icon: BookOpen,
      title: "Study Mode",
      description: "Swipe-based flashcards with 'known' and 'learning' progress tracking.",
      color: "orange",
      gradient: "from-orange-500/20 to-orange-600/5",
    },
    {
      icon: RotateCcw,
      title: "Spaced Repetition",
      description: "Missed questions come back in retry rounds until you master them.",
      color: "rose",
      gradient: "from-rose-500/20 to-rose-600/5",
    },
    {
      icon: Share2,
      title: "Community Sharing",
      description: "Share quizzes, browse public ones, vote and comment.",
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      icon: Flame,
      title: "Streak Tracking",
      description: "Build daily learning habits with streak goals and reminders.",
      color: "amber",
      gradient: "from-amber-500/20 to-amber-600/5",
    },
  ];

  const colorClasses: Record<string, { text: string; border: string; bg: string }> = {
    blue: { text: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/10" },
    purple: { text: "text-purple-500", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    orange: { text: "text-orange-500", border: "border-orange-500/30", bg: "bg-orange-500/10" },
    rose: { text: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-500/10" },
    emerald: { text: "text-emerald-500", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    amber: { text: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const colors = colorClasses[feature.color];
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full group hover:shadow-xl transition-all duration-300 border-transparent hover:${colors.border} bg-gradient-to-br ${feature.gradient} to-card`}>
              <CardContent className="p-6">
                <motion.div 
                  className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className={`w-6 h-6 ${colors.text}`} />
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatsSection() {
  const stats = [
    { value: "100%", label: "Free Forever", icon: Star },
    { value: "10+", label: "Languages", icon: Users },
    { value: "∞", label: "Unlimited Quizzes", icon: Layers },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 md:gap-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <motion.div 
            className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </motion.div>
          <div className="text-2xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    setExtractedText("");
  }, []);

  const handleTextExtracted = (text: string, isOfficeWithImages?: boolean, documentImages?: string[]) => {
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

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[80px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Study Assistant</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Turn notes into{" "}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-amber-500">
                    quizzes
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                </span>
                <br />
                <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl">in seconds</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8">
                Upload any study material and let AI create personalized practice quizzes. Study smarter, not harder.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="gap-2 px-8 text-base h-12 w-full sm:w-auto shadow-lg shadow-primary/20"
                  data-testid="button-hero-get-started"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gap-2 w-full sm:w-auto h-12"
                  data-testid="button-hero-learn-more"
                >
                  See How It Works
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                {[
                  { icon: CheckCircle2, text: "Free forever" },
                  { icon: CheckCircle2, text: "No credit card" },
                  { icon: CheckCircle2, text: "PDF & Images" },
                ].map((item, i) => (
                  <motion.div 
                    key={item.text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <item.icon className="h-4 w-4 text-green-500" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="order-1 lg:order-2"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <StatsSection />
        </div>
      </section>

      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              From Documents to Mastery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to transform any study material into an interactive learning experience.
            </p>
          </motion.div>
          
          <TransformationDemo />
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Learn Smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to make studying more effective and enjoyable.
            </p>
          </motion.div>
          
          <div className="max-w-5xl mx-auto">
            <FeatureShowcase />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30">
              Try It Now
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upload Your First Document
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how easy it is. Drop a file and watch the magic happen.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="shadow-xl border-primary/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              <CardContent className="p-6 md:p-8 relative">
                <FileUpload onTextExtracted={handleTextExtracted} />
                
                {extractedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <Button
                      size="lg"
                      onClick={handleContinueToGenerate}
                      className="w-full gap-2 h-12"
                      data-testid="button-continue-generate"
                    >
                      Continue to Generate Quiz
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Study Smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join students who are transforming their study materials into effective, personalized quizzes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 px-8 h-12 w-full sm:w-auto shadow-lg shadow-primary/20"
                data-testid="button-cta-get-started"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 w-full sm:w-auto h-12"
                  data-testid="button-learn-more"
                >
                  Learn More
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
