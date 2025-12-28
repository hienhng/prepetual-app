import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contact() {
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

          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground mb-8">We'd love to hear from you. Get in touch with our team.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>For general inquiries and support</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:giahienhn@gmail.com" 
                  className="text-primary hover:underline"
                  data-testid="link-email-support"
                >
                  giahienhn@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Help us improve Prepetual</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:giahienhn@gmail.com" 
                  className="text-primary hover:underline"
                  data-testid="link-email-feedback"
                >
                  giahienhn@gmail.com
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-1">How do I reset my password?</h3>
                  <p className="text-muted-foreground text-sm">
                    Click on "Forgot password?" on the login screen and enter your email address. We'll send you a link to reset your password.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">What file formats are supported?</h3>
                  <p className="text-muted-foreground text-sm">
                    Prepetual supports PDF documents and common image formats (PNG, JPG, JPEG). Our OCR technology can extract text from both.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Is my data secure?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, we take security seriously. Your uploaded documents are processed securely and your personal information is protected. See our Privacy Policy for more details.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Can I share quizzes with others?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! Each quiz has a shareable link that you can send to friends, classmates, or study groups.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Response Time</h2>
              <p className="text-muted-foreground leading-relaxed">
                We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, please include "URGENT" in your email subject line.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
