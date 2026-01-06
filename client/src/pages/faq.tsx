import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, HelpCircle, BookOpen, Lock, FileText, Brain, Share2, BarChart3, Globe, Edit3 } from "lucide-react";
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
  }
];

export default function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/help">
            <Button variant="ghost" className="mb-8 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Help Center
            </Button>
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-black mb-4 tracking-tight">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Prepetual.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="border rounded-2xl px-6 bg-card hover:border-primary/20 transition-all data-[state=open]:border-primary/30 shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <faq.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-lg">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 pt-0">
                  <div className="pl-12">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center border-t pt-16">
            <p className="text-muted-foreground mb-6">Still have questions?</p>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8 font-bold">
                Contact Support
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
