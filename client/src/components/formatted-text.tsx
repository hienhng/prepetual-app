import katex from "katex";
import "katex/dist/katex.min.css";

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
