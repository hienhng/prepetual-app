import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { 
  ArrowLeft, Rocket, Target, Heart, 
  ArrowRight, ChevronDown, Sparkles, Users, BookOpen, Zap,
  Star, Check
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState, useCallback } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

function FloatingParticle({ delay = 0, duration = 8, size = 4, left, top }: { delay?: number; duration?: number; size?: number; left: string; top: string }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 pointer-events-none"
      style={{ width: size, height: size, left, top }}
      animate={{
        y: [0, -40, 0],
        x: [0, 15, -15, 0],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function ParallaxLayer({ children, speed = 0.5, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

function RevealText({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        animate={isInView ? { y: 0 } : { y: "100%" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
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

function MagneticButton({ children, className = "", ...props }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function USPCard({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  index 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string; gradient: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", glow: "shadow-emerald-500/20", gradient: "from-emerald-500/20 to-transparent" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", glow: "shadow-blue-500/20", gradient: "from-blue-500/20 to-transparent" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20", glow: "shadow-cyan-500/20", gradient: "from-cyan-500/20 to-transparent" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", glow: "shadow-rose-500/20", gradient: "from-rose-500/20 to-transparent" },
  };
  const colors = colorClasses[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Card className={`relative overflow-visible border ${colors.border} transition-all duration-700 ${isHovered ? `shadow-2xl ${colors.glow}` : 'shadow-md'}`}>
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-md`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.8 : 0.2 }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className={`absolute -right-16 -top-16 w-48 h-48 rounded-full ${colors.bg} blur-3xl`}
          animate={{ scale: isHovered ? 1.8 : 1, opacity: isHovered ? 0.6 : 0.15 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className={`absolute -left-8 -bottom-8 w-32 h-32 rounded-full ${colors.bg} blur-2xl`}
          animate={{ scale: isHovered ? 1.5 : 0.8, opacity: isHovered ? 0.4 : 0 }}
          transition={{ duration: 0.6 }}
        />
        <CardContent className="p-8 md:p-10 relative">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <motion.div 
              className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0 border ${colors.border} relative`}
              animate={{ 
                rotate: isHovered ? [0, -8, 8, -4, 0] : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.6 }}
            >
              <Icon className={`w-8 h-8 ${colors.text}`} />
              <motion.div
                className={`absolute inset-0 rounded-2xl ${colors.bg}`}
                animate={{ scale: isHovered ? [1, 1.5, 1] : 1, opacity: isHovered ? [0.5, 0, 0.5] : 0 }}
                transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
              />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-3 text-xl">{title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base">{description}</p>
            </div>
          </div>
          <motion.div 
            className={`absolute bottom-0 left-0 h-[2px] ${colors.text.replace('text', 'bg')} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: isHovered ? "100%" : "0%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ServiceItem({ text, delay, index }: { text: string; delay: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Card className={`border border-border/50 transition-all duration-500 ${isHovered ? 'shadow-xl border-primary/20' : 'shadow-sm'}`}>
        <CardContent className="p-6 md:p-8 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
            initial={{ opacity: 0, x: "-100%" }}
            animate={isHovered ? { opacity: 1, x: 0 } : { opacity: 0, x: "-100%" }}
            transition={{ duration: 0.5 }}
          />
          <div className="flex items-start gap-5 relative">
            <motion.div 
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20"
              animate={{ 
                scale: isHovered ? 1.15 : 1,
                rotate: isHovered ? 360 : 0 
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.4 }}
              >
                <Check className="w-5 h-5 text-primary" />
              </motion.div>
            </motion.div>
            <p className="text-lg text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-500">
              {text}
            </p>
          </div>
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-full"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{ originY: 0 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.03]" />
      <motion.div
        className="absolute w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -top-48 -right-48"
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] top-1/3 -left-64"
        animate={{ scale: [1, 1.3, 1], y: [0, -40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px] bottom-48 right-32"
        animate={{ scale: [0.8, 1.2, 0.8], x: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[60px] top-2/3 left-1/3"
        animate={{ scale: [1, 1.4, 1], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.8}
          duration={6 + (i % 4) * 2}
          size={3 + (i % 3) * 2}
          left={`${10 + (i * 7) % 80}%`}
          top={`${5 + (i * 13) % 90}%`}
        />
      ))}
    </div>
  );
}

export default function About() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const uspItems = [
    {
      icon: Zap,
      title: "Zero setup time",
      description: "Other apps make you type every question and answer by hand. With Prepetual, you upload your material and get a complete quiz in seconds. Your time should be spent learning, not copying.",
      color: "emerald"
    },
    {
      icon: Target,
      title: "Built for exams, not memorization",
      description: "Our AI generates questions that test comprehension, not just recall. You'll face the same types of questions you'll see on exam day\u2014with explanations that actually teach.",
      color: "blue"
    },
    {
      icon: Users,
      title: "A study buddy that doesn't give up",
      description: "Pip is available 24/7, never judges, and actually helps you think through problems instead of just showing the answer. It's like having a patient tutor who understands exactly what you're studying.",
      color: "cyan"
    },
    {
      icon: Heart,
      title: "Actually free",
      description: "No premium tiers. No \"unlock more questions\" paywalls. No trial periods. Prepetual is free because we believe every student deserves great study tools, regardless of their budget.",
      color: "rose"
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <GridBackground />

      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="py-6">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Hero */}
          <motion.section 
            ref={heroRef}
            className="min-h-[90vh] flex flex-col items-center justify-center text-center py-20 relative"
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          >
            <motion.div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.03 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-[600px] h-[600px] text-primary" />
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.02 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-[20vw] font-brand font-bold text-foreground select-none leading-none">P</div>
            </motion.div>

            <MagneticButton>
              <motion.div 
                className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-background mb-10 border border-primary/20 overflow-hidden shadow-2xl relative z-10"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <img 
                  src={brandLogo} 
                  alt="Prepetual Logo" 
                  className="w-full h-full object-cover relative z-10"
                />
              </motion.div>
            </MagneticButton>
            
            <RevealText>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 relative z-10">
                About{" "}
                <AnimatedText 
                  text="Prepetual" 
                  className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
                />
              </h1>
            </RevealText>
            
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Helping students turn any study material into exam-ready practice—
              <span className="text-foreground font-medium">without the busywork</span>.
            </motion.p>

            <motion.div
              className="mt-20 text-muted-foreground relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-8 h-8 mx-auto" />
              </motion.div>
              <span className="text-sm font-medium tracking-wider uppercase">Scroll to explore</span>
            </motion.div>
          </motion.section>

          {/* Mission */}
          <section className="py-32 md:py-40 relative">
            <ParallaxLayer speed={0.2} className="absolute -right-20 top-20 pointer-events-none">
              <motion.div
                className="w-40 h-40 rounded-full border border-primary/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
            </ParallaxLayer>
            <ParallaxLayer speed={-0.15} className="absolute -left-10 bottom-20 pointer-events-none">
              <motion.div
                className="w-24 h-24 rounded-full border border-purple-500/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
            </ParallaxLayer>

            <div className="max-w-3xl mx-auto">
              <RevealText className="mb-4">
                <motion.div
                  className="inline-flex items-center gap-3 mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary uppercase tracking-widest">Our Purpose</span>
                </motion.div>
              </RevealText>

              <RevealText delay={0.1}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-12 leading-tight">
                  Our Mission
                </h2>
              </RevealText>

              <div className="relative pl-8 border-l-2 border-primary/20">
                <motion.div 
                  className="absolute left-[-1px] top-0 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ transformOrigin: "top" }}
                />
                
                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                    We believe exam preparation shouldn't be about copying questions into flashcard apps or spending hours making study guides.
                  </p>
                  <motion.p 
                    className="text-2xl md:text-3xl text-foreground leading-relaxed font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    It should be about actually learning.
                  </motion.p>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Prepetual exists to remove the friction between having study material and being ready for your exam. Upload your notes, textbook pages, or past papers—and within seconds, you have a personalized quiz that adapts to how you learn.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* What We Offer */}
          <section className="py-32 md:py-40 relative">
            <ParallaxLayer speed={0.3} className="absolute right-10 top-40 pointer-events-none">
              <motion.div
                className="w-3 h-3 rounded-full bg-purple-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </ParallaxLayer>

            <div className="max-w-3xl mx-auto">
              <RevealText className="mb-4">
                <motion.div
                  className="inline-flex items-center gap-3 mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <BookOpen className="w-7 h-7 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-purple-500 uppercase tracking-widest">Our Services</span>
                </motion.div>
              </RevealText>

              <RevealText delay={0.1}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-16 leading-tight">
                  What We Offer
                </h2>
              </RevealText>
              
              <div className="space-y-5">
                <ServiceItem 
                  text="AI-powered quiz generation that understands your content—not just keywords. Whether you're studying biology, history, or calculus, our AI creates questions that test real understanding."
                  delay={0.1}
                  index={0}
                />
                <ServiceItem 
                  text="Multiple study modes to match how you learn best. Take timed quizzes for exam simulation, flip through flashcards for quick review, or use revision mode to focus on concepts you keep missing."
                  delay={0.2}
                  index={1}
                />
                <ServiceItem 
                  text="Pip, your AI study companion, is there when you're stuck. Ask for hints, get explanations, or have concepts broken down step-by-step—without spoiling the answer."
                  delay={0.3}
                  index={2}
                />
                <ServiceItem 
                  text="Progress tracking that shows you exactly where you stand. See your accuracy trends, maintain your study streak, and know which topics need more attention before the big day."
                  delay={0.4}
                  index={3}
                />
              </div>
            </div>
          </section>

          {/* What Makes Us Different */}
          <section className="py-32 md:py-40 relative">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-20">
                <MagneticButton className="inline-block mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-10 h-10 text-amber-500" />
                    </motion.div>
                  </motion.div>
                </MagneticButton>

                <RevealText>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    What Makes Us Different
                  </h2>
                </RevealText>
                <motion.p 
                  className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  There are plenty of flashcard and quiz apps out there. Here's why students choose Prepetual:
                </motion.p>
              </div>

              <div className="space-y-6">
                {uspItems.map((item, index) => (
                  <USPCard key={item.title} {...item} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-32 md:py-48 text-center relative">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent rounded-3xl"
              />
            </motion.div>

            <MagneticButton className="inline-block mb-10">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Rocket className="w-24 h-24 text-primary relative z-10" />
                </motion.div>
              </motion.div>
            </MagneticButton>

            <RevealText>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 relative z-10">
                Ready to study smarter?
              </h2>
            </RevealText>
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-14 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Upload your first document and see how Prepetual can transform your exam prep.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="relative z-10"
            >
              <Button 
                size="lg" 
                onClick={() => setLocation("/")} 
                data-testid="button-start-now"
                className="text-lg shadow-xl shadow-primary/20"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </section>

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
