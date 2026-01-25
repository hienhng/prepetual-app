import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Camera, Save, Moon, Sun, Monitor, Trash2, 
  Loader2, Check, AlertCircle, ShieldCheck, ShieldX, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

type ThemeOption = "light" | "dark" | "system";

function useTheme() {
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as ThemeOption) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const applyTheme = (t: ThemeOption) => {
      if (t === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      } else {
        document.documentElement.classList.toggle("dark", t === "dark");
      }
    };
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("themechange"));
  };

  return { theme, setTheme };
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
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

  const hasUnsavedChanges = settings ? (
    (username !== (settings.username || "")) ||
    (autoDeleteFiles !== (settings.autoDeleteFiles || false)) ||
    (confettiEnabled !== (settings.consecutiveCorrectConfetti !== false)) ||
    (skipRevision !== (settings.skipRevisionQuestions || false))
  ) : false;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (settings) {
      setUsername(settings.username || "");
      setProfileImage(settings.profileImageUrl);
      setAutoDeleteFiles(settings.autoDeleteFiles || false);
      setConfettiEnabled(settings.consecutiveCorrectConfetti !== false);
      setSkipRevision(settings.skipRevisionQuestions || false);
    }
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
      try {
        const response = await apiRequest("PATCH", "/api/user/settings", payload);
        const json = await response.json();
        return { result: json, silent: _silent };
      } catch (error: any) {
        throw new Error(error.message || "Failed to save settings");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (!data.silent) {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated.",
          variant: "success" as any,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
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
      
      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      setProfileImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been updated.",
        variant: "success" as any,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAllPreferences = () => {
    updateSettingsMutation.mutate({
      username: username.trim() || undefined,
      autoDeleteFiles,
      consecutiveCorrectConfetti: confettiEnabled,
      skipRevisionQuestions: skipRevision,
    });
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const handleAutoDeleteChange = (checked: boolean) => {
    setAutoDeleteFiles(checked);
  };

  const handleConfettiChange = (checked: boolean) => {
    setConfettiEnabled(checked);
  };

  const handleSkipRevisionChange = (checked: boolean) => {
    setSkipRevision(checked);
  };

  const getInitials = () => {
    const name = username || user?.username || "";
    if (name) return name[0].toUpperCase();
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
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
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    data-testid="button-upload-avatar"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  {user?.emailVerified ? (
                    <Badge variant="outline" className="mt-1 gap-1 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
                      <ShieldX className="w-2.5 h-2.5" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
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
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                      data-testid={`button-theme-${option.value}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4" />
                Quiz Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="confetti-toggle" className="text-sm font-medium">
                    Consecutive correct confetti
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confetti after 3+ correct answers in a row
                  </p>
                </div>
                <Switch
                  id="confetti-toggle"
                  checked={confettiEnabled}
                  onCheckedChange={handleConfettiChange}
                  data-testid="switch-confetti-toggle"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="skip-revision-toggle" className="text-sm font-medium">
                    Skip revision questions
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go straight to results
                  </p>
                </div>
                <Switch
                  id="skip-revision-toggle"
                  checked={skipRevision}
                  onCheckedChange={handleSkipRevisionChange}
                  data-testid="switch-skip-revision"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="w-4 h-4" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="auto-delete" className="text-sm font-medium">
                    Auto-delete uploaded files
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delete source files after quiz generation
                  </p>
                </div>
                <Switch
                  id="auto-delete"
                  checked={autoDeleteFiles}
                  onCheckedChange={handleAutoDeleteChange}
                  data-testid="switch-auto-delete"
                />
              </div>
              
              {autoDeleteFiles && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your uploads enhance your experience by making it more personalized.
                  </p>
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
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-background/95 backdrop-blur-sm border shadow-lg"
          >
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Unsaved changes</span>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAllPreferences}
              disabled={updateSettingsMutation.isPending}
              className="gap-1.5 h-7 px-3"
              data-testid="button-save-all-preferences"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
