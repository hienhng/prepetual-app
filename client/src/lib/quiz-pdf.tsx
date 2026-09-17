import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Question } from "@shared/schema";
import { paginateQuiz, quizPdfFilename, type PdfBlock } from "./quiz-pdf-layout";
import "katex/dist/katex.min.css";
import "./quiz-pdf.css";

interface QuizPdfInput {
  title: string;
  category: string;
  questions: Question[];
}

const CONTENT_WIDTH = 680;
const MARGIN_MM = 15;
const FOOTER_MM = 8;

function RichText({ text }: { text: string }) {
  // Accept the same LaTeX delimiters as the quiz preview. Raw HTML is never executed.
  const content = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  return <div className="pdf-rich-text"><ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { throwOnError: false, trust: false }]]}
    components={{ img: ({ src, alt }) => <img src={src} alt={alt || "Question image"} crossOrigin="anonymous" /> }}
  >{content}</ReactMarkdown></div>;
}

function QuizDocument({ title, category, questions }: QuizPdfInput) {
  return <>
    <header className="pdf-header">
      <div className="pdf-brand">PREPETUAL / QUIZ</div>
      <h1>{title.trim() || "Quiz"}</h1>
      <p>{category} <span aria-hidden="true"> · </span> {questions.length} questions</p>
    </header>
    {questions.map((question, index) => {
      const options = question.type === "true_false"
        ? (question.options?.length ? question.options : ["True", "False"])
        : question.type === "multiple_choice" ? question.options || [] : [];
      return <section className="pdf-question" key={`${question.id}-${index}`}>
        <div className="pdf-question-label">QUESTION {index + 1} <span>{question.type.replaceAll("_", " ")}</span></div>
        <div className="pdf-prompt"><RichText text={question.question} /></div>
        {question.imageUrl && <img className="pdf-question-image" src={question.imageUrl} crossOrigin="anonymous" alt={`Question ${index + 1} image`} />}
        {options.map((option, optionIndex) => <div className="pdf-option" key={optionIndex}>
          <span className="pdf-option-label">{String.fromCharCode(65 + optionIndex)}.</span>
          <RichText text={option.replace(/^\s*[A-Z][.)]\s+/i, "")} />
        </div>)}
        {question.type === "short_answer" && <div className="pdf-answer-space"><div /><div /><div /></div>}
      </section>;
    })}
  </>;
}

async function waitForImages(container: HTMLElement): Promise<void> {
  await Promise.all(Array.from(container.querySelectorAll("img"), image => new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error); else resolve();
    };
    const timeout = window.setTimeout(() => finish(new Error("A question image timed out. Please retry the PDF download.")), 15000);
    image.onload = () => finish();
    image.onerror = () => finish(new Error("A question image could not be loaded. Check the image and retry the PDF download."));
    if (image.complete) finish(image.naturalWidth ? undefined : new Error("A question image could not be loaded."));
  })));
}

function measureBlocks(container: HTMLElement, pageHeight: number): PdfBlock[] {
  const origin = container.getBoundingClientRect().top;
  const blocks: PdfBlock[] = [];
  const add = (rect: DOMRect, padding = 0) => {
    if (rect.height > 0) blocks.push({ top: Math.max(0, rect.top - origin - padding), bottom: rect.bottom - origin + padding });
  };
  for (const section of container.querySelectorAll<HTMLElement>(".pdf-header, .pdf-question")) {
    const rect = section.getBoundingClientRect();
    if (rect.height <= pageHeight) {
      add(rect);
      continue;
    }
    // Oversized questions split at text lines, never through a formula, image or table row.
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim() || node.parentElement?.closest(".katex")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      Array.from(range.getClientRects()).forEach(line => add(line, 2));
    }
    section.querySelectorAll<HTMLElement>(".katex, img, tr, .pdf-answer-space").forEach(element => add(element.getBoundingClientRect(), 2));
    const label = section.querySelector(".pdf-question-label");
    const prompt = section.querySelector(".pdf-prompt");
    if (label && prompt) {
      blocks.push({ top: rect.top - origin, bottom: prompt.getBoundingClientRect().top - origin + 24 });
    }
  }
  return blocks;
}

/** Render bounded page canvases rather than a single canvas that can exceed browser limits. */
export async function createQuizPdf(input: QuizPdfInput): Promise<jsPDF> {
  const container = document.createElement("div");
  container.className = "quiz-pdf";
  container.setAttribute("aria-hidden", "true");
  container.style.width = `${CONTENT_WIDTH}px`;
  container.innerHTML = renderToStaticMarkup(<QuizDocument {...input} />);
  document.body.appendChild(container);
  try {
    await waitForImages(container);
    // Force layout so KaTeX's locally bundled fonts are requested before awaiting them.
    container.getBoundingClientRect();
    await document.fonts.ready;
    for (const math of container.querySelectorAll<HTMLElement>(".katex-display > .katex")) {
      if (math.scrollWidth > CONTENT_WIDTH) math.style.fontSize = `${CONTENT_WIDTH / math.scrollWidth}em`;
    }
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
    doc.setProperties({ title: input.title.trim() || "Quiz", subject: input.category, creator: "Prepetual" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidthMm = pageWidth - MARGIN_MM * 2;
    const mmPerPixel = contentWidthMm / CONTENT_WIDTH;
    const contentHeight = Math.floor((pageHeight - MARGIN_MM * 2 - FOOTER_MM) / mmPerPixel);
    const pages = paginateQuiz(Math.ceil(container.getBoundingClientRect().height), contentHeight, measureBlocks(container, contentHeight));
    for (const [index, page] of pages.entries()) {
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff", scale: 1.8, useCORS: true, logging: false,
        width: CONTENT_WIDTH, height: page.bottom - page.top, y: page.top,
        windowWidth: 1024, scrollX: 0, scrollY: 0,
      });
      if (index > 0) doc.addPage();
      doc.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", MARGIN_MM, MARGIN_MM,
        contentWidthMm, (page.bottom - page.top) * mmPerPixel, undefined, "FAST");
      canvas.width = canvas.height = 0;
      doc.setDrawColor(220, 225, 232);
      doc.line(MARGIN_MM, pageHeight - 17, pageWidth - MARGIN_MM, pageHeight - 17);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Prepetual", MARGIN_MM, pageHeight - 11);
      doc.text(`${index + 1} / ${pages.length}`, pageWidth - MARGIN_MM, pageHeight - 11, { align: "right" });
    }
    return doc;
  } finally {
    container.remove();
  }
}

export async function downloadQuizPdf(input: QuizPdfInput): Promise<void> {
  const doc = await createQuizPdf(input);
  await doc.save(quizPdfFilename(input.title), { returnPromise: true });
}
