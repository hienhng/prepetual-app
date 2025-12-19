import { motion } from "framer-motion";
import { ArrowLeft, Zap, BookOpen, Brain, Share2, BarChart3, Globe, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

const featureIcons = [
  { icon: BookOpen, label: "Multiple Question Types" },
  { icon: BarChart3, label: "Difficulty Levels" },
  { icon: Brain, label: "Study Mode" },
  { icon: Share2, label: "Shareable Quizzes" },
  { icon: BarChart3, label: "Progress Tracking" },
  { icon: Globe, label: "Multi-Language Support" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Hero Section */}
          <motion.div
            className="mb-12"
            variants={itemVariants}
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                About
                <span className="ml-3 text-4xl md:text-5xl font-brand text-foreground">
                  Prepetual
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Transforming how students learn with AI-powered personalized quizzes. Study smarter, not harder.
              </p>
            </div>
          </motion.div>

          {/* Mission Section with Card */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Prepetual is dedicated to transforming the way students learn and prepare for exams. We believe that effective studying should be accessible, engaging, and personalized.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI-powered platform turns your study materials into interactive quizzes, helping you master any subject faster and more efficiently.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works - Step by Step */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">How It Works</h2>
            <div className="space-y-3">
              {[
                { step: 1, text: "Upload your study materials - PDFs, images, or lecture notes" },
                { step: 2, text: "Our AI extracts text and analyzes the content" },
                { step: 3, text: "Customized quiz questions are generated instantly" },
                { step: 4, text: "Take the quiz and receive detailed explanations" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  variants={itemVariants}
                  className="flex gap-4 items-start"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                    <span className="font-semibold text-primary text-sm">{item.step}</span>
                  </div>
                  <div className="pt-1">
                    <p className="text-foreground font-medium">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">Powerful Features</h2>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { icon: BookOpen, title: "Multiple Question Types", desc: "Multiple choice, true/false, short answer" },
                { icon: BarChart3, title: "Difficulty Levels", desc: "Easy, medium, and hard customization" },
                { icon: Brain, title: "Study Mode", desc: "Flashcard-style learning experience" },
                { icon: Share2, title: "Shareable Quizzes", desc: "Collaborate with friends and classmates" },
                { icon: BarChart3, title: "Progress Tracking", desc: "Monitor your quiz history and results" },
                { icon: Globe, title: "Multi-Language", desc: "Vietnamese and English support" },
              ].map(({ icon: Icon, title, desc }, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                >
                  <Card className="h-full hover-elevate">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Technology Section */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Our Technology
                </CardTitle>
                <CardDescription>Powered by cutting-edge AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Prepetual leverages advanced artificial intelligence to understand your study materials and generate relevant, challenging questions. Our platform intelligently processes various document formats and languages.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Advanced OCR technology for text extraction",
                    "AI-powered content analysis",
                    "Intelligent question generation",
                    "Multi-language support",
                    "Personalized learning paths",
                    "Real-time progress analytics",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            className="mb-12 bg-primary/5 rounded-lg p-8 md:p-12 text-center border"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
              Ready to Revolutionize Your Study Routine?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start studying smarter today. Create a free account and experience the power of AI-assisted personalized learning.
            </p>
            <Link href="/">
              <Button size="lg" data-testid="button-start-studying">
                Get Started Now
              </Button>
            </Link>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-8"
          >
            {[
              { number: "100%", label: "Free to Use" },
              { number: "10+", label: "Languages" },
              { number: "∞", label: "Quizzes" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
