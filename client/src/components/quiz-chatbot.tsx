import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Sparkles, Loader2, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
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
}

export function QuizChatbot({ quizTitle, questions, currentQuestionIndex, sourceMaterial }: QuizChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

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

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-primary/20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Quiz Assistant</h3>
                    <p className="text-xs opacity-80">Ask me anything about this quiz</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                    data-testid="button-chatbot-minimize"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleOpen}
                    className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                    data-testid="button-chatbot-close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ScrollArea className="h-[320px] p-4" ref={scrollAreaRef}>
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium mb-1">Hi! I'm your quiz assistant</p>
                          <p className="text-xs max-w-[200px]">
                            Ask me to explain concepts, give hints, or help you understand the material.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {["Explain this question", "Give me a hint", "What's the key concept?"].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => {
                                  setInputValue(suggestion);
                                  inputRef.current?.focus();
                                }}
                                data-testid={`button-suggestion-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              {message.role === "assistant" && (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <Bot className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                  message.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted rounded-bl-sm"
                                }`}
                              >
                                {message.content}
                              </div>
                              {message.role === "user" && (
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                            </motion.div>
                          ))}
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2 justify-start"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="p-3 border-t bg-card">
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about this question..."
                          className="flex-1 h-9 text-sm"
                          disabled={isLoading}
                          data-testid="input-chatbot-message"
                        />
                        <Button
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          className="h-9 w-9"
                          data-testid="button-chatbot-send"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-chatbot-toggle"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
