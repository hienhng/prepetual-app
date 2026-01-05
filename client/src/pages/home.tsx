import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Sparkles, Brain, ArrowRight, CheckCircle2, Upload, FileText, BarChart3, LoaderCircle, CircleFadingPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-20 overflow-hidden">
        {/* Clean grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="container relative mx-auto px-4 sm:px-6">
          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-Powered Study Assistant</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Turn your notes into{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-quiz-purple">practice quizzes</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 mb-8">
                Upload any study material and let AI create personalized quizzes in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
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

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>PDF & Images</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Upload card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-quiz-purple/10 to-primary/10 rounded-3xl blur-2xl opacity-60" />
              <Card className="relative shadow-xl border-primary/10">
                <CardContent className="p-6">
                  <FileUpload onTextExtracted={handleTextExtracted} />
                  
                  {extractedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Button
                        size="lg"
                        onClick={handleContinueToGenerate}
                        className="w-full gap-2"
                        data-testid="button-continue-generate"
                      >
                        Continue to Generate Quiz
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
                  Global language support
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="shadow-lg border-primary/20 overflow-visible relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-xl blur-sm -z-10" />
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-primary/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                    <motion.div
                      animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">Drop your files here</p>
                  </div>
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                      initial={{ x: -10, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm text-foreground flex-1 truncate font-medium">biology_notes.pdf</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </motion.div>
                    </motion.div>
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90">
                      Continue <ArrowRight className="w-4 h-4" />
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
              whileHover={{ y: -4 }}
              className="order-2 md:order-1"
            >
              <Card className="shadow-lg border-quiz-purple/20 overflow-visible relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-quiz-purple/20 via-transparent to-quiz-purple/10 rounded-xl blur-sm -z-10" />
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-quiz-purple/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="p-4 rounded-xl border border-quiz-purple/20 bg-gradient-to-br from-quiz-purple/5 to-transparent mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-quiz-purple bg-quiz-purple/10 px-2 py-0.5 rounded-full">Multiple Choice</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-4">What is the primary function of mitochondria?</p>
                    <div className="space-y-2">
                      <motion.div 
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 text-sm cursor-pointer"
                        whileHover={{ x: 2 }}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                        <span>Protein synthesis</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-quiz-purple/15 border-2 border-quiz-purple/40 text-sm"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.01, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-quiz-purple bg-quiz-purple flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <span className="text-quiz-purple font-semibold">Energy production</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 text-sm cursor-pointer"
                        whileHover={{ x: 2 }}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                        <span>Cell division</span>
                      </motion.div>
                    </div>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-quiz-purple font-medium"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <CircleFadingPlus className="w-4 h-4" />
                    </motion.div>
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
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground ">
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
              whileHover={{ y: -4 }}
            >
              <Card className="shadow-lg border-quiz-orange/20 overflow-visible relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-quiz-orange/20 via-transparent to-green-500/10 rounded-xl blur-sm -z-10" />
                <CardContent className="p-6">
                  <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-quiz-orange/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="text-center py-6 mb-4 bg-gradient-to-br from-green-500/5 to-quiz-orange/5 rounded-xl">
                    <div className="relative w-28 h-28 mx-auto mb-4">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          whileInView={{ strokeDashoffset: 251.2 * 0.15 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--quiz-orange))" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span 
                          className="text-3xl font-bold text-foreground"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5, type: "spring" }}
                        >
                          85%
                        </motion.span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground">Great job! Above average.</p>
                  </div>
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center justify-between gap-4 text-sm p-3 rounded-xl bg-green-500/15 border border-green-500/30"
                      initial={{ x: -10, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-foreground font-medium">Correct</span>
                      </div>
                      <span className="font-bold text-green-600">17/20</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center justify-between gap-4 text-sm p-3 rounded-xl bg-quiz-orange/15 border border-quiz-orange/30"
                      initial={{ x: -10, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-quiz-orange" />
                        <span className="text-foreground font-medium">Needs review</span>
                      </div>
                      <span className="font-bold text-quiz-orange">3/20</span>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {/* <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Prepetual and how it helps you study.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {[
              {
                q: "What file types can I upload?",
                a: "You can upload PDF documents and common image formats (JPEG, PNG). Our AI handles both text-based PDFs and scanned images using advanced OCR technology."
              },
              {
                q: "Does it support languages other than English?",
                a: "Yes! Prepetual automatically detects the language of your material. It has specialized support for Vietnamese and many other global languages."
              },
              {
                q: "Can I edit the quizzes after they are generated?",
                a: "Absolutely. You can modify questions, answers, and explanations before taking the quiz to ensure it matches your specific study needs."
              },
              {
                q: "Is there a limit to how many quizzes I can create?",
                a: "Free accounts can create multiple quizzes. For intensive users, we offer persistent history so you can retake and review your materials anytime."
              }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2 flex gap-2">
                      <span className="text-primary font-bold">Q:</span>
                      {faq.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/faq">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                View All FAQs
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions about Prepetual.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "\"Import Existing Quiz\" vs \"Generate New Quiz\" - What's the difference?",
                  a: "Import parses exam papers to identify answers using AI knowledge, while Generate creates entirely new questions based on the content of your study materials."
                },
                {
                  q: "Why can't I see explanations?",
                  a: "Detailed explanations are a premium feature. Guests can take quizzes, but full explanations are only available to registered users. Sign up for free to unlock them!"
                },
                {
                  q: "Which file formats are supported?",
                  a: "We support PDF documents and various image formats (PNG, JPG). Our advanced OCR technology handles scanned documents and photos of physical notes with high precision."
                },
                {
                  q: "Study Mode - How does it work?",
                  a: "Study Mode uses a flashcard-style system. 'Known' indicates you've mastered the concept, while 'Learning' marks it for further review. The AI uses these signals to help you focus on your weak areas."
                }
              ].map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="border rounded-xl px-6 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 data-[state=open]:border-primary/50"
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <span className="font-semibold text-lg text-left">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="text-center">
            <Link href="/faq">
              <Button variant="outline" size="lg" className="gap-2 px-8 rounded-full">
                View All FAQs
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-20"
            >
              {/* <Link href="/faq">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline" data-testid="link-faq">
                  Frequently Asked Questions
                </Button>
              </Link> */}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
