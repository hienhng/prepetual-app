import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, BookOpen, Lock, FileText, Brain, Share2, BarChart3, Globe, Edit3, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/lib/language-context";

export default function FAQ() {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ui = language === "vi"
    ? {
        back: "Quay lại trang chủ",
        title: "Câu hỏi thường gặp",
        subtitle: "Mọi điều bạn cần biết về Prepetual và cách tận dụng tối đa các buổi học của mình.",
        still: "Vẫn còn thắc mắc?",
        contact: "Liên hệ hỗ trợ",
        faqs: [
          { id: "item-1", question: "Tạo quiz — Import và Generate khác nhau như thế nào?", answer: "Import phân tích đề thi để xác định đáp án bằng kiến thức AI, còn Generate tạo ra các câu hỏi hoàn toàn mới dựa trên nội dung tài liệu học của bạn.", icon: BookOpen },
          { id: "item-2", question: "Vì sao tôi không xem được lời giải thích?", answer: "Lời giải chi tiết là tính năng nâng cao. Khách có thể làm quiz để kiểm tra kiến thức, nhưng lời giải đầy đủ chỉ dành cho người dùng đã đăng ký. Đăng ký miễn phí để mở khóa.", icon: Lock },
          { id: "item-3", question: "Những loại tệp nào được hỗ trợ?", answer: "Chúng tôi hỗ trợ PDF và nhiều định dạng ảnh khác nhau như PNG, JPG. Công nghệ OCR nâng cao có thể xử lý tài liệu scan và ảnh chụp ghi chú giấy với độ chính xác cao.", icon: FileText },
          { id: "item-4", question: "Study Mode hoạt động như thế nào?", answer: "Study Mode dùng cơ chế dạng flashcard. 'Known' nghĩa là bạn đã nắm vững, còn 'Learning' đánh dấu để xem lại thêm. AI dùng các tín hiệu này để giúp bạn tập trung vào điểm yếu.", icon: Brain },
          { id: "item-5", question: "Khi chia sẻ quiz, người khác sẽ thấy gì?", answer: "Khi bạn chia sẻ quiz, người khác có thể xem câu hỏi và làm quiz. Kết quả cá nhân và lịch sử của bạn vẫn chỉ hiển thị trong tài khoản của bạn.", icon: Share2 },
          { id: "item-6", question: "Mức độ khó được xác định như thế nào?", answer: "Mức độ khó điều chỉnh độ phức tạp của câu hỏi và chiều sâu hiểu biết cần có. 'Easy' tập trung vào kiến thức cốt lõi, còn 'Hard' thử thách bạn với câu hỏi khái niệm và phân tích.", icon: BarChart3 },
          { id: "item-7", question: "Hệ thống hỗ trợ những ngôn ngữ nào?", answer: "AI của chúng tôi tự động nhận diện ngôn ngữ của tài liệu nguồn và tạo câu hỏi bằng chính ngôn ngữ đó. Chúng tôi hỗ trợ nhiều ngôn ngữ để mang lại trải nghiệm học tập toàn cầu.", icon: Globe },
          { id: "item-8", question: "Tôi có thể chỉnh sửa câu hỏi trong quiz không?", answer: "Có. Bạn có thể sửa bất kỳ câu hỏi nào do AI tạo ra, thêm câu hỏi của riêng mình hoặc xóa câu hỏi trước khi bắt đầu làm quiz hoặc chia sẻ.", icon: Edit3 },
          { id: "item-9", question: "Pip AI Assistant có thể giúp tôi như thế nào?", answer: "Pip là người bạn đồng hành học tập cá nhân của bạn trong mọi bài quiz. Pip có thể giải thích khái niệm khó, đưa gợi ý và hỗ trợ công thức toán học. Pip sẽ dẫn dắt bạn đến đáp án thay vì đưa đáp án trực tiếp.", icon: MessageCircle },
        ],
      }
    : {
        back: "Back to Home",
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know about Prepetual and how to make the most of your study sessions.",
        still: "Still have questions?",
        contact: "Contact Support",
        faqs: [
          { id: "item-1", question: "Quiz Creation — What is the difference between Import and Generate?", answer: "Import parses exam papers to identify answers using AI knowledge, while Generate creates entirely new questions based on the content of your study materials.", icon: BookOpen },
          { id: "item-2", question: "Why can't I see explanations?", answer: "Detailed explanations are a premium feature. Guests can take quizzes to test their knowledge, but full explanations are only available to registered users. Sign up for free to unlock them!", icon: Lock },
          { id: "item-3", question: "What file types work?", answer: "We support PDF documents and various image formats (PNG, JPG). Our advanced OCR technology handles scanned documents and photos of physical notes with high precision.", icon: FileText },
          { id: "item-4", question: "Study Mode - How does it work?", answer: "Study Mode uses a flashcard-style system. 'Known' indicates you've mastered the concept, while 'Learning' marks it for further review. The AI uses these signals to help you focus on your weak areas.", icon: Brain },
          { id: "item-5", question: "Quiz sharing - What can people see?", answer: "When you share a quiz, others can see the questions and take the quiz. However, your personal results and history remain private to your account.", icon: Share2 },
          { id: "item-6", question: "Difficulty levels - What makes a quiz \"easy\" vs \"hard\"?", answer: "Difficulty levels adjust the complexity of questions and the depth of understanding required. 'Easy' focuses on core facts, while 'Hard' challenges you with conceptual and analytical questions.", icon: BarChart3 },
          { id: "item-7", question: "Global support - Which languages are supported?", answer: "Our AI auto-detects the language of your source material and generates questions in that same language. We support numerous languages worldwide for a truly global learning experience.", icon: Globe },
          { id: "item-8", question: "Editing quizzes - Can I change the questions?", answer: "Yes! You can modify any AI-generated question, add your own, or remove questions before you start taking the quiz or sharing it.", icon: Edit3 },
          { id: "item-9", question: "Pip AI Assistant - How can it help me?", answer: "Pip is your personal study companion available during any quiz. Pip can explain complex concepts, provide hints, and even render mathematical formulas. Pip's goal is to help you learn, so it will guide you toward the answer without simply giving it away.", icon: MessageCircle },
        ],
      };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/">
            <Button variant="ghost" className="group mb-8" data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {ui.back}
            </Button>
          </Link>

          <div className="mb-16 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <HelpCircle className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              {ui.title.split(" ").slice(0, -1).join(" ")} <span className="text-primary">{ui.title.split(" ").slice(-1)}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{ui.subtitle}</p>
          </div>

          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {ui.faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="rounded-xl border bg-background/50 px-4 transition-all hover:border-primary/50 data-[state=open]:border-primary/50 data-[state=open]:bg-primary/[0.02] md:px-6">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <faq.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-lg font-semibold">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2 text-base leading-relaxed text-muted-foreground">
                      <div className="pl-12">{faq.answer}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-16 text-center">
            <p className="mb-4 text-muted-foreground">{ui.still}</p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                {ui.contact}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
