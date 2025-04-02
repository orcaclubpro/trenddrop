import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Cpu,
  Settings,
  HelpCircle,
  TrendingUp,
  LucideIcon
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  isActive: boolean;
}

const NavItem = ({ href, icon: Icon, title, isActive }: NavItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer my-1",
          isActive ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"
        )}
      >
        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
        <span>{title}</span>
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  
  const navItems = [
    {
      href: '/',
      icon: LayoutDashboard,
      title: 'Dashboard',
      isActive: location === '/'
    },
    {
      href: '/categories',
      icon: Package,
      title: 'Categories',
      isActive: location === '/categories' || location.startsWith('/products/')
    },
    {
      href: '/regions',
      icon: MapPin,
      title: 'Regions',
      isActive: location === '/regions' || location.startsWith('/regions/')
    },
    {
      href: '/agent-control',
      icon: Cpu,
      title: 'Agent Control',
      isActive: location === '/agent-control'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-sm">
      <div className="flex h-16 items-center px-5 border-b">
        <Link href="/">
          <div className="flex items-center gap-2 font-semibold cursor-pointer">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">
              <span className="text-primary">Trend</span>Drop
            </span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4">
        <div className="mb-4 px-2">
          <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
            Main Navigation
          </h3>
        </div>
        <nav className="grid items-start px-2 gap-1">
          {navItems.map((item, index) => (
            <NavItem key={index} {...item} />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t pt-4 pb-8">
        <div className="px-6">
          <nav className="grid items-start gap-1">
            <NavItem 
              href="/settings" 
              icon={Settings} 
              title="Settings" 
              isActive={location === '/settings'} 
            />
            <NavItem 
              href="/help" 
              icon={HelpCircle} 
              title="Help & Support" 
              isActive={location === '/help'} 
            />
          </nav>
        </div>
      </div>
    </div>
  );
}