import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, UserCheck, MessageCircle, Bot } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const ui = language === "vi"
    ? {
        back: "Quay lại trang chủ",
        title: "Chính sách riêng tư",
        subtitle: "Chúng tôi coi trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân của bạn.",
        updated: "Cập nhật lần cuối: 19 tháng 12, 2025",
        contactTitle: "Có câu hỏi về quyền riêng tư?",
        contactDescription: "Đội ngũ của chúng tôi luôn sẵn sàng giúp bạn hiểu rõ cách chúng tôi quản lý thông tin của bạn.",
        contactButton: "Liên hệ đội ngũ quyền riêng tư",
        sections: [
          { id: "1", title: "Giới thiệu", icon: Globe, content: "Prepetual (\"chúng tôi\") cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi bạn sử dụng dịch vụ tạo quiz bằng AI của chúng tôi." },
          { id: "2", title: "Thông tin chúng tôi thu thập", icon: Database, content: (
            <div className="space-y-3">
              <p>Chúng tôi thu thập thông tin theo các cách sau:</p>
              <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Tài khoản:</strong> Email, tên và mật khẩu khi bạn đăng ký</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Nội dung:</strong> Tài liệu, hình ảnh và văn bản bạn tải lên</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Sử dụng:</strong> Hiệu suất, hoạt động học tập và thói quen sử dụng</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Thiết bị:</strong> Loại trình duyệt, địa chỉ IP và các mã định danh</span></li>
              </ul>
            </div>
          ) },
          { id: "3", title: "Cách chúng tôi sử dụng thông tin của bạn", icon: Eye, content: "Chúng tôi sử dụng thông tin thu thập được để cung cấp và duy trì dịch vụ, xử lý tài liệu bạn tải lên, theo dõi tiến độ, gửi các cập nhật quan trọng, cải thiện thuật toán AI và bảo vệ khỏi các mối đe dọa bảo mật." },
          { id: "4", title: "Xử lý tài liệu", icon: Lock, content: "Khi bạn tải tài liệu lên, chúng sẽ được xử lý bởi hệ thống AI để trích xuất văn bản và tạo câu hỏi. Tài liệu của bạn được lưu trữ an toàn và chỉ bạn mới có thể truy cập. Chúng tôi không chia sẻ nội dung của bạn với bên thứ ba ngoài các nhu cầu xử lý AI cần thiết." },
          { id: "5", title: "Trợ lý AI Pip", icon: Bot, content: "Pip sử dụng nội dung quiz và lịch sử trò chuyện trong từng phiên để cung cấp gợi ý và giải thích hữu ích. Các cuộc trò chuyện với Pip không được lưu vĩnh viễn và sẽ bị xóa khi bạn đóng quiz. Pip không có quyền truy cập vào thông tin tài khoản cá nhân ngoài ngữ cảnh quiz hiện tại." },
          { id: "6", title: "Lưu trữ dữ liệu", icon: Shield, content: "Chúng tôi giữ thông tin tài khoản và quiz của bạn trong thời gian tài khoản còn hoạt động. Tài liệu tải lên có thể được lưu tạm thời để xử lý rồi xóa. Bạn có thể yêu cầu xóa dữ liệu của mình bất kỳ lúc nào." },
          { id: "7", title: "Bảo mật", icon: UserCheck, content: "Chúng tôi áp dụng các biện pháp bảo mật theo tiêu chuẩn ngành để bảo vệ dữ liệu của bạn, bao gồm mã hóa khi truyền và lưu trữ, xác thực an toàn và kiểm tra bảo mật định kỳ." },
        ],
      }
    : {
        back: "Back to Home",
        title: "Privacy Policy",
        subtitle: "We value your privacy and are committed to protecting your personal data.",
        updated: "Last updated: December 19, 2025",
        contactTitle: "Questions about your privacy?",
        contactDescription: "Our team is always here to help you understand how we manage your information.",
        contactButton: "Contact Privacy Team",
        sections: [
          { id: "1", title: "Introduction", icon: Globe, content: "Prepetual (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered quiz generation service." },
          { id: "2", title: "Information We Collect", icon: Database, content: (
            <div className="space-y-3">
              <p>We collect information in the following ways:</p>
              <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Account:</strong> Email, name, and password when you register</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Content:</strong> Documents, images, and text you upload</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Usage:</strong> Performance, study activity, and patterns</span></li>
                <li className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3"><div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" /><span><strong>Device:</strong> Browser type, IP address, and identifiers</span></li>
              </ul>
            </div>
          ) },
          { id: "3", title: "How We Use Your Information", icon: Eye, content: "We use the information we collect to provide and maintain our service, process your uploaded documents, track your progress, send important updates, improve our AI algorithms, and protect against security threats." },
          { id: "4", title: "Document Processing", icon: Lock, content: "When you upload documents, they are processed by our AI systems to extract text and generate questions. Your documents are stored securely and are only accessible to you. We do not share your content with third parties except as necessary for AI processing." },
          { id: "5", title: "Pip AI Assistant", icon: Bot, content: "Our AI study assistant, Pip, uses your quiz content and conversation history within each session to provide helpful explanations and hints. Chat conversations with Pip are not stored permanently and are cleared when you close the quiz. Pip does not have access to your personal account information beyond your current quiz context." },
          { id: "6", title: "Data Retention", icon: Shield, content: "We retain your account information and quizzes for as long as your account is active. Uploaded documents may be temporarily stored for processing and then deleted. You can request deletion of your data at any time." },
          { id: "7", title: "Security", icon: UserCheck, content: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits." },
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
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-4 text-5xl font-black tracking-tight text-foreground">{ui.title}</h1>
            <p className="max-w-2xl text-xl text-muted-foreground">{ui.subtitle}</p>
            <div className="mt-6 inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">{ui.updated}</div>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-6">
            {ui.sections.map((section, index) => (
              <motion.div key={section.id} initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }}>
                <Card className="overflow-hidden border-primary/5 bg-card/50 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
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

          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
            <div className="absolute right-0 top-0 p-8 opacity-10">
              <MessageCircle className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <h3 className="mb-4 text-3xl font-black">{ui.contactTitle}</h3>
              <p className="mx-auto mb-8 max-w-xl text-xl text-muted-foreground">{ui.contactDescription}</p>
              <a href="mailto:giahienhn@gmail.com">
                <Button size="lg" className="rounded-full px-10 font-bold shadow-lg shadow-primary/20">
                  {ui.contactButton}
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
