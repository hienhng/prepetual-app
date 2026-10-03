import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, Home, Menu, Sparkles, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { QuizChatbot } from "@/components/quiz-chatbot";
import AskPipIcon from "@/components/ui/ask-pip-icon";
import { useQuiz } from "@/lib/quiz-context";
import { useLanguage } from "@/lib/language-context";
import { apiRequest } from "@/lib/queryClient";
import { MarkdownText } from "@/components/formatted-text";
import type { GeneratedLecture, LectureSlide, LectureStep, Quiz } from "@shared/schema";
import { useTheme } from "./settings";

const buildLecture = (quizData: Quiz | null, aiTopicTitles?: string[]): GeneratedLecture => {
  const sourceText = quizData?.sourceText ?? "";
  const normalizedText = sourceText
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphBlocks = normalizedText
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 30);

  const sentenceBlocks = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 20);

  const materialBlocks = paragraphBlocks.length > 0 ? paragraphBlocks : sentenceBlocks;
  const topicCount = Math.min(4, Math.max(2, aiTopicTitles?.length ?? 3));

  const buildTopicTitle = (block: string, topicIndex: number) => {
    const providedTitle = aiTopicTitles?.[topicIndex]?.trim();
    if (providedTitle) {
      return providedTitle;
    }

    const titleCandidate = block
      .replace(/^[-•*\d.]+\s*/, "")
      .replace(/\s+/g, " ")
      .split(/[.!?]/)[0]
      .trim();

    const compactTitle = titleCandidate.length > 60 ? `${titleCandidate.slice(0, 57).trimEnd()}...` : titleCandidate;
    return compactTitle.length > 4 ? compactTitle : `Topic ${topicIndex + 1}`;
  };

  const buildMaterialChunks = () => {
    if (materialBlocks.length === 0) {
      return ["No material content was available for this lecture."];
    }

    return Array.from({ length: topicCount }, (_, topicIndex) => {
      const start = Math.floor((topicIndex / topicCount) * materialBlocks.length);
      const end = Math.floor(((topicIndex + 1) / topicCount) * materialBlocks.length);
      return materialBlocks.slice(start, end).join(" \n\n ");
    }).filter((chunk) => chunk.trim().length > 0);
  };

  const topicChunks = buildMaterialChunks();

  const buildParagraphBody = (sentences: string[], fallback: string, paragraphCount: number) => {
    const sourceSentences = sentences.length > 0 ? sentences : [fallback];
    const paragraphs: string[] = [];
    const sentencesPerParagraph = Math.max(1, Math.ceil(sourceSentences.length / paragraphCount));

    for (let paragraphIndex = 0; paragraphIndex < paragraphCount; paragraphIndex++) {
      const start = paragraphIndex * sentencesPerParagraph;
      const end = Math.min(sourceSentences.length, start + sentencesPerParagraph);
      const paragraphSentences = sourceSentences.slice(start, end);

      if (paragraphSentences.length === 0) {
        if (paragraphIndex === 0) {
          paragraphs.push(fallback);
        } else {
          paragraphs.push("Expand this concept further with an example or connection to the rest of the lecture.");
        }
      } else {
        paragraphs.push(paragraphSentences.join(" "));
      }
    }

    return paragraphs;
  };

  const topics = topicChunks.map((chunk, topicIndex) => {
    const sentences = chunk
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.replace(/\s+/g, " ").trim())
      .filter((sentence) => sentence.length > 12);

    const topicTitle = buildTopicTitle(chunk, topicIndex);
    const slideCount = Math.min(4, Math.max(2, Math.ceil(sentences.length / 6)));
    const outline = [
      {
        title: `${topicTitle}: Core concept`,
        subtitle: "Understand the main idea",
        lines: sentences.slice(0, 8),
        fallback: "Begin by defining the central idea clearly and describing why it matters within the material.",
      },
      {
        title: `${topicTitle}: Important details`,
        subtitle: "Key points and clarifications",
        lines: sentences.slice(4, 12),
        fallback: "Explain the critical facts, terms, or distinctions that support the main idea.",
      },
      {
        title: `${topicTitle}: Examples and application`,
        subtitle: "How it works in practice",
        lines: sentences.slice(8, 16),
        fallback: "Use examples or practical situations to show how this concept appears or is used.",
      },
      {
        title: `${topicTitle}: Summary and takeaway`,
        subtitle: "What to remember",
        lines: sentences.slice(-8),
        fallback: "Summarize the main takeaway and connect it back to the broader lecture.",
      },
    ];

    const slideSeeds = outline.slice(0, slideCount).map((item, index) => {
      const body = buildParagraphBody(
        item.lines.length > 0 ? item.lines : sentences.slice(index * 4, index * 4 + 4),
        item.fallback,
        4
      );

      return {
        title: item.title,
        subtitle: item.subtitle,
        body,
      };
    });

    const slides: LectureSlide[] = slideSeeds.map((slide) => ({
      title: slide.title,
      subtitle: slide.subtitle,
      body: slide.body,
    }));

    return {
      id: `topic-${topicIndex + 1}`,
      title: topicTitle,
      slides,
    };
  });

  const intro: LectureSlide = {
    title: "Welcome & Study Goals",
    subtitle: quizData?.title ?? "Study lecture",
    body: [
      "This lecture is built directly from the uploaded material so the content stays grounded in the source text.",
      "Each topic below is broken into multiple slides so you can explore the main ideas, details, examples, and takeaways.",
      ...(materialBlocks.slice(0, 2).length > 0
        ? materialBlocks.slice(0, 2).map((block) => `• ${block}`)
        : ["• Review the source material alongside the lecture to strengthen understanding."]),
    ],
  };

  const summary: LectureSlide = {
    title: "Lecture Wrap-up",
    subtitle: "Key ideas to revisit",
    body: topics.map((topic, index) => {
      const takeaway = topic.slides[topic.slides.length - 1]?.body[0]?.replace(/^•\s*/, "") ?? "Review the topic";
      return `${index + 1}. ${topic.title}: ${takeaway}`;
    }),
  };

  const reviewQuiz: LectureSlide = {
    title: "Revision Study Prompts",
    subtitle: "Use the source material",
    body: topics.map((topic) => `• Write a short summary of ${topic.title} using the most important ideas from the lecture.`),
  };

  const sequence: LectureStep[] = [
    { ...intro, kind: "intro" as const },
    ...topics.flatMap((topic, topicIndex) =>
      topic.slides.map((slide) => ({ ...slide, kind: "topic" as const, topicIndex }))
    ),
    { ...summary, kind: "summary" as const },
    { ...reviewQuiz, kind: "quiz" as const },
  ];

  const topicStartIndices: number[] = [];
  let currentIndex = 1;
  topics.forEach((topic) => {
    topicStartIndices.push(currentIndex);
    currentIndex += topic.slides.length;
  });

  return {
    title: quizData?.title ?? "Study Lecture",
    intro,
    topics,
    summary,
    revisionQuiz: reviewQuiz,
    sequence,
    topicStartIndices,
  };
};

