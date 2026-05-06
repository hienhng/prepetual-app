import { motion } from "framer-motion";
import { Link } from "wouter";
import { Ghost, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background blobs for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-lg"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <Ghost className="h-24 w-24 text-primary/40 mx-auto" />
          </motion.div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/5 rounded-full blur-sm" />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-primary">404</h1>
          <h2 className="text-2xl font-bold tracking-tight">{t('notFound.title')}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t('notFound.description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 font-semibold">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              {t('common.backToHome')}
            </Link>
          </Button>
          <Button variant="ghost" size="lg" className="h-12 px-8 font-semibold" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('common.goBack')}
          </Button>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 left-0 right-0 text-center text-sm text-muted-foreground font-medium">
        {t('common.footer')} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
