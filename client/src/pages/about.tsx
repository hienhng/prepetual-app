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
    subject: "Math",
    color: "text-blue-500",
    colorBg: "bg-blue-500/8",
    philosophy: "Math isn't about memorizing formulas\u2014it's about understanding why they work. When we truly grasp the logic behind a formula, we can derive it ourselves, adapt it to new problems, and never feel lost on an exam. Prepetual generates questions that test your reasoning, not just your ability to plug in numbers.",
    example: "Instead of asking \"What is the quadratic formula?\", Prepetual might ask \"Why does completing the square lead to the quadratic formula?\" or present a problem that requires you to decide which approach to use.",
  },
  {
    icon: BookOpen,
    subject: "English & Literature",
    color: "text-rose-500",
    colorBg: "bg-rose-500/8",
    philosophy: "Literature is about interpretation, context, and connecting ideas across texts. Memorizing plot summaries won't help you write a strong essay. We believe in testing your ability to analyze themes, understand character motivations, and form your own arguments backed by evidence from the text.",
    example: "Rather than \"Who is the protagonist of the novel?\", you might see \"How does the author use the setting to reflect the protagonist's internal conflict?\" Questions that push you to think critically.",
  },
  {
    icon: FlaskConical,
    subject: "Science",
    color: "text-emerald-500",
    colorBg: "bg-emerald-500/8",
    philosophy: "Science is built on understanding processes, not memorizing facts. If you understand how photosynthesis works at a conceptual level, you can answer any question about it\u2014even ones you've never seen before. That's the power of understanding over memorization.",
    example: "Instead of \"Name the stages of mitosis,\" Prepetual asks \"What would happen to a cell if the spindle fibers failed to form during mitosis?\" Understanding the process means you can predict outcomes.",
  },
  {
    icon: Globe2,
    subject: "Social Studies & History",
    color: "text-amber-500",
    colorBg: "bg-amber-500/8",
    philosophy: "History isn't a list of dates and names\u2014it's about understanding cause and effect, recognizing patterns, and learning from human decisions. When you understand why events happened, you can connect them to other events and see the bigger picture.",
    example: "Not \"In what year did World War I begin?\" but \"What combination of alliances and tensions made a large-scale conflict in Europe nearly inevitable by 1914?\" Understanding context makes the facts stick naturally.",
  },
  {
    icon: Languages,
    subject: "Global Languages",
    color: "text-purple-500",
    colorBg: "bg-purple-500/8",
    philosophy: "Learning a language is about understanding how it works\u2014grammar patterns, sentence structure, context\u2014not just memorizing vocabulary lists. When we understand the rules, we can construct sentences we've never practiced before and communicate freely.",
    example: "Beyond \"Translate this word,\" Prepetual tests whether you can use the word correctly in context, understand why a certain tense is used, or identify the nuance between similar expressions.",
  },
  {
    icon: Shapes,
    subject: "Other Subjects",
    color: "text-cyan-500",
    colorBg: "bg-cyan-500/8",
    philosophy: "No matter the subject\u2014art, music, computer science, psychology\u2014the same principle applies. Surface-level memorization fades quickly. But when you build a mental model of how something works, that knowledge becomes part of how you think. That's what Prepetual aims for, in every subject.",
    example: "Upload any study material and the AI adapts. It detects the subject, understands the content, and generates questions that challenge your comprehension\u2014not your short-term memory.",
  },
];

