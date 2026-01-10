import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain, Share2, BarChart3, Globe, Sparkles, Upload, Zap, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
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

const features = [
  { 
    icon: BookOpen, 
    title: "Multiple Question Types", 
    desc: "Multiple choice, true/false, and short answer questions" 
  },
  { 
    icon: BarChart3, 
    title: "Difficulty Levels", 
    desc: "Choose between easy, medium, and hard questions" 
  },
  { 
    icon: Brain, 
    title: "Study Mode", 
    desc: "Learn with interactive flashcard-style cards" 
  },
  { 
    icon: Share2, 
    title: "Share Quizzes", 
    desc: "Collaborate and share with friends" 
  },
  { 
    icon: BarChart3, 
    title: "Track Progress", 
    desc: "Monitor your learning journey" 
  },
  { 
    icon: Globe, 
    title: "Multi-Language", 
    desc: "Support for 10+ languages worldwide" 
  },
];

const steps = [
  { 
    icon: Upload, 
    title: "Upload", 
    desc: "Drop your PDFs, images, or notes" 
  },
  { 
    icon: Brain, 
    title: "AI Analyzes", 
    desc: "Our AI reads and understands your content" 
  },
  { 
    icon: Zap, 
    title: "Generate", 
    desc: "Custom quiz questions created instantly" 
  },
  { 
    icon: GraduationCap, 
    title: "Learn", 
    desc: "Take quizzes and master the material" 
  },
];

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Link href="/">
              <Button variant="ghost" className="mb-6" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="font-brand">Prepetual</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your study materials into personalized quizzes with AI.
              Study smarter, not harder.
            </p>
          </motion.div>

          {/* How It Works */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="text-center p-4"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative inline-flex mb-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Features Grid */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  className="p-5 rounded-xl border bg-card"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Stats */}
          <motion.section variants={itemVariants} className="mb-16">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: "100%", label: "Free" },
                { value: "10+", label: "Languages" },
                { value: "∞", label: "Quizzes" },
              ].map((stat) => (
                <div key={stat.label} className="p-4">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section variants={itemVariants} className="text-center pb-8">
            <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Ready to Start Learning?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first AI-powered quiz in seconds.
              </p>
              <Link href="/">
                <Button size="lg" data-testid="button-start-studying">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
