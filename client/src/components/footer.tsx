import { Link } from "wouter";
import logoImage from "@assets/image_1765894870887.png";

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
            <span className="text-lg font-brand text-foreground">Prepetual</span>
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

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} Prepetual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
