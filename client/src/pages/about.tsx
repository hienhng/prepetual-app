import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Zap, BookOpen, Brain, Share2, BarChart3, Globe, Check, Sparkles, Upload, FileSearch, ClipboardList, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRef, useEffect } from "react";

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const pulseAnimation = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function About() {
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

          <section className="mb-16">
            <h1 className="text-4xl font-black mb-6 tracking-tight">About Prepetual</h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              We're on a mission to transform how students learn by leveraging the power of AI to create personalized, interactive study experiences.
            </p>
            
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Zap className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h2 className="text-xl font-bold mb-2">Our Vision</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Effective studying should be accessible to everyone. Prepetual turns your static study materials into dynamic learning tools, helping you master any subject faster and with more confidence.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">How It Works</h2>
            <div className="grid gap-6">
              {[
                { icon: Upload, title: "Upload", desc: "Drop your PDFs, images, or notes." },
                { icon: Brain, title: "Analyze", desc: "Our AI extracts and understands your content." },
                { icon: ClipboardList, title: "Generate", desc: "Custom quizzes created instantly." },
                { icon: Trophy, title: "Master", desc: "Learn with detailed feedback and explanations." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16 border-t pt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of students studying smarter with Prepetual.</p>
            <Link href="/">
              <Button size="lg" className="rounded-full px-8 font-bold">
                Get Started Free
              </Button>
            </Link>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
