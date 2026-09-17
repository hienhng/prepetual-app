import katex from "katex";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

function renderMathInText(text: string): string {
  if (!text) return "";
  let result = text;
  
  // Pre-process common unicode math characters that often break or show as "?"
  // Superscripts
  result = result.replace(/²/g, '^2');
  result = result.replace(/³/g, '^3');
  result = result.replace(/¹/g, '^1');
  result = result.replace(/⁰/g, '^0');
  result = result.replace(/⁴/g, '^4');
  result = result.replace(/⁵/g, '^5');
  result = result.replace(/⁶/g, '^6');
  result = result.replace(/⁷/g, '^7');
  result = result.replace(/⁸/g, '^8');
  result = result.replace(/⁹/g, '^9');
  
  // Math operators
  result = result.replace(/−/g, '-'); // Unicode minus
  result = result.replace(/×/g, '×'); // Multiplier
  result = result.replace(/÷/g, '÷'); // Division
  
  // Handle display mode blocks: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { 
        displayMode: true, 
        throwOnError: false,
        trust: true
      });
    } catch {
      return `$$${math}$$`;
    }
  });
  
  // Handle inline math: $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { 
        displayMode: false, 
        throwOnError: false,
        trust: true
      });
    } catch {
      return `$${math}$`;
    }
  });
  
  // Handle display mode blocks: \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { 
        displayMode: true, 
        throwOnError: false,
        trust: true
      });
    } catch {
      return `\\[${math}\\]`;
    }
  });
  
  // Handle inline math: \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { 
        displayMode: false, 
        throwOnError: false,
        trust: true
      });
    } catch {
      return `\\(${math}\\)`;
    }
  });
  
  // Markdown headings — must run before \n→<br> so the whole line is captured
  result = result.replace(/^### (.+)$/gm, '<h3 style="font-size:0.95em;font-weight:700;margin:0.75em 0 0.25em">$1</h3>');
  result = result.replace(/^## (.+)$/gm,  '<h2 style="font-size:1.05em;font-weight:700;margin:0.85em 0 0.3em">$1</h2>');
  result = result.replace(/^# (.+)$/gm,   '<h1 style="font-size:1.15em;font-weight:700;margin:1em 0 0.4em">$1</h1>');

  // Horizontal rule
  result = result.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid currentColor;opacity:0.2;margin:0.75em 0">');

  // Basic markdown-like formatting for bold/italic
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code style="font-family:monospace;font-size:0.875em;background:rgba(128,128,128,0.15);padding:0.1em 0.35em;border-radius:4px">$1</code>');

  // Preserve line breaks — convert \n to <br> so multi-line AI responses aren't collapsed
  result = result.replace(/\n/g, '<br>');
  
  return result;
}

export function MathText({ content, className }: { content: string; className?: string }) {
  if (!content) return null;
  const html = renderMathInText(content);
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

/**
 * Renders generated long-form content as safe Markdown while retaining the
 * KaTeX support used elsewhere in the app. ReactMarkdown creates React nodes
 * instead of injecting the generated text as HTML.
 */
export function MarkdownText({ content, className }: { content: string; className?: string }) {
  if (!content) return null;

  return (
    <div className={cn("lecture-markdown text-base leading-7 text-foreground/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-bold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-bold first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="my-4 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary/40 bg-primary/5 py-2 pl-4 pr-3 italic">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              href={href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
          code: ({ children, className: codeClassName, ...props }) => {
            const isBlock = codeClassName?.startsWith("language-");
            return isBlock ? (
              <code className={cn("font-mono text-sm", codeClassName)} {...props}>{children}</code>
            ) : (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...props}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/70 p-4 text-sm leading-6">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-6 border-border" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
