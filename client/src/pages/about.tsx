import { motion } from "framer-motion";
import { 
  ArrowLeft, Rocket, Target, Heart, 
  ArrowRight, ChevronDown, Sparkles, Users, BookOpen, Zap
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import brandLogo from "@assets/favicon_prepetual_1768124938772.png";

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function About() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
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
            className="min-h-[70vh] flex flex-col items-center justify-center text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-background mb-6 border border-primary/20 overflow-hidden shadow-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <img 
                src={brandLogo} 
                alt="Prepetual Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              About <span className="font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Prepetual</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Helping students turn any study material into exam-ready practice—without the busywork.
            </motion.p>

            <motion.div
              className="mt-12 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="w-6 h-6 mx-auto" />
              </motion.div>
            </motion.div>
          </motion.section>

          <ScrollSection className="py-20 border-t border-border/30">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  We believe exam preparation shouldn't be about copying questions into flashcard apps or spending hours making study guides. It should be about actually <span className="text-foreground font-medium">learning</span>.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Prepetual exists to remove the friction between having study material and being ready for your exam. Upload your notes, textbook pages, or past papers—and within seconds, you have a personalized quiz that adapts to how you learn.
                </p>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection className="py-20 border-t border-border/30">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  What We Offer
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    <span className="text-foreground font-medium">AI-powered quiz generation</span> that understands your content—not just keywords. Whether you're studying biology, history, or calculus, our AI creates questions that test real understanding.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Multiple study modes</span> to match how you learn best. Take timed quizzes for exam simulation, flip through flashcards for quick review, or use revision mode to hammer down the concepts you keep missing.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Pip, your AI study companion</span>, is there when you're stuck. Ask for hints, get explanations, or have concepts broken down step-by-step—without spoiling the answer.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Progress tracking</span> that shows you exactly where you stand. See your accuracy trends, maintain your study streak, and know which topics need more attention before the big day.
                  </p>
                </div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection className="py-20 border-t border-border/30">
            <div className="flex items-start gap-6 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  What Makes Us Different
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  There are plenty of flashcard and quiz apps out there. Here's why students choose Prepetual:
                </p>
              </div>
            </div>

            <div className="space-y-4 ml-0 md:ml-20">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    Zero setup time
                  </h3>
                  <p className="text-muted-foreground">
                    Other apps make you type every question and answer by hand. With Prepetual, you upload your material and get a complete quiz in seconds. Your time should be spent learning, not copying.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Built for exams, not memorization
                  </h3>
                  <p className="text-muted-foreground">
                    Our AI generates questions that test comprehension, not just recall. You'll face the same types of questions you'll see on exam day—multiple choice, true/false, and short answer—with explanations that actually teach.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-cyan-500/20 bg-cyan-500/5">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-500" />
                    A study buddy that doesn't give up
                  </h3>
                  <p className="text-muted-foreground">
                    Pip is available 24/7, never judges, and actually helps you think through problems instead of just showing the answer. It's like having a patient tutor who understands exactly what you're studying.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-500/20 bg-rose-500/5">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Actually free
                  </h3>
                  <p className="text-muted-foreground">
                    No premium tiers. No "unlock more questions" paywalls. No trial periods. Prepetual is free because we believe every student deserves great study tools, regardless of their budget.
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollSection>

          <ScrollSection className="py-24 border-t border-border/30 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <Rocket className="w-14 h-14 text-primary mx-auto" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to study smarter?
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
              Upload your first document and see how Prepetual can transform your exam prep.
            </p>
            <Button size="lg" onClick={() => setLocation("/")} data-testid="button-start-now">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </ScrollSection>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
