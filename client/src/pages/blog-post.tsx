import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { getBlogPostById, blogPosts, InlineImage } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from "lucide-react";

function InlineImageComponent({ image }: { image: InlineImage }) {
  return (
    <figure className="my-8">
      <div className="rounded-lg overflow-hidden">
        <img 
          src={image.src} 
          alt={image.alt} 
          className="w-full h-auto object-cover"
        />
      </div>
      {image.caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-3 italic">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const post = getBlogPostById(id || "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-4xl">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="mb-4 text-foreground/80 hover:text-foreground" data-testid="button-back-to-blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
            <Badge className="mb-4">{post.category}</Badge>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold text-foreground mb-4"
            >
              {post.title}
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <article className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <div className="text-lg text-muted-foreground mb-8 font-medium border-l-4 border-primary pl-4">
            {post.excerpt}
          </div>
          {renderContentWithImages(post.content, post.inlineImages || [])}
        </motion.div>
      </article>

      {otherPosts.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherPosts.map((otherPost) => (
                <Link key={otherPost.id} href={`/blog/${otherPost.id}`}>
                  <Card className="h-full overflow-hidden hover-elevate transition-all cursor-pointer">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={otherPost.image}
                        alt={otherPost.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <CardHeader>
                      <Badge variant="outline" className="w-fit mb-2">{otherPost.category}</Badge>
                      <CardTitle className="text-lg line-clamp-2">{otherPost.title}</CardTitle>
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
  const parts: (string | { type: 'image'; index: number })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ type: 'image', index: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

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
      {parts.map((part, idx) => {
        if (typeof part === 'string') {
          return (
            <div 
              key={idx}
              className={contentStyles}
              dangerouslySetInnerHTML={{ __html: formatContent(part) }}
            />
          );
        } else {
          const image = inlineImages[part.index];
          if (image) {
            return <InlineImageComponent key={idx} image={image} />;
          }
          return null;
        }
      })}
    </>
  );
}

function formatContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isUnorderedItem = trimmed.startsWith('- ');
    const isOrderedItem = /^\d+\.\s/.test(trimmed);

    if (isUnorderedItem) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        result.push('<ul>');
        inUnorderedList = true;
      }
      result.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
    } else if (isOrderedItem) {
      if (inUnorderedList) {
        result.push('</ul>');
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        result.push('<ol>');
        inOrderedList = true;
      }
      result.push(`<li>${formatInline(trimmed.replace(/^\d+\.\s/, ''))}</li>`);
    } else {
      if (inUnorderedList) {
        result.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }

      if (trimmed.startsWith('## ')) {
        result.push(`<h2>${trimmed.slice(3)}</h2>`);
      } else if (trimmed.startsWith('### ')) {
        result.push(`<h3>${trimmed.slice(4)}</h3>`);
      } else if (trimmed.startsWith('#### ')) {
        result.push(`<h4>${trimmed.slice(5)}</h4>`);
      } else if (trimmed !== '') {
        result.push(`<p>${formatInline(trimmed)}</p>`);
      }
    }
  }

  if (inUnorderedList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  return result.join('\n');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
