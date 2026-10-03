import { useLanguage } from "@/lib/language-context";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Search, Copy, Clock, X, HelpCircle, Lightbulb, BookOpen, RefreshCw, MessageCircleQuestion, LayoutGrid, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { MathText } from "@/components/formatted-text";
import { useAuth } from "@/hooks/useAuth";
import AskPipIcon from "@/components/ui/ask-pip-icon";
import type { Question } from "@shared/schema";
import { MAX_CHAT_MESSAGE_CHARS, prepareChatHistory } from "@shared/quiz-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  id: string;
  isError?: boolean;
}

interface QuizChatbotProps {
  quizId: string;
  quizTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  suggestedQuestions?: string[];
  isOpen: boolean;
  onClose: () => void;
  presentation?: "floating" | "sidebar";
}

type ConversationMode = "general" | "explain" | "hint" | "quiz";

const conversationModes: { id: ConversationMode; label: string; emoji: string }[] = [
  { id: "general", label: "General", emoji: "💬" },
  { id: "explain", label: "Explain", emoji: "📚" },
  { id: "hint", label: "Hint", emoji: "💡" },
  { id: "quiz", label: "Quiz", emoji: "🎯" },
];


function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
  return date.toLocaleDateString();
}

function MessageActions({ content, messageId }: { content: string; messageId: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/30 dark:border-slate-700/30 text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
        title={t("common.copy")}
      >
        <Copy className={`w-3 h-3 ${copied ? "text-green-500 hover:text-green-600" : ""}`} />
      </motion.button>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="h-full flex flex-col items-center justify-center text-center py-8"
    >
      <motion.div 
        className="mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <AskPipIcon size={64} className="rounded-lg" />
      </motion.div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t("chatbot.welcome")}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
        {t("chatbot.welcomeDescription")}
      </p>
    </motion.div>
  );
}


function SparkleDecor() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/20"
          style={{
            left: `${10 + i * 20}%`,
            top: `${15 + (i % 2) * 30}%`,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          Sparkles
        </motion.div>
      ))}
    </>
  );
}

