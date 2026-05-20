import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Heart, 
  ChevronDown, Sparkles, Users,
  Star, Brain,
  Lightbulb, Shield, Globe, Target,
  Calculator, BookOpen, FlaskConical, Globe2, Languages, Shapes
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";
import { useLanguage } from "@/lib/language-context";
import AskPipIcon from "@/components/ui/ask-pip-icon";

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

const sleekEase = [0.16, 1, 0.3, 1] as const;
const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

function RevealOnScroll({ children, className = "", delay = 0, direction = "up" }: { children: React.ReactNode; className?: string; delay?: number; direction?: "up" | "down" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const dirs = { up: { y: 40 }, down: { y: -40 }, left: { x: 60 }, right: { x: -60 } };
  const initial = { opacity: 0, filter: "blur(4px)", ...dirs[direction] };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" } : initial}
      transition={{ duration: 0.9, ease: sleekEase, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SplitReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "120%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: "120%", opacity: 0 }}
        transition={{ duration: 0.8, ease: sleekEase, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function WordReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: sleekEase, delay: delay + i * 0.04 }}
          >
            {word}{i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function AnimatedText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 30, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.4 + i * 0.035, duration: 0.5, ease: sleekEase }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

function StaggerParagraph({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.p
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, ease: sleekEase, delay }}
    >
      {text}
    </motion.p>
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

const subjectApproaches = [
  {
    icon: Calculator,
    subjectKey: "Math",
    color: "text-blue-500",
    colorBg: "bg-blue-500/8",
  },
  {
    icon: BookOpen,
    subjectKey: "EnglishLiterature",
    color: "text-rose-500",
    colorBg: "bg-rose-500/8",
  },
  {
    icon: FlaskConical,
    subjectKey: "Science",
    color: "text-emerald-500",
    colorBg: "bg-emerald-500/8",
  },
  {
    icon: Globe2,
    subjectKey: "SocialStudiesHistory",
    color: "text-amber-500",
    colorBg: "bg-amber-500/8",
  },
  {
    icon: Languages,
    subjectKey: "GlobalLanguages",
    color: "text-purple-500",
    colorBg: "bg-purple-500/8",
  },
  {
    icon: Shapes,
    subjectKey: "OtherSubjects",
    color: "text-cyan-500",
    colorBg: "bg-cyan-500/8",
  },
];

function SubjectApproachItem({ item, index, isOpen, onToggle }: { item: typeof subjectApproaches[0]; index: number; isOpen: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const { t } = useLanguage();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ delay: index * 0.06, duration: 0.6, ease: sleekEase }}
    >
      <div
        className={`rounded-md border transition-colors duration-300 ${isOpen ? 'border-border/60 bg-muted/20' : 'border-border/30'}`}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-4 md:gap-5 p-5 md:p-6 text-left cursor-pointer"
          data-testid={`button-subject-${item.subjectKey.toLowerCase()}`}
        >
          <div className={`w-11 h-11 rounded-xl ${item.colorBg} flex items-center justify-center shrink-0`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <span className="flex-1 text-lg font-semibold text-foreground">{t(`about.subjects.${item.subjectKey}.title`)}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="shrink-0 text-muted-foreground"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: sleekEase }}
              className="overflow-hidden"
            >
              <div className="px-5 md:px-6 pb-6 md:pb-8 pt-0 ml-0 md:ml-16 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {t(`about.subjects.${item.subjectKey}.philosophy`)}
                </p>
                <div className="p-4 rounded-md bg-muted/30 border border-border/20">
                  <span className="text-xs font-medium text-primary uppercase tracking-[0.15em] mb-2 block">{t('about.howItWorks')}</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{t(`about.subjects.${item.subjectKey}.example`)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SubjectApproachSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <section className="py-40 md:py-56">
      <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
        <RevealOnScroll>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1 h-8 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-500 uppercase tracking-[0.2em]">{t('about.acrossEverySubject')}</span>
          </div>
        </RevealOnScroll>

        <SplitReveal delay={0.05}>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            {t('about.approachTitle')}
          </h2>
        </SplitReveal>

        <RevealOnScroll delay={0.1}>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-20">
            {t('about.approachDesc')}
          </p>
        </RevealOnScroll>

        <div className="space-y-3">
          {subjectApproaches.map((item, i) => (
            <SubjectApproachItem
              key={item.subjectKey}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ value, index }: { value: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ delay: index * 0.08, duration: 0.7, ease: sleekEase }}
      className="bg-background p-10 md:p-14"
    >
      <motion.div
        className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-8"
        whileInView={{ rotate: [0, -5, 5, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
      >
        <value.icon className="w-6 h-6 text-primary" />
      </motion.div>
      <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
    </motion.div>
  );
}

export default function About() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const { t } = useLanguage();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

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
                {t('common.back')}
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
            initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
            animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.1 }}
            whileHover={{ scale: 1.06, rotate: 3 }}
          >
            <motion.div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
            <img src={brandLogo} alt="Prepetual Logo" className="w-full h-full object-cover relative z-10" />
          </motion.div>

          <SplitReveal>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-10 relative z-10 tracking-tight">
              {t('about.heroTitle')} {" "}
              <AnimatedText text="prepetual" className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent" />
            </h1>
          </SplitReveal>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.7, duration: 0.8, ease: sleekEase }}
          >
            {t('about.heroSubtitle')}{" "}
            <span className="text-foreground font-medium">{t('about.understandingIsEverything')}</span>.
          </motion.p>

          <motion.div className="mt-24 text-muted-foreground/60 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-6 h-6 mx-auto" />
            </motion.div>
          </motion.div>
        </motion.section>


        {/* ===== OUR BELIEF ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
            <RevealOnScroll>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">{t('about.ourBelief')}</span>
              </div>
            </RevealOnScroll>

            <div className="space-y-16">
              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                  {t('about.beliefTitle')}
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.15}>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                  {t('about.beliefSubtitle')}
                </p>
              </RevealOnScroll>

              <div className="max-w-2xl">
                <WordReveal
                  text={t('about.beliefHighlight')}
                  className="text-2xl md:text-3xl text-foreground leading-snug font-semibold"
                  delay={0.2}
                />
              </div>

              <StaggerParagraph
                text={t('about.beliefDescription')}
                className="text-lg text-muted-foreground leading-relaxed max-w-3xl"
                delay={0.1}
              />
            </div>
          </div>
        </section>


        {/* ===== THE PROBLEM WE SAW ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 lg:gap-16 items-start">
              <div className="lg:col-span-3">
                <RevealOnScroll>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-1 h-8 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-amber-500 uppercase tracking-[0.2em]">{t('about.theProblem')}</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.05}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-12 leading-[1.1] tracking-tight">
                    {t('about.problemTitle')}
                  </h2>
                </SplitReveal>

                <div className="space-y-10">
                  <StaggerParagraph
                    text={t('about.problemDesc1')}
                    className="text-lg text-muted-foreground leading-relaxed"
                    delay={0.1}
                  />

                  <StaggerParagraph
                    text={t('about.problemDesc2')}
                    className="text-lg text-muted-foreground leading-relaxed"
                    delay={0.15}
                  />

                  <RevealOnScroll delay={0.2}>
                    <p className="text-xl text-foreground leading-relaxed font-medium">
                      {t('about.problemHighlight')}
                    </p>
                  </RevealOnScroll>
                </div>
              </div>

              <div className="lg:col-span-2 lg:sticky lg:top-32 z-50">
                <RevealOnScroll delay={0.2} direction="right">
                  <div className="space-y-6">
                    {[
                      { label: t('about.oldWay'), items: [t('about.oldWay1'), t('about.oldWay2'), t('about.oldWay3'), t('about.oldWay4')] },
                      { label: t('about.prepetualWay'), items: [t('about.prepetualWay1'), t('about.prepetualWay2'), t('about.prepetualWay3'), t('about.prepetualWay4')] },
                    ].map((group, gi) => (
                      <div key={group.label} className={`p-6 rounded-md border ${gi === 0 ? 'border-border/30 bg-muted/20' : 'border-primary/15 bg-primary/3'}`}>
                        <span className={`text-xs font-medium uppercase tracking-[0.15em] mb-4 block ${gi === 0 ? 'text-muted-foreground' : 'text-primary'}`}>{group.label}</span>
                        <div className="space-y-3">
                          {group.items.map((item, ii) => (
                            <motion.div
                              key={item}
                              className="flex items-center gap-3"
                              initial={{ opacity: 0, x: 20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.3 + gi * 0.2 + ii * 0.06, duration: 0.5, ease: sleekEase }}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${gi === 0 ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                              <span className={`text-sm ${gi === 0 ? 'text-muted-foreground line-through decoration-muted-foreground/30' : 'text-foreground'}`}>{item}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>


        {/* ===== OUR APPROACH ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
            <RevealOnScroll>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 rounded-full bg-cyan-500" />
                <span className="text-sm font-medium text-cyan-500 uppercase tracking-[0.2em]">{t('about.ourApproach')}</span>
              </div>
            </RevealOnScroll>

            <SplitReveal delay={0.05}>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-20 leading-[1.1] tracking-tight">
                {t('about.approachTitle2')}
              </h2>
            </SplitReveal>

            <div className="space-y-24">
              {[
                {
                  icon: Brain,
                  title: t('about.approachTitle_Thinking'),
                  text: t('about.approachDesc_Thinking'),
                  accent: "text-primary",
                  accentBg: "bg-primary/8",
                },
                {
                  icon: Lightbulb,
                  title: t('about.approachTitle_Teaching'),
                  text: t('about.approachDesc_Teaching'),
                  accent: "text-amber-500",
                  accentBg: "bg-amber-500/8",
                },
                {
                  icon: Sparkles,
                  title: t('about.approachTitle_Pip'),
                  text: t('about.approachDesc_Pip'),
                  accent: "text-cyan-500",
                  accentBg: "bg-cyan-500/8",
                },
                {
                  icon: Target,
                  title: t('about.approachTitle_Revision'),
                  text: t('about.approachDesc_Revision'),
                  accent: "text-emerald-500",
                  accentBg: "bg-emerald-500/8",
                },
              ].map((item, i) => (
                <RevealOnScroll key={item.title} delay={0.05}>
                  <div className="group">
                    <div className="flex items-start gap-6 md:gap-8">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl ${item.accentBg} flex items-center justify-center shrink-0 mt-1`}
                        whileInView={{ rotate: [0, 3, -3, 0] }}
                        viewport={{ once: true }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                      >
                        <item.icon className={`w-7 h-7 ${item.accent}`} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">{item.title}</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                    <div className={`mt-8 ml-20 md:ml-[5.5rem] h-px bg-gradient-to-r ${item.accentBg.replace('bg-', 'from-')} to-transparent`} />
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>


        {/* ===== BUILT BY STUDENTS ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
            <RevealOnScroll>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 rounded-full bg-violet-500" />
                <span className="text-sm font-medium text-violet-500 uppercase tracking-[0.2em]">{t('about.ourStory')}</span>
              </div>
            </RevealOnScroll>

            <SplitReveal delay={0.05}>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-12 leading-[1.1] tracking-tight">
                {t('about.storyTitle')}
              </h2>
            </SplitReveal>

            <div className="space-y-10">
              <StaggerParagraph
                text={t('about.storyDesc1')}
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.1}
              />

              <StaggerParagraph
                text={t('about.storyDesc2')}
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.15}
              />

              <RevealOnScroll delay={0.2}>
                <p className="text-xl text-foreground leading-relaxed font-medium">
                  {t('about.storyHighlight')}
                </p>
              </RevealOnScroll>

              <StaggerParagraph
                text={t('about.storyDesc3')}
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.1}
              />
            </div>
          </div>
        </section>


        {/* ===== MEET PREPAL (conversation demo) ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 lg:gap-16 items-start">
              <div className="lg:col-span-2 lg:sticky lg:top-32 z-50">
                <RevealOnScroll>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-1 h-8 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">{t('about.studyCompanion')}</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.05}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-[1.1] tracking-tight">
                    {t('about.companionTitle')}
                  </h2>
                </SplitReveal>

                <StaggerParagraph
                  text={t('about.companionDesc1')}
                  className="text-lg text-muted-foreground leading-relaxed mb-8"
                  delay={0.1}
                />

                <StaggerParagraph
                  text={t('about.companionDesc2')}
                  className="text-muted-foreground leading-relaxed mb-10"
                  delay={0.15}
                />

                <RevealOnScroll delay={0.25}>
                  <div className="flex flex-wrap gap-2">
                    {[t('about.companionTag1'), t('about.companionTag2'), t('about.companionTag3'), t('about.companionTag4')].map((tag) => (
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
                        <p className="text-sm text-foreground leading-relaxed">{t('about.companionDemo1')}</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                          <AskPipIcon size={16} />
                        </motion.div>
                      </div>
                      <div className="p-4 rounded-2xl rounded-br-md bg-primary/5 border border-primary/15 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">{t('about.companionDemo2')}</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-bl-md bg-muted/40 border border-border/30 max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed">{t('about.companionDemo3')}</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <AskPipIcon size={16} />
                      </div>
                      <motion.div
                        className="p-4 rounded-2xl rounded-br-md bg-primary/5 border border-primary/15 max-w-[85%]"
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-sm text-foreground leading-relaxed">{t('about.companionDemo4')}</p>
                      </motion.div>
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </section>


        {/* ===== WHAT WE VALUE ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="mb-28">
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-8 rounded-full bg-rose-500" />
                  <span className="text-sm font-medium text-rose-500 uppercase tracking-[0.2em]">{t('about.whatWeValue')}</span>
                </div>
              </RevealOnScroll>

              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
                  {t('about.valuesTitle')}
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.1}>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  {t('about.valuesSubtitle')}
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/30 rounded-md overflow-hidden">
              {[
                { icon: Globe, title: t('about.valueTitle1'), description: t('about.valueDesc1') },
                { icon: Lightbulb, title: t('about.valueTitle2'), description: t('about.valueDesc2') },
                { icon: Shield, title: t('about.valueTitle3'), description: t('about.valueDesc3') },
                { icon: Heart, title: t('about.valueTitle4'), description: t('about.valueDesc4') },
              ].map((value, i) => (
                <ValueCard key={value.title} value={value} index={i} />
              ))}
            </div>
          </div>
        </section>


        {/* ===== OUR APPROACH TO SUBJECTS ===== */}
        <SubjectApproachSection />

        <div className="h-20" />
      </div>
    </div>
  );
}
