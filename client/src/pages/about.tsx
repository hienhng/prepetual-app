import { motion, useInView } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Rocket, Target, Users, Lightbulb, Shield, 
  Upload, Brain, Zap, GraduationCap, BookOpen, BarChart3, Share2, 
  Globe, CheckCircle2, FileText, MessageSquare, ThumbsUp, Pencil,
  Layers, Clock, Flame, Import, Play, RotateCcw, Eye, ArrowRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const coreFeatures = [
  {
    icon: Upload,
    title: "Multi-Format Upload",
    description: "Drop PDFs, images, Word docs, PowerPoint, or Excel files. Our OCR extracts text from photos of textbooks too.",
    color: "blue",
    details: ["PDF documents", "Images (JPG, PNG)", "Word (.docx)", "PowerPoint (.pptx)", "Excel (.xlsx)"]
  },
  {
    icon: Brain,
    title: "AI Quiz Generation",
    description: "Our AI doesn't just pick keywords—it understands concepts to create meaningful, challenging questions.",
    color: "purple",
    details: ["Multiple choice", "True/False", "Short answer", "3 difficulty levels"]
  },
  {
    icon: Import,
    title: "Import Existing Quizzes",
    description: "Have an old exam or worksheet? Upload it and our AI will parse the questions and find the correct answers.",
    color: "amber",
    details: ["Parse exam papers", "AI identifies answers", "Edit before taking", "Save to library"]
  },
  {
    icon: BookOpen,
    title: "Study Mode",
    description: "Swipe-based flashcards with beautiful animations. Mark cards as 'known' or 'learning' to focus your study.",
    color: "orange",
    details: ["Swipe gestures", "Flip animations", "Progress tracking", "Undo actions"]
  },
  {
    icon: RotateCcw,
    title: "Spaced Repetition",
    description: "Got a question wrong? It comes back in a retry round. Keep practicing until you master every concept.",
    color: "rose",
    details: ["Retry missed questions", "Build mastery", "Track weak spots", "Detailed explanations"]
  },
  {
    icon: Share2,
    title: "Community & Sharing",
    description: "Share quizzes with a link, make them public, browse community quizzes, vote and comment.",
    color: "emerald",
    details: ["Shareable links", "Public quizzes", "Upvote/downvote", "Comments"]
  },
];

const stats = [
  { value: "100%", label: "Free Forever", sublabel: "No subscriptions" },
  { value: "10+", label: "Languages", sublabel: "Including Vietnamese" },
  { value: "∞", label: "Unlimited", sublabel: "Quizzes & questions" },
];

const supportedFormats = [
  { name: "PDF", icon: "📄" },
  { name: "Images", icon: "🖼️" },
  { name: "Word", icon: "📝" },
  { name: "PowerPoint", icon: "📊" },
  { name: "Excel", icon: "📈" },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [target, isInView]);
  
  return <span ref={ref}>{count}{suffix}</span>;
}