export default function StudyPage() {
  const { currentQuiz, setCurrentQuiz } = useQuiz();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [lecture, setLecture] = useState<GeneratedLecture | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (!currentQuiz) {
      setLecture(null);
      setCurrentStep(0);
      return;
    }

    const savedLecture = currentQuiz.lecture as GeneratedLecture | null | undefined;
    setLecture(savedLecture ?? null);
    setCurrentStep(0);
  }, [currentQuiz?.id, currentQuiz?.lecture]);

  const currentLecture = useMemo(() => {
    if (!lecture) {
      return null;
    }

    return lecture.sequence[Math.min(currentStep, lecture.sequence.length - 1)];
  }, [lecture, currentStep]);

  const currentTopicIndex = currentLecture?.kind === "topic" ? currentLecture.topicIndex ?? 0 : -1;

  const goToTopic = (topicIndex: number) => {
    if (!lecture) return;
    const targetIndex = lecture.topicStartIndices[Math.min(topicIndex, lecture.topicStartIndices.length - 1)];
    setCurrentStep(targetIndex);
    setIsTopicsOpen(false);
  };

  const selectStep = (step: number) => {
    setCurrentStep(step);
    setIsTopicsOpen(false);
  };

  const goToPrevious = () => {
    if (!lecture) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    if (!lecture) return;
    setCurrentStep((prev) => Math.min(lecture.sequence.length - 1, prev + 1));
  };

  const handleGenerateLecture = async () => {
    if (!currentQuiz) return;

    setIsGeneratingLecture(true);

    let generatedLecture: GeneratedLecture | null = null;
    try {
      const lectureResponse = await apiRequest("POST", `/api/quiz/${currentQuiz.id}/generate-lecture`, { topicCount: 4 });
      const lecturePayload = await lectureResponse.json();
      generatedLecture = lecturePayload?.lecture ?? null;
    } catch (error) {
      console.error("Failed to generate lecture from material", error);
    }

    if (!generatedLecture) {
      generatedLecture = buildLecture(currentQuiz);
    }

    setLecture(generatedLecture);
    setCurrentStep(0);

    try {
      const response = await apiRequest("PUT", `/api/quiz/${currentQuiz.id}`, { lecture: generatedLecture });
      const updatedQuiz = await response.json();
      setCurrentQuiz(updatedQuiz);
    } catch (error) {
      console.error("Failed to save lecture", error);
    } finally {
      setIsGeneratingLecture(false);
    }
  };

  const topicsNavigation = lecture ? (
    <>
      <div className="mb-4 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
          {t("study.lectureProgress")}
        </p>
        <h3 className="mt-1 text-lg font-bold">{t("study.lectureSession")}</h3>
      </div>
      <div className="space-y-2 overflow-y-auto pr-1 lg:flex-1 lg:max-h-[calc(100vh-20rem)]">
        <Button
          variant={currentStep === 0 ? "default" : "outline"}
          className="w-full justify-start rounded-2xl px-3 py-2 text-left"
          onClick={() => selectStep(0)}
        >
          <span className="flex flex-col items-start">
            <span className="font-semibold">{t("study.intro")}</span>
            <span className="text-xs opacity-70">{t("study.startHere")}</span>
          </span>
        </Button>
        {lecture.topics.map((topic, topicIndex) => (
          <div key={topic.id} className="rounded-3xl border border-border/70 bg-background/80 p-2">
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition ${currentTopicIndex === topicIndex ? "bg-primary/10 text-primary" : "bg-transparent text-foreground hover:bg-muted/80"}`}
              onClick={() => goToTopic(topicIndex)}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">{topic.title}</span>
                <span className="text-[11px] opacity-70">{t("study.topicLabel", { number: topicIndex + 1 })}</span>
              </span>
            </button>
            <div className="mt-2 space-y-1 px-2">
              {topic.slides.map((slide, slideIndex) => {
                const slideNumber = lecture.topicStartIndices[topicIndex] + slideIndex;
                const isActive = currentStep === slideNumber;
                return (
                  <button
                    key={`${topic.id}-slide-${slideIndex}`}
                    type="button"
                    className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${isActive ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted/80"}`}
                    onClick={() => selectStep(slideNumber)}
                  >
                    <div className="font-semibold leading-snug">{slide.title}</div>
                    <div className="text-[11px] opacity-70">{slide.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Button
          variant={currentLecture?.kind === "summary" ? "default" : "outline"}
          className="w-full justify-start rounded-2xl px-3 py-2 text-left"
          onClick={() => selectStep(lecture.sequence.length - 2)}
        >
          <span className="flex flex-col items-start">
            <span className="font-semibold">{t("study.summary")}</span>
            <span className="text-xs opacity-70">{t("study.wrapUp")}</span>
          </span>
        </Button>
        <Button
          variant={currentLecture?.kind === t("history.quiz") ? "default" : "outline"}
          className="w-full justify-start rounded-2xl px-3 py-2 text-left"
          onClick={() => selectStep(lecture.sequence.length - 1)}
        >
          <span className="flex flex-col items-start">
            <span className="font-semibold">{t("study.revisionQuiz")}</span>
            <span className="text-xs opacity-70">{t("study.testYourself")}</span>
          </span>
        </Button>
      </div>
    </>
  ) : null;

  if (!currentQuiz) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <BookOpen className="mb-6 h-16 w-16 text-muted-foreground/30" />
          <h2 className="mb-3 text-2xl font-bold">{t("study.noQuizSelected")}</h2>
          <p className="mb-8 text-muted-foreground">{t("study.noQuizSelectedDesc")}</p>
          <Link href="/history">
            <Button size="lg" className="rounded-xl px-8" data-testid="button-go-history">
              {t("study.goToHistory")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight leading-none">{currentQuiz.title}</h1>
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {t("study.lectureSession")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {lecture ? (
            <Sheet open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full lg:hidden" aria-label={t("study.openTopics")} data-testid="button-open-topics">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(86vw,22rem)] flex-col rounded-r-[2rem] p-4 sm:max-w-sm">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("study.lectureSession")}</SheetTitle>
                </SheetHeader>
                {topicsNavigation}
              </SheetContent>
            </Sheet>
          ) : null}
          <Button
            variant="ghost"
            className="h-10 rounded-full px-2.5 sm:px-3"
            onClick={() => setIsChatbotOpen((isOpen) => !isOpen)}
            data-testid="button-ask-prepal"
          >
            <AskPipIcon size={22} />
            <span className="ml-1.5 hidden text-sm font-semibold sm:inline">{t("quizPlayer.askPip")}</span>
          </Button>
          <Link href="/dashboard">
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-testid="button-toggle-theme">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {!lecture ? (
        <Card className="flex flex-1 flex-col justify-center rounded-[2rem] border border-dashed border-primary/20 bg-card/80 p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-3 text-2xl font-bold">{t("study.generateLecture")}</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            {t("study.generateLectureDesc")}
          </p>
          <Button
            size="lg"
            className="mx-auto rounded-2xl px-8"
            onClick={handleGenerateLecture}
            disabled={isGeneratingLecture}
          >
            {isGeneratingLecture ? t("study.generatingLecture") : t("study.startLecture")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="sticky top-8 hidden rounded-[2rem] border border-border/60 bg-card/80 p-4 shadow-sm lg:col-start-1 lg:row-start-1 lg:mr-4 lg:flex lg:max-h-[calc(110vh-12rem)] lg:flex-col lg:overflow-hidden">
            {topicsNavigation}
          </aside>

          <Card className="flex h-[min(42rem,calc(100dvh-10rem))] min-h-[30rem] flex-col rounded-[2rem] border border-primary/10 bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                  {t("study.lectureProgress")}
                </p>
                <h2 className="text-2xl font-black tracking-tight">{currentLecture?.title}</h2>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                {t("study.slideLabel", { current: currentStep + 1, total: lecture ? lecture.sequence.length : 1 })}
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`slide-${currentStep}`}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-border/60 bg-background/70 p-6 sm:p-8"
              >
                {currentLecture?.subtitle ? (
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary/70">{currentLecture.subtitle}</p>
                ) : null}
                {currentLecture?.body.length ? (
                  <MarkdownText content={currentLecture.body.join("\n\n")} />
                ) : null}

                {currentLecture?.kind === t("history.quiz") && (
                  <div className="mt-8 flex justify-center">
                    <Link href="/quiz">
                      <Button size="lg" className="rounded-2xl px-8 font-semibold shadow-md flex items-center gap-2" data-testid="button-start-main-quiz">
                        <Sparkles className="h-5 w-5" />
                        {t("study.startMainQuiz")}
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {t("study.lectureReadyDesc")}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext} disabled={!lecture || currentStep === lecture.sequence.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      <QuizChatbot
        quizId={currentQuiz.id}
        quizTitle={currentQuiz.title}
        questions={currentQuiz.questions}
        currentQuestionIndex={0}
        suggestedQuestions={[
          t("study.mainIdeaCue"),
          t("study.summaryCue"),
          t("study.exampleCue"),
          t("study.quizCue"),
        ]}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </motion.div>
  );
}
