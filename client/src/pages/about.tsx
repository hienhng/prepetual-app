import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Rocket, Target, Users, Lightbulb, Shield, Heart, Upload, Brain, Zap, GraduationCap, BookOpen, BarChart3, Share2, Globe, CheckCircle2, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const steps = [
  { 
    icon: Upload, 
    title: "Upload Your Materials", 
    desc: "Drop any PDF, image, or paste text from your lectures, textbooks, or notes. We support multiple languages and formats.",
    color: "from-blue-500 to-blue-600"
  },
  { 
    icon: Brain, 
    title: "AI Analyzes Content", 
    desc: "Our advanced AI reads and understands your content, identifying key concepts, facts, and relationships.",
    color: "from-purple-500 to-purple-600"
  },
  { 
    icon: Zap, 
    title: "Generate Custom Quiz", 
    desc: "Choose your preferred question types, difficulty level, and number of questions. Get a personalized quiz in seconds.",
    color: "from-orange-500 to-orange-600"
  },
  { 
    icon: GraduationCap, 
    title: "Learn & Master", 
    desc: "Take quizzes with instant feedback, detailed explanations, and track your progress over time.",
    color: "from-green-500 to-green-600"
  },
];

const features = [
  { icon: BookOpen, title: "Multiple Question Types", desc: "Multiple choice, true/false, and short answer formats" },
  { icon: BarChart3, title: "Difficulty Levels", desc: "Easy, medium, and hard to match your skill level" },
  { icon: Brain, title: "Study Mode", desc: "Flashcard-style learning with flip animations" },
  { icon: Share2, title: "Share Quizzes", desc: "Collaborate with classmates and study groups" },
  { icon: Target, title: "Progress Tracking", desc: "Monitor accuracy, streaks, and improvement" },
  { icon: Globe, title: "10+ Languages", desc: "Vietnamese, English, Spanish, French, and more" },
];

const values = [
  { 
    icon: Rocket, 
    title: "Speed & Efficiency", 
    desc: "Stop wasting hours creating flashcards manually. Our AI generates comprehensive quizzes in seconds, giving you more time to actually study." 
  },
  { 
    icon: Target, 
    title: "Science-Backed Learning", 
    desc: "Active recall through quizzing is proven by research to dramatically improve memory retention compared to passive reading." 
  },
  { 
    icon: Users, 
    title: "Accessible to Everyone", 
    desc: "Quality education tools shouldn't be locked behind expensive subscriptions. Prepetual is completely free to use with no hidden costs." 
  },
  { 
    icon: Lightbulb, 
    title: "AI That Empowers", 
    desc: "We believe AI should enhance human learning, not replace it. Our technology adapts to your content and learning style." 
  },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
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
  }, [target]);
  
  return <span>{count}{suffix}</span>;
}

