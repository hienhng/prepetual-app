import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Search, Copy, Clock, X, HelpCircle, Lightbulb, BookOpen, RefreshCw, MessageCircleQuestion, LayoutGrid, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { MathText } from "@/components/formatted-text";
import { useAuth } from "@/hooks/useAuth";
import AskPipIcon from "@/components/ui/ask-pip-icon";
import type { Question } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  id: string;
}

interface QuizChatbotProps {
  quizId: string;
  quizTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  suggestedQuestions?: string[];
  isOpen: boolean;
  onClose: () => void;
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
        title="Copy"
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
        Welcome to Prepal AI
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
        Ask me anything about this quiz and I'll help you master the material!
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

export function QuizChatbot({ quizId, quizTitle, questions, currentQuestionIndex, suggestedQuestions, isOpen, onClose }: QuizChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // word-by-word generation animation
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [revealedText, setRevealedText] = useState("");
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showSearch) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showSearch]);

  // Cleanup animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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
        chatHistory: messages,
        mode: conversationMode,
        userPreferences: user,
      });

      const data = await response.json();
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
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, something went wrong. Please try again.", 
          timestamp: Date.now(),
          id: `msg-${Date.now()}`
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!isOpen) return null;

  return (
    <motion.div 
      layout
      layoutId="quiz-chatbot"
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 40 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 1 }}
      style={{
        position: "fixed",
        bottom: isExpanded ? "5vh" : "6rem",
        right: isExpanded ? "5vw" : "1rem",
        width: isExpanded ? "90vw" : "24rem",
        height: isExpanded ? "88vh" : "600px",
        maxWidth: isExpanded ? "1200px" : undefined,
        zIndex: 50,
      }}
      className="rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AskPipIcon size={32} className="rounded-lg" />
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Prepal AI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your Study Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title="Search messages"
            >
              <Search className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title="Close"
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
              className="mb-3"
            >
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm border-slate-300 dark:border-slate-600 rounded-full px-3 focus-visible:ring-0 focus-visible:border-slate-400"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-2">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircleQuestion className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Ask me anything</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                About this quiz, the topic, or study strategies
              </p>
            </div>
            <div className="w-full space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Try asking
              </p>
              {suggestedCues.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => handleCueClick(label)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors text-sm text-slate-700 dark:text-slate-300"
                >
                  <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
                    className={`group max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-slate-900 dark:bg-slate-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed [&_.katex-display]:my-1 [&_.katex]:text-[0.9em]">
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
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.username || "User"} className="object-cover" />
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
            className="border-t border-slate-200/60 dark:border-slate-800/80"
          >
            <button
              onClick={() => setShowCues(!showCues)}
              className="w-full px-4 py-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <LayoutGrid className="w-3 h-3" />
              Suggested questions
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
                      className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
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
        className="p-3 border-t border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Prepal AI anything..."
            className="flex-1 h-10 text-sm rounded-full border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 focus-visible:ring-0 focus-visible:border-slate-300 dark:focus-visible:border-slate-700 transition-all duration-300 px-4"
            disabled={isLoading || showSearch}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary dark:bg-primary  dark:hover:bg-primary text-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
