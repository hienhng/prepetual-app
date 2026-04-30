import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Sparkles, Lightbulb, HelpCircle, BookOpen, ArrowUp, MessageCircle, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { MathText } from "@/components/formatted-text";
import { useAuth } from "@/hooks/useAuth";
import type { Question } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface QuizChatbotProps {
  quizTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  sourceMaterial?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreferences {
  persona: string;
  subjectInclination: string;
  feedbackStyle: string;
  aiPartnership: string;
}

const suggestions = [
  { text: "Explain this concept", icon: Lightbulb, bgColor: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-200 dark:border-amber-800" },
  { text: "Give me a hint", icon: HelpCircle, bgColor: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400", borderColor: "border-violet-200 dark:border-violet-800" },
  { text: "What's the key concept?", icon: BookOpen, bgColor: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400", borderColor: "border-emerald-200 dark:border-emerald-800" },
  { text: "Break it down simply", icon: Brain, bgColor: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400", borderColor: "border-sky-200 dark:border-sky-800" },
];


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
          <Sparkles size={10 + i * 2} />
        </motion.div>
      ))}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
          animate={{
            y: [0, -5, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
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
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/quiz-chat", {
        quizTitle,
        questions,
        currentQuestionIndex,
        userMessage,
        chatHistory: messages,
        sourceMaterial,
        userPreferences: user,
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, timestamp: Date.now() }]);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1000);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Brr! Something went cold. Please try again!", timestamp: Date.now() },
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col overflow-hidden border-l-0 shadow-2xl">
        <SheetHeader className="px-5 py-4 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shrink-0 relative overflow-hidden">
          <SparkleDecor />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent" />
            <motion.div 
              className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 overflow-hidden"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <CutePenguin size={40} />
            </motion.div>
            <div className="text-left flex-1">
              <SheetTitle className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
                Pip
                <Badge className="bg-white/20 text-white text-[10px] px-1.5 py-0 border-white/30 pt-[0px] pb-[0px] pl-[9px] pr-[9px] font-extrabold">AI</Badge>
              </SheetTitle>
              <p className="text-xs text-white/85 mt-0.5">Your study companion</p>
            </div>
          </div>
        </SheetHeader>

        {currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-2.5 border-b bg-violet-50/60 dark:bg-violet-950/20 shrink-0"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-white">{currentQuestionIndex + 1}</span>
              </div>
              <div className="text-xs line-clamp-2 text-muted-foreground leading-relaxed pt-0.5">
                <MathText content={currentQuestion.question} />
              </div>
            </div>
          </motion.div>
        )}

        <ScrollArea className="flex-1 px-3 py-3 bg-gradient-to-b from-violet-50/20 to-transparent dark:from-violet-950/10">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-full flex flex-col items-center justify-center text-center py-4"
            >
              <motion.div 
                className="relative mb-5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 dark:from-violet-900/40 dark:via-purple-900/30 dark:to-fuchsia-900/40 flex items-center justify-center shadow-lg overflow-hidden border-2 border-violet-200/60 dark:border-violet-700/50"
                  animate={{ 
                    boxShadow: [
                      "0 8px 30px -8px rgba(139, 92, 246, 0.25)",
                      "0 16px 40px -8px rgba(139, 92, 246, 0.4)",
                      "0 8px 30px -8px rgba(139, 92, 246, 0.25)"
                    ]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ rotate: [0, -3, 3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <CutePenguin size={64} />
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h3 
                className="text-lg font-bold mb-1.5 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Hey there!
              </motion.h3>
              <motion.p 
                className="text-xs text-muted-foreground max-w-[240px] mb-5 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                I'm Pip, your study buddy! Ask me anything about this quiz - I'll help you learn without spoiling the answers.
              </motion.p>
              
              <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.08 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                  >
                    <button
                      className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl border-2 ${suggestion.borderColor} ${suggestion.bgColor} transition-all`}
                      onClick={() => {
                        setInputValue(suggestion.text);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${suggestion.text.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${suggestion.bgColor} flex items-center justify-center`}>
                        <suggestion.icon className={`w-5 h-5 ${suggestion.iconColor}`} />
                      </div>
                      <span className="text-xs font-medium text-foreground/80 leading-tight text-center">{suggestion.text}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      delay: message.role === "assistant" ? 0.08 : 0
                    }}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <TutorAvatar 
                        isAnimating={isLoading && index === messages.length} 
                        isSuccess={isSuccess && index === messages.length - 1} 
                      />
                    )}
                    <motion.div
                      className={`max-w-[78%] rounded-xl px-3 py-2.5 text-sm shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-slate-800 border border-violet-100 dark:border-slate-700 rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed text-[13px] [&_.katex-display]:my-2 [&_.katex]:text-[0.9em]">
                        <MathText content={message.content} />
                      </div>
                    </motion.div>
                    {message.role === "user" && (
                      <motion.div 
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <TutorAvatar isAnimating />
                  <motion.div 
                    className="bg-white dark:bg-slate-800 border border-violet-100 dark:border-slate-700 rounded-xl rounded-bl-sm px-3 py-2.5"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <TypingIndicator />
                  </motion.div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <motion.div 
          className="p-3 border-t bg-gradient-to-r from-violet-50/60 to-purple-50/60 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-md shrink-0"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Pip anything..."
              className="flex-1 h-11 rounded-xl border-violet-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus-visible:ring-violet-400/30 focus-visible:border-violet-400 transition-all placeholder:text-muted-foreground/50 text-sm"
              disabled={isLoading}
              data-testid="input-chatbot-message"
            />
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="border-none h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-md shadow-violet-500/20 transition-all hover:shadow-violet-500/30 disabled:opacity-50 disabled:shadow-none"
                data-testid="button-chatbot-send"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
