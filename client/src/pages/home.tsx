import { useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, Brain, ArrowRight, CheckCircle2, Upload, FileText, BarChart3, Users, Share2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    setExtractedText("");
  }, []);

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    if (isAuthenticated) {
      setLocation("/generate");
    } else {
      openLoginDialog();
    }
  };

  const handleGetStarted = () => {
    openSignUpDialog();
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-16 sm:pb-24">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/8 to-quiz-purple/8 rounded-full blur-3xl opacity-60" />
        
        <div className="container relative mx-auto px-4 sm:px-6 pt-8 sm:pt-16 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-10 sm:mb-14"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Study Assistant</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Turn your notes into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-quiz-purple to-primary">practice quizzes</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload any study material and let AI create personalized quizzes in seconds. 
              Study smarter, not harder.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 text-base px-8 w-full sm:w-auto"
                data-testid="button-hero-get-started"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto"
                data-testid="button-hero-learn-more"
              >
                See How It Works
              </Button>
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <FileUpload onTextExtracted={handleTextExtracted} />
          </motion.div>

          {extractedText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                onClick={handleContinueToGenerate}
                className="gap-2 text-base px-8"
                data-testid="button-continue-generate"
              >
                Continue to Generate Quiz
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>PDF & Image support</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your study materials into effective practice quizzes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload your materials",
                description: "Drag and drop PDFs, images, or scanned notes. Our OCR handles even handwritten text.",
                color: "primary"
              },
              {
                step: "02",
                icon: Brain,
                title: "AI generates questions",
                description: "Choose question types, difficulty, and count. AI creates relevant, challenging questions.",
                color: "quiz-purple"
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Practice & improve",
                description: "Take quizzes, get instant feedback with explanations, and track your progress over time.",
                color: "quiz-orange"
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-none bg-transparent">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
                      item.color === 'primary' ? 'bg-primary/10' : 
                      item.color === 'quiz-purple' ? 'bg-quiz-purple/10' : 'bg-quiz-orange/10'
                    }`}>
                      <item.icon className={`w-6 h-6 ${
                        item.color === 'primary' ? 'text-primary' : 
                        item.color === 'quiz-purple' ? 'text-quiz-purple' : 'text-quiz-orange'
                      }`} />
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">STEP {item.step}</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to study smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you learn more effectively
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: FileText,
                title: "Multiple formats",
                description: "Upload PDFs, images, or paste text directly"
              },
              {
                icon: Brain,
                title: "Smart AI",
                description: "Questions that test understanding, not just memorization"
              },
              {
                icon: BarChart3,
                title: "Detailed results",
                description: "Explanations for every answer to deepen learning"
              },
              {
                icon: Users,
                title: "Community sharing",
                description: "Share quizzes and discover content from others"
              },
              {
                icon: Share2,
                title: "Easy sharing",
                description: "Share quiz links with classmates and study groups"
              },
              {
                icon: MessageSquare,
                title: "Multi-language",
                description: "Vietnamese and English support with auto-detection"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/5 via-quiz-purple/5 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to ace your next exam?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join students who are already studying smarter with AI-powered quizzes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 px-8 w-full sm:w-auto"
                data-testid="button-cta-get-started"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full sm:w-auto"
                data-testid="button-cta-try-now"
              >
                Try It Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
