import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-black mb-4 tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 19, 2025</p>
          </div>

          <div className="space-y-12 pb-12">
            {[
              { title: "1. Introduction", content: "Prepetual is committed to protecting your privacy. This policy explains how we collect and safeguard your information." },
              { title: "2. Information We Collect", content: "We collect account info (email, name), uploaded documents for processing, and usage data to improve your experience." },
              { title: "3. Document Processing", content: "Your documents are processed securely and only accessible to you. We don't share your content with unauthorized third parties." },
              { title: "4. Data Security", content: "We implement industry-standard security measures, including encryption and secure authentication, to protect your data." },
              { title: "5. Your Rights", content: "You have the right to access, download, correct, or delete your data at any time through your account settings." }
            ].map((section, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold mb-4 text-foreground">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
