import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contact() {
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
            <h1 className="text-4xl font-black mb-4 tracking-tight">Contact Us</h1>
            <p className="text-xl text-muted-foreground">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-primary/10 shadow-sm hover:border-primary/30 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold">Email Support</CardTitle>
                <CardDescription>General inquiries & support</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:giahienhn@gmail.com" className="text-primary font-bold hover:underline">
                  giahienhn@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm hover:border-primary/30 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold">Feedback</CardTitle>
                <CardDescription>Help us improve Prepetual</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:giahienhn@gmail.com" className="text-primary font-bold hover:underline">
                  giahienhn@gmail.com
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 rounded-3xl bg-muted border border-border/50">
            <h2 className="text-xl font-bold mb-4">Response Time</h2>
            <p className="text-muted-foreground leading-relaxed">
              We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, please include "URGENT" in your email subject line.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
