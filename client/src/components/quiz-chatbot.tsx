import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Snowflake, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import katex from "katex";
import "katex/dist/katex.min.css";
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

const suggestions = [
  { text: "Explain this", icon: Lightbulb, color: "from-amber-300 to-yellow-400" },
  { text: "Give me a hint", icon: HelpCircle, color: "from-sky-300 to-cyan-400" },
  { text: "Key concept?", icon: BookOpen, color: "from-teal-300 to-emerald-400" },
];

function renderMathInText(text: string): string {
  let result = text;
  
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
  
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  return result;
}

function MathText({ content, className }: { content: string; className?: string }) {
  const html = renderMathInText(content);
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export function CutePenguin({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      className={className}
    >
      {/* Left flipper */}
      <ellipse cx="18" cy="52" rx="12" ry="24" fill="#2d3436" transform="rotate(-25 18 52)" />
      {/* Right flipper */}
      <ellipse cx="82" cy="52" rx="12" ry="24" fill="#2d3436" transform="rotate(25 82 52)" />
      
      {/* Main body - black outer */}
      <ellipse cx="50" cy="55" rx="35" ry="40" fill="#2d3436" />
      
      {/* White belly - large oval */}
      <ellipse cx="50" cy="60" rx="26" ry="32" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
      
      {/* Head - black top portion that connects to body */}
      <path d="M20 45 Q20 15 50 15 Q80 15 80 45 Q80 55 50 55 Q20 55 20 45" fill="#2d3436" />
      
      {/* White face area */}
      <ellipse cx="50" cy="42" rx="22" ry="18" fill="#ffffff" />
      
      {/* Left eye white */}
      <ellipse cx="38" cy="40" rx="9" ry="10" fill="#ffffff" />
      {/* Right eye white */}
      <ellipse cx="62" cy="40" rx="9" ry="10" fill="#ffffff" />
      
      {/* Left pupil */}
      <circle cx="39" cy="41" r="5" fill="#2d3436" />
      {/* Right pupil */}
      <circle cx="61" cy="41" r="5" fill="#2d3436" />
      
      {/* Left eye highlight */}
      <circle cx="41" cy="39" r="2" fill="#ffffff" />
      {/* Right eye highlight */}
      <circle cx="63" cy="39" r="2" fill="#ffffff" />
      
      {/* Beak - diamond shape */}
      <path d="M50 46 L44 52 L50 58 L56 52 Z" fill="#f5a623" />
      
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
    </svg>
  );
}

function SnowflakeDecor() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${10 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, 10, 0],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <Snowflake size={12 + i * 2} />
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
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function TutorAvatar({ isAnimating = false, large = false }: { isAnimating?: boolean; large?: boolean }) {
  const containerSize = large ? "w-24 h-24" : "w-11 h-11";
  const penguinSize = large ? 60 : 32;
  
  return (
    <motion.div 
      className={`relative ${containerSize} rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 flex items-center justify-center shrink-0 shadow-lg overflow-hidden border-2 border-sky-200/50 dark:border-slate-500/50`}
      animate={isAnimating ? {
        y: [0, -4, 0],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        animate={isAnimating ? { rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <CutePenguin size={penguinSize} />
      </motion.div>
    </motion.div>
  );
}

export function QuizChatbot({ quizTitle, questions, currentQuestionIndex, sourceMaterial, isOpen, onClose }: QuizChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, timestamp: Date.now() }]);
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
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col overflow-hidden border-l-0 shadow-2xl">
        <SheetHeader className="px-5 py-5 bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 text-white shrink-0 relative overflow-hidden">
          <SnowflakeDecor />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/10 to-transparent" />
            <motion.div 
              className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30 overflow-hidden"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <CutePenguin size={48} />
            </motion.div>
            <div className="text-left flex-1">
              <SheetTitle className="text-white text-xl font-bold tracking-tight flex items-center gap-2">
                Penny
                <Snowflake className="w-4 h-4 opacity-80" />
              </SheetTitle>
              <p className="text-sm text-white/90 mt-1">Your arctic study buddy</p>
            </div>
          </div>
        </SheetHeader>

        {currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-3 border-b bg-gradient-to-r from-sky-50/80 to-cyan-50/80 dark:from-slate-800/80 dark:to-slate-700/80 shrink-0"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-bold text-white">{currentQuestionIndex + 1}</span>
              </div>
              <div className="text-sm line-clamp-2 text-muted-foreground leading-relaxed">
                <MathText content={currentQuestion.question} />
              </div>
            </div>
          </motion.div>
        )}

        <ScrollArea className="flex-1 px-4 py-4 bg-gradient-to-b from-sky-50/30 to-transparent dark:from-slate-900/30" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-full flex flex-col items-center justify-center text-center py-6"
            >
              <motion.div 
                className="relative mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 flex items-center justify-center shadow-xl overflow-hidden border-3 border-sky-200/60 dark:border-slate-500/50"
                  animate={{ 
                    boxShadow: [
                      "0 10px 40px -10px rgba(14, 165, 233, 0.3)",
                      "0 20px 50px -10px rgba(14, 165, 233, 0.5)",
                      "0 10px 40px -10px rgba(14, 165, 233, 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <CutePenguin size={80} />
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-700"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Snowflake className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h3 
                className="text-xl font-bold mb-2 bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Hey there, friend!
              </motion.h3>
              <motion.p 
                className="text-sm text-muted-foreground max-w-[260px] mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                I'm Penny, your arctic study companion! Ask me anything about this quiz - I'll help you learn without giving away the answers.
              </motion.p>
              
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12 rounded-xl border-sky-200/60 dark:border-slate-600 hover:border-sky-300 dark:hover:border-slate-500 hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-all group"
                      onClick={() => {
                        setInputValue(suggestion.text);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${suggestion.text.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                        <suggestion.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{suggestion.text}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      delay: message.role === "assistant" ? 0.1 : 0
                    }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <TutorAvatar isAnimating={index === messages.length - 1} />
                    )}
                    <motion.div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-sky-500 to-cyan-600 text-white rounded-br-md shadow-sky-500/20"
                          : "bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-bl-md"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed [&_.katex-display]:my-3 [&_.katex]:text-[0.95em]">
                        <MathText content={message.content} />
                      </div>
                    </motion.div>
                    {message.role === "user" && (
                      <motion.div 
                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-md border border-slate-200/50 dark:border-slate-600/50"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <TutorAvatar isAnimating />
                  <motion.div 
                    className="bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <TypingIndicator />
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        <motion.div 
          className="p-4 border-t bg-gradient-to-r from-sky-50/80 to-cyan-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-md shrink-0"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Penny anything..."
              className="flex-1 h-12 rounded-xl border-sky-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus-visible:ring-sky-400/30 focus-visible:border-sky-400 transition-all placeholder:text-muted-foreground/60"
              disabled={isLoading}
              data-testid="input-chatbot-message"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 disabled:opacity-50 disabled:shadow-none"
                data-testid="button-chatbot-send"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
