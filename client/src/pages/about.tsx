import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { 
  ArrowLeft, Rocket, Target, Heart, 
  ArrowRight, ChevronDown, Sparkles, Users, Zap,
  Star, Brain, MessageCircle,
  Lightbulb, Shield, Globe, Clock, FileText
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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

function RevealOnScroll({ children, className = "", delay = 0, direction = "up" }: { children: React.ReactNode; className?: string; delay?: number; direction?: "up" | "down" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const dirs = { up: { y: 50 }, down: { y: -50 }, left: { x: 50 }, right: { x: -50 } };
  const initial = { opacity: 0, ...dirs[direction] };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
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
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
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

function FloatingDot({ delay = 0, size = 4, className = "" }: { delay?: number; size?: number; className?: string }) {
  return (
    <motion.div
      className={`rounded-full bg-primary/20 absolute ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

export default function About() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const journeySteps = [
    { phase: "The Problem", title: "Too Much Busywork", description: "Students everywhere were manually typing flashcards, copying questions, and formatting study guides. Hours wasted before any real learning began." },
    { phase: "The Idea", title: "What If AI Could Help?", description: "We asked a simple question: what if you could just upload your notes and instantly have a practice quiz? No setup, no formatting, no manual work." },
    { phase: "The Build", title: "Prepetual Was Born", description: "We built an AI that doesn't just extract keywords\u2014it understands content. It creates questions that actually test comprehension, with explanations that teach." },
    { phase: "Today", title: "Growing Every Day", description: "Students around the world use Prepetual to study smarter. We're constantly improving our AI, adding new features, and keeping it completely free." },
  ];

  const differentiators = [
    { icon: Zap, title: "Zero setup time", description: "Other apps make you type every question and answer by hand. With Prepetual, you upload your material and get a complete quiz in seconds. Your time should be spent learning, not copying.", accent: "emerald" },
    { icon: Target, title: "Built for exams, not memorization", description: "Our AI generates questions that test comprehension, not just recall. You'll face the same types of questions you'll see on exam day\u2014with explanations that actually teach.", accent: "primary" },
    { icon: Users, title: "A study buddy that doesn't give up", description: "Pip is available 24/7, never judges, and actually helps you think through problems instead of just showing the answer. It's like having a patient tutor who understands exactly what you're studying.", accent: "cyan" },
    { icon: Heart, title: "Actually free", description: "No premium tiers. No \"unlock more questions\" paywalls. No trial periods. Prepetual is free because we believe every student deserves great study tools, regardless of their budget.", accent: "rose" },
  ];

  const values = [
    { icon: Globe, title: "Accessible to All", description: "Education tools should be free and available to every student, everywhere. No exceptions." },
    { icon: Lightbulb, title: "Learning First", description: "Every feature we build is designed to deepen understanding, not just help you pass a test." },
    { icon: Shield, title: "Privacy Matters", description: "Your study data belongs to you. We don't sell it, share it, or use it for anything other than helping you learn." },
    { icon: Rocket, title: "Always Improving", description: "We listen to students, study the science of learning, and constantly evolve to serve you better." },
  ];

  const accentColors: Record<string, { bg: string; text: string; glow: string }> = {
    emerald: { bg: "bg-emerald-500/8", text: "text-emerald-500", glow: "from-emerald-500/10" },
    primary: { bg: "bg-primary/8", text: "text-primary", glow: "from-primary/10" },
    cyan: { bg: "bg-cyan-500/8", text: "text-cyan-500", glow: "from-cyan-500/10" },
    rose: { bg: "bg-rose-500/8", text: "text-rose-500", glow: "from-rose-500/10" },
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:100px_100px] opacity-[0.02]" />
        <InteractiveOrb className="absolute w-[600px] h-[600px] bg-primary/4 rounded-full blur-[120px] -top-40 -right-40" />
        <InteractiveOrb className="absolute w-[500px] h-[500px] bg-purple-500/4 rounded-full blur-[100px] top-1/3 -left-56" />
        <InteractiveOrb className="absolute w-[400px] h-[400px] bg-cyan-500/4 rounded-full blur-[80px] bottom-40 right-20" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
          <div className="py-8">
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
          className="min-h-[100vh] flex flex-col items-center justify-center text-center relative px-6"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <FloatingDot delay={0} size={6} className="top-[20%] left-[15%]" />
          <FloatingDot delay={1.2} size={4} className="top-[30%] right-[20%]" />
          <FloatingDot delay={2.4} size={5} className="bottom-[25%] left-[25%]" />
          <FloatingDot delay={0.8} size={3} className="bottom-[35%] right-[12%]" />

          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 0.015 }} transition={{ delay: 0.5 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }}>
              <Star className="w-[800px] h-[800px] text-primary" />
            </motion.div>
          </motion.div>

          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-background mb-16 border border-primary/15 overflow-hidden shadow-2xl shadow-primary/10 relative z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
            whileHover={{ scale: 1.06, rotate: 3 }}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
            <img src={brandLogo} alt="Prepetual Logo" className="w-full h-full object-cover relative z-10" />
          </motion.div>

          <SplitReveal>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-10 relative z-10 tracking-tight">
              About{" "}
              <AnimatedText text="Prepetual" className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent" />
            </h1>
          </SplitReveal>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            Helping students turn any study material into exam-ready practice—
            <span className="text-foreground font-medium">without the busywork</span>.
          </motion.p>

          <motion.div className="mt-24 text-muted-foreground/60 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-6 h-6 mx-auto" />
            </motion.div>
          </motion.div>
        </motion.section>


        {/* ===== OUR MISSION ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
            <RevealOnScroll>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">Our Purpose</span>
              </div>
            </RevealOnScroll>

            <SplitReveal delay={0.05}>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-16 leading-[1.1] tracking-tight">
                Our Mission
              </h2>
            </SplitReveal>

            <div className="space-y-12">
              <RevealOnScroll delay={0.1}>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                  We believe exam preparation shouldn't be about copying questions into flashcard apps or spending hours making study guides.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={0.2}>
                <p className="text-3xl md:text-4xl text-foreground leading-snug font-semibold max-w-2xl">
                  It should be about actually learning.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={0.3}>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  Prepetual exists to remove the friction between having study material and being ready for your exam. Upload your notes, textbook pages, or past papers—and within seconds, you have a personalized quiz that adapts to how you learn.
                </p>
              </RevealOnScroll>
            </div>

            <RevealOnScroll delay={0.4}>
              <div className="mt-20 pt-16 border-t border-border/40">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">biology_chapter_5.pdf</span>
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-4">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                        <Brain className="w-5 h-5 text-primary/60" />
                      </motion.div>
                      <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {["What is the role of mitochondria?", "True or False: DNA is single-stranded", "Explain cellular respiration"].map((q, i) => (
                        <motion.div
                          key={i}
                          className="p-4 rounded-md bg-muted/30 border border-border/30"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <p className="text-sm text-muted-foreground leading-relaxed">{q}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>


        {/* ===== OUR JOURNEY ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="max-w-4xl mb-24">
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-8 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-500 uppercase tracking-[0.2em]">Our Journey</span>
                </div>
              </RevealOnScroll>

              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
                  How We Got Here
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.1}>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Every great product starts with a frustration. Ours began when we realized that students were spending more time making study materials than actually studying them.
                </p>
              </RevealOnScroll>
            </div>

            <div className="space-y-6">
              {journeySteps.map((step, i) => {
                const ref = useRef<HTMLDivElement>(null);
                const isInView = useInView(ref, { once: true, margin: "-60px" });

                return (
                  <motion.div
                    ref={ref}
                    key={step.phase}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="group"
                  >
                    <div className="flex items-start gap-6 md:gap-10 py-10 border-b border-border/30 last:border-0">
                      <div className="shrink-0 pt-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border border-border/50 bg-muted/30 text-muted-foreground font-mono text-sm font-bold">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-2 block">{step.phase}</span>
                        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-xl">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ===== MEET PIP ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 lg:gap-16 items-start">
              <div className="lg:col-span-2 lg:sticky lg:top-32 z-50">
                <RevealOnScroll>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-1 h-8 rounded-full bg-cyan-500" />
                    <span className="text-sm font-medium text-cyan-500 uppercase tracking-[0.2em]">AI Assistant</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.05}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-[1.1] tracking-tight">
                    Meet Pip
                  </h2>
                </SplitReveal>

                <RevealOnScroll delay={0.1}>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Pip is your personal AI study companion. Available 24/7, Pip helps you understand difficult concepts without just giving away the answer.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={0.2}>
                  <p className="text-muted-foreground leading-relaxed mb-10">
                    Unlike a search engine that dumps information on you, Pip guides you through problems step-by-step, asks you questions to check your understanding, and celebrates when you get it right. It's the patient tutor everyone deserves.
                  </p>
                </RevealOnScroll>

                <RevealOnScroll delay={0.3}>
                  <div className="flex flex-wrap gap-2">
                    {["Hints, not answers", "Step-by-step guidance", "Never judges", "Available 24/7"].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </RevealOnScroll>
              </div>

              <div className="lg:col-span-3">
                <RevealOnScroll delay={0.15}>
                  <div className="space-y-5">
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-bl-md bg-muted/40 border border-border/30 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">I don't understand the difference between mitosis and meiosis. Can you help?</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                          <Sparkles className="w-4 h-4 text-primary" />
                        </motion.div>
                      </div>
                      <div className="p-4 rounded-2xl rounded-br-md bg-primary/5 border border-primary/15 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">Great question! Think of it this way: both involve cell division, but they have different goals. Let me give you a hint—how many daughter cells does each process produce?</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-bl-md bg-muted/40 border border-border/30 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">Mitosis makes 2 and meiosis makes 4?</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <motion.div
                        className="p-4 rounded-2xl rounded-br-md bg-primary/5 border border-primary/15 max-w-[85%]"
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-sm text-foreground leading-relaxed">Exactly right! Now you're getting it. That's a key difference to remember for your exam.</p>
                      </motion.div>
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>


        {/* ===== WHAT MAKES US DIFFERENT ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
            <div className="mb-28">
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-8 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-500 uppercase tracking-[0.2em]">Why Prepetual</span>
                </div>
              </RevealOnScroll>

              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
                  What Makes Us Different
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.1}>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  There are plenty of flashcard and quiz apps out there. Here's why students choose Prepetual:
                </p>
              </RevealOnScroll>
            </div>

            <div className="space-y-24">
              {differentiators.map((item, i) => {
                const c = accentColors[item.accent];
                return (
                  <RevealOnScroll key={item.title} delay={0.05}>
                    <div className="group">
                      <div className="flex items-start gap-6 md:gap-8">
                        <motion.div
                          className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center shrink-0 mt-1`}
                          whileInView={{ rotate: [0, 3, -3, 0] }}
                          viewport={{ once: true }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        >
                          <item.icon className={`w-7 h-7 ${c.text}`} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">{item.title}</h3>
                          <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      <div className={`mt-8 ml-20 md:ml-[5.5rem] h-px bg-gradient-to-r ${c.glow} to-transparent`} />
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>


        {/* ===== OUR VALUES ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="mb-28">
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-8 rounded-full bg-rose-500" />
                  <span className="text-sm font-medium text-rose-500 uppercase tracking-[0.2em]">What Drives Us</span>
                </div>
              </RevealOnScroll>

              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
                  Our Values
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.1}>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  These principles guide every decision we make, every feature we build, and every student we serve.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/30 rounded-md overflow-hidden">
              {values.map((value, i) => {
                const ref = useRef<HTMLDivElement>(null);
                const isInView = useInView(ref, { once: true, margin: "-40px" });

                return (
                  <motion.div
                    ref={ref}
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-background p-10 md:p-14"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-8"
                      whileInView={{ rotate: [0, -5, 5, 0] }}
                      viewport={{ once: true }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    >
                      <value.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ===== CTA ===== */}
        <section className="py-40 md:py-56 relative">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[140px] pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          <div className="container mx-auto px-6 sm:px-8 max-w-3xl text-center relative">
            <RevealOnScroll>
              <motion.div className="mb-14 inline-block" whileHover={{ scale: 1.05 }}>
                <motion.div animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                  <Rocket className="w-20 h-20 text-primary" />
                </motion.div>
              </motion.div>
            </RevealOnScroll>

            <SplitReveal>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight">
                Ready to study smarter?
              </h2>
            </SplitReveal>

            <RevealOnScroll delay={0.15}>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-16 leading-relaxed">
                Upload your first document and see how Prepetual can transform your exam prep.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={0.25}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/")}
                  data-testid="button-start-now"
                  className="text-lg shadow-xl shadow-primary/15"
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

        <div className="h-20" />
      </div>
    </div>
  );
}
