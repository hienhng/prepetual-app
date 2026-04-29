const katex = require('katex');

function renderMathInText(text) {
  if (!text) return "";
  let result = text;
  
  // Handle display mode blocks: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { 
        displayMode: true, 
        throwOnError: false,
        trust: true
      });
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      return `\\(${math}\\)`;
    }
  });
  
  return result;
}

const testCases = [
  "What is $x^2$?",
  "Solve \\( y = mx + b \\).",
  "Calculate: $$ \\sum_{i=1}^n i $$",
  "The formula is \\[ E = mc^2 \\].",
  "No math here.",
  "What is $x^2$ and $y^3$?"
];

testCases.forEach(tc => {
  console.log(`Input: ${tc}`);
  console.log(`Output: ${renderMathInText(tc)}`);
  console.log('---');
});
