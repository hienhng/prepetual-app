import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Zap, BookOpen, Brain, Share2, BarChart3, Globe, Check, Sparkles, Upload, FileSearch, ClipboardList, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRef, useEffect } from "react";

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseAnimation = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          variants={floatingAnimation}
          initial="initial"
          animate="animate"
        />
        <motion.div
          className="absolute top-1/3 -left-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl"
          variants={floatingAnimation}
          initial="initial"
          animate="animate"
          style={{ animationDelay: "2s" }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-40 h-40 rounded-full bg-primary/10 blur-2xl"
          variants={pulseAnimation}
          initial="initial"
          animate="animate"
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/">
            <Button variant="ghost" className="mb-8" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Hero Section with floating elements */}
          <motion.section
            className="relative mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Decorative floating icons */}
              <motion.div
                className="absolute -top-4 right-10 text-primary/20"
                animate={{ 
                  y: [-5, 5, -5], 
                  rotate: [0, 10, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
              <motion.div
                className="absolute top-20 right-32 text-primary/15"
                animate={{ 
                  y: [5, -5, 5], 
                  rotate: [0, -10, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Brain className="w-6 h-6" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                  About
                  <motion.span
                    className="ml-3 text-4xl md:text-6xl font-brand inline-block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Prepetual
                  </motion.span>
                </h1>
              </motion.div>

              <motion.p
                className="text-xl text-muted-foreground max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Transforming how students learn with AI-powered personalized quizzes. 
                Study smarter, achieve more.
              </motion.p>
            </div>
          </motion.section>

          {/* Mission Section with gradient border */}
          <motion.section
            className="mb-20"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="relative p-[1px] rounded-xl bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 overflow-visible"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 bg-background/95 backdrop-blur-sm overflow-visible">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <Zap className="w-6 h-6 text-primary" />
                    {/* <motion.div
                      className="p-3 rounded-xl bg-primary/10"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      
                    </motion.div> */}
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-2">Our Mission</h2>
                      <p className="text-muted-foreground">Empowering learners worldwide</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      Prepetual is dedicated to transforming the way students learn and prepare for exams. 
                      We believe that effective studying should be accessible, engaging, and personalized.
                    </p>
                    <p>
                      Our AI-powered platform turns your study materials into interactive quizzes, 
                      helping you master any subject faster and more efficiently.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.section>

          {/* How It Works - Interactive Timeline */}
          <motion.section
            className="mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h2
              className="text-3xl font-semibold text-foreground mb-10 text-center"
              variants={itemVariants}
            >
              How It Works
            </motion.h2>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />

              <div className="space-y-8 md:space-y-0">
                {[
                  { icon: Upload, step: 1, title: "Upload Materials", desc: "Drop your PDFs, images, or lecture notes" },
                  { icon: FileSearch, step: 2, title: "AI Analysis", desc: "Our AI extracts and understands your content" },
                  { icon: ClipboardList, step: 3, title: "Quiz Generation", desc: "Custom questions created instantly" },
                  { icon: Trophy, step: 4, title: "Learn & Master", desc: "Take quizzes with detailed explanations" },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    className={`flex items-center gap-6 md:gap-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                    variants={itemVariants}
                    custom={index}
                  >
                    <div className={`flex-1 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                      <motion.div
                        className="p-6 rounded-xl bg-card border"
                        whileHover={{ 
                          scale: 1.03,
                          boxShadow: "0 10px 40px -15px hsl(var(--primary) / 0.2)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`flex items-center gap-3 mb-3 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                          <motion.div
                            className="p-2 rounded-lg bg-primary/10"
                            whileHover={{ rotate: 15 }}
                            transition={{ duration: 0.2 }}
                          >
                            <item.icon className="w-5 h-5 text-primary" />
                          </motion.div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.desc}</p>
                      </motion.div>
                    </div>

                    {/* Step indicator */}
                    <motion.div
                      className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold shadow-lg"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {item.step}
                    </motion.div>

                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Features Grid with staggered animations */}
          <motion.section
            className="mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h2
              className="text-3xl font-semibold text-foreground mb-10 text-center"
              variants={itemVariants}
            >
              Powerful Features
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: BookOpen, title: "Multiple Question Types", desc: "Multiple choice, true/false, short answer", color: "from-blue-500/20 to-blue-600/5" },
                { icon: BarChart3, title: "Difficulty Levels", desc: "Easy, medium, and hard customization", color: "from-green-500/20 to-green-600/5" },
                { icon: Brain, title: "Study Mode", desc: "Flashcard-style learning experience", color: "from-purple-500/20 to-purple-600/5" },
                { icon: Share2, title: "Shareable Quizzes", desc: "Collaborate with friends and classmates", color: "from-orange-500/20 to-orange-600/5" },
                { icon: BarChart3, title: "Progress Tracking", desc: "Monitor your quiz history and results", color: "from-pink-500/20 to-pink-600/5" },
                { icon: Globe, title: "Global Language Support", desc: "Support for numerous languages worldwide", color: "from-cyan-500/20 to-cyan-600/5" },
              ].map(({ icon: Icon, title, desc, color }, index) => (
                <motion.div
                  key={index}
                  variants={scaleInVariants}
                  custom={index}
                >
                  <motion.div
                    className={`relative h-full p-6 rounded-xl border bg-gradient-to-br ${color} backdrop-blur-sm`}
                    whileHover={{ 
                      y: -8,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-4 shadow-sm"
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        transition: { duration: 0.5 },
                      }}
                    >
                      <Icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Technology Section with animated list */}
          <motion.section
            className="mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div
              className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 md:p-12 border"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-8 h-8 text-primary" />
                {/* <motion.div
                  animate={{ 
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "in" }}
                >
                  
                </motion.div> */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Our Technology</h2>
                  <p className="text-muted-foreground">Powered by cutting-edge AI</p>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                Prepetual leverages advanced artificial intelligence to understand your study materials 
                and generate relevant, challenging questions. Our platform intelligently processes 
                various document formats and languages.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Advanced OCR technology",
                  "AI-powered content analysis",
                  "Intelligent question generation",
                  "Global language support",
                  "Personalized learning paths",
                  "Real-time progress analytics",
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Check className="w-3 h-3 text-primary" />
                    </motion.div>
                    <span className="text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.section>

          {/* CTA Section with animated background */}
          <motion.section
            className="mb-16"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="relative rounded-2xl bg-primary/5 p-10 md:p-16 text-center border overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.4 }}
            >
              {/* Animated background circles */}
              <motion.div
                className="absolute top-0 left-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl"
                animate={{ 
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-primary/10 blur-2xl"
                animate={{ 
                  x: [0, -30, 0],
                  y: [0, -20, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10">
                <motion.h2
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  Ready to Transform Your Learning?
                </motion.h2>
                <motion.p
                  className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  Start studying smarter today with AI-powered personalized quizzes.
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="/">
                    <Button size="lg" className="text-lg px-8" data-testid="button-start-studying">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Stats Section with counting animation */}
          <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { number: "100%", label: "Free to Use", sublabel: "No hidden costs" },
                { number: "10+", label: "Language Support", sublabel: "Global support" },
                { number: "∞", label: "Unlimited Quizzes", sublabel: "Create as many as you need" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6"
                  variants={scaleInVariants}
                  custom={index}
                  whileHover={{ y: -5 }}
                >
                  <motion.div
                    className="text-4xl md:text-5xl font-bold text-primary mb-2"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 15,
                      delay: index * 0.1,
                    }}
                    viewport={{ once: true }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-lg font-medium text-foreground mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
