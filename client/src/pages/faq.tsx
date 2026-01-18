import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, HelpCircle, BookOpen, Lock, FileText, Brain, Share2, BarChart3, Globe, Edit3, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    id: "item-1",
    question: "Quiz Creation — What is the difference between Import and Generate?",
    answer: "Import parses exam papers to identify answers using AI knowledge, while Generate creates entirely new questions based on the content of your study materials.",
    icon: BookOpen
  },
  {
    id: "item-2",
    question: "Why can't I see explanations?",
    answer: "Detailed explanations are a premium feature. Guests can take quizzes to test their knowledge, but full explanations are only available to registered users. Sign up for free to unlock them!",
    icon: Lock
  },
  {
    id: "item-3",
    question: "What file types work?",
    answer: "We support PDF documents and various image formats (PNG, JPG). Our advanced OCR technology handles scanned documents and photos of physical notes with high precision.",
    icon: FileText
  },
  {
    id: "item-4",
    question: "Study Mode - How does it work?",
    answer: "Study Mode uses a flashcard-style system. 'Known' indicates you've mastered the concept, while 'Learning' marks it for further review. The AI uses these signals to help you focus on your weak areas.",
    icon: Brain
  },
  {
    id: "item-5",
    question: "Quiz sharing - What can people see?",
    answer: "When you share a quiz, others can see the questions and take the quiz. However, your personal results and history remain private to your account.",
    icon: Share2
  },
  {
    id: "item-6",
    question: "Difficulty levels - What makes a quiz \"easy\" vs \"hard\"?",
    answer: "Difficulty levels adjust the complexity of questions and the depth of understanding required. 'Easy' focuses on core facts, while 'Hard' challenges you with conceptual and analytical questions.",
    icon: BarChart3
  },
  {
    id: "item-7",
    question: "Global support - Which languages are supported?",
    answer: "Our AI auto-detects the language of your source material and generates questions in that same language. We support numerous languages worldwide for a truly global learning experience.",
    icon: Globe
  },
  {
    id: "item-8",
    question: "Editing quizzes - Can I change the questions?",
    answer: "Yes! You can modify any AI-generated question, add your own, or remove questions before you start taking the quiz or sharing it.",
    icon: Edit3
  },
  {
    id: "item-9",
    question: "Pip AI Assistant - How can it help me?",
    answer: "Pip is your personal study companion available during any quiz. Pip can explain complex concepts, provide hints, and even render mathematical formulas. Pip's goal is to help you learn, so it will guide you toward the answer without simply giving it away.",
    icon: MessageCircle
  }
];

export default function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/">
            <Button variant="ghost" className="mb-8 group" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
            >
              <HelpCircle className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Prepetual and how to make the most of your study sessions.
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={faq.id}
                    className="border rounded-xl px-4 md:px-6 bg-background/50 transition-all hover:border-primary/50 data-[state=open]:border-primary/50 data-[state=open]:bg-primary/[0.02]"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <faq.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-lg">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 pt-2">
                      <div className="pl-12">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Contact Support
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
