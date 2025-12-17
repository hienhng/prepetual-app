import { useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, BookOpen, Brain, Zap, ArrowRight, FileStack, CheckCircle2, Upload, FileText, BarChart3, Image } from "lucide-react";
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
  const { isAuthenticated } = useAuth();
  const { openLoginDialog } = useAuthDialog();

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

  const features = [
    {
      icon: FileStack,
      title: "Upload Documents",
      description: "Support for PDFs and images with automatic text extraction",
    },
    {
      icon: Brain,
      title: "AI-Powered",
      description: "Smart quiz generation with multiple question types",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get detailed feedback and explanations for each answer",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-quiz-purple/5 to-background pb-10 sm:pb-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-quiz-purple/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6 pt-10 sm:pt-16 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-quiz-purple/15 text-primary border border-primary/30 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-sm hover:from-primary/25 hover:to-quiz-purple/25 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10" />
              <span className="relative z-10">AI-Powered Study Assistant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2 sm:px-0">
              Prepare better for exams with quizzes made from
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-quiz-purple">  your notes </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0">
              Upload any document or image, and let AI create personalized study quizzes. 
              Perfect for exam prep, revision, and active learning.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FileUpload onTextExtracted={handleTextExtracted} />
          </motion.div>

          {extractedText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mt-6 sm:mt-8 px-4 sm:px-0"
            >
              <Button
                size="lg"
                onClick={handleContinueToGenerate}
                className="gap-2 text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8 w-full sm:w-auto hover:shadow- hover:-translate-y-1 transition-all"
                data-testid="button-continue-generate"
              >
                Continue to Generate Quiz
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Feature Section 1: Upload & Extract */}
      <section className="py-12 sm:py-20 md:py-28 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Effortless Document Upload
              </h2>
              <p className="text-lg text-muted-foreground">
                Simply drag and drop your study materials. Our smart extraction handles PDFs, images, and scanned documents with precision.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">PDF documents with multi-page support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Images with OCR text extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Vietnamese and English language support</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center bg-primary/5">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
                      </motion.div>
                      <p className="text-xs text-muted-foreground">Drop your files here</p>
                    </div>
                        <div className="flex flex-col items-center space-y-1.5">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 w-full">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-xs text-foreground flex-1 truncate">biology_notes.pdf</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <Card className="bg-primary hover-elevate w-fit rounded-lg h-fit">
                        <CardContent className="p-3 flex items-center justify-center gap-2 text-xs text-primary-foreground font-medium">
                          Continue
                          <ArrowRight className="w-3 h-3" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: AI Generation */}
      <section className="py-12 sm:py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="order-2 md:order-1"
            >
              <Card className="border shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border bg-background">
                        <p className="text-xs text-muted-foreground mb-1">Multiple Choice</p>
                        <p className="text-sm font-medium text-foreground mb-2">What is the primary function of mitochondria?</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50 text-xs">
                            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                            <span>Protein synthesis</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded bg-primary/10 border border-primary/30 text-xs">
                            <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                
                            </div>
                            <span className="text-primary font-medium">Energy production</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50 text-xs">
                            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                            <span>Cell division</span>
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        className="flex items-center gap-2 text-xs text-quiz-purple"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Brain className="w-3 h-3" />
                        <span>Generating more questions...</span>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5 order-1 md:order-2"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-quiz-purple/10">
                <Brain className="w-5 h-5 text-quiz-purple" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                AI-Powered Quiz Generation
              </h2>
              <p className="text-lg text-muted-foreground">
                Our intelligent AI analyzes your content and creates meaningful questions that test understanding, not just memorization.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-purple mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Multiple choice, true/false, and short answer</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-purple mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Adjustable difficulty levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-purple mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Smart question variety for comprehensive coverage</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: Results & Feedback */}
      <section className="py-12 sm:py-20 md:py-28 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-quiz-orange/10">
                <BarChart3 className="w-5 h-5 text-quiz-orange" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Instant Results & Insights
              </h2>
              <p className="text-lg text-muted-foreground">
                Get immediate feedback on every answer with detailed explanations that help you understand the material, not just memorize answers.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-orange mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Detailed explanations for each question</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-orange mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Score tracking and progress visualization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-quiz-orange mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">Study mode for focused review sessions</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="text-center py-3">
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className="text-green-500"
                            strokeDasharray="251.2"
                            initial={{ strokeDashoffset: 251.2 }}
                            whileInView={{ strokeDashoffset: 251.2 * 0.15 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-foreground">85%</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Great job! You scored above average.</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs p-1.5 rounded bg-green-500/10">
                        <span className="text-foreground">Correct answers</span>
                        <span className="font-medium text-green-600">17/20</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-1.5 rounded bg-red-500/10">
                        <span className="text-foreground">Needs review</span>
                        <span className="font-medium text-red-600">3/20</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Ready to ace your next exam? 
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Upload your materials or preps and experience the power of AI-generated quizzes.
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full sm:w-auto"
              data-testid="button-get-started"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
