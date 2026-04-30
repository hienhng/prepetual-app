import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  Home, 
  LayoutDashboard, 
  Archive, 
  Plus, 
  BookOpen,
  Info,
  Mail,
  LogOut,
  User,
  Globe,
  ChevronsLeft,
  ChevronsRight,
  PanelRight,
  Compass,
  HelpCircle,
  Settings,
  Folders,
  ChartLine,
  FolderOpen,
  Pin,
  PinOff,
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQuizNavigationGuard } from "@/lib/quiz-navigation-guard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/language-context";
import logoImage from "@assets/image_1765894870887.png";
import type { Folder } from "@shared/schema";

const primaryNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  {
    title: "Your Quizzes",
    url: "/history",
    icon: Folders,
  },
  {
    title: "Discover",
    url: "/feed",
    icon: Compass,
  },
];

const secondaryNavItems = [
  {
    title: "Progress",
    url: "/progress",
    icon: ChartLine,
  },
  {
    title: "Results",
    url: "/results", // Dummy path or use #
    icon: BookOpen, // Or FileText
  },
];


export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile, state, toggleSidebar } = useSidebar();
  const { handleLinkClick } = useQuizNavigationGuard();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isCollapsed = state === "collapsed";
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { data: allFolders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
    enabled: !!user,
  });

  const sortedSidebarFolders = [...allFolders].sort((a, b) => {
    if (a.pinnedToSidebar && !b.pinnedToSidebar) return -1;
    if (!a.pinnedToSidebar && b.pinnedToSidebar) return 1;
    return 0;
  });

  useEffect(() => {
    if (renamingFolder && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.focus(), 100);
    }
  }, [renamingFolder]);

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/folders/${id}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
    onError: () => {
      toast({ title: "Error", description: t("sidebar.failedTogglePin"), variant: "destructive" });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest("PATCH", `/api/folders/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setRenamingFolder(null);
      setRenameValue("");
      toast({ title: t("sidebar.folderRenamed") });
    },
    onError: () => {
      toast({ title: "Error", description: t("sidebar.failedRenameFolder"), variant: "destructive" });
    },
  });

  const openRenameDialog = (folder: Folder) => {
    setRenamingFolder(folder);
    setRenameValue(folder.name);
  };

  const handleRenameSubmit = () => {
    if (!renameValue.trim() || !renamingFolder) return;
    renameFolderMutation.mutate({ id: renamingFolder.id, name: renameValue.trim() });
  };

  const getInitials = () => {
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return t("common.user").charAt(0);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    window.location.href = "/";
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    handleLinkClick(e, path, () => setOpenMobile(false));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-all relative group/logo"
              data-testid="sidebar-expand-toggle"
            >
              <img 
                src={logoImage} 
                alt="Expand Sidebar" 
                className="w-8 h-8 min-w-8 min-h-8 rounded-full object-cover flex-shrink-0 group-hover/logo:opacity-0 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity bg-sidebar-accent rounded-md">
                <PanelRight className="h-4 w-4" />
              </div>
            </button>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2" onClick={(e) => handleNavClick(e, "/dashboard")}>
              <img 
                src={logoImage} 
                alt="Prepetual Logo" 
                className="w-8 h-8 min-w-8 min-h-8 rounded-full object-cover flex-shrink-0"
              />
              <span className="pb-1 text-xl font-brand text-foreground whitespace-nowrap hidden sm:inline">prepetual</span>
            </Link>
          )}
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex"
              data-testid="sidebar-collapse-toggle"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    tooltip={t(`sidebar.${item.title === "Dashboard" ? "dashboard" : item.title === "Create" ? "create" : item.title === "Your Quizzes" ? "yourQuizzes" : "discover"}`)}
                  >
                    <Link href={item.url} onClick={(e) => handleNavClick(e, item.url)} data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(`sidebar.${item.title === "Dashboard" ? "dashboard" : item.title === "Create" ? "create" : item.title === "Your Quizzes" ? "yourQuizzes" : "discover"}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.analysis")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    tooltip={t(item.title === "Progress" ? "sidebar.progress" : "sidebar.results")}
                  >
                    <Link href={item.url} onClick={(e) => handleNavClick(e, item.url)} data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(item.title === "Progress" ? "sidebar.progress" : "sidebar.results")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.folders")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sortedSidebarFolders.length > 0 ? (
                sortedSidebarFolders.map((folder) => (
                  <SidebarMenuItem key={folder.id} className="group/pinned relative">
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/folder/${folder.id}`}
                      tooltip={folder.name}
                    >
                      <Link
                        href={`/folder/${folder.id}`}
                        onClick={(e) => handleNavClick(e, `/folder/${folder.id}`)}
                        data-testid={`sidebar-pinned-folder-${folder.id}`}
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>{folder.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-xl opacity-0 group-hover/pinned:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 hover:bg-sidebar-accent/90 transition-all z-10"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-folder-actions-${folder.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4 text-sidebar-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            {t("common.rename")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePinMutation.mutate(folder.id)}>
                            {folder.pinnedToSidebar ? (
                              <>
                                <PinOff className="h-3.5 w-3.5 mr-2" />
                                {t("sidebar.unpinFromTop")}
                              </>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5 mr-2" />
                                {t("sidebar.pinToTop")}
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarMenuItem>
                ))
              ) : (
                !isCollapsed && (
                  <div className="px-4 py-2 text-xs text-muted-foreground italic">
                    {t("sidebar.noFolders")}
                  </div>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className={`space-y-2 overflow-hidden ${isCollapsed ? 'p-1' : 'p-3'}`}>
        <div className={`flex items-center gap-2 w-full ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`gap-2 min-w-0 ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'justify-start px-2 flex-1'}`} data-testid="sidebar-user-menu">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.username || "User"} className="object-cover" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {user?.username || t("common.user")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              
              
              <DropdownMenuItem asChild>
                <Link href="/settings" onClick={(e) => handleNavClick(e, "/settings")} data-testid="sidebar-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("sidebar.settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help" onClick={(e) => handleNavClick(e, "/help")} data-testid="sidebar-help">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t("sidebar.helpCenter")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" onClick={(e) => handleNavClick(e, "/contact")} data-testid="sidebar-contact">
                  <Mail className="h-4 w-4 mr-2" />
                  {t("sidebar.contactUs")}
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive" data-testid="sidebar-logout">
                <LogOut className="h-4 w-4 mr-2" />
                {t("sidebar.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className={`${isCollapsed ? 'flex' : 'hidden md:flex'} items-center gap-1`}>
            
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
      <Dialog open={!!renamingFolder} onOpenChange={(open) => { if (!open) { setRenamingFolder(null); setRenameValue(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sidebar.renameFolder")}</DialogTitle>
            <DialogDescription>{t("sidebar.renameFolderDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleRenameSubmit(); }}>
            <Input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={t("sidebar.folderName")}
              data-testid="input-rename-folder"
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => { setRenamingFolder(null); setRenameValue(""); }}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!renameValue.trim() || renameFolderMutation.isPending} data-testid="button-rename-folder-submit">
                {renameFolderMutation.isPending ? t("common.renaming") : t("common.rename")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
