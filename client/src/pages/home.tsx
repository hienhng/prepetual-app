import { useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, Brain, ArrowRight, CheckCircle2, Upload, FileText, BarChart3 } from "lucide-react";
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Study Assistant</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-5 leading-[1.1] tracking-tight">
              Turn your notes into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-quiz-purple">practice quizzes</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Upload any study material and let AI create personalized quizzes in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gap-2 px-8 w-full sm:w-auto"
                data-testid="button-hero-get-started"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8"
                data-testid="button-hero-learn-more"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-xl mx-auto"
          >
            <FileUpload onTextExtracted={handleTextExtracted} />
          </motion.div>

          {extractedText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-6"
            >
              <Button
                size="lg"
                onClick={handleContinueToGenerate}
                className="gap-2 px-8"
                data-testid="button-continue-generate"
              >
                Continue to Generate Quiz
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>PDF & Images</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: Upload & Extract */}
      <section id="features" className="py-20 sm:py-28 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Effortless Document Upload
              </h2>
              <p className="text-muted-foreground">
                Drag and drop your study materials. Smart extraction handles PDFs and scanned images with precision.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  PDF documents with multi-page support
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Images with OCR text extraction
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Vietnamese and English support
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center bg-primary/5 mb-4">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <FileText className="w-8 h-8 mx-auto text-primary/70 mb-2" />
                    </motion.div>
                    <p className="text-xs text-muted-foreground">Drop your files here</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/60">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground flex-1 truncate">biology_notes.pdf</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <Button size="sm" className="w-full gap-1">
                      Continue <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: AI Generation */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="order-2 md:order-1"
            >
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="p-4 rounded-lg border bg-background mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Multiple Choice</p>
                    <p className="text-sm font-medium text-foreground mb-3">What is the primary function of mitochondria?</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
                        <span>Protein synthesis</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/30 text-sm">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        </div>
                        <span className="text-primary font-medium">Energy production</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
                        <span>Cell division</span>
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-xs text-quiz-purple"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Generating more questions...</span>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4 order-1 md:order-2"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-quiz-purple/10">
                <Brain className="w-5 h-5 text-quiz-purple" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                AI-Powered Quiz Generation
              </h2>
              <p className="text-muted-foreground">
                Intelligent AI analyzes your content and creates meaningful questions that test understanding.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-purple flex-shrink-0" />
                  Multiple choice, true/false, short answer
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-purple flex-shrink-0" />
                  Adjustable difficulty levels
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-purple flex-shrink-0" />
                  Smart question variety
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: Results & Feedback */}
      <section className="py-20 sm:py-28 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-quiz-orange/10">
                <BarChart3 className="w-5 h-5 text-quiz-orange" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Instant Results & Insights
              </h2>
              <p className="text-muted-foreground">
                Immediate feedback on every answer with detailed explanations to help you learn.
              </p>
              <ul className="space-y-2 pt-2">
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-orange flex-shrink-0" />
                  Detailed explanations for each question
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-orange flex-shrink-0" />
                  Score tracking and visualization
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-quiz-orange flex-shrink-0" />
                  Study mode for focused review
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="text-center py-4 mb-4">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                          className="text-green-500"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          whileInView={{ strokeDashoffset: 251.2 * 0.15 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">85%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Great job! Above average.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm p-2.5 rounded-lg bg-green-500/10">
                      <span className="text-foreground">Correct</span>
                      <span className="font-medium text-green-600">17/20</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm p-2.5 rounded-lg bg-red-500/10">
                      <span className="text-foreground">Needs review</span>
                      <span className="font-medium text-red-600">3/20</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-lg mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              Ready to ace your next exam?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join students studying smarter with AI-powered quizzes.
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
                variant="ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="w-full sm:w-auto"
                data-testid="button-cta-try-now"
              >
                Back to top
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
