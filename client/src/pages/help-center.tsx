import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, FileText, Shield, Mail, MessageSquare } from "lucide-react";

const helpSections = [
  {
    title: "About",
    description: "Learn more about Prepetual and our mission.",
    href: "/about",
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "FAQ",
    description: "Common questions and answers about using the app.",
    href: "/faq",
    icon: HelpCircle,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    title: "Contact",
    description: "Get in touch with us for support or feedback.",
    href: "/contact",
    icon: Mail,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Terms of Service",
    description: "Read our rules and guidelines for using the platform.",
    href: "/terms",
    icon: FileText,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    title: "Privacy Policy",
    description: "How we handle and protect your data.",
    href: "/privacy",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-500/10"
  }
];

export default function HelpCenter() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4 tracking-tight">Help Center</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about Prepetual
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {helpSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover-elevate cursor-pointer border-primary/10 transition-all group overflow-hidden h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl ${section.bg} ${section.color} transition-colors group-hover:scale-110 duration-200`}>
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

      <div className="mt-16 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center">
        <MessageSquare className="h-10 w-10 mx-auto text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">Still need help?</h3>
        <p className="text-muted-foreground mb-6">
          Our support team is here to assist you with any questions.
        </p>
        <Link href="/contact">
          <Button className="rounded-full px-8 font-bold">
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
}
