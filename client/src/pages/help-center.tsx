import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, FileText, Shield, Mail, MessageSquare } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function HelpCenter() {
  const { language } = useLanguage();

  const ui = language === "vi"
    ? {
        title: "Trung tâm trợ giúp",
        subtitle: "Mọi điều bạn cần biết về Prepetual",
        sections: [
          { title: "Giới thiệu", description: "Tìm hiểu thêm về Prepetual và sứ mệnh của chúng tôi.", href: "/about", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Câu hỏi thường gặp", description: "Những câu hỏi phổ biến và câu trả lời khi sử dụng ứng dụng.", href: "/faq", icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Điều khoản dịch vụ", description: "Đọc các quy tắc và hướng dẫn khi sử dụng nền tảng.", href: "/terms", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Chính sách riêng tư", description: "Cách chúng tôi xử lý và bảo vệ dữ liệu của bạn.", href: "/privacy", icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
        ],
        stillNeedHelp: "Vẫn cần hỗ trợ?",
        supportDescription: "Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi câu hỏi của bạn.",
        contactSupport: "Liên hệ hỗ trợ",
      }
    : {
        title: "Help Center",
        subtitle: "Everything you need to know about Prepetual",
        sections: [
          { title: "About", description: "Learn more about Prepetual and our mission.", href: "/about", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "FAQ", description: "Common questions and answers about using the app.", href: "/faq", icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Terms of Service", description: "Read our rules and guidelines for using the platform.", href: "/terms", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Privacy Policy", description: "How we handle and protect your data.", href: "/privacy", icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
        ],
        stillNeedHelp: "Still need help?",
        supportDescription: "Our support team is here to assist you with any questions.",
        contactSupport: "Contact Support",
      };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tight">{ui.title}</h1>
        <p className="text-lg text-muted-foreground">{ui.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {ui.sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="group h-full cursor-pointer overflow-hidden border-primary/10 transition-all hover-elevate">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`rounded-xl p-3 transition-colors duration-200 group-hover:scale-110 ${section.bg} ${section.color}`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-primary/10 bg-primary/5 p-8 text-center">
        <MessageSquare className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h3 className="mb-2 text-xl font-bold">{ui.stillNeedHelp}</h3>
        <p className="mb-6 text-muted-foreground">{ui.supportDescription}</p>
        <Link href="/contact">
          <Button className="rounded-full px-8 font-bold">{ui.contactSupport}</Button>
        </Link>
      </div>
    </div>
  );
}
