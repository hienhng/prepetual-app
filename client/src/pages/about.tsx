import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ArrowLeft, Rocket, Target, Heart, 
  ArrowRight, ChevronDown, Sparkles, Users, BookOpen, Zap,
  Star, Check
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{ 
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 6, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay 
      }}
    />
  );
}

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
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
  
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30", glow: "shadow-rose-500/20" },
  };
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`relative overflow-hidden transition-all duration-500 border-2 ${colors.border} ${isHovered ? `shadow-2xl ${colors.glow}` : ''}`}>
        <motion.div 
          className={`absolute inset-0 ${colors.bg}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${colors.bg} blur-2xl`}
          animate={{ scale: isHovered ? 1.5 : 1, opacity: isHovered ? 0.6 : 0.2 }}
          transition={{ duration: 0.4 }}
        />
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <motion.div 
              className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 border ${colors.border}`}
              animate={{ 
                rotate: isHovered ? [0, -10, 10, 0] : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.4 }}
            >
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </motion.div>
            <div>
              <h3 className="font-bold text-foreground mb-2 text-lg">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
          <motion.div 
            className={`absolute bottom-0 left-0 h-1 ${colors.text.replace('text', 'bg')}`}
            initial={{ width: 0 }}
            animate={{ width: isHovered ? "100%" : 0 }}
            transition={{ duration: 0.4 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ServiceItem({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-3 group"
    >
      <motion.div 
        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1"
        whileHover={{ scale: 1.2, rotate: 360 }}
        transition={{ duration: 0.4 }}
      >
        <Check className="w-3.5 h-3.5 text-primary" />
      </motion.div>
      <p className="text-lg text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
        {text}
      </p>
    </motion.div>
  );
}

export default function About() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

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
      description: "Our AI generates questions that test comprehension, not just recall. You'll face the same types of questions you'll see on exam day—with explanations that actually teach.",
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
      <div className="fixed inset-0 pointer-events-none">
        <FloatingShape className="w-72 h-72 bg-primary/5 blur-3xl -top-20 -right-20" delay={0} />
        <FloatingShape className="w-96 h-96 bg-purple-500/5 blur-3xl top-1/3 -left-40" delay={2} />
        <FloatingShape className="w-64 h-64 bg-cyan-500/5 blur-3xl bottom-20 right-10" delay={4} />
        <FloatingShape className="w-48 h-48 bg-amber-500/5 blur-3xl top-1/2 right-1/4" delay={1} />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="py-6">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <motion.section 
            ref={heroRef}
            className="min-h-[80vh] flex flex-col items-center justify-center text-center py-16 relative"
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
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-background mb-8 border border-primary/20 overflow-hidden shadow-2xl relative z-10"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200}}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <img 
                src={brandLogo} 
                alt="Prepetual Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 relative z-10">
              About{" "}
              <AnimatedText 
                text="Prepetual" 
                className="font-brand bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
              />
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Helping students turn any study material into exam-ready practice—
              <span className="text-foreground font-medium">without the busywork</span>.
            </motion.p>

            <motion.div
              className="mt-16 text-muted-foreground relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="w-8 h-8 mx-auto" />
              </motion.div>
              <span className="text-sm font-medium">Scroll to explore</span>
            </motion.div>
          </motion.section>

          <ScrollSection className="py-24">
            <div className="relative">
              <motion.div 
                className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              />
              
              <div className="pl-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    Our Mission
                  </h2>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    We believe exam preparation shouldn't be about copying questions into flashcard apps or spending hours making study guides.
                  </p>
                  <p className="text-xl text-foreground leading-relaxed font-medium">
                    It should be about actually learning.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Prepetual exists to remove the friction between having study material and being ready for your exam. Upload your notes, textbook pages, or past papers—and within seconds, you have a personalized quiz that adapts to how you learn.
                  </p>
                </motion.div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection className="py-24">
            <div className="relative">
              <motion.div 
                className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-purple-500/50 to-transparent rounded-full"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              />
              
              <div className="pl-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-8"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <BookOpen className="w-7 h-7 text-purple-500" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    What We Offer
                  </h2>
                </motion.div>
                
                <div className="space-y-5">
                  <ServiceItem 
                    text="AI-powered quiz generation that understands your content—not just keywords. Whether you're studying biology, history, or calculus, our AI creates questions that test real understanding."
                    delay={0.1}
                  />
                  <ServiceItem 
                    text="Multiple study modes to match how you learn best. Take timed quizzes for exam simulation, flip through flashcards for quick review, or use revision mode to focus on concepts you keep missing."
                    delay={0.2}
                  />
                  <ServiceItem 
                    text="Pip, your AI study companion, is there when you're stuck. Ask for hints, get explanations, or have concepts broken down step-by-step—without spoiling the answer."
                    delay={0.3}
                  />
                  <ServiceItem 
                    text="Progress tracking that shows you exactly where you stand. See your accuracy trends, maintain your study streak, and know which topics need more attention before the big day."
                    delay={0.4}
                  />
                </div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection className="py-24">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6"
              >
                <Sparkles className="w-8 h-8 text-amber-500" />
              </motion.div>
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                What Makes Us Different
              </motion.h2>
              <motion.p 
                className="text-lg text-muted-foreground max-w-xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                There are plenty of flashcard and quiz apps out there. Here's why students choose Prepetual:
              </motion.p>
            </div>

            <div className="space-y-4">
              {uspItems.map((item, index) => (
                <USPCard key={item.title} {...item} index={index} />
              ))}
            </div>
          </ScrollSection>

          <ScrollSection className="py-24 text-center">
            <motion.div
              className="relative inline-block mb-8"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Rocket className="w-20 h-20 text-primary relative z-10" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Ready to study smarter?
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-md mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Upload your first document and see how Prepetual can transform your exam prep.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                size="lg" 
                onClick={() => setLocation("/")} 
                data-testid="button-start-now"
                className="text-lg px-8 py-6 h-auto"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </ScrollSection>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
