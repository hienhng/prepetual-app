import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { getBlogPostById, blogPosts, InlineImage } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

function InlineImageComponent({ image }: { image: InlineImage }) {
  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-lg">
        <img src={image.src} alt={image.alt} className="h-auto w-full object-cover" />
      </div>
      {image.caption && <figcaption className="mt-3 text-center text-sm italic text-muted-foreground">{image.caption}</figcaption>}
    </figure>
  );
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const post = getBlogPostById(id || "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const ui = language === "vi"
    ? {
        missingTitle: "Không tìm thấy bài viết",
        missingDescription: "Bài viết bạn đang tìm không tồn tại.",
        backToBlog: "Quay lại Blog",
        moreArticles: "Bài viết khác",
      }
    : {
        missingTitle: "Post Not Found",
        missingDescription: "The blog post you're looking for doesn't exist.",
        backToBlog: "Back to Blog",
        moreArticles: "More Articles",
      };

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">{ui.missingTitle}</h1>
          <p className="mb-6 text-muted-foreground">{ui.missingDescription}</p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {ui.backToBlog}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherPosts = blogPosts.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[40vh] overflow-hidden md:h-[50vh]">
        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-4 flex items-center gap-4">
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground" data-testid="button-back-to-blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {ui.backToBlog}
                </Button>
              </Link>
              <Badge>{post.category}</Badge>
            </div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
              {post.title}
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <article className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="prose prose-lg max-w-none dark:prose-invert">
          <div className="mb-8 border-l-4 border-primary pl-4 text-lg font-medium text-muted-foreground">{post.excerpt}</div>
          {renderContentWithImages(post.content, post.inlineImages || [])}
        </motion.div>
      </article>

      {otherPosts.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-foreground">{ui.moreArticles}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {otherPosts.map((otherPost) => (
                <Link key={otherPost.id} href={`/blog/${otherPost.id}`}>
                  <Card className="h-full cursor-pointer overflow-hidden transition-all hover-elevate">
                    <div className="aspect-video overflow-hidden">
                      <img src={otherPost.image} alt={otherPost.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    </div>
                    <CardHeader>
                      <Badge variant="outline" className="mb-2 w-fit">
                        {otherPost.category}
                      </Badge>
                      <CardTitle className="line-clamp-2 text-lg">{otherPost.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{otherPost.date}</span>
                        <span>{otherPost.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function renderContentWithImages(content: string, inlineImages: InlineImage[]) {
  const imagePattern = /\[IMAGE:(\d+)\]/g;
  const parts: (string | { type: "image"; index: number })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    parts.push({ type: "image", index: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) parts.push(content.slice(lastIndex));

  const contentStyles = `[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4
                         [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-8 [&>h3]:mb-3
                         [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-foreground [&>h4]:mt-6 [&>h4]:mb-2
                         [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:text-muted-foreground
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:text-muted-foreground
                         [&>li]:mb-2
                         [&>strong]:text-foreground [&>strong]:font-semibold
                         [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground`;

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return <div key={index} className={contentStyles} dangerouslySetInnerHTML={{ __html: formatContent(part) }} />;
        }

        const image = inlineImages[part.index];
        return image ? <InlineImageComponent key={index} image={image} /> : null;
      })}
    </>
  );
}

function formatContent(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isUnorderedItem = trimmed.startsWith("- ");
    const isOrderedItem = /^\d+\.\s/.test(trimmed);

    if (isUnorderedItem) {
      if (inOrderedList) {
        result.push("</ol>");
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        result.push("<ul>");
        inUnorderedList = true;
      }
      result.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
    } else if (isOrderedItem) {
      if (inUnorderedList) {
        result.push("</ul>");
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        result.push("<ol>");
        inOrderedList = true;
      }
      result.push(`<li>${formatInline(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
    } else {
      if (inUnorderedList) {
        result.push("</ul>");
        inUnorderedList = false;
      }
      if (inOrderedList) {
        result.push("</ol>");
        inOrderedList = false;
      }

      if (trimmed.startsWith("## ")) {
        result.push(`<h2>${trimmed.slice(3)}</h2>`);
      } else if (trimmed.startsWith("### ")) {
        result.push(`<h3>${trimmed.slice(4)}</h3>`);
      } else if (trimmed.startsWith("#### ")) {
        result.push(`<h4>${trimmed.slice(5)}</h4>`);
      } else if (trimmed !== "") {
        result.push(`<p>${formatInline(trimmed)}</p>`);
      }
    }
  }

  if (inUnorderedList) result.push("</ul>");
  if (inOrderedList) result.push("</ol>");

  return result.join("\n");
}

function formatInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
