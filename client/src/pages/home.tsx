import { useLocation } from "wouter";
import { Sparkles, BookOpen, Brain, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated } = useAuth();

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    if (isAuthenticated) {
      setLocation("/generate");
    } else {
      window.location.href = "/api/login";
    }
  };

  const features = [
    {
      icon: BookOpen,
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Study Assistant
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform Your Study Materials Into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-quiz-purple"> Interactive Quizzes</span>
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
                className="gap-2 text-lg py-6 px-8"
                data-testid="button-continue-generate"
              >
                Continue to Generate Quiz
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to turn your study materials into effective quizzes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center p-6 hover:bg-muted/30 transition-colors">
                  <CardContent className="p-0">
                    <div className={`
                      w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center
                      ${index === 0 ? "bg-primary/10" : index === 1 ? "bg-quiz-purple/10" : "bg-quiz-orange/10"}
                    `}>
                      <feature.icon className={`
                        h-7 w-7
                        ${index === 0 ? "text-primary" : index === 1 ? "text-quiz-purple" : "text-quiz-orange"}
                      `} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
              Ready to Study Smarter?
            </h2>
            <p className="text-muted-foreground mb-8">
              Upload your first document and experience the power of AI-generated quizzes.
            </p>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="gap-2"
              data-testid="button-get-started"
            >
              <Sparkles className="h-5 w-5" />
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