function FeatureCard({ feature, index }: { feature: typeof coreFeatures[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  };
  const colors = colorClasses[feature.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`h-full transition-all duration-300 ${isHovered ? `shadow-xl ${colors.border} border-2` : 'border'}`}>
        <CardContent className="p-6">
          <motion.div 
            className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-4`}
            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <feature.icon className={`w-7 h-7 ${colors.text}`} />
          </motion.div>
          
          <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{feature.description}</p>
          
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
          >
            {feature.details.map((detail) => (
              <Badge 
                key={detail} 
                variant="secondary" 
                className={`text-xs font-normal ${isHovered ? colors.bg : ''}`}
              >
                {detail}
              </Badge>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const steps = ["upload", "configure", "generate", "study"];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-8 overflow-hidden">
      <div className="absolute top-4 right-4 flex gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            animate={{ scale: i === step ? 1.2 : 1 }}
          />
        ))}
      </div>
      
      <div className="h-48 flex items-center justify-center">
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Upload className="w-10 h-10 text-blue-500" />
            </motion.div>
            <p className="text-foreground font-semibold">Drop your study materials</p>
            <p className="text-sm text-muted-foreground">PDFs, images, or documents</p>
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex gap-3 justify-center mb-4">
              {["Easy", "Medium", "Hard"].map((d, i) => (
                <motion.div
                  key={d}
                  className={`px-4 py-2 rounded-lg border ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  animate={{ scale: i === 1 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {d}
                </motion.div>
              ))}
            </div>
            <p className="text-foreground font-semibold">Customize your quiz</p>
            <p className="text-sm text-muted-foreground">Difficulty, question types, count</p>
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-10 h-10 text-purple-500" />
            </motion.div>
            <p className="text-foreground font-semibold">AI generates your quiz</p>
            <p className="text-sm text-muted-foreground">Smart questions in seconds</p>
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex gap-4 justify-center mb-4">
              <motion.div
                className="px-6 py-3 rounded-xl bg-orange-500/20 flex items-center gap-2"
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BookOpen className="w-5 h-5 text-orange-500" />
                <span className="text-orange-500 font-medium">Study</span>
              </motion.div>
              <motion.div
                className="px-6 py-3 rounded-xl bg-emerald-500/20 flex items-center gap-2"
                animate={{ x: [5, -5, 5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Play className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Quiz</span>
              </motion.div>
            </div>
            <p className="text-foreground font-semibold">Learn your way</p>
            <p className="text-sm text-muted-foreground">Flashcards or interactive quiz</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function HowItWorksTimeline() {
  const steps = [
    { icon: Upload, title: "Upload", desc: "Drop any document or image" },
    { icon: Zap, title: "Configure", desc: "Choose difficulty & question types" },
    { icon: Brain, title: "Generate", desc: "AI creates personalized questions" },
    { icon: GraduationCap, title: "Master", desc: "Study, quiz, and track progress" },
  ];

  return (
    <div className="relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden md:block" />
      
      <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="relative"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 relative z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <step.icon className="w-8 h-8 text-primary" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
              </motion.div>
              <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function About() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          <motion.div variants={itemVariants}>
            <Link href="/">
              <Button variant="ghost" className="mb-8" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>

          <motion.section variants={itemVariants} className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-background mb-6 shadow-lg border border-primary/20 overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={brandLogo} 
                alt="Prepetual Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              About <span className="font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Prepetual</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Transform any study material into personalized, interactive quizzes. 
              Powered by AI. Built for learners.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {supportedFormats.map((format) => (
                <Badge key={format.name} variant="secondary" className="px-4 py-2 text-sm">
                  <span className="mr-2">{format.icon}</span>
                  {format.name}
                </Badge>
              ))}
            </div>

            <Button size="lg" onClick={() => setLocation("/create")} data-testid="button-get-started">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.section>

          <motion.section variants={itemVariants} className="mb-20">
            <InteractiveDemo />
          </motion.section>

          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/30">
                Core Features
              </Badge>
              <h2 className="text-3xl font-bold text-foreground">Everything You Need to Learn Smarter</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/30">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold text-foreground">Four Steps to Mastery</h2>
            </div>
            <HowItWorksTimeline />
          </motion.section>

          <motion.section variants={itemVariants} className="mb-20">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
              <CardContent className="py-12 px-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  {stats.map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-5xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="font-semibold text-foreground text-lg">{stat.label}</div>
                      <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants} className="mb-20">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Shield className="w-6 h-6 text-emerald-500" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-foreground mb-2">Your Privacy, Protected</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        Documents are processed securely. We never share your data with third parties.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Encrypted", "No data selling", "Secure"].map((item) => (
                          <span key={item} className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      <Flame className="w-6 h-6 text-orange-500" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-foreground mb-2">Build Your Streak</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        Complete quizzes daily to maintain your learning streak and build lasting habits.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Daily goals", "Streak calendar", "Stats tracking"].map((item) => (
                          <span key={item} className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="text-center pb-16">
            <motion.div 
              className="py-16 px-8 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Ready to Study Smarter?
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Join learners who are transforming their study materials into 
                  effective, personalized quizzes.
                </p>
                <Button size="lg" onClick={() => setLocation("/create")} data-testid="button-start-now">
                  Create Your First Quiz
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
