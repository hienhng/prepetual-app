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
  
  // Basic markdown-like formatting for bold/italic if not handled by KaTeX
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
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
