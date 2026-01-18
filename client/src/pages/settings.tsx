import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  User, Camera, Save, Moon, Sun, Monitor, Trash2, 
  Loader2, Check, AlertCircle, ShieldCheck, ShieldX
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
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: settings, isLoading } = useQuery<{
    autoDeleteFiles: boolean;
    username: string | null;
    profileImageUrl: string | null;
  }>({
    queryKey: ["/api/user/settings"],
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      setUsername(settings.username || "");
      setProfileImage(settings.profileImageUrl);
      setAutoDeleteFiles(settings.autoDeleteFiles || false);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      username?: string;
      autoDeleteFiles?: boolean;
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

  const handleSaveProfile = () => {
    updateSettingsMutation.mutate({
      username: username.trim() || undefined,
    });
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  const handleAutoDeleteChange = (checked: boolean) => {
    setAutoDeleteFiles(checked);
    updateSettingsMutation.mutate({ autoDeleteFiles: checked, _silent: true });
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Update your profile information and picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    data-testid="button-upload-avatar"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
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
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-foreground">{user?.email}</p>
                  {user?.emailVerified ? (
                    <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
                      <ShieldX className="w-3 h-3" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  data-testid="input-username"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={updateSettingsMutation.isPending}
                className="gap-2"
                data-testid="button-save-profile"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Choose your preferred theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                      data-testid={`button-theme-${option.value}`}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        {option.label}
                      </span>
                      {isActive && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-delete" className="text-base">
                    Auto-delete uploaded files
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete source files after quiz generation
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
                  className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                                        Your uploads enhance your experience by making it more personalized and improved.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
