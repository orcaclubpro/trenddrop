import { Menu, Bell, Sun, Moon, Computer } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/use-websocket';

interface TopbarProps {
  openSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Topbar({ openSidebar, isSidebarOpen }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useWebSocket();
  
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center">
        {!isSidebarOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openSidebar}
            className="mr-2 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-lg font-semibold">TrendDrop</h1>
          <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            Trend Intelligence
          </div>
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center space-x-2">
        {/* Connection status indicator */}
        <div className="hidden md:flex items-center mr-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {/* Theme selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Computer className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Computer className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}