import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, ArrowLeft, MapPin, SendHorizonal } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SiGithub } from "react-icons/si";

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
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

      toast({
        title: "Message sent!",
        description: "We'll get back to you at giahienhn@gmail.com as soon as possible.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us a detailed message.",
      value: "giahienhn@gmail.com",
      href: "mailto:giahienhn@gmail.com",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: MessageSquare,
      title: "Community",
      description: "Join the conversation.",
      value: "@prepetual_ai",
      href: "#",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: SiGithub,
      title: "GitHub",
      description: "Report issues or contribute.",
      value: "prepetual-ai",
      href: "https://github.com",
      color: "text-foreground",
      bg: "bg-muted"
    }
  ];

  return (
    <div className="min-h-screen bg-background/50">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-16">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8 rounded-full hover:bg-primary/10" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <div className="p-4 bg-primary/10 rounded-3xl mb-6">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <Card className="border-primary/5 shadow-xl bg-card/50 backdrop-blur overflow-hidden rounded-[2rem]">
                <CardContent className="p-8 sm:p-12">
                  <h2 className="text-3xl font-bold mb-8 tracking-tight">Send a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Your Name</label>
                        <Input 
                          name="name"
                          placeholder="John Doe" 
                          className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20"
                          required
                          data-testid="input-contact-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Email Address</label>
                        <Input 
                          name="email"
                          type="email" 
                          placeholder="john@example.com" 
                          className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20"
                          required
                          data-testid="input-contact-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Subject</label>
                      <Input 
                        name="subject"
                        placeholder="How can we help?" 
                        className="h-12 rounded-xl border-primary/10 bg-background/50 focus:ring-primary/20"
                        required
                        data-testid="input-contact-subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground ml-1">Message</label>
                      <Textarea 
                        name="message"
                        placeholder="Tell us more about your inquiry..." 
                        className="min-h-[150px] rounded-2xl border-primary/10 bg-background/50 focus:ring-primary/20 p-4"
                        required
                        data-testid="textarea-contact-message"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto px-10 h-14 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      data-testid="button-contact-submit"
                    >
                      <SendHorizonal className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {contactMethods.map((method, idx) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <a href={method.href} className="block">
                    <Card className="hover-elevate border-primary/5 shadow-sm bg-card/50 backdrop-blur transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${method.bg} ${method.color}`}>
                            <method.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{method.title}</h3>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="text-sm font-medium text-primary mt-1">{method.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}
              
              <Card className="border-primary/10 bg-primary/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-2">Office</h3>
                  <p className="text-muted-foreground mb-4">
                    Based in the cloud, serving students worldwide.
                  </p>
                  <div className="inline-flex items-center text-primary font-bold">
                    <MapPin className="h-4 w-4 mr-2" />
                    Remote-first
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
