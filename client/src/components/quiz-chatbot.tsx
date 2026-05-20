import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Search, Copy, Share2, Clock, X } from "lucide-react";
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
  quizTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  sourceMaterial?: string;
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200/30 dark:border-slate-700/30 text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
        title="Share"
      >
        <Share2 className="w-3 h-3" />
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

type PenguinEmotion = "idle" | "thinking" | "happy";

export function CutePenguin({ size = 64, className = "", emotion = "idle" }: { size?: number; className?: string; emotion?: PenguinEmotion }) {
  const isThinking = emotion === "thinking";
  const isHappy = emotion === "happy";
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      className={className}
    >
      {/* Left flipper - animated */}
      <motion.ellipse 
        cx="18" cy="52" rx="12" ry="24" fill="#2d3436"
        animate={isThinking ? {
          rotate: [-25, -35, -25],
          y: [0, -3, 0],
        } : isHappy ? {
          rotate: [-25, -55, -25],
          y: [0, -8, 0],
        } : { rotate: -25 }}
        transition={{ 
          duration: isThinking ? 1.5 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 2 : 0,
          ease: "easeInOut"
        }}
        style={{ originX: "18px", originY: "52px" }}
      />
      {/* Right flipper - animated */}
      <motion.ellipse 
        cx="82" cy="52" rx="12" ry="24" fill="#2d3436"
        animate={isThinking ? {
          rotate: [25, 35, 25],
          y: [0, -3, 0],
        } : isHappy ? {
          rotate: [25, 55, 25],
          y: [0, -8, 0],
        } : { rotate: 25 }}
        transition={{ 
          duration: isThinking ? 1.5 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 2 : 0,
          ease: "easeInOut",
          delay: isThinking ? 0.2 : 0
        }}
        style={{ originX: "82px", originY: "52px" }}
      />
      
      {/* Main body - black outer */}
      <ellipse cx="50" cy="55" rx="35" ry="40" fill="#2d3436" />
      
      {/* White belly - large oval */}
      <ellipse cx="50" cy="60" rx="26" ry="32" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
      
      {/* Head - black top portion that connects to body */}
      <path d="M20 45 Q20 15 50 15 Q80 15 80 45 Q80 55 50 55 Q20 55 20 45" fill="#2d3436" />
      
      {/* White face area */}
      <ellipse cx="50" cy="42" rx="22" ry="18" fill="#ffffff" />
      
      {/* Blush cheeks - only when happy */}
      <motion.ellipse 
        cx="28" cy="48" rx="6" ry="4" fill="#ffb6c1"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHappy ? 0.7 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.ellipse 
        cx="72" cy="48" rx="6" ry="4" fill="#ffb6c1"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHappy ? 0.7 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Left eye white - animated size when happy */}
      <motion.ellipse 
        cx="38" cy="40" rx="9" ry="10" fill="#ffffff"
        animate={isHappy ? { 
          ry: [10, 12, 10],
          rx: [9, 10, 9]
        } : {}}
        transition={{ duration: 0.4, repeat: isHappy ? 1 : 0 }}
      />
      {/* Right eye white - animated size when happy */}
      <motion.ellipse 
        cx="62" cy="40" rx="9" ry="10" fill="#ffffff"
        animate={isHappy ? { 
          ry: [10, 12, 10],
          rx: [9, 10, 9]
        } : {}}
        transition={{ duration: 0.4, repeat: isHappy ? 1 : 0 }}
      />
      
      {/* Left pupil - animated position */}
      <motion.circle 
        cx="39" cy="41" r="5" fill="#2d3436"
        animate={isThinking ? {
          cx: [39, 36, 42, 39],
          cy: [41, 38, 38, 41],
        } : isHappy ? {
          r: [5, 6, 5],
          cy: [41, 39, 41],
        } : {}}
        transition={{ 
          duration: isThinking ? 2 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 1 : 0,
          ease: "easeInOut"
        }}
      />
      {/* Right pupil - animated position */}
      <motion.circle 
        cx="61" cy="41" r="5" fill="#2d3436"
        animate={isThinking ? {
          cx: [61, 58, 64, 61],
          cy: [41, 38, 38, 41],
        } : isHappy ? {
          r: [5, 6, 5],
          cy: [41, 39, 41],
        } : {}}
        transition={{ 
          duration: isThinking ? 2 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 1 : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Left eye highlight - follows pupil */}
      <motion.circle 
        cx="41" cy="39" r="2" fill="#ffffff"
        animate={isThinking ? {
          cx: [41, 38, 44, 41],
          cy: [39, 36, 36, 39],
        } : isHappy ? {
          r: [2, 3, 2],
        } : {}}
        transition={{ 
          duration: isThinking ? 2 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 1 : 0,
          ease: "easeInOut"
        }}
      />
      {/* Right eye highlight - follows pupil */}
      <motion.circle 
        cx="63" cy="39" r="2" fill="#ffffff"
        animate={isThinking ? {
          cx: [63, 60, 66, 63],
          cy: [39, 36, 36, 39],
        } : isHappy ? {
          r: [2, 3, 2],
        } : {}}
        transition={{ 
          duration: isThinking ? 2 : 0.5, 
          repeat: isThinking ? Infinity : isHappy ? 1 : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Sparkle stars when happy */}
      <motion.path 
        d="M25 28 L27 32 L31 32 L28 35 L29 39 L25 36 L21 39 L22 35 L19 32 L23 32 Z" 
        fill="#ffd700"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isHappy ? [0, 1, 0] : 0,
          scale: isHappy ? [0, 1.2, 0] : 0,
          rotate: isHappy ? [0, 20, 0] : 0
        }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ originX: "25px", originY: "33px" }}
      />
      <motion.path 
        d="M75 28 L77 32 L81 32 L78 35 L79 39 L75 36 L71 39 L72 35 L69 32 L73 32 Z" 
        fill="#ffd700"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: isHappy ? [0, 1, 0] : 0,
          scale: isHappy ? [0, 1.2, 0] : 0,
          rotate: isHappy ? [0, -20, 0] : 0
        }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ originX: "75px", originY: "33px" }}
      />
      
      {/* Beak - animated when happy */}
      <motion.path 
        d="M50 46 L44 52 L50 58 L56 52 Z" 
        fill="#f5a623"
        animate={isHappy ? {
          d: ["M50 46 L44 52 L50 58 L56 52 Z", "M50 44 L42 51 L50 60 L58 51 Z", "M50 46 L44 52 L50 58 L56 52 Z"]
        } : {}}
        transition={{ duration: 0.4, repeat: isHappy ? 1 : 0 }}
      />
      
      {/* Head shine/highlight */}
      <ellipse cx="35" cy="25" rx="8" ry="4" fill="#4a5568" opacity="0.4" transform="rotate(-30 35 25)" />
      
      {/* Left foot */}
      <ellipse cx="38" cy="94" rx="10" ry="5" fill="#f5a623" />
      {/* Right foot */}
      <ellipse cx="62" cy="94" rx="10" ry="5" fill="#f5a623" />
      
      {/* Foot toes - left */}
      <path d="M30 94 L26 92 M33 95 L29 94 M36 95 L33 95" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" />
      {/* Foot toes - right */}
      <path d="M70 94 L74 92 M67 95 L71 94 M64 95 L67 95" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" />
      
      {/* Thinking dots above head */}
      <motion.circle 
        cx="70" cy="8" r="3" fill="#a0aec0"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isThinking ? [0, 1, 0] : 0,
          y: isThinking ? [0, -3, 0] : 0
        }}
        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0, delay: 0 }}
      />
      <motion.circle 
        cx="78" cy="5" r="4" fill="#a0aec0"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isThinking ? [0, 1, 0] : 0,
          y: isThinking ? [0, -3, 0] : 0
        }}
        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0, delay: 0.3 }}
      />
      <motion.circle 
        cx="88" cy="2" r="5" fill="#a0aec0"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isThinking ? [0, 1, 0] : 0,
          y: isThinking ? [0, -3, 0] : 0
        }}
        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0, delay: 0.6 }}
      />
    </svg>
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
  
  const emotion: PenguinEmotion = isSuccess ? "happy" : isAnimating ? "thinking" : "idle";
  
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
      <CutePenguin size={penguinSize} emotion={emotion} />
    </motion.div>
  );
}

export function QuizChatbot({ quizTitle, questions, currentQuestionIndex, sourceMaterial, isOpen, onClose }: QuizChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        quizTitle,
        questions,
        currentQuestionIndex,
        userMessage,
        chatHistory: messages,
        sourceMaterial,
        mode: conversationMode,
        userPreferences: user,
      });

      const data = await response.json();
      const assistantId = `msg-${Date.now()}`;
      
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: data.response, 
        timestamp: Date.now(),
        id: assistantId
      }]);
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
      initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 40, rotateX: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 1 }}
      style={{ perspective: "1000px" }}
      className="fixed bottom-24 right-4 w-96 h-[600px] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
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

        {/* Conversation Modes */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {conversationModes.map((mode) => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setConversationMode(mode.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                conversationMode === mode.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-transparent hover:bg-slate-150/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="mr-1">{mode.emoji}</span>
              {mode.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Current Question Preview */}
      {currentQuestion && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400"
        >
          <p className="line-clamp-2">
            <span className="font-semibold">Q{currentQuestionIndex + 1}:</span> {" "}
            <MathText content={currentQuestion.question} />
          </p>
        </motion.div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
        {filteredMessages.length === 0 ? (
          <EmptyState />
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
                      <MathText content={message.content} />
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
