import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Lightbulb, HelpCircle, BookOpen, Brain } from "lucide-react";
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

function TutorAvatar({ isAnimating = false }: { isAnimating?: boolean }) {
  return (
    <motion.div 
      className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20"
      animate={isAnimating ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 opacity-0"
        animate={isAnimating ? { opacity: [0, 0.5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <Brain className="w-4.5 h-4.5 text-white relative z-10" />
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background"
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
              className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20"
              animate={{ 
                rotate: [0, 3, -3, 0],
                y: [0, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
            </motion.div>
            <div className="text-left flex-1">
              <SheetTitle className="text-white text-xl font-bold tracking-tight">Study Buddy</SheetTitle>
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
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-indigo-500/20 flex items-center justify-center shadow-xl"
                  animate={{ 
                    boxShadow: [
                      "0 10px 40px -10px rgba(139, 92, 246, 0.3)",
                      "0 20px 50px -10px rgba(139, 92, 246, 0.45)",
                      "0 10px 40px -10px rgba(139, 92, 246, 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="w-12 h-12 text-violet-600 dark:text-violet-400" />
                  </motion.div>
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
