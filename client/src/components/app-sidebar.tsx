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

} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/image_1765894870887.png";

const mainNavItems = [
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
    title: "Archive",
    url: "/history",
    icon: Archive,
  },
  {
    title: "Community",
    url: "/feed",
    icon: Globe,
  },
];

const infoNavItems = [
  {
    title: "About",
    url: "/about",
    icon: Info,
  },
  {
    title: "Contact",
    url: "/contact",
    icon: Mail,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile, state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    window.location.href = "/";
  };

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-md group cursor-pointer hover:bg-sidebar-accent transition-colors"
              data-testid="sidebar-expand-toggle"
            >
              <img 
                src={logoImage} 
                alt="Expand Sidebar" 
                className="w-8 h-8 min-w-8 min-h-8 rounded-full object-cover flex-shrink-0 group-hover:hidden"
              />
              <PanelRight className="h-4 w-4 hidden group-hover:block" />
            </button>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
              <img 
                src={logoImage} 
                alt="Prepetual Logo" 
                className="w-8 h-8 min-w-8 min-h-8 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-lg font-brand text-foreground whitespace-nowrap">Prepetual</span>
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
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick} data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {infoNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick} data-testid={`sidebar-link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`p-3 space-y-2 ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`gap-2 ${isCollapsed ? 'justify-center w-9 h-9 p-0' : 'justify-start px-2 flex-1'}`} data-testid="sidebar-user-menu">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} className="object-cover" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem className="text-muted-foreground" disabled>
                <User className="h-4 w-4 mr-2" />
                {user?.email || "User"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} data-testid="sidebar-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className={`${isCollapsed ? 'flex' : 'hidden md:block'}`}>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
