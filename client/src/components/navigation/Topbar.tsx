import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Topbar() {
  return (
    <div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <div className="hidden md:flex">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, regions, or trends..."
            className="w-[300px] pl-8 bg-background"
          />
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </div>
  );
}