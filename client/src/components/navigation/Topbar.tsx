import { Bell, Search, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function Topbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Toggle dark mode class on document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-8">
      <div className="hidden md:flex flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, regions, or trends..."
            className="w-full pl-10 pr-4 py-2 h-10 rounded-full bg-secondary border-none focus-visible:ring-primary"
          />
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-secondary"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 border-2 text-muted-foreground hover:text-foreground hover:border-primary"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </div>
  );
}