function SubjectApproachItem({ item, index, isOpen, onToggle }: { item: typeof subjectApproaches[0]; index: number; isOpen: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

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
          data-testid={`button-subject-${item.subject.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className={`w-11 h-11 rounded-xl ${item.colorBg} flex items-center justify-center shrink-0`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <span className="flex-1 text-lg font-semibold text-foreground">{item.subject}</span>
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
                  {item.philosophy}
                </p>
                <div className="p-4 rounded-md bg-muted/30 border border-border/20">
                  <span className="text-xs font-medium text-primary uppercase tracking-[0.15em] mb-2 block">How it works in practice</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.example}</p>
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

  return (
    <section className="py-40 md:py-56">
      <div className="container mx-auto px-6 sm:px-8 max-w-4xl">
        <RevealOnScroll>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1 h-8 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-500 uppercase tracking-[0.2em]">Across Every Subject</span>
          </div>
        </RevealOnScroll>

        <SplitReveal delay={0.05}>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
            Our approach to different subjects
          </h2>
        </SplitReveal>

        <RevealOnScroll delay={0.1}>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-20">
            Understanding looks different in every subject. Here's how Prepetual applies our shared philosophy—understanding over memorization—across the topics you study.
          </p>
        </RevealOnScroll>

        <div className="space-y-3">
          {subjectApproaches.map((item, i) => (
            <SubjectApproachItem
              key={item.subject}
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
              About{" "}
              <AnimatedText text="Prepetual" className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent" />
            </h1>
          </SplitReveal>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.7, duration: 0.8, ease: sleekEase }}
          >
            Built on a simple belief:{" "}
            <span className="text-foreground font-medium">understanding is everything</span>.
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
                <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">Our Belief</span>
              </div>
            </RevealOnScroll>

            <div className="space-y-16">
              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                  Learning should be about understanding.
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.15}>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
                  Not memorizing answers. Not cramming the night before. Not highlighting an entire textbook and hoping something sticks.
                </p>
              </RevealOnScroll>

              <div className="max-w-2xl">
                <WordReveal
                  text="When you truly understand a concept, you’re not just prepared for one question — you’re prepared for any question."
                  className="text-2xl md:text-3xl text-foreground leading-snug font-semibold"
                  delay={0.2}
                />
              </div>

              <StaggerParagraph
                text="That's the idea behind Prepetual. When we understand how something works—not just what the answer is—we can apply that knowledge anywhere. A new question, a different format, a harder exam. It doesn't matter. Understanding travels with you."
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
                    <span className="text-sm font-medium text-amber-500 uppercase tracking-[0.2em]">The Problem</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.05}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-12 leading-[1.1] tracking-tight">
                    Most study tools get it backwards
                  </h2>
                </SplitReveal>

                <div className="space-y-10">
                  <StaggerParagraph
                    text="We kept seeing the same pattern: students spending hours copying questions into flashcard apps, formatting study guides, color-coding notes. They were doing so much work around studying, but never actually studying."
                    className="text-lg text-muted-foreground leading-relaxed"
                    delay={0.1}
                  />

                  <StaggerParagraph
                    text={'And even when they did quiz themselves, the questions tested recall\u2014"What year did X happen?"\u2014not understanding. You could ace the quiz and still not understand the material.'}
                    className="text-lg text-muted-foreground leading-relaxed"
                    delay={0.15}
                  />

                  <RevealOnScroll delay={0.2}>
                    <p className="text-xl text-foreground leading-relaxed font-medium">
                      We wanted to build something that skips the busywork and goes straight to what matters: do you actually understand this?
                    </p>
                  </RevealOnScroll>
                </div>
              </div>

              <div className="lg:col-span-2 lg:sticky lg:top-32 z-50">
                <RevealOnScroll delay={0.2} direction="right">
                  <div className="space-y-6">
                    {[
                      { label: "The old way", items: ["Copy questions by hand", "Format flashcards for hours", "Memorize without understanding", "Hope it sticks for the exam"] },
                      { label: "The Prepetual way", items: ["Upload your notes", "AI tests your understanding", "Learn from explanations", "Actually know the material"] },
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
                <span className="text-sm font-medium text-cyan-500 uppercase tracking-[0.2em]">Our Approach</span>
              </div>
            </RevealOnScroll>

            <SplitReveal delay={0.05}>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-20 leading-[1.1] tracking-tight">
                Understanding over memorization
              </h2>
            </SplitReveal>

            <div className="space-y-24">
              {[
                {
                  icon: Brain,
                  title: "Questions that make you think",
                  text: "Prepetual's AI doesn't just pull facts from your notes and ask you to repeat them. It generates questions that test whether you truly grasp the concept\u2014the kind of questions that make you pause, connect ideas, and reason through an answer.",
                  accent: "text-primary",
                  accentBg: "bg-primary/8",
                },
                {
                  icon: Lightbulb,
                  title: "Explanations that actually teach",
                  text: "Getting a question wrong shouldn't feel like a dead end. Every answer comes with a clear explanation\u2014not just \"the correct answer is B,\" but why it's correct and how the concept works. That's where real learning happens.",
                  accent: "text-amber-500",
                  accentBg: "bg-amber-500/8",
                },
                {
                  icon: Sparkles,
                  title: "Pip guides, never gives away",
                  text: "When you're stuck, Pip\u2014your AI study companion\u2014doesn't hand you the answer. It asks follow-up questions, gives hints, and walks you through the reasoning. Because the moment you figure it out yourself is the moment you truly understand it.",
                  accent: "text-cyan-500",
                  accentBg: "bg-cyan-500/8",
                },
                {
                  icon: Target,
                  title: "Revision that targets gaps",
                  text: "Prepetual remembers what you got wrong and lets you retry just those questions. Instead of reviewing everything, we focus on the concepts that haven't clicked yet\u2014until they do.",
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
                <span className="text-sm font-medium text-violet-500 uppercase tracking-[0.2em]">Our Story</span>
              </div>
            </RevealOnScroll>

            <SplitReveal delay={0.05}>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-12 leading-[1.1] tracking-tight">
                Built by students, for students
              </h2>
            </SplitReveal>

            <div className="space-y-10">
              <StaggerParagraph
                text="Prepetual wasn't born in a corporate office or a startup incubator. It was built by students who were frustrated with the same problems you face every day. Late-night cram sessions that don't stick. Study tools that feel like extra homework. The nagging feeling that you're preparing for exams the wrong way."
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.1}
              />

              <StaggerParagraph
                text="We built Prepetual because we needed it ourselves. We understand what it's like to stare at a stack of notes and feel completely lost. We know the difference between memorizing something for a test and actually getting it. And we wanted a tool that bridges that gap."
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.15}
              />

              <RevealOnScroll delay={0.2}>
                <p className="text-xl text-foreground leading-relaxed font-medium">
                  Because when a student builds something for other students, the result isn't just functional—it's personal. Every decision we made came from our own experience in the classroom.
                </p>
              </RevealOnScroll>

              <StaggerParagraph
                text="We're not a team of engineers guessing what students need. We are the students. And we're still learning, improving, and refining Prepetual alongside everyone who uses it."
                className="text-lg text-muted-foreground leading-relaxed"
                delay={0.1}
              />
            </div>
          </div>
        </section>


        {/* ===== MEET PIP (conversation demo) ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 lg:gap-16 items-start">
              <div className="lg:col-span-2 lg:sticky lg:top-32 z-50">
                <RevealOnScroll>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-1 h-8 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">Study Companion</span>
                  </div>
                </RevealOnScroll>

                <SplitReveal delay={0.05}>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-[1.1] tracking-tight">
                    Meet Pip
                  </h2>
                </SplitReveal>

                <StaggerParagraph
                  text="Pip is your personal AI study companion. Available 24/7, Pip helps you understand difficult concepts without just giving away the answer."
                  className="text-lg text-muted-foreground leading-relaxed mb-8"
                  delay={0.1}
                />

                <StaggerParagraph
                  text="Unlike a search engine that dumps information on you, Pip guides you through problems step-by-step, asks you questions to check your understanding, and celebrates when you get it right. It's the patient tutor everyone deserves."
                  className="text-muted-foreground leading-relaxed mb-10"
                  delay={0.15}
                />

                <RevealOnScroll delay={0.25}>
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


        {/* ===== WHAT WE VALUE ===== */}
        <section className="py-40 md:py-56">
          <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
            <div className="mb-28">
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-8 rounded-full bg-rose-500" />
                  <span className="text-sm font-medium text-rose-500 uppercase tracking-[0.2em]">What We Value</span>
                </div>
              </RevealOnScroll>

              <SplitReveal delay={0.05}>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight">
                  Principles behind Prepetual
                </h2>
              </SplitReveal>

              <RevealOnScroll delay={0.1}>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  These aren't corporate values on a wall. They're the convictions that shaped every decision in building this tool.
                </p>
              </RevealOnScroll>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/30 rounded-md overflow-hidden">
              {[
                { icon: Globe, title: "Accessible to All", description: "Education tools should be free and available to every student, everywhere. No exceptions. No premium tiers. If you can access the internet, you can use Prepetual." },
                { icon: Lightbulb, title: "Understanding First", description: "Every feature is designed to deepen understanding, not just help you pass a test. Because a student who understands the material doesn't need to worry about the exam." },
                { icon: Shield, title: "Privacy Matters", description: "Your study data belongs to you. We don't sell it, share it, or use it for anything other than helping you learn. Your notes stay your notes." },
                { icon: Heart, title: "Always Improving", description: "We study the science of learning, listen to students, and constantly evolve Prepetual. Our goal is always the same: help you understand more, faster." },
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
