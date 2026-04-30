import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User, Calendar } from "lucide-react";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { useLanguage } from "@/lib/language-context";

export default function Blog() {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ui = language === "vi"
    ? {
        badge: "Blog của chúng tôi",
        title: "Góc nhìn cho người học hiện đại",
        subtitle: "Mẹo học tập, phân tích chuyên sâu và các cập nhật về giáo dục ứng dụng AI.",
        readMore: "Đọc thêm",
        subscribeTitle: "Đăng ký nhận bản tin",
        subscribeDescription: "Nhận các mẹo học tập mới nhất và cập nhật AI được gửi thẳng tới hộp thư của bạn.",
        placeholder: "Nhập email của bạn",
        subscribe: "Đăng ký",
      }
    : {
        badge: "Our Blog",
        title: "Insights for Modern Learners",
        subtitle: "Tips, tricks, and deep dives into the world of AI-powered education and effective studying.",
        readMore: "Read More",
        subscribeTitle: "Subscribe to Our Newsletter",
        subscribeDescription: "Get the latest study tips and AI updates delivered straight to your inbox.",
        placeholder: "Enter your email",
        subscribe: "Subscribe",
      };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-16 text-center md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 border-primary/30 px-4 py-1.5 text-primary">
              {ui.badge}
            </Badge>
            <h1 className="mb-6 text-4xl font-bold text-foreground md:text-6xl">{ui.title}</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{ui.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="flex h-full flex-col overflow-hidden border-border/50 transition-all hover-elevate">
                <Link href={`/blog/${post.id}`} className="block">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute left-4 top-4">
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">{post.category}</Badge>
                    </div>
                  </div>
                </Link>
                <CardHeader className="flex-1">
                  <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <Link href={`/blog/${post.id}`}>
                    <CardTitle className="line-clamp-2 cursor-pointer text-xl leading-snug transition-colors hover:text-primary">{post.title}</CardTitle>
                  </Link>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                </CardContent>
                <CardFooter className="mt-auto flex items-center justify-between border-t p-4 pt-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{post.author}</span>
                  </div>
                  <Link href={`/blog/${post.id}`}>
                    <Button variant="ghost" size="sm" className="h-auto gap-2 p-0 text-primary hover:text-primary" data-testid={`button-read-more-${post.id}`}>
                      {ui.readMore}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardContent className="relative z-10 p-8 text-center md:p-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">{ui.subscribeTitle}</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">{ui.subscribeDescription}</p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row">
              <input type="email" placeholder={ui.placeholder} className="flex-1 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30" />
              <Button variant="secondary" className="font-semibold">
                {ui.subscribe}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
