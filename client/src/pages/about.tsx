import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Rocket, Target, Shield, 
  Upload, Brain, GraduationCap, BookOpen, Share2, 
  Globe, CheckCircle2, MessageCircle,
  Flame, RotateCcw, ArrowRight, Zap, ChevronDown
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

const features = [
  {
    icon: Upload,
    title: "Upload Anything",
    description: "PDFs, images, Word docs, PowerPoint, Excel—we handle it all. Our OCR even extracts text from photos of textbooks.",
    color: "blue",
  },
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description: "Our AI understands concepts, not just keywords. Get meaningful, challenging questions tailored to your content.",
    color: "purple",
  },
  {
    icon: BookOpen,
    title: "Study Your Way",
    description: "Flashcards with swipe gestures, interactive quizzes, or revision mode. Choose what works best for you.",
    color: "orange",
  },
  {
    icon: RotateCcw,
    title: "Master Every Concept",
    description: "Missed a question? It comes back until you get it right. Spaced repetition ensures nothing slips through.",
    color: "rose",
  },
  {
    icon: MessageCircle,
    title: "Pip, Your Study Buddy",
    description: "Stuck on a concept? Pip the penguin explains things without giving away answers. Math formulas included.",
    color: "cyan",
  },
  {
    icon: Target,
    title: "Track Your Progress",
    description: "Streaks, accuracy stats, and quiz history. Know exactly where you stand before exam day.",
    color: "amber",
  },
];

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FeatureSection({ feature, index }: { feature: typeof features[0]; index: number }) {
  const isEven = index % 2 === 0;
  const colorClasses: Record<string, { bg: string; text: string; gradient: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", gradient: "from-blue-500/20 to-transparent" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", gradient: "from-purple-500/20 to-transparent" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", gradient: "from-orange-500/20 to-transparent" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", gradient: "from-rose-500/20 to-transparent" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", gradient: "from-cyan-500/20 to-transparent" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", gradient: "from-amber-500/20 to-transparent" },
  };
  const colors = colorClasses[feature.color];

  return (
    <ScrollSection className="py-16 md:py-24">
      <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}>
        <motion.div 
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, x: isEven ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={`inline-flex w-16 h-16 rounded-2xl ${colors.bg} items-center justify-center mb-6`}>
            <feature.icon className={`w-8 h-8 ${colors.text}`} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {feature.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
            {feature.description}
          </p>
        </motion.div>
        
        <motion.div 
          className="flex-1 w-full max-w-md"
          initial={{ opacity: 0, x: isEven ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className={`aspect-square rounded-3xl bg-gradient-to-br ${colors.gradient} border border-border/50 flex items-center justify-center`}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <feature.icon className={`w-24 h-24 ${colors.text} opacity-50`} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </ScrollSection>
  );
}

export default function About() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="py-6">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <motion.section 
            className="min-h-[80vh] flex flex-col items-center justify-center text-center py-16"
            style={{ opacity, scale }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-background mb-8 border border-primary/20 overflow-hidden shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <img 
                src={brandLogo} 
                alt="Prepetual Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              About <span className="font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Prepetual</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Transform any study material into personalized quizzes. 
              Powered by AI, designed for students who want to ace their exams.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-3 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button size="lg" onClick={() => setLocation("/")} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="w-6 h-6 mx-auto" />
              </motion.div>
              <span className="text-sm">Scroll to explore</span>
            </motion.div>
          </motion.section>

          <ScrollSection className="py-16 md:py-24 border-t border-border/50">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Why Prepetual?</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Study smarter, not harder
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We built Prepetual because we believe every student deserves tools that actually help them learn—not just memorize.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: Sparkles, label: "100% Free", sublabel: "No subscriptions ever" },
                { icon: Globe, label: "10+ Languages", sublabel: "Auto-detected" },
                { icon: Zap, label: "Instant Quizzes", sublabel: "Seconds, not hours" },
                { icon: Shield, label: "Privacy First", sublabel: "Your data stays yours" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-full bg-muted/50 border border-border/50"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-foreground text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.sublabel}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollSection>

          <div className="border-t border-border/50">
            {features.map((feature, index) => (
              <FeatureSection key={feature.title} feature={feature} index={index} />
            ))}
          </div>

          <ScrollSection className="py-24 border-t border-border/50">
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <Rocket className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to ace your next exam?
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                Join students who are studying smarter with AI-powered quizzes.
              </p>
              <Button size="lg" onClick={() => setLocation("/")} data-testid="button-start-now">
                Create Your First Quiz
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </ScrollSection>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
