import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type ThemeOption = "light" | "dark" | "system";

function getEffectiveTheme(theme: ThemeOption): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeOption>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeOption | null;
    const initialTheme = stored || "system";
    setThemeState(initialTheme);
    document.documentElement.classList.toggle("dark", getEffectiveTheme(initialTheme) === "dark");

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const newTheme = e.newValue as ThemeOption;
        setThemeState(newTheme);
        document.documentElement.classList.toggle("dark", getEffectiveTheme(newTheme) === "dark");
      }
    };

    const handleCustomThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") as ThemeOption | null;
      if (currentTheme) {
        setThemeState(currentTheme);
        document.documentElement.classList.toggle("dark", getEffectiveTheme(currentTheme) === "dark");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themechange", handleCustomThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themechange", handleCustomThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = getEffectiveTheme(theme) === "light" ? "dark" : "light";
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    window.dispatchEvent(new Event("themechange"));
  };

  const effectiveTheme = getEffectiveTheme(theme);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "system" ? (
        <Monitor className="h-5 w-5" />
      ) : effectiveTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
