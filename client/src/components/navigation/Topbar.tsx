import { useCallback, useState } from 'react';
import { Menu, Moon, Sun, Bell, Search } from 'lucide-react';
import { Link } from 'wouter';
import { useTheme } from '@/components/ui/theme-provider';
import { useWebSocket } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';

interface TopbarProps {
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sticky top-0 z-30 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-md hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/">
          <a className="sm:hidden text-lg font-bold text-primary">TrendDrop</a>
        </Link>
        <div className="hidden md:flex relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products..."
            className="rounded-md border py-2 px-4 pl-9 text-sm w-full focus:outline-none focus:ring-2 ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="p-2 rounded-md hover:bg-secondary relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-card rounded-md shadow-lg border p-2 z-50">
              <div className="p-2">
                <h3 className="font-medium">Notifications</h3>
                <div className="text-sm text-muted-foreground mt-2">
                  <p className="py-1 border-b">Agent discovered 5 new products</p>
                  <p className="py-1 border-b">New trending product: "Smart Plant Pot"</p>
                  <p className="py-1">Database sync completed</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-secondary"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}