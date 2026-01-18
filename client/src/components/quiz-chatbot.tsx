import { useState, useRef, useEffect } from "react";
import { Send, Loader2, User, Sparkles, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
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
  { text: "Explain this", icon: Lightbulb, color: "from-amber-400 to-orange-500" },
  { text: "Give me a hint", icon: HelpCircle, color: "from-emerald-400 to-teal-500" },
  { text: "Key concept?", icon: BookOpen, color: "from-blue-400 to-indigo-500" },
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function PenguinMascot({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      className={className}
    >
      <ellipse cx="32" cy="38" rx="20" ry="22" fill="#1a1a2e" />
      <ellipse cx="32" cy="40" rx="14" ry="16" fill="#f8f9fa" />
      <circle cx="32" cy="18" r="16" fill="#1a1a2e" />
      <ellipse cx="32" cy="20" rx="10" ry="8" fill="#f8f9fa" />
      <motion.g
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      >
        <ellipse cx="26" cy="17" rx="4" ry="5" fill="#f8f9fa" />
        <ellipse cx="38" cy="17" rx="4" ry="5" fill="#f8f9fa" />
        <circle cx="26" cy="17" r="2.5" fill="#1a1a2e" />
        <circle cx="38" cy="17" r="2.5" fill="#1a1a2e" />
        <circle cx="27" cy="16" r="1" fill="#fff" />
        <circle cx="39" cy="16" r="1" fill="#fff" />
      </motion.g>
      <ellipse cx="32" cy="24" rx="3" ry="2" fill="#ff9f43" />
      <path d="M29 23 L32 28 L35 23" fill="#ff9f43" />
      <motion.ellipse 
        cx="22" cy="18" 
        rx="2" ry="1.5" 
        fill="#ff6b9d"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.ellipse 
        cx="42" cy="18" 
        rx="2" ry="1.5" 
        fill="#ff6b9d"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M10 32 Q6 40 12 50"
        stroke="#1a1a2e"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [0, -5, 0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: "12px 40px" }}
      />
      <motion.path
        d="M54 32 Q58 40 52 50"
        stroke="#1a1a2e"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: "52px 40px" }}
      />
      <ellipse cx="26" cy="58" rx="5" ry="3" fill="#ff9f43" />
      <ellipse cx="38" cy="58" rx="5" ry="3" fill="#ff9f43" />
    </svg>
  );
}

function TutorAvatar({ isAnimating = false, large = false }: { isAnimating?: boolean; large?: boolean }) {
  const size = large ? "w-20 h-20" : "w-10 h-10";
  const penguinSize = large ? 52 : 28;
  
  return (
    <motion.div 
      className={`relative ${size} rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0 shadow-lg overflow-hidden`}
      animate={isAnimating ? {
        y: [0, -2, 0],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <PenguinMascot size={penguinSize} />
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
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
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again.", timestamp: Date.now() },
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
        <SheetHeader className="px-5 py-5 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-indigo-400/20 blur-xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20 overflow-hidden"
              animate={{ 
                y: [0, -3, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <PenguinMascot size={42} />
            </motion.div>
            <div className="text-left flex-1">
              <SheetTitle className="text-white text-xl font-bold tracking-tight">Penny the Penguin</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-sm text-white/80">Online and ready to help</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 py-3 border-b bg-muted/30 shrink-0"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{currentQuestionIndex + 1}</span>
              </div>
              <div className="text-sm line-clamp-2 text-muted-foreground leading-relaxed">
                <MathText content={currentQuestion.question} />
              </div>
            </div>
          </motion.div>
        )}

        <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-full flex flex-col items-center justify-center text-center py-6"
            >
              <motion.div 
                className="relative mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-28 h-28 rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 flex items-center justify-center shadow-xl overflow-hidden"
                  animate={{ 
                    boxShadow: [
                      "0 10px 40px -10px rgba(139, 92, 246, 0.25)",
                      "0 20px 50px -10px rgba(139, 92, 246, 0.4)",
                      "0 10px 40px -10px rgba(139, 92, 246, 0.25)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PenguinMascot size={72} />
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h3 
                className="text-xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Hey there!
              </motion.h3>
              <motion.p 
                className="text-sm text-muted-foreground max-w-[260px] mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                I'm your personal study buddy. Ask me anything about this quiz - I'll help you understand without spoiling the answers.
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
                      className="w-full justify-start gap-3 h-12 rounded-xl border-border/50 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all group"
                      onClick={() => {
                        setInputValue(suggestion.text);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${suggestion.text.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
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
                          ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-md shadow-violet-500/20"
                          : "bg-card border border-border/50 rounded-bl-md"
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
                        className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-md"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <TutorAvatar isAnimating />
                  <motion.div 
                    className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3"
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
          className="p-4 border-t bg-background/95 backdrop-blur-md shrink-0"
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
              placeholder="Ask me anything..."
              className="flex-1 h-12 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-violet-500/30 focus-visible:border-violet-400 transition-all placeholder:text-muted-foreground/60"
              disabled={isLoading}
              data-testid="input-chatbot-message"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50 disabled:shadow-none"
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
