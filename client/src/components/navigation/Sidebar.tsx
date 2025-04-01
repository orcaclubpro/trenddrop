import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Globe, 
  Bot, 
  ChevronLeft,
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  
  // Hide sidebar on mobile when it's closed
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 z-20 bg-black/50 md:hidden" 
        onClick={closeSidebar}
      />
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col md:static">
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              TD
            </div>
            <span className="text-lg font-bold">TrendDrop</span>
          </div>
          <button 
            onClick={closeSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavItem
            href="/"
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={location === '/'}
          />
          <NavItem
            href="/categories"
            icon={Tags}
            label="Categories"
            isActive={location === '/categories'}
          />
          <NavItem
            href="/regions"
            icon={Globe}
            label="Regions"
            isActive={location === '/regions'}
          />
          <NavItem
            href="/agent"
            icon={Bot}
            label="AI Agent"
            isActive={location === '/agent'}
          />
          
          <div className="pt-4 mt-4 border-t border-border">
            <NavItem
              href="/settings"
              icon={Settings}
              label="Settings"
              isActive={location === '/settings'}
            />
            <NavItem
              href="/help"
              icon={HelpCircle}
              label="Help & Support"
              isActive={location === '/help'}
            />
          </div>
        </nav>
        
        {/* Sidebar footer */}
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p>TrendDrop v1.0.0</p>
            <p className="mt-1">Trend Intelligence Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}