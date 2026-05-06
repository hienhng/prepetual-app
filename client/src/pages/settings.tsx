import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  Save,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Languages,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage, type AppLanguage } from "@/lib/language-context";

type ThemeOption = "light" | "dark" | "system";

function useTheme() {
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as ThemeOption) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const applyTheme = (value: ThemeOption) => {
      if (value === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      } else {
        document.documentElement.classList.toggle("dark", value === "dark");
      }
    };

    applyTheme(theme);
  }, [theme]);

  const setTheme = (nextTheme: ThemeOption) => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event("themechange"));
  };

  return { theme, setTheme };
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImageUrl || null);
  const [autoDeleteFiles, setAutoDeleteFiles] = useState(user?.autoDeleteFiles || false);
  const [confettiEnabled, setConfettiEnabled] = useState(user?.consecutiveCorrectConfetti !== false);
  const [skipRevision, setSkipRevision] = useState(user?.skipRevisionQuestions || false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: settings, isLoading } = useQuery<{
    autoDeleteFiles: boolean;
    consecutiveCorrectConfetti: boolean;
    skipRevisionQuestions: boolean;
    username: string | null;
    profileImageUrl: string | null;
  }>({
    queryKey: ["/api/user/settings"],
    enabled: !!user,
  });

  const hasUnsavedChanges = settings
    ? username !== (settings.username || "") ||
      autoDeleteFiles !== (settings.autoDeleteFiles || false) ||
      confettiEnabled !== (settings.consecutiveCorrectConfetti !== false) ||
      skipRevision !== (settings.skipRevisionQuestions || false)
    : false;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!settings) return;

    setUsername(settings.username || "");
    setProfileImage(settings.profileImageUrl);
    setAutoDeleteFiles(settings.autoDeleteFiles || false);
    setConfettiEnabled(settings.consecutiveCorrectConfetti !== false);
    setSkipRevision(settings.skipRevisionQuestions || false);
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      username?: string;
      autoDeleteFiles?: boolean;
      consecutiveCorrectConfetti?: boolean;
      skipRevisionQuestions?: boolean;
      profileImageUrl?: string;
      _silent?: boolean;
    }) => {
      const { _silent, ...payload } = data;
      const response = await apiRequest("PATCH", "/api/user/settings", payload);
      const json = await response.json();
      return { result: json, silent: _silent };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (!data.silent) {
        toast({
          title: t("settings.saveSuccess"),
          description: t("settings.saveSuccessDescription"),
          variant: "success" as any,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t("settings.saveError"),
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("settings.invalidFileType"),
        description: t("settings.invalidFileTypeDescription"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("settings.fileTooLarge"),
        description: t("settings.fileTooLargeDescription"),
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/upload-profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error(t("settings.uploadFailed"));

      const data = await response.json();
      setProfileImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: t("settings.imageUploaded"),
        description: t("settings.imageUploadedDescription"),
        variant: "success" as any,
      });
    } catch {
      toast({
        title: t("settings.uploadFailed"),
        description: t("settings.uploadFailedDescription"),
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const getInitials = () => {
    const name = username || user?.username || "";
    if (name) return name[0].toUpperCase();
    return user?.email?.[0]?.toUpperCase() || t("common.user").charAt(0);
  };

  const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("settings.light"), icon: Sun },
    { value: "dark", label: t("settings.dark"), icon: Moon },
    { value: "system", label: t("settings.system"), icon: Monitor },
  ];

  const languageOptions: { value: AppLanguage; label: string }[] = [
    { value: "en", label: t("common.english") },
    { value: "vi", label: t("common.vietnamese") },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                {t("settings.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="bg-primary/10 text-lg text-primary">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
                    data-testid="button-upload-avatar"
                  >
                    {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-avatar-file"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                  {user?.emailVerified ? (
                    <Badge variant="outline" className="mt-1 gap-1 border-emerald-500/30 bg-emerald-50 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {t("common.verified")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 gap-1 border-amber-500/30 bg-amber-50 text-xs text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                      <ShieldX className="h-2.5 w-2.5" />
                      {t("common.notVerified")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm">
                  {t("settings.username")}
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t("settings.usernamePlaceholder")}
                  className="h-9"
                  data-testid="input-username"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="w-4 h-4" />
                {t("settings.appearance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 transition-all ${
                        isActive ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                      data-testid={`button-theme-${option.value}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Languages className="h-4 w-4" />
                    {t("settings.language")}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.languageDescription")}</p>
                </div>
                <div className="flex gap-2">
                  {languageOptions.map((option) => {
                    const isActive = language === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => setLanguage(option.value)}
                        className={`flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                          isActive ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                        }`}
                        data-testid={`button-language-${option.value}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4" />
                {t("settings.quizExperience")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="confetti-toggle" className="text-sm font-medium">
                    {t("settings.consecutiveConfetti")}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.consecutiveConfettiDescription")}</p>
                </div>
                <Switch id="confetti-toggle" checked={confettiEnabled} onCheckedChange={setConfettiEnabled} data-testid="switch-confetti-toggle" />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="skip-revision-toggle" className="text-sm font-medium">
                    {t("settings.skipRevision")}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.skipRevisionDescription")}</p>
                </div>
                <Switch id="skip-revision-toggle" checked={skipRevision} onCheckedChange={setSkipRevision} data-testid="switch-skip-revision" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="w-4 h-4" />
                {t("settings.privacy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="auto-delete" className="text-sm font-medium">
                    {t("settings.autoDelete")}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.autoDeleteDescription")}</p>
                </div>
                <Switch id="auto-delete" checked={autoDeleteFiles} onCheckedChange={setAutoDeleteFiles} data-testid="switch-auto-delete" />
              </div>

              {autoDeleteFiles && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t("settings.autoDeleteWarning")}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <div className="h-16" />
        </motion.div>
      </div>

      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t("settings.unsavedChanges")}</span>
            </div>
            <Button
              size="sm"
              onClick={() =>
                updateSettingsMutation.mutate({
                  username: username.trim() || undefined,
                  autoDeleteFiles,
                  consecutiveCorrectConfetti: confettiEnabled,
                  skipRevisionQuestions: skipRevision,
                })
              }
              disabled={updateSettingsMutation.isPending}
              className="h-7 gap-1.5 px-3 rounded-full"
              data-testid="button-save-all-preferences"
            >
              {updateSettingsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t("common.save")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
