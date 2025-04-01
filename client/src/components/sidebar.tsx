import { useLocation, Link } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Globe, 
  Video, 
  Settings, 
  Sun, 
  Moon, 
  ShoppingBag,
  ListFilter,
  Bell,
  User
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapse, setCollapse] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: "/trending-products", label: "Trending Products", icon: <TrendingUp className="h-5 w-5" /> },
    { path: "/geographic-trends", label: "Geographic Trends", icon: <Globe className="h-5 w-5" /> },
    { path: "/marketing-videos", label: "Marketing Videos", icon: <Video className="h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> }
  ];
  
  const SidebarContent = () => (
    <>
      <div className={`h-16 px-6 flex items-center border-b border-border`}>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2 whitespace-nowrap">
          <ShoppingBag className="h-6 w-6" /> 
          {!collapse && "TrendDrop"}
        </h1>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapse(!collapse)}
            className="ml-auto"
          >
            <ListFilter className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="p-4 flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`px-4 py-3 rounded-md flex items-center gap-4 transition-colors ${
                    location === item.path 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {!collapse && <span>{item.label}</span>}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {!collapse && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-auto">
                    <div className="p-2 text-sm text-center text-muted-foreground">
                      No new notifications
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <User className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                      1
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </>
  );

  // Mobile sidebar uses a sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40">
            <ListFilter className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 flex flex-col">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <aside 
      className={`h-screen fixed inset-y-0 left-0 z-20 bg-background border-r border-border flex flex-col transition-all duration-300 ${
        collapse ? "w-20" : "w-64"
      }`}
    >
      <SidebarContent />
    </aside>
  );
}
