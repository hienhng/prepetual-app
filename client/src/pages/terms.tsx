import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle, Scale, UserPlus, FileSignature, AlertCircle, Info, HelpCircle, Bot } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";

export default function TermsOfService() {
  const { language } = useLanguage();

  const ui = language === "vi"
    ? {
        back: "Quay lại trang chủ",
        title: "Điều khoản dịch vụ",
        subtitle: "Vui lòng đọc kỹ các điều khoản này trước khi sử dụng nền tảng của chúng tôi.",
        updated: "Cập nhật lần cuối: 19 tháng 12, 2025",
        footer: "Khi sử dụng Prepetual, bạn đồng ý với các điều khoản này. Nếu có câu hỏi, vui lòng liên hệ tại",
        sections: [
          { id: "1", title: "Chấp nhận điều khoản", icon: CheckCircle, content: "Khi truy cập và sử dụng Prepetual (\"Dịch vụ\"), bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ." },
          { id: "2", title: "Mô tả dịch vụ", icon: Info, content: "Prepetual là nền tảng tạo quiz bằng AI cho phép người dùng tải tài liệu học tập lên và tạo các bài quiz tương tác. Dịch vụ bao gồm xử lý tài liệu, tạo câu hỏi bằng AI, làm quiz và theo dõi kết quả." },
          { id: "3", title: "Tài khoản người dùng", icon: UserPlus, content: "Để sử dụng một số tính năng nhất định, bạn cần đăng ký tài khoản. Bạn đồng ý cung cấp thông tin chính xác và bảo vệ mật khẩu của mình. Bạn chịu trách nhiệm cho mọi hoạt động diễn ra dưới tài khoản của mình." },
          { id: "4", title: "Nội dung của người dùng", icon: FileSignature, content: "Bạn vẫn sở hữu nội dung mình tải lên. Khi tải lên, bạn cấp cho chúng tôi quyền không độc quyền để xử lý và lưu trữ nội dung đó chỉ nhằm cung cấp Dịch vụ. Bạn phải đảm bảo mình có quyền tải lên bất kỳ nội dung nào bạn gửi." },
          { id: "5", title: "Sử dụng được chấp nhận", icon: AlertCircle, content: (
            <div className="space-y-4">
              <p>Bạn đồng ý không:</p>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Sử dụng cho mục đích bất hợp pháp</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Xâm phạm quyền sở hữu trí tuệ</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Truy cập trái phép</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Gây gián đoạn máy chủ hoặc dịch vụ</li>
              </ul>
            </div>
          ) },
          { id: "6", title: "Nội dung do AI tạo", icon: HelpCircle, content: "Các bài quiz được AI tạo dựa trên nội dung của bạn. Dù chúng tôi luôn cố gắng đảm bảo độ chính xác, chúng tôi không cam kết rằng mọi câu hỏi được tạo ra đều hoàn toàn đúng. Vui lòng tự kiểm chứng các thông tin quan trọng." },
          { id: "7", title: "Trợ lý AI Pip", icon: Bot, content: "Pip là người bạn đồng hành học tập bằng AI được thiết kế để hỗ trợ bạn học tốt hơn. Pip đưa ra gợi ý và giải thích nhưng được cố ý thiết kế để không cung cấp đáp án trực tiếp. Dù Pip luôn cố gắng hữu ích và chính xác, các phản hồi vẫn do AI tạo ra và nên được kiểm chứng với nội dung học quan trọng." },
          { id: "8", title: "Giới hạn trách nhiệm", icon: Scale, content: "Trong mọi trường hợp, Prepetual hoặc các bên liên kết sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả nào phát sinh từ việc bạn sử dụng dịch vụ." },
        ],
      }
    : {
        back: "Back to Home",
        title: "Terms of Service",
        subtitle: "Please read these terms carefully before using our platform.",
        updated: "Last updated: December 19, 2025",
        footer: "By using Prepetual, you agree to these terms. If you have questions, please reach out at",
        sections: [
          { id: "1", title: "Acceptance of Terms", icon: CheckCircle, content: "By accessing and using Prepetual (\"the Service\"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service." },
          { id: "2", title: "Description of Service", icon: Info, content: "Prepetual is an AI-powered quiz generation platform that allows users to upload study materials and generate interactive quizzes. The Service includes document processing, AI-based question generation, quiz taking, and result tracking features." },
          { id: "3", title: "User Accounts", icon: UserPlus, content: "To access certain features, you must register for an account. You agree to provide accurate information and safeguard your password. You are responsible for all activities that occur under your account." },
          { id: "4", title: "User Content", icon: FileSignature, content: "You retain ownership of content you upload. By uploading, you grant us a non-exclusive license to process and store your content solely to provide the Service. You must ensure you have the right to upload any content you submit." },
          { id: "5", title: "Acceptable Use", icon: AlertCircle, content: (
            <div className="space-y-4">
              <p>You agree not to:</p>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Use for unlawful purposes</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Infringe on IP rights</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Gain unauthorized access</li>
                <li className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-red-500" />Disrupt servers or service</li>
              </ul>
            </div>
          ) },
          { id: "6", title: "AI-Generated Content", icon: HelpCircle, content: "Quizzes are generated by AI based on your content. While we strive for accuracy, we do not guarantee generated questions are correct. Please verify important information independently." },
          { id: "7", title: "Pip AI Assistant", icon: Bot, content: "Pip is our AI study companion designed to help you learn. Pip provides hints and explanations but is intentionally designed not to give direct answers. While Pip strives to be helpful and accurate, responses are AI-generated and should be verified for critical educational content. Pip's goal is to guide your learning journey, not replace independent study and verification." },
          { id: "8", title: "Limitation of Liability", icon: Scale, content: "In no event shall Prepetual or its affiliates be liable for any indirect, incidental, or consequential damages arising from your use of the service." },
        ],
      };

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-16 flex flex-col items-center text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8 rounded-full hover:bg-primary/10" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {ui.back}
              </Button>
            </Link>

            <div className="mb-6 rounded-3xl bg-primary/10 p-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-4 text-5xl font-black tracking-tight text-foreground">{ui.title}</h1>
            <p className="max-w-2xl text-xl text-muted-foreground">{ui.subtitle}</p>
            <div className="mt-6 inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">{ui.updated}</div>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-6">
            {ui.sections.map((section, index) => (
              <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                <Card className="overflow-hidden border-primary/5 bg-card/50 shadow-sm backdrop-blur">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="mt-1 flex-shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                          {section.id}. {section.title}
                        </h2>
                        <div className="text-lg leading-relaxed text-muted-foreground">{section.content}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl border border-primary/5 bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              {ui.footer}{" "}
              <a href="mailto:giahienhn@gmail.com" className="font-bold text-primary underline-offset-4 hover:underline">
                giahienhn@gmail.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
