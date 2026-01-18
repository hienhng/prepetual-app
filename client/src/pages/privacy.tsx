import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, UserCheck, Bell, MessageCircle, Bot } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const sections = [
    {
      id: "1",
      title: "Introduction",
      icon: Globe,
      content: "Prepetual (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered quiz generation service."
    },
    {
      id: "2",
      title: "Information We Collect",
      icon: Database,
      content: (
        <div className="space-y-3">
          <p>We collect information in the following ways:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <li className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span><strong>Account:</strong> Email, name, and password when you register</span>
            </li>
            <li className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span><strong>Content:</strong> Documents, images, and text you upload</span>
            </li>
            <li className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span><strong>Usage:</strong> Performance, study activity, and patterns</span>
            </li>
            <li className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span><strong>Device:</strong> Browser type, IP address, and identifiers</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "3",
      title: "How We Use Your Information",
      icon: Eye,
      content: "We use the information we collect to provide and maintain our service, process your uploaded documents, track your progress, send important updates, improve our AI algorithms, and protect against security threats."
    },
    {
      id: "4",
      title: "Document Processing",
      icon: Lock,
      content: "When you upload documents, they are processed by our AI systems to extract text and generate questions. Your documents are stored securely and are only accessible to you. We do not share your content with third parties except as necessary for AI processing."
    },
    {
      id: "5",
      title: "Pip AI Assistant",
      icon: Bot,
      content: "Our AI study assistant, Pip, uses your quiz content and conversation history within each session to provide helpful explanations and hints. Chat conversations with Pip are not stored permanently and are cleared when you close the quiz. Pip does not have access to your personal account information beyond your current quiz context."
    },
    {
      id: "6",
      title: "Data Retention",
      icon: Shield,
      content: "We retain your account information and quizzes for as long as your account is active. Uploaded documents may be temporarily stored for processing and then deleted. You can request deletion of your data at any time."
    },
    {
      id: "7",
      title: "Security",
      icon: UserCheck,
      content: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits."
    }
  ];

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-16">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8 rounded-full hover:bg-primary/10" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <div className="p-4 bg-primary/10 rounded-3xl mb-6">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              We value your privacy and are committed to protecting your personal data.
            </p>
            <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground">
              Last updated: December 19, 2025
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-16">
            {sections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <Card className="border-primary/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card/50 backdrop-blur">
                  <CardContent className="p-8">
                    <div className="flex gap-6 items-start">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary flex-shrink-0 mt-1">
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">
                          {section.id}. {section.title}
                        </h2>
                        <div className="text-muted-foreground leading-relaxed text-lg">
                          {section.content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="p-12 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <MessageCircle className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4">Questions about your privacy?</h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                Our team is always here to help you understand how we manage your information.
              </p>
              <a href="mailto:giahienhn@gmail.com">
                <Button size="lg" className="rounded-full px-10 font-bold shadow-lg shadow-primary/20">
                  Contact Privacy Team
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