function TutorAvatar({ isAnimating = false, isSuccess = false, large = false }: { isAnimating?: boolean; isSuccess?: boolean; large?: boolean }) {
  const containerSize = large ? "w-20 h-20" : "w-10 h-10";
  const penguinSize = large ? 52 : 28;
  
  
  
  return (
    <motion.div 
      className={`relative ${containerSize} rounded-xl bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 dark:from-violet-900/40 dark:via-purple-900/30 dark:to-fuchsia-900/40 flex items-center justify-center shrink-0 shadow-md overflow-visible border-2 border-violet-200/60 dark:border-violet-700/50`}
      animate={isSuccess ? {
        scale: [1, 1.1, 1],
      } : isAnimating ? {
        y: [0, -2, 0],
      } : {}}
      transition={isSuccess ? {
        duration: 0.5,
      } : {
        duration: 1.2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      
    </motion.div>
  );
}

export function QuizChatbot({ quizId, quizTitle, questions, currentQuestionIndex, suggestedQuestions, isOpen, onClose, presentation = "floating" }: QuizChatbotProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactScreen, setIsCompactScreen] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );
  // word-by-word generation animation
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [revealedText, setRevealedText] = useState("");
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const sendingRef = useRef(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const updateScreen = () => setIsCompactScreen(media.matches);
    updateScreen();
    media.addEventListener("change", updateScreen);
    return () => media.removeEventListener("change", updateScreen);
  }, []);

  const defaultSuggestedCues = [
    { icon: HelpCircle, label: "Explain the concept behind this question" },
    { icon: Lightbulb,  label: "Give me a hint without revealing the answer" },
    { icon: BookOpen,   label: "What topics should I study more?" },
    { icon: RefreshCw,  label: "Quiz me on this concept with a different question" },
  ];
  const suggestedCues = suggestedQuestions
    ? suggestedQuestions.map((label, index) => ({
        icon: defaultSuggestedCues[index % defaultSuggestedCues.length].icon,
        label,
      }))
    : defaultSuggestedCues;

  const handleCueClick = (label: string) => {
    setInputValue(label);
    setShowCues(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isLoading, revealedText, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showSearch) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showSearch]);

  // A different quiz starts a new conversation; ignore any previous request.
  useEffect(() => {
    requestRef.current++;
    sendingRef.current = false;
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    setAnimatingId(null);
    setRevealedText("");
    setSearchQuery("");
    return () => {
      requestRef.current++;
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [quizId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sendingRef.current) return;

    sendingRef.current = true;
    const requestId = ++requestRef.current;
    if (animationRef.current) clearTimeout(animationRef.current);
    setAnimatingId(null);

    const userMessage = inputValue.trim();
    setInputValue("");
    const messageId = `msg-${Date.now()}`;
    
    setMessages((prev) => [...prev, { 
      role: "user", 
      content: userMessage, 
      timestamp: Date.now(),
      id: messageId
    }]);
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/quiz-chat", {
        quizId,
        currentQuestionIndex,
        userMessage,
        chatHistory: prepareChatHistory(messages),
      });

      const data = await response.json();
      if (requestId !== requestRef.current) return;
      if (typeof data.response !== "string" || !data.response.trim()) {
        throw new Error("Prepal returned an empty response. Please try again.");
      }
      const assistantId = `msg-${Date.now()}`;
      const fullText: string = data.response;

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: fullText, 
        timestamp: Date.now(),
        id: assistantId
      }]);

      // Kick off word-by-word animation
      setAnimatingId(assistantId);
      const words = fullText.split(" ");
      let wordIndex = 0;
      setRevealedText("");

      const revealNext = () => {
        wordIndex++;
        setRevealedText(words.slice(0, wordIndex).join(" "));
        if (wordIndex < words.length) {
          animationRef.current = setTimeout(revealNext, 28);
        } else {
          setAnimatingId(null);
        }
      };
      animationRef.current = setTimeout(revealNext, 28);
    } catch (error: any) {
      if (requestId !== requestRef.current) return;
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: error instanceof Error ? error.message : "Prepal could not respond. Please try again.",
          isError: true,
          timestamp: Date.now(),
          id: `msg-${Date.now()}`
        },
      ]);
    } finally {
      if (requestId === requestRef.current) {
        sendingRef.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!isOpen) return null;

  const isSidebar = presentation === "sidebar";
  const isBottomSheet = isSidebar && isCompactScreen;

  return (
    <motion.div 
      id="quiz-chatbot"
      role={isSidebar ? "complementary" : undefined}
      aria-label={t("chatbot.chatLabel")}
      data-testid="quiz-chatbot"
      initial={isBottomSheet ? { opacity: 1, x: 0, y: "100%" } : isSidebar ? { opacity: 0, x: 20, y: 0 } : { opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={isBottomSheet ? { opacity: 1, x: 0, y: "100%" } : isSidebar ? { opacity: 0, x: 20, y: 0 } : { opacity: 0, scale: 0.85, y: 40 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 1 }}
      style={isSidebar ? undefined : {
        position: "fixed",
        bottom: isExpanded ? "5vh" : "6rem",
        right: isExpanded ? "5vw" : "1rem",
        width: isExpanded ? "90vw" : "min(24rem, calc(100vw - 2rem))",
        height: isExpanded ? "88dvh" : "min(600px, calc(100dvh - 7rem))",
        maxWidth: isExpanded ? "1200px" : undefined,
        zIndex: 50,
      }}
      className={`${isSidebar ? "fixed bottom-0 inset-x-0 z-40 w-full min-w-0 h-[85dvh] rounded-t-2xl border-t shadow-xl lg:top-0 lg:left-auto lg:w-96 lg:h-dvh lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none" : "rounded-2xl shadow-2xl border"} bg-background border-border flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-border/70">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <AskPipIcon size={28} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("quizPlayer.askPip")}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title={t("chatbot.search")}
              aria-label={t("chatbot.search")}
              aria-expanded={showSearch}
            >
              <Search className="w-4 h-4" />
            </motion.button>
            {!isSidebar && <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                  title={isExpanded ? t("quizGenerator.collapse") : t('common.expand')}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title={t("common.close")}
              aria-label={t("chatbot.closePanel")}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3"
            >
              <Input
                placeholder={t("chatbot.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t("chatbot.search")}
                className="h-9 text-sm border-border rounded-xl bg-muted/40 px-3"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSidebar && (
        <div className="shrink-0 flex items-center gap-2 border-b border-border/60 bg-muted/30 px-5 py-3">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={quizTitle}>{quizTitle}</span>
          <span className="shrink-0 rounded-md border border-border/70 bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
            {t("study.question")} {currentQuestionIndex + 1}
          </span>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 px-5 py-6">
        {filteredMessages.length === 0 && searchQuery.trim() ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("chatbot.noResults")}</p>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-start gap-6 pt-7 pb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
              <AskPipIcon size={38} />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{t("chatbot.workThrough")}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {t("chatbot.hintDescription")}
              </p>
            </div>
            <div className="w-full space-y-2">
              <p className="pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("chatbot.start")}
              </p>
              {suggestedCues.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => handleCueClick(label)}
                  className="group w-full flex items-start gap-3 px-3.5 py-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left transition-colors text-[13px] leading-relaxed text-foreground"
                >
                  <Icon className="mt-0.5 w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-md overflow-hidden flex items-center justify-center">
                      <AskPipIcon size={40} />
                    </div>
                  )}
                  
                  <div
                    className={`group min-w-0 max-w-[85%] rounded-2xl px-3.5 py-3 text-sm ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary/10 text-foreground"
                        : "rounded-tl-sm bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words leading-relaxed [&_.katex-display]:my-1 [&_.katex-display]:overflow-x-auto [&_.katex]:text-[0.9em]">
                      {message.role === "assistant" && animatingId === message.id ? (
                        <span>
                          {revealedText}
                          <motion.span
                            className="inline-block w-0.5 h-[1em] bg-current align-middle ml-0.5 rounded-full opacity-80"
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                          />
                        </span>
                      ) : (
                        <MathText content={message.content} />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className="text-xs opacity-60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(message.timestamp)}
                      </span>
                      {message.role === "assistant" && (
                        <MessageActions content={message.content} messageId={message.id} />
                      )}
                    </div>
                  </div>
                  
                  {message.role === "user" && (
                    <Avatar className="w-6 h-6 flex-shrink-0 border border-slate-200 dark:border-slate-800">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.username || t("common.user")} className="object-cover" />
                      <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-350 font-semibold">
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
 
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 justify-start items-start"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
                  <AskPipIcon size={20} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggested questions strip (when messages exist) */}
      <AnimatePresence>
        {filteredMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="shrink-0 border-t border-border/60"
          >
            <button
              onClick={() => setShowCues(!showCues)}
              className="w-full px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={showCues}
            >
              <LayoutGrid className="w-3 h-3" />
              {t("chatbot.suggestedQuestions")}
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform duration-200 ${showCues ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showCues && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden px-3 pb-2 flex flex-wrap gap-1.5"
                >
                  {suggestedCues.map(({ label }) => (
                    <button
                      key={label}
                      onClick={() => handleCueClick(label)}
                      className="max-w-full px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div 
        className="shrink-0 p-4 bg-background"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-2 items-end rounded-2xl border border-border bg-muted/30 p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-colors">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            maxLength={MAX_CHAT_MESSAGE_CHARS}
            placeholder={t("chatbot.askPlaceholder")}
            aria-label={t("chatbot.messageLabel")}
            rows={3}
            className="min-w-0 flex-1 min-h-[84px] max-h-40 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label={t("chatbot.send")}
              className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-none transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
        <p className="mt-2.5 text-center text-[10px] text-muted-foreground">{t("chatbot.keyboardHint")}</p>
      </motion.div>
    </motion.div>
  );
}
