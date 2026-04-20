import { Link } from "wouter";
import logoImage from "@assets/image_1765894870887.png";
import { Facebook, Linkedin, Instagram, Twitter, Github } from "lucide-react";
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Prepetual Logo" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-lg font-brand text-foreground">prepetual</span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link 
              href="/about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-about"
            >
              About
            </Link>
            <Link 
              href="/blog" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-blog"
            >
              Blog
            </Link>
            <Link 
              href="/faq" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-faq"
            >
              FAQ
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-contact"
            >
              Contact
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-privacy"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-terms"
            >
              Terms of Service
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Prepetual. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with ❤️ by Gia Hien
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://web.facebook.com/hn.giahien/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-border social-button"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a 
              href="https://x.com/HoangNgocG97530" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-border social-button"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://www.instagram.com/hng.hien/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-border social-button"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://www.linkedin.com/in/hoang-ngoc-gia-hien-4b42bb3a0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-border social-button"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/hienhng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary hover:text-primary transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-border social-button"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
