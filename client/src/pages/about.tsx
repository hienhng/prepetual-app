import { motion, useInView } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Rocket, Target, Users, Lightbulb, Shield, 
  Upload, Brain, Zap, GraduationCap, BookOpen, BarChart3, Share2, 
  Globe, CheckCircle2, FileText, MessageSquare, ThumbsUp, Pencil,
  Layers, Clock, Flame, Import, Play, RotateCcw, Eye, ArrowRight, Bot,
  Check, X, MessageCircle
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
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
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const coreFeatures = [
  {
    icon: Upload,
    title: "Multi-Format Upload",
    description: "Drop PDFs, images, Word docs, PowerPoint, or Excel files. Our OCR extracts text from photos of textbooks too.",
    color: "blue",
  },
  {
    icon: Brain,
    title: "AI Quiz Generation",
    description: "Our AI doesn't just pick keywords—it understands concepts to create meaningful, challenging questions.",
    color: "purple",
  },
  {
    icon: BookOpen,
    title: "Study Mode",
    description: "Swipe-based flashcards with beautiful animations. Mark cards as 'known' or 'learning' to focus your study.",
    color: "orange",
  },
  {
    icon: RotateCcw,
    title: "Spaced Repetition",
    description: "Got a question wrong? It comes back in a retry round. Keep practicing until you master every concept.",
    color: "rose",
  },
  {
    icon: Share2,
    title: "Community Sharing",
    description: "Share quizzes with a link, make them public, and let others benefit from your study materials.",
    color: "emerald",
  },
  {
    icon: Flame,
    title: "Streak Tracking",
    description: "Build daily learning habits with streak tracking. Stay motivated and watch your consistency grow.",
    color: "amber",
  },
  {
    icon: MessageCircle,
    title: "Pip AI Assistant",
    description: "Your friendly arctic study buddy! Pip helps explain concepts, gives hints, and supports math formulas.",
    color: "cyan",
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Monitor your accuracy, quiz history, and exam readiness. See which topics need more practice.",
    color: "indigo",
  },
];

const stats = [
  { value: "100%", label: "Free Forever", icon: Sparkles, color: "text-amber-500" },
  { value: "10+", label: "Languages", icon: Globe, color: "text-blue-500" },
  { value: "∞", label: "Unlimited Quizzes", icon: Layers, color: "text-purple-500" },
  { value: "24/7", label: "AI Assistance", icon: Bot, color: "text-cyan-500" },
];

const howItWorks = [
  { 
    step: 1, 
    icon: Upload, 
    title: "Upload", 
    description: "Drop your study materials - PDFs, images, docs, or exam papers",
    color: "blue"
  },
  { 
    step: 2, 
    icon: Brain, 
    title: "Generate", 
    description: "AI analyzes content and creates personalized quiz questions",
    color: "purple"
  },
  { 
    step: 3, 
    icon: Play, 
    title: "Practice", 
    description: "Take quizzes, study flashcards, and master difficult concepts",
    color: "emerald"
  },
  { 
    step: 4, 
    icon: GraduationCap, 
    title: "Ace It", 
    description: "Track progress and walk into your exam with confidence",
    color: "amber"
  },
];

function FeatureCard({ feature, index }: { feature: typeof coreFeatures[0]; index: number }) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", glow: "group-hover:shadow-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20", glow: "group-hover:shadow-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", glow: "group-hover:shadow-amber-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", glow: "group-hover:shadow-orange-500/20" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", glow: "group-hover:shadow-rose-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", glow: "group-hover:shadow-emerald-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20", glow: "group-hover:shadow-cyan-500/20" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20", glow: "group-hover:shadow-indigo-500/20" },
  };
  const colors = colorClasses[feature.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex"
    >
      <Card className={`w-full group transition-all duration-300 border ${colors.border} bg-card hover:shadow-xl ${colors.glow} hover:-translate-y-1`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
              <feature.icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HowItWorksSection() {
  const colorClasses: Record<string, { bg: string; text: string; solidBg: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", solidBg: "bg-blue-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", solidBg: "bg-purple-500" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", solidBg: "bg-emerald-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", solidBg: "bg-amber-500" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {howItWorks.map((item, index) => {
        const colors = colorClasses[item.color];
        return (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full border bg-card hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="relative inline-flex mb-4">
                  <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <item.icon className={`w-8 h-8 ${colors.text}`} />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${colors.solidBg} text-white text-sm font-bold flex items-center justify-center`}>
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatsSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border bg-card hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function ValuePropositions() {
  const items = [
    {
      icon: Shield,
      title: "Privacy Protected",
      description: "Documents are processed securely. We never share your data with third parties.",
      color: "emerald",
      points: ["Encrypted storage", "No data selling", "Secure processing"]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate quizzes in seconds, not hours. Our AI works quickly so you can start studying faster.",
      color: "amber",
      points: ["Instant generation", "Quick results", "No waiting"]
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Study in your preferred language. Our AI auto-detects and generates content in 10+ languages.",
      color: "blue",
      points: ["Vietnamese", "English", "Auto-detection"]
    },
    {
      icon: Users,
      title: "Study Together",
      description: "Share quizzes with classmates, study groups, or the entire community.",
      color: "purple",
      points: ["Share links", "Public quizzes", "Collaborate"]
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((item, index) => {
        const colors = colorClasses[item.color];
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full border ${colors.border} ${colors.bg.replace('/10', '/5')}`}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {item.points.map((point) => (
                        <span key={point} className={`inline-flex items-center gap-1 text-xs ${colors.text}`}>
                          <Check className="w-3 h-3" />
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
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

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          <motion.div variants={itemVariants}>
            <Link href="/">
              <Button variant="ghost" className="mb-6" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>

          <motion.section variants={itemVariants} className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-background mb-6 border border-primary/20 overflow-hidden shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={brandLogo} 
                alt="Prepetual Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Prepetual</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Transform your study materials into interactive quizzes with AI. 
              Upload any document, generate personalized questions, and ace your exams with confidence.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["PDF", "Word", "PowerPoint", "Excel", "Images"].map((format) => (
                <Badge key={format} variant="secondary" className="px-3 py-1">
                  {format}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => setLocation("/")} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/faq")} data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="mb-16">
            <StatsSection />
          </motion.section>

          <motion.section variants={itemVariants} className="mb-16">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 px-3 py-1">
                How It Works
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Four Steps to Success</h2>
            </div>
            <HowItWorksSection />
          </motion.section>

          <motion.section variants={itemVariants} className="mb-16">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 px-3 py-1">
                Features
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Everything You Need to Study Smarter</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {coreFeatures.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="mb-16">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 px-3 py-1">
                Why Prepetual
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Built for Students</h2>
            </div>
            <ValuePropositions />
          </motion.section>

          <motion.section variants={itemVariants} className="pb-12">
            <Card className="border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
              <CardContent className="py-12 px-8 text-center relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-6"
                  >
                    <Rocket className="w-14 h-14 text-primary mx-auto" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    Ready to Ace Your Exams?
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Join students who are transforming their study materials into 
                    effective, personalized quizzes.
                  </p>
                  <Button size="lg" onClick={() => setLocation("/")} data-testid="button-start-now">
                    Create Your First Quiz
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
