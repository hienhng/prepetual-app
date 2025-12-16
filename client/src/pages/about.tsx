import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

          <h1 className="text-3xl font-bold text-foreground mb-6">About 
          <span className="ml-2 text-3xl font-brand text-foreground mb-6">
             Prepetual
          </span>
          
          </h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Prepetual is dedicated to transforming the way students learn and prepare for exams. We believe that effective studying should be accessible, engaging, and personalized. Our AI-powered platform turns your study materials into interactive quizzes, helping you master any subject faster and more efficiently.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Simply upload your study materials - whether it's a PDF document, lecture notes, or even images of textbook pages. Our advanced AI technology will:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Extract text from your documents using OCR technology</li>
                <li>Analyze the content to identify key concepts</li>
                <li>Generate customized quiz questions tailored to your material</li>
                <li>Provide detailed explanations to help you understand</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Features</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Multiple question types: multiple choice, true/false, and short answer</li>
                <li>Adjustable difficulty levels: easy, medium, and hard</li>
                <li>Study mode with flashcard-style learning</li>
                <li>Quiz history and progress tracking</li>
                <li>Shareable quizzes with friends and classmates</li>
                <li>Support for Vietnamese and English content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Our Technology</h2>
              <p className="text-muted-foreground leading-relaxed">
                Prepetual leverages cutting-edge artificial intelligence to understand your study materials and generate relevant, challenging questions. Our platform supports multiple languages and can process various document formats, making it a versatile tool for students worldwide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Get Started</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ready to revolutionize your study routine? Create a free account today and experience the power of AI-assisted learning. Upload your first document and let Prepetual help you achieve your academic goals.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
