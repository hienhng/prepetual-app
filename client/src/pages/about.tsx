import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Rocket, Target, Heart, 
  ArrowRight, ChevronDown, Sparkles, Users, BookOpen, Zap,
  Star, Check, Upload, Brain, MessageCircle, BarChart3,
  Lightbulb, Shield, Globe, Clock, Layers, GraduationCap,
  FileText, Eye, Flame
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useEffect(() => {
    const handler = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [x, y]);
  return { x, y };
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = prefix + Math.round(latest) + suffix;
    });
    return unsubscribe;
  }, [springValue, suffix, prefix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function RevealOnScroll({ children, className = "", delay = 0, direction = "up" }: { children: React.ReactNode; className?: string; delay?: number; direction?: "up" | "down" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const dirs = { up: { y: 60 }, down: { y: -60 }, left: { x: 60 }, right: { x: -60 } };
  const initial = { opacity: 0, ...dirs[direction] };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SplitReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "110%" }}
        animate={isInView ? { y: 0 } : { y: "110%" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

function InteractiveOrb({ className = "" }: { className?: string }) {
  const mouse = useMousePosition();
  const ref = useRef<HTMLDivElement>(null);
  const orbX = useSpring(0, { stiffness: 30, damping: 20 });
  const orbY = useSpring(0, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const unsubX = mouse.x.on("change", (mx) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      orbX.set((mx - rect.left - rect.width / 2) * 0.03);
    });
    const unsubY = mouse.y.on("change", (my) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      orbY.set((my - rect.top - rect.height / 2) * 0.03);
    });
    return () => { unsubX(); unsubY(); };
  }, [mouse.x, mouse.y, orbX, orbY]);

  return (
    <motion.div ref={ref} style={{ x: orbX, y: orbY }} className={className} />
  );
}

