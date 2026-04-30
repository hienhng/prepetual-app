import { Link } from "wouter";
import logoImage from "@assets/image_1765894870887.png";
import { Facebook, Linkedin, Instagram, Twitter, Github } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background/95">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoImage}
              alt="Prepetual Logo"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-lg font-brand text-foreground">prepetual</span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
              {t("footer.about")}
            </Link>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-blog">
              {t("footer.blog")}
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-faq">
              {t("footer.faq")}
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
              {t("footer.contact")}
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
              {t("footer.terms")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t pt-8 md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Prepetual. {t("footer.rights")}
            </p>
            <p className="text-sm text-muted-foreground">{t("footer.madeBy")}</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://web.facebook.com/hn.giahien/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button rounded-xl border border-transparent bg-secondary/50 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-secondary hover:text-primary"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/HoangNgocG97530"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button rounded-xl border border-transparent bg-secondary/50 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-secondary hover:text-primary"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/hng.hien/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button rounded-xl border border-transparent bg-secondary/50 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-secondary hover:text-primary"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/hoang-ngoc-gia-hien-4b42bb3a0/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button rounded-xl border border-transparent bg-secondary/50 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-secondary hover:text-primary"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/hienhng"
              target="_blank"
              rel="noopener noreferrer"
              className="social-button rounded-xl border border-transparent bg-secondary/50 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-secondary hover:text-primary"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
