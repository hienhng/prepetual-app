import { motion } from "framer-motion";
import { Mail, MessageSquare, ArrowLeft, MapPin, SendHorizonal } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SiGithub } from "react-icons/si";
import { useLanguage } from "@/lib/language-context";

export default function Contact() {
  const { toast } = useToast();
  const { language } = useLanguage();

  const ui = language === "vi"
    ? {
        back: "Quay lại trang chủ",
        title: "Liên hệ",
        subtitle: "Có câu hỏi hoặc góp ý? Chúng tôi rất muốn lắng nghe bạn.",
        sendMessage: "Gửi tin nhắn",
        yourName: "Tên của bạn",
        email: "Địa chỉ email",
        subject: "Chủ đề",
        message: "Nội dung",
        namePlaceholder: "Nguyễn Văn A",
        emailPlaceholder: "ban@example.com",
        subjectPlaceholder: "Chúng tôi có thể hỗ trợ gì?",
        messagePlaceholder: "Hãy cho chúng tôi biết chi tiết hơn về yêu cầu của bạn...",
        submit: "Gửi tin nhắn",
        office: "Văn phòng",
        officeDescription: "Hoạt động từ xa, hỗ trợ học sinh trên toàn thế giới.",
        remote: "Làm việc từ xa",
        successTitle: "Đã gửi tin nhắn!",
        successDescription: "Chúng tôi sẽ phản hồi bạn qua giahienhn@gmail.com sớm nhất có thể.",
        errorDescription: "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
        methods: [
          { title: "Gửi email", description: "Gửi cho chúng tôi một tin nhắn chi tiết.", value: "giahienhn@gmail.com", href: "mailto:giahienhn@gmail.com", icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Cộng đồng", description: "Tham gia cuộc trò chuyện.", value: "@prepetual_ai", href: "#", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "GitHub", description: "Báo lỗi hoặc đóng góp.", value: "prepetual-ai", href: "https://github.com", icon: SiGithub, color: "text-foreground", bg: "bg-muted" },
        ],
      }
    : {
        back: "Back to Home",
        title: "Contact Us",
        subtitle: "Have questions or feedback? We'd love to hear from you.",
        sendMessage: "Send a message",
        yourName: "Your Name",
        email: "Email Address",
        subject: "Subject",
        message: "Message",
        namePlaceholder: "John Doe",
        emailPlaceholder: "john@example.com",
        subjectPlaceholder: "How can we help?",
        messagePlaceholder: "Tell us more about your inquiry...",
        submit: "Send Message",
        office: "Office",
        officeDescription: "Based in the cloud, serving students worldwide.",
        remote: "Remote-first",
        successTitle: "Message sent!",
        successDescription: "We'll get back to you at giahienhn@gmail.com as soon as possible.",
        errorDescription: "Failed to send message. Please try again later.",
        methods: [
          { title: "Email Us", description: "Send us a detailed message.", value: "giahienhn@gmail.com", href: "mailto:giahienhn@gmail.com", icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Community", description: "Join the conversation.", value: "@prepetual_ai", href: "#", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "GitHub", description: "Report issues or contribute.", value: "prepetual-ai", href: "https://github.com", icon: SiGithub, color: "text-foreground", bg: "bg-muted" },
        ],
      };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to send");

      toast({ title: ui.successTitle, description: ui.successDescription });
      (event.target as HTMLFormElement).reset();
    } catch {
      toast({ title: "Error", description: ui.errorDescription, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-16 flex flex-col items-center text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8 rounded-full hover:bg-primary/10" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {ui.back}
              </Button>
            </Link>

            <div className="mb-6 rounded-3xl bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-4 text-5xl font-black tracking-tight text-foreground">{ui.title}</h1>
            <p className="max-w-2xl text-xl text-muted-foreground">{ui.subtitle}</p>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden rounded-[2rem] border-primary/5 bg-card/50 shadow-xl backdrop-blur">
                <CardContent className="p-8 sm:p-12">
                  <h2 className="mb-8 text-3xl font-bold tracking-tight">{ui.sendMessage}</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-bold text-muted-foreground">{ui.yourName}</label>
                        <Input name="name" placeholder={ui.namePlaceholder} className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20" required data-testid="input-contact-name" />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-bold text-muted-foreground">{ui.email}</label>
                        <Input name="email" type="email" placeholder={ui.emailPlaceholder} className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20" required data-testid="input-contact-email" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-muted-foreground">{ui.subject}</label>
                      <Input name="subject" placeholder={ui.subjectPlaceholder} className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20" required data-testid="input-contact-subject" />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-bold text-muted-foreground">{ui.message}</label>
                      <Textarea name="message" placeholder={ui.messagePlaceholder} className="min-h-[150px] rounded-2xl border-primary/10 bg-background/50 p-4 focus:ring-primary/20" required data-testid="textarea-contact-message" />
                    </div>
                    <Button type="submit" className="h-14 w-full rounded-xl px-10 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto" data-testid="button-contact-submit">
                      <SendHorizonal className="mr-2 h-5 w-5" />
                      {ui.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {ui.methods.map((method, index) => (
                <motion.div key={method.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }}>
                  <a href={method.href} className="block">
                    <Card className="hover-elevate border-primary/5 bg-card/50 shadow-sm transition-all backdrop-blur">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`rounded-xl p-3 ${method.bg} ${method.color}`}>
                            <method.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{method.title}</h3>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="mt-1 text-sm font-medium text-primary">{method.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}

              <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <h3 className="mb-2 text-xl font-bold">{ui.office}</h3>
                  <p className="mb-4 text-muted-foreground">{ui.officeDescription}</p>
                  <div className="inline-flex items-center font-bold text-primary">
                    <MapPin className="mr-2 h-4 w-4" />
                    {ui.remote}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
