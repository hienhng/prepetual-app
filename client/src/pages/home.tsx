import { useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, BookOpen, Brain, Zap, ArrowRight, FileStack } from "lucide-react";
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
  const { openAuthDialog } = useAuthDialog();

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
      openAuthDialog("login");
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
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-quiz-purple/5 to-background pb-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quiz-purple/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 pt-16 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 shadow-lg">
              <Sparkles className="h-4 w-4" />
              AI-Powered Study Assistant
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Prepare better for exams with quizzes made from
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-quiz-purple">  your notes </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
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
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                onClick={handleContinueToGenerate}
                className="gap-2 text-lg py-6 px-8 hover:shadow- hover:-translate-y-1 transition-all"
                data-testid="button-continue-generate"
              >
                Continue to Generate Quiz
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to turn your study materials into effective quizzes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Upload Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <Card className="h-full border-0 bg-gradient-to-br from-primary/5 to-background hover-elevate overflow-hidden">
                <CardContent className="p-8 text-center flex flex-col h-full">
                  <div className="mb-6 flex-shrink-0">
                    <svg className="w-32 h-32 mx-auto" viewBox="0 0 160 160" fill="none">
                      <rect x="30" y="20" width="100" height="120" rx="8" stroke="currentColor" strokeWidth="2" className="text-primary" />
                      <path d="M80 50L80 110" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" />
                      <path d="M60 90L100 90" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" />
                      <motion.circle
                        cx="80"
                        cy="70"
                        r="12"
                        className="text-quiz-purple"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Upload Documents
                  </h3>
                  <p className="text-muted-foreground text-sm flex-grow">
                    Support for PDFs and images with automatic text extraction
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-primary font-semibold">
                    <span className="text-2xl">1</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI-Powered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-0 bg-gradient-to-br from-quiz-purple/5 to-background hover-elevate overflow-hidden">
                <CardContent className="p-8 text-center flex flex-col h-full">
                  <div className="mb-6 flex-shrink-0">
                    <svg className="w-32 h-32 mx-auto" viewBox="0 0 160 160" fill="none">
                      <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="2" className="text-quiz-purple" />
                      <circle cx="80" cy="80" r="35" stroke="currentColor" strokeWidth="2" className="text-quiz-purple" opacity="0.5" />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-quiz-purple"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <circle cx="80" cy="80" r="8" fill="currentColor" className="text-quiz-purple" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    AI-Powered
                  </h3>
                  <p className="text-muted-foreground text-sm flex-grow">
                    Smart quiz generation with multiple question types
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-quiz-purple font-semibold">
                    <span className="text-2xl">2</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Instant Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-0 bg-gradient-to-br from-quiz-orange/5 to-background hover-elevate overflow-hidden">
                <CardContent className="p-8 text-center flex flex-col h-full">
                  <div className="mb-6 flex-shrink-0">
                    <svg className="w-32 h-32 mx-auto" viewBox="0 0 160 160" fill="none">
                      <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="2" className="text-quiz-orange" />
                      <motion.path
                        d="M55 80 L72 95 L110 55"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-quiz-orange"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                        viewport={{ once: false }}
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-quiz-orange"
                        initial={{ opacity: 1, r: 50 }}
                        animate={{ opacity: 0, r: 70 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Instant Results
                  </h3>
                  <p className="text-muted-foreground text-sm flex-grow">
                    Get detailed feedback and explanations for each answer
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-quiz-orange font-semibold">
                    <span className="text-2xl">3</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to ace your next exam? 
            </h2>
            <p className="text-muted-foreground mb-8">
              Upload your materials or preps and experience the power of AI-generated quizzes.
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
