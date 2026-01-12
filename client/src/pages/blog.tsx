import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User, Calendar } from "lucide-react";
import { Link } from "wouter";

// Import stock images
import educationTechImg from "@assets/stock_images/education_technology_2b7a5460.jpg";
import aiRobotImg from "@assets/stock_images/artificial_intellige_de833e12.jpg";
import organizedDeskImg from "@assets/stock_images/organized_student_de_5cb006a3.jpg";

const blogPosts = [
  {
    id: 1,
    title: "The Best Quizlet Alternatives for 2026",
    excerpt: "With changes to study tools, students are looking for better ways to learn. Here is why QuizAI is leading the pack.",
    image: educationTechImg,
    date: "Jan 10, 2026",
    author: "Alex Rivers",
    readTime: "5 min read",
    category: "EdTech"
  },
  {
    id: 2,
    title: "How to Convert Raw Notes into Interactive Study Materials",
    excerpt: "Learn the secrets of using AI to transform your messy lecture notes into structured, interactive quizzes in seconds.",
    image: aiRobotImg,
    date: "Jan 08, 2026",
    author: "Dr. Sarah Chen",
    readTime: "8 min read",
    category: "Study Tips"
  },
  {
    id: 3,
    title: "Organizing Your Digital Study Space for Maximum Focus",
    excerpt: "A clean digital environment leads to a clear mind. Discover the top tools and habits for digital organization.",
    image: organizedDeskImg,
    date: "Jan 05, 2026",
    author: "Jordan Smith",
    readTime: "4 min read",
    category: "Productivity"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-primary border-primary/30">
              Our Blog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Insights for Modern Learners
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tips, tricks, and deep dives into the world of AI-powered education and effective studying.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col overflow-hidden hover-elevate transition-all border-border/50">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="flex-1">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-snug line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 mt-auto border-t p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{post.author}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary p-0 h-auto">
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card className="bg-primary text-primary-foreground overflow-hidden relative border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <CardContent className="p-8 md:p-12 text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
              Get the latest study tips and AI updates delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 flex-1"
              />
              <Button variant="secondary" className="font-semibold">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
