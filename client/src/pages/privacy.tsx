import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const ui = language === "vi"
    ? {
        back: "Quay lại",
        title: "Chính sách Bảo mật",
        updated: "Cập nhật lần cuối: 2 tháng 5, 2026",
        sections: [
          {
            title: "1. Giới thiệu",
            content: "Chào mừng bạn đến với Prepetual. Chúng tôi cam kết bảo mật thông tin cá nhân và quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập và bảo vệ dữ liệu khi bạn sử dụng nền tảng học tập của chúng tôi."
          },
          {
            title: "2. Dữ liệu chúng tôi thu thập",
            content: (
              <div className="space-y-4">
                <p>Chúng tôi thu thập các loại thông tin sau:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Thông tin tài khoản:</strong> Tên, địa chỉ email và mật khẩu khi bạn đăng ký.</li>
                  <li><strong>Nội dung người dùng:</strong> Tài liệu (PDF, hình ảnh) và văn bản bạn tải lên để tạo quiz.</li>
                  <li><strong>Dữ liệu sử dụng:</strong> Thông tin về cách bạn tương tác với ứng dụng và kết quả học tập.</li>
                </ul>
              </div>
            )
          },
          {
            title: "3. Xử lý dữ liệu AI",
            content: "Prepetual sử dụng trí tuệ nhân tạo để phân tích tài liệu của bạn. Dữ liệu này được xử lý riêng tư. Chúng tôi không sử dụng nội dung cá nhân của bạn để huấn luyện các mô hình AI công khai của bên thứ ba mà không có sự cho phép của bạn."
          },
          {
            title: "4. Chia sẻ với bên thứ ba",
            content: "Chúng tôi không bán dữ liệu của bạn. Thông tin có thể được chia sẻ với các nhà cung cấp dịch vụ (như lưu trữ đám mây hoặc API AI) chỉ nhằm mục đích vận hành các tính năng của ứng dụng."
          },
          {
            title: "5. Bảo mật",
            content: "Dữ liệu của bạn được bảo vệ bằng mã hóa tiêu chuẩn ngành. Chúng tôi thực hiện các biện pháp kỹ thuật để ngăn chặn truy cập trái phép hoặc rò rỉ thông tin."
          },
          {
            title: "6. Quyền của bạn",
            content: "Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào thông qua phần cài đặt tài khoản."
          },
          {
            title: "7. Liên hệ",
            content: "Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: giahienhn@gmail.com"
          }
        ]
      }
    : {
        back: "Back",
        title: "Privacy Policy",
        updated: "Last updated: May 2, 2026",
        sections: [
          {
            title: "1. Introduction",
            content: "Welcome to Prepetual. We are committed to protecting your personal information and your right to privacy. This policy outlines our practices regarding data collection and protection."
          },
          {
            title: "2. Information We Collect",
            content: (
              <div className="space-y-4">
                <p>We collect information that you provide directly to us:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Account Data:</strong> Name, email address, and credentials.</li>
                  <li><strong>User Content:</strong> Documents (PDFs, images) and text uploaded for quiz generation.</li>
                  <li><strong>Usage Data:</strong> Information on how you use our service and your learning progress.</li>
                </ul>
              </div>
            )
          },
          {
            title: "3. AI Data Processing",
            content: "Prepetual utilizes AI to analyze your uploaded documents. This processing is done in a secure environment. We do not use your private content to train third-party public AI models without explicit consent."
          },
          {
            title: "4. Third-Party Sharing",
            content: "We do not sell your personal data. We only share information with service providers (such as cloud hosting or AI processing APIs) necessary to deliver our services."
          },
          {
            title: "5. Data Security",
            content: "We implement industry-standard encryption to safeguard your data. We take technical measures to prevent unauthorized access or data breaches."
          },
          {
            title: "6. Your Rights",
            content: "You have the right to access, rectify, or request the deletion of your personal data at any time via your account settings."
          },
          {
            title: "7. Contact Us",
            content: "For any questions regarding this policy, please reach out to us at: giahienhn@gmail.com"
          }
        ]
      };

  return (
    <div className="min-h-screen bg-background text-foreground font-['DM_Sans',sans-serif] transition-colors duration-300">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.4 }}
        >
          {/* Back Navigation */}
          <div className="mb-10">
            <Link href="/">
              <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {ui.back}
              </Button>
            </Link>
          </div>

          {/* Policy Header */}
          <header className="mb-12 border-b border-border pb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{ui.title}</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{ui.updated}</p>
          </header>

          {/* Policy Content */}
          <main className="space-y-12">
            {ui.sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  {section.title}
                </h2>
                <div className="text-[1.05rem] leading-relaxed text-muted-foreground">
                  {section.content}
                </div>
              </section>
            ))}
          </main>

          {/* Footer */}
          <footer className="mt-24 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Prepetual. All rights reserved.</p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
}