export default function About() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Link href="/">
              <Button variant="ghost" className="mb-8" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>

          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center mb-20">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 mb-6 shadow-lg shadow-primary/25"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              About <span className="font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Prepetual</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your AI-powered study companion that transforms any document into 
              interactive, personalized quizzes. Learn smarter, not harder.
            </p>
          </motion.section>

          {/* Our Story */}
          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Story</span>
              <h2 className="text-3xl font-bold text-foreground mt-2">Born From a Real Problem</h2>
            </div>
            <Card className="overflow-visible">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-foreground leading-relaxed text-lg">
                      Prepetual started with a simple frustration: I had stacks of papers, lecture notes, 
                      and study materials, but no effective way to test myself on them.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      I knew that active recall—testing yourself rather than just re-reading—is the most 
                      effective way to learn. But staring at a piece of paper doesn't let you do that. 
                      I needed something that could turn my own materials into interactive quizzes.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      So I built it. Prepetual uses AI to read your documents and generate personalized 
                      quiz questions, so you can actually practice active recall on your own content—not 
                      generic flashcards someone else made.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-72 h-56">
                      {/* Messy Papers - Left Side */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute w-16 h-20 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded shadow-md border border-amber-200/50 dark:border-amber-700/30"
                            style={{
                              left: `${i * 3}px`,
                              zIndex: 5 - i,
                            }}
                            initial={{ rotate: -15 + i * 8, x: 0, y: i * -3 }}
                            animate={{ 
                              rotate: [-15 + i * 8, -10 + i * 6, -15 + i * 8],
                              y: [i * -3, i * -5, i * -3],
                            }}
                            transition={{ 
                              duration: 3 + i * 0.5, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <div className="p-1.5 space-y-1">
                              <div className="h-1 w-10 bg-muted-foreground/20 rounded" />
                              <div className="h-1 w-8 bg-muted-foreground/20 rounded" />
                              <div className="h-1 w-11 bg-muted-foreground/20 rounded" />
                              <div className="h-1 w-6 bg-muted-foreground/20 rounded" />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Transformation Arrow with Sparkles */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <motion.div
                          className="relative"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Sparkles className="w-7 h-7 text-white" />
                          </div>
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full bg-primary"
                              style={{
                                top: `${-10 + i * 5}px`,
                                left: `${50 + i * 10}px`,
                              }}
                              animate={{
                                opacity: [0, 1, 0],
                                scale: [0.5, 1.2, 0.5],
                                x: [0, 15, 30],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.3,
                              }}
                            />
                          ))}
                        </motion.div>
                      </div>

                      {/* Quiz Archive - Right Side */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          {/* Stacked organized cards */}
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute w-20 h-24 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/30 shadow-sm"
                              style={{
                                right: `${i * 6}px`,
                                top: `${i * 4}px`,
                                zIndex: 3 - i,
                              }}
                              animate={{
                                y: [0, -2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            >
                              {i === 0 && (
                                <div className="p-2 space-y-1.5">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-primary/40" />
                                    <div className="h-1.5 w-10 bg-primary/30 rounded" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-sm border border-primary/40" />
                                    <div className="h-1 w-12 bg-muted-foreground/20 rounded" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-sm border border-primary/40 bg-primary/30" />
                                    <div className="h-1 w-10 bg-muted-foreground/20 rounded" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-sm border border-primary/40" />
                                    <div className="h-1 w-8 bg-muted-foreground/20 rounded" />
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                          
                          {/* Check badge */}
                          <motion.div
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg z-10"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* How It Works */}
          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
              <h2 className="text-3xl font-bold text-foreground mt-2">Four Simple Steps</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative"
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`h-full transition-shadow duration-300 ${hoveredStep === index ? 'shadow-xl shadow-primary/10' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                          animate={hoveredStep === index ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <step.icon className="w-7 h-7 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                              Step {index + 1}
                            </span>
                          </div>
                          <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Features */}
          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
              <h2 className="text-3xl font-bold text-foreground mt-2">Everything You Need</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="relative group"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`h-full transition-all duration-300 ${hoveredFeature === index ? 'border-primary/50 shadow-lg' : ''}`}>
                    <CardContent className="p-5">
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                        animate={hoveredFeature === index ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Stats */}
          <motion.section variants={itemVariants} className="mb-20">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="py-10 px-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  {[
                    { value: 100, suffix: "%", label: "Free Forever", sublabel: "No hidden costs" },
                    { value: 10, suffix: "+", label: "Languages", sublabel: "Global support" },
                    { value: null, display: "∞", label: "Unlimited", sublabel: "Create any amount" },
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="p-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                        {stat.value !== null ? (
                          <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                        ) : (
                          stat.display
                        )}
                      </div>
                      <div className="font-medium text-foreground">{stat.label}</div>
                      <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Values */}
          <motion.section variants={itemVariants} className="mb-20">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Values</span>
              <h2 className="text-3xl font-bold text-foreground mt-2">What We Believe In</h2>
            </div>
            <div className="space-y-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-visible">
                    <CardContent className="p-6">
                      <div className="flex gap-5">
                        <motion.div 
                          className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <value.icon className="w-7 h-7 text-primary" />
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg mb-2">{value.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Privacy */}
          <motion.section variants={itemVariants} className="mb-20">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex gap-5">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-2">Your Privacy is Protected</h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      We take your privacy seriously. Your documents are processed securely and never shared 
                      with third parties. We only use your content to generate quizzes for you—nothing else.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {["Encrypted uploads", "No data selling", "Secure processing"].map((item) => (
                        <span key={item} className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* CTA */}
          <motion.section variants={itemVariants} className="text-center pb-12">
            <motion.div 
              className="py-16 px-8 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute top-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl"
                animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
                transition={{ duration: 12, repeat: Infinity }}
              />
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                  Join students worldwide who are using AI to study smarter and achieve their goals faster.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="/">
                    <Button size="lg" className="text-lg px-10 py-6" data-testid="button-start-studying">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Learning for Free
                    </Button>
                  </Link>
                </motion.div>
                <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
