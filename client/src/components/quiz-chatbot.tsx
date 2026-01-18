import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
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
  { text: "Explain this", icon: Lightbulb },
  { text: "Give me a hint", icon: HelpCircle },
  { text: "Key concept?", icon: BookOpen },
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
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." },
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-4 py-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="flex items-center gap-3 relative z-10">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div className="text-left">
              <SheetTitle className="text-white text-lg font-bold">Quiz Assistant</SheetTitle>
              <p className="text-sm text-white/80">I'm here to help you learn</p>
            </div>
          </div>
        </SheetHeader>

        {currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 border-b bg-gradient-to-r from-muted/80 to-muted/40 shrink-0"
          >
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{currentQuestionIndex + 1}</span>
              </div>
              <div className="text-sm line-clamp-2 text-muted-foreground">
                <MathText content={currentQuestion.question} />
              </div>
            </div>
          </motion.div>
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-8"
            >
              <motion.div 
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-5 shadow-lg"
                animate={{ 
                  y: [0, -8, 0],
                  boxShadow: [
                    "0 10px 30px -10px rgba(139, 92, 246, 0.3)",
                    "0 20px 40px -10px rgba(139, 92, 246, 0.4)",
                    "0 10px 30px -10px rgba(139, 92, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="w-10 h-10 text-violet-600 dark:text-violet-400" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Hey there!</h3>
              <p className="text-sm text-muted-foreground max-w-[220px] mb-6">
                Need help understanding something? I'll guide you without giving away the answer.
              </p>
              <div className="flex flex-wrap gap-2 justify-center px-4">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                      onClick={() => {
                        setInputValue(suggestion.text);
                        inputRef.current?.focus();
                      }}
                      data-testid={`button-suggestion-${suggestion.text.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <suggestion.icon className="w-3.5 h-3.5 text-violet-500" />
                      {suggestion.text}
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
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <motion.div 
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-md"
                          : "bg-muted/80 rounded-bl-md border border-border/50"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed [&_.katex-display]:my-2 [&_.katex]:text-[0.95em]">
                        <MathText content={message.content} />
                      </div>
                    </div>
                    {message.role === "user" && (
                      <motion.div 
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-md"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
                  className="flex gap-2.5 justify-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 border border-border/50">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span 
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-400"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ 
                            duration: 0.6, 
                            repeat: Infinity, 
                            delay: i * 0.15,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 h-11 rounded-xl border-violet-200 dark:border-violet-800/50 focus-visible:ring-violet-500/30 focus-visible:border-violet-400"
              disabled={isLoading}
              data-testid="input-chatbot-message"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
              data-testid="button-chatbot-send"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