function TimelineItem({ year, title, description, index }: { year: string; title: string; description: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative pl-10 pb-12 last:pb-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      <motion.div
        className="absolute left-[-5px] top-1 w-[11px] h-[11px] rounded-full border-2 border-primary bg-background"
        animate={{ scale: isHovered ? 1.4 : 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute left-[-8px] top-[-2px] w-[17px] h-[17px] rounded-full bg-primary/20"
        animate={{ scale: isHovered ? 2 : 0, opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />
      <Badge variant="secondary" className="mb-3 text-xs">{year}</Badge>
      <h4 className="font-bold text-foreground text-lg mb-2">{title}</h4>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function BentoCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <Card className={`${hover ? 'hover-elevate' : ''} border border-border/50 transition-all duration-500 overflow-visible ${className}`}>
      <CardContent className="p-6 md:p-8 h-full relative">
        {children}
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, description, color, index }: { icon: any; title: string; description: string; color: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className={`h-full border ${c.border} transition-all duration-500 overflow-visible ${isHovered ? 'shadow-xl' : 'shadow-sm'}`}>
        <CardContent className="p-6 md:p-8 relative h-full">
          <motion.div
            className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${c.bg} blur-2xl pointer-events-none`}
            animate={{ scale: isHovered ? 1.5 : 0.8, opacity: isHovered ? 0.6 : 0.1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="relative">
            <motion.div
              className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-5 border ${c.border}`}
              animate={{
                rotate: isHovered ? [0, -5, 5, 0] : 0,
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              <Icon className={`w-7 h-7 ${c.text}`} />
            </motion.div>
            <h3 className="font-bold text-foreground text-lg mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
          <motion.div
            className={`absolute bottom-0 left-0 h-[2px] ${c.text.replace('text', 'bg')} rounded-full`}
            animate={{ width: isHovered ? "100%" : "0%" }}
            transition={{ duration: 0.5 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProcessStep({ step, title, description, icon: Icon, index, isActive, onClick }: {
  step: number; title: string; description: string; icon: any; index: number; isActive: boolean; onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onClick={onClick}
      className={`cursor-pointer group p-5 rounded-md border transition-all duration-500 ${
        isActive ? 'border-primary/30 bg-primary/5 shadow-lg' : 'border-transparent'
      }`}
      data-testid={`button-process-step-${step}`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
            isActive ? 'bg-primary/15 border border-primary/30' : 'bg-muted/50 border border-transparent'
          }`}
          animate={{ scale: isActive ? 1.05 : 1 }}
        >
          <Icon className={`w-6 h-6 transition-colors duration-500 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Step {step}</span>
          </div>
          <h4 className={`font-bold text-lg mb-1.5 transition-colors duration-500 ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>{title}</h4>
          <AnimatePresence>
            {isActive && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="text-muted-foreground leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ValueCard({ icon: Icon, title, description, index }: { icon: any; title: string; description: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="text-center group"
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5"
        animate={{
          rotate: isHovered ? [0, -10, 10, 0] : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-8 h-8 text-primary" />
      </motion.div>
      <h4 className="font-bold text-foreground text-lg mb-2">{title}</h4>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}

export default function About() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeProcess, setActiveProcess] = useState(0);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.88]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProcess((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const processSteps = [
    { step: 1, icon: Upload, title: "Upload Your Material", description: "Drop any study material\u2014PDFs, images, Word docs, or PowerPoint files. We handle the rest." },
    { step: 2, icon: Eye, title: "AI Reads & Analyzes", description: "Our AI instantly scans and understands your content, identifying key concepts and relationships." },
    { step: 3, icon: Brain, title: "Questions Generated", description: "Smart questions are crafted that test comprehension, not just recall. Multiple choice, true/false, and short answer." },
    { step: 4, icon: GraduationCap, title: "You Learn & Grow", description: "Take your quiz, get instant feedback with explanations, and track your progress over time." },
  ];

  const processVisuals = [
    <div className="flex flex-col items-center justify-center h-full gap-4" key="upload">
      <motion.div className="w-32 h-32 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center" animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Upload className="w-14 h-14 text-primary" />
        </motion.div>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-2">
        {['PDF', 'DOCX', 'PPTX', 'Images'].map((f, i) => (
          <motion.div key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Badge variant="secondary" className="text-xs">{f}</Badge>
          </motion.div>
        ))}
      </div>
    </div>,
    <div className="flex flex-col items-center justify-center h-full gap-4" key="analyze">
      <div className="w-full max-w-xs space-y-3">
        {[100, 80, 55].map((w, i) => (
          <motion.div key={i} className="h-3 bg-primary/10 rounded-full overflow-hidden" style={{ width: `${w}%` }}>
            <motion.div className="h-full bg-primary/30 rounded-full" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
          </motion.div>
        ))}
      </div>
      <motion.div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Eye className="w-5 h-5 text-primary" />
        </motion.div>
        <span className="text-sm font-medium text-primary">Analyzing content...</span>
      </motion.div>
    </div>,
    <div className="flex flex-col items-center justify-center h-full gap-3" key="generate">
      {[{ q: "What is photosynthesis?", t: "Multiple Choice" }, { q: "Chloroplasts produce...", t: "True / False" }, { q: "Explain the light reaction", t: "Short Answer" }].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="w-full max-w-xs">
          <div className="p-3 rounded-md bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{item.t}</span>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}>
                <Sparkles className="w-3 h-3 text-primary" />
              </motion.div>
            </div>
            <p className="text-sm font-medium text-foreground">{item.q}</p>
          </div>
        </motion.div>
      ))}
    </div>,
    <div className="flex flex-col items-center justify-center h-full gap-4" key="learn">
      <motion.div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <Check className="w-10 h-10 text-emerald-500" />
      </motion.div>
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground">85%</p>
        <p className="text-sm text-muted-foreground">Quiz Score</p>
      </div>
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-medium text-foreground">5 Day Streak</span>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.03]" />
        <InteractiveOrb className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -top-32 -right-32" />
        <InteractiveOrb className="absolute w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px] top-1/3 -left-48" />
        <InteractiveOrb className="absolute w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[70px] bottom-32 right-16" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="py-6">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* ===== HERO ===== */}
        <motion.section
          ref={heroRef}
          className="min-h-[95vh] flex flex-col items-center justify-center text-center py-20 relative"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 0.02 }} transition={{ delay: 0.5 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}>
              <Star className="w-[700px] h-[700px] text-primary" />
            </motion.div>
          </motion.div>

          <motion.div
            className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-background mb-10 border border-primary/20 overflow-hidden shadow-2xl relative z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.08, rotate: 5 }}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
            <img src={brandLogo} alt="Prepetual Logo" className="w-full h-full object-cover relative z-10" />
          </motion.div>

          <SplitReveal>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold text-foreground mb-8 relative z-10">
              About{" "}
              <AnimatedText text="Prepetual" className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent" />
            </h1>
          </SplitReveal>

          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed relative z-10 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Helping students turn any study material into exam-ready practice—
            <span className="text-foreground font-medium">without the busywork</span>.
          </motion.p>

          <motion.div className="mt-20 text-muted-foreground relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-8 h-8 mx-auto" />
            </motion.div>
            <span className="text-sm font-medium tracking-wider uppercase">Scroll to explore</span>
          </motion.div>
        </motion.section>

        {/* ===== OUR MISSION (Full-width split) ===== */}
        <section className="py-28 md:py-40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div>
                <RevealOnScroll>
                  <div className="inline-flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary uppercase tracking-widest">Our Purpose</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.1}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-tight">
                    Our Mission
                  </h2>
                </SplitReveal>

                <RevealOnScroll delay={0.2}>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                    We believe exam preparation shouldn't be about copying questions into flashcard apps or spending hours making study guides.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={0.3}>
                  <p className="text-2xl text-foreground leading-relaxed font-medium mb-6">
                    It should be about actually learning.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={0.4}>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Prepetual exists to remove the friction between having study material and being ready for your exam. Upload your notes, textbook pages, or past papers—and within seconds, you have a personalized quiz that adapts to how you learn.
                  </p>
                </RevealOnScroll>
              </div>

              <RevealOnScroll direction="right" delay={0.3}>
                <div className="relative">
                  <motion.div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 rounded-3xl blur-2xl" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
                  <Card className="relative border border-primary/10 overflow-visible">
                    <CardContent className="p-8 md:p-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">Your study notes</p>
                            <p className="text-sm text-muted-foreground">biology_chapter_5.pdf</p>
                          </div>
                        </div>
                        <motion.div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                        <div className="flex items-center gap-3 justify-center">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                            <Brain className="w-8 h-8 text-primary" />
                          </motion.div>
                          <motion.span className="text-sm font-medium text-primary" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            Generating your quiz...
                          </motion.span>
                        </div>
                        <motion.div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                        <div className="space-y-3">
                          {["What is the role of mitochondria?", "True or False: DNA is single-stranded", "Explain cellular respiration"].map((q, i) => (
                            <motion.div key={i} className="p-3 rounded-md bg-muted/30 border border-border/50" initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1 }}>
                              <p className="text-sm text-foreground">{q}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ===== OUR JOURNEY (Timeline) ===== */}
        <section className="py-28 md:py-40 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              <div>
                <RevealOnScroll>
                  <div className="inline-flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-amber-500 uppercase tracking-widest">Our Journey</span>
                  </div>
                </RevealOnScroll>
                <SplitReveal delay={0.1}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                    How We Got Here
                  </h2>
                </SplitReveal>
                <RevealOnScroll delay={0.2}>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Every great product starts with a frustration. Ours began when we realized that students were spending more time making study materials than actually studying them.
                  </p>
                </RevealOnScroll>
              </div>

              <div className="relative">
                <TimelineItem year="The Problem" title="Too Much Busywork" description="Students everywhere were manually typing flashcards, copying questions, and formatting study guides. Hours wasted before any real learning began." index={0} />
                <TimelineItem year="The Idea" title="What If AI Could Help?" description="We asked a simple question: what if you could just upload your notes and instantly have a practice quiz? No setup, no formatting, no manual work." index={1} />
                <TimelineItem year="The Build" title="Prepetual Was Born" description="We built an AI that doesn't just extract keywords\u2014it understands content. It creates questions that actually test comprehension, with explanations that teach." index={2} />
                <TimelineItem year="Today" title="Growing Every Day" description="Students around the world use Prepetual to study smarter. We're constantly improving our AI, adding new features, and keeping it completely free." index={3} />
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS (Interactive Process) ===== */}
        <section className="py-28 md:py-40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-20">
              <RevealOnScroll>
                <div className="inline-flex items-center gap-3 mb-6 mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Layers className="w-6 h-6 text-cyan-500" />
                  </div>
                  <span className="text-sm font-medium text-cyan-500 uppercase tracking-widest">The Process</span>
                </div>
              </RevealOnScroll>
              <SplitReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  How Prepetual Works
                </h2>
              </SplitReveal>
              <RevealOnScroll delay={0.2}>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  From upload to understanding in four simple steps. No accounts required, no complexity.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <RevealOnScroll delay={0.2}>
                <div className="space-y-2">
                  {processSteps.map((step, i) => (
                    <ProcessStep
                      key={step.step}
                      {...step}
                      index={i}
                      isActive={activeProcess === i}
                      onClick={() => setActiveProcess(i)}
                    />
                  ))}
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="right" delay={0.3}>
                <Card className="border border-border/50 overflow-visible sticky top-24 z-50">
                  <CardContent className="p-8 md:p-10 min-h-[360px] flex items-center justify-center relative">
                    <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 rounded-md pointer-events-none" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeProcess}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full"
                      >
                        {processVisuals[activeProcess]}
                      </motion.div>
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ===== WHAT WE OFFER (Bento Grid) ===== */}
        <section className="py-28 md:py-40 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-20">
              <RevealOnScroll>
                <div className="inline-flex items-center gap-3 mb-6 mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-purple-500 uppercase tracking-widest">Our Toolkit</span>
                </div>
              </RevealOnScroll>
              <SplitReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  What We Offer
                </h2>
              </SplitReveal>
              <RevealOnScroll delay={0.2}>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  A complete suite of tools designed to transform how you prepare for exams.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={Brain}
                title="AI-Powered Quiz Generation"
                description="AI-powered quiz generation that understands your content\u2014not just keywords. Whether you're studying biology, history, or calculus, our AI creates questions that test real understanding."
                color="primary"
                index={0}
              />
              <FeatureCard
                icon={Layers}
                title="Multiple Study Modes"
                description="Multiple study modes to match how you learn best. Take timed quizzes for exam simulation, flip through flashcards for quick review, or use revision mode to focus on concepts you keep missing."
                color="purple"
                index={1}
              />
              <FeatureCard
                icon={MessageCircle}
                title="Pip, Your AI Study Buddy"
                description="Pip, your AI study companion, is there when you're stuck. Ask for hints, get explanations, or have concepts broken down step-by-step\u2014without spoiling the answer."
                color="cyan"
                index={2}
              />
              <FeatureCard
                icon={BarChart3}
                title="Progress Tracking"
                description="Progress tracking that shows you exactly where you stand. See your accuracy trends, maintain your study streak, and know which topics need more attention before the big day."
                color="emerald"
                index={3}
              />
            </div>
          </div>
        </section>

        {/* ===== MEET PIP ===== */}
        <section className="py-28 md:py-40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <RevealOnScroll delay={0.1}>
                <div className="relative">
                  <motion.div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 via-transparent to-primary/10 rounded-3xl blur-2xl" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 5, repeat: Infinity }} />
                  <Card className="relative border border-cyan-500/10 overflow-visible">
                    <CardContent className="p-8 md:p-10">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="p-3 rounded-md bg-muted/50 border border-border/50 max-w-[85%]">
                            <p className="text-sm text-foreground">I don't understand the difference between mitosis and meiosis. Can you help?</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 flex-row-reverse">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                              <Sparkles className="w-4 h-4 text-primary" />
                            </motion.div>
                          </div>
                          <div className="p-3 rounded-md bg-primary/5 border border-primary/20 max-w-[85%]">
                            <p className="text-sm text-foreground">Great question! Think of it this way: both involve cell division, but they have different goals. Let me give you a hint\u2014how many daughter cells does each process produce?</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="p-3 rounded-md bg-muted/50 border border-border/50 max-w-[85%]">
                            <p className="text-sm text-foreground">Mitosis makes 2 and meiosis makes 4?</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 flex-row-reverse">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <motion.div className="p-3 rounded-md bg-primary/5 border border-primary/20 max-w-[85%]" initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
                            <p className="text-sm text-foreground">Exactly right! Now you're getting it. That's a key difference to remember for your exam.</p>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </RevealOnScroll>

              <div>
                <RevealOnScroll>
                  <div className="inline-flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <MessageCircle className="w-6 h-6 text-cyan-500" />
                    </div>
                    <span className="text-sm font-medium text-cyan-500 uppercase tracking-widest">AI Assistant</span>
                  </div>
                </RevealOnScroll>
                <SplitReveal delay={0.1}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
                    Meet Pip
                  </h2>
                </SplitReveal>
                <RevealOnScroll delay={0.2}>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                    Pip is your personal AI study companion. Available 24/7, Pip helps you understand difficult concepts without just giving away the answer.
                  </p>
                </RevealOnScroll>
                <RevealOnScroll delay={0.3}>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Unlike a search engine that dumps information on you, Pip guides you through problems step-by-step, asks you questions to check your understanding, and celebrates when you get it right. It's the patient tutor everyone deserves.
                  </p>
                </RevealOnScroll>
                <RevealOnScroll delay={0.4}>
                  <div className="flex flex-wrap gap-3">
                    {["Hints, not answers", "Step-by-step guidance", "Never judges", "Available 24/7"].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">{tag}</Badge>
                    ))}
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* ===== IMPACT NUMBERS ===== */}
        <section className="py-28 md:py-40 bg-muted/30 relative overflow-hidden">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative">
            <div className="text-center mb-20">
              <SplitReveal>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Built for Students, Loved by Students
                </h2>
              </SplitReveal>
              <RevealOnScroll delay={0.1}>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  The numbers speak for themselves. Here's how Prepetual is making a difference.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 100, suffix: "%", label: "Free forever", icon: Heart },
                { value: 5, suffix: "+", label: "File types supported", icon: FileText },
                { value: 3, suffix: "", label: "Question types", icon: Layers },
                { value: 24, suffix: "/7", label: "Pip availability", icon: MessageCircle },
              ].map((stat, i) => (
                <RevealOnScroll key={stat.label} delay={i * 0.1}>
                  <BentoCard>
                    <div className="text-center">
                      <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                      <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </BentoCard>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHAT MAKES US DIFFERENT ===== */}
        <section className="py-28 md:py-40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-20">
              <RevealOnScroll>
                <div className="inline-flex items-center gap-3 mb-6 mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-amber-500 uppercase tracking-widest">Why Prepetual</span>
                </div>
              </RevealOnScroll>
              <SplitReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  What Makes Us Different
                </h2>
              </SplitReveal>
              <RevealOnScroll delay={0.2}>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  There are plenty of flashcard and quiz apps out there. Here's why students choose Prepetual:
                </p>
              </RevealOnScroll>
            </div>

            <div className="space-y-8">
              {[
                { icon: Zap, title: "Zero setup time", description: "Other apps make you type every question and answer by hand. With Prepetual, you upload your material and get a complete quiz in seconds. Your time should be spent learning, not copying.", color: "emerald" },
                { icon: Target, title: "Built for exams, not memorization", description: "Our AI generates questions that test comprehension, not just recall. You'll face the same types of questions you'll see on exam day\u2014with explanations that actually teach.", color: "primary" },
                { icon: Users, title: "A study buddy that doesn't give up", description: "Pip is available 24/7, never judges, and actually helps you think through problems instead of just showing the answer. It's like having a patient tutor who understands exactly what you're studying.", color: "cyan" },
                { icon: Heart, title: "Actually free", description: "No premium tiers. No \"unlock more questions\" paywalls. No trial periods. Prepetual is free because we believe every student deserves great study tools, regardless of their budget.", color: "rose" },
              ].map((item, index) => {
                const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
                  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
                  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20" },
                  rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
                };
                const c = colorMap[item.color];
                const isEven = index % 2 === 0;

                return (
                  <RevealOnScroll key={item.title} direction={isEven ? "left" : "right"} delay={0.1}>
                    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 items-center ${!isEven ? 'lg:direction-rtl' : ''}`}>
                      <div className={`lg:col-span-3 ${!isEven ? 'lg:order-2' : ''}`}>
                        <div className="flex items-start gap-5">
                          <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center shrink-0 border ${c.border}`}>
                            <item.icon className={`w-7 h-7 ${c.text}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-2xl mb-3">{item.title}</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`lg:col-span-2 ${!isEven ? 'lg:order-1' : ''}`}>
                        <Card className={`border ${c.border} overflow-visible`}>
                          <CardContent className="p-6 relative">
                            <motion.div className={`absolute inset-0 bg-gradient-to-br ${c.bg} to-transparent rounded-md opacity-30 pointer-events-none`} />
                            <div className="relative flex items-center justify-center py-8">
                              <motion.div
                                className={`w-24 h-24 rounded-3xl ${c.bg} border ${c.border} flex items-center justify-center`}
                                whileInView={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                                viewport={{ once: true }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <item.icon className={`w-12 h-12 ${c.text}`} />
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== OUR VALUES ===== */}
        <section className="py-28 md:py-40 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-20">
              <RevealOnScroll>
                <div className="inline-flex items-center gap-3 mb-6 mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <span className="text-sm font-medium text-rose-500 uppercase tracking-widest">What Drives Us</span>
                </div>
              </RevealOnScroll>
              <SplitReveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Our Values
                </h2>
              </SplitReveal>
              <RevealOnScroll delay={0.2}>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  These principles guide every decision we make, every feature we build, and every student we serve.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <ValueCard icon={Globe} title="Accessible to All" description="Education tools should be free and available to every student, everywhere. No exceptions." index={0} />
              <ValueCard icon={Lightbulb} title="Learning First" description="Every feature we build is designed to deepen understanding, not just help you pass a test." index={1} />
              <ValueCard icon={Shield} title="Privacy Matters" description="Your study data belongs to you. We don't sell it, share it, or use it for anything other than helping you learn." index={2} />
              <ValueCard icon={Rocket} title="Always Improving" description="We listen to students, study the science of learning, and constantly evolve to serve you better." index={3} />
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-32 md:py-48 relative overflow-hidden">
          <motion.div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }} />

          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center relative">
            <RevealOnScroll>
              <motion.div className="mb-10 inline-block" whileHover={{ scale: 1.1 }}>
                <motion.div className="relative">
                  <motion.div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
                  <motion.div animate={{ y: [0, -15, 0], rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                    <Rocket className="w-24 h-24 text-primary relative z-10" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </RevealOnScroll>

            <SplitReveal>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Ready to study smarter?
              </h2>
            </SplitReveal>
            <RevealOnScroll delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-14">
                Upload your first document and see how Prepetual can transform your exam prep.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/")}
                  data-testid="button-start-now"
                  className="text-lg shadow-xl shadow-primary/20"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Link href="/faq">
                  <Button variant="outline" size="lg" data-testid="button-learn-more" className="text-lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <div className="h-16" />
      </div>
    </div>
  );
}
