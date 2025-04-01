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
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer",
          isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
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
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/">
          <div className="flex items-center gap-2 font-semibold cursor-pointer">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>TrendDrop</span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 gap-1">
          {navItems.map((item, index) => (
            <NavItem key={index} {...item} />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t">
        <div className="py-4 px-2">
          <nav className="grid items-start px-2 gap-1">
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