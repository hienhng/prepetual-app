import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Rocket, Target, Users, Lightbulb, Shield, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/">
            <Button variant="ghost" className="mb-8" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          {/* Hero */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                <span className="font-brand">Prepetual</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your AI study companion that turns any document into interactive quizzes. 
              Upload, generate, and master any subject.
            </p>
          </motion.div>

          {/* What We Do */}
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-4">What We Do</h2>
            <div className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Prepetual uses artificial intelligence to analyze your study materials—PDFs, images, 
                lecture notes—and creates personalized quizzes tailored to help you learn faster.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're preparing for an exam, learning a new language, or mastering a skill, 
                our platform adapts to your content and generates questions that challenge and engage you.
              </p>
            </div>
          </motion.section>

          {/* Values */}
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-sm font-medium text-primary uppercase tracking-wider mb-6">What We Believe</h2>
            <div className="grid gap-4">
              {[
                { 
                  icon: Rocket, 
                  title: "Learning Should Be Fast", 
                  desc: "No more wasting hours making flashcards. Get quizzes in seconds." 
                },
                { 
                  icon: Target, 
                  title: "Practice Makes Perfect", 
                  desc: "Active recall through quizzes is proven to boost retention." 
                },
                { 
                  icon: Users, 
                  title: "Everyone Deserves Access", 
                  desc: "Quality study tools shouldn't cost a fortune. We're free to use." 
                },
                { 
                  icon: Lightbulb, 
                  title: "AI Should Empower", 
                  desc: "Technology that works for you, not the other way around." 
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="flex gap-4 p-4 rounded-xl border bg-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Key Numbers */}
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex justify-around py-8 px-4 rounded-xl bg-primary/5 border">
              {[
                { value: "Free", label: "Forever" },
                { value: "10+", label: "Languages" },
                { value: "Unlimited", label: "Quizzes" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Privacy & Trust */}
          <motion.section 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex gap-4 p-5 rounded-xl border bg-card">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Your Privacy Matters</h3>
                <p className="text-sm text-muted-foreground">
                  Your documents are processed securely and never shared. 
                  We only use your content to generate quizzes for you.
                </p>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section 
            className="text-center pb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="py-10 px-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border">
              <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Start Learning Smarter
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Join thousands of students using AI to study more effectively.
              </p>
              <Link href="/">
                <Button size="lg" data-testid="button-start-studying">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Your First Quiz
                </Button>
              </Link>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
