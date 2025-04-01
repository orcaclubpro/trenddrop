import { Link, useLocation } from 'wouter';
import { HomeIcon, ShoppingBag, MapPin, BarChart, Settings, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { icon: HomeIcon, text: 'Dashboard', path: '/' },
  { icon: ShoppingBag, text: 'Categories', path: '/categories' },
  { icon: Globe, text: 'Regions', path: '/regions' },
  { icon: BarChart, text: 'Agent Control', path: '/agent-control' },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-md hidden sm:block">
      <div className="p-4 h-16 border-b flex items-center">
        <h1 className="text-xl font-bold text-primary">TrendDrop</h1>
      </div>
      <nav className="p-4 space-y-2">
        {sidebarLinks.map((link) => {
          const isActive = location === link.path;
          const Icon = link.icon;
          return (
            <Link key={link.path} href={link.path}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.text}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 w-full px-4">
        <div className="p-4 rounded-lg bg-muted">
          <h3 className="font-medium mb-2">TrendDrop Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Discover trending products for your dropshipping business
          </p>
        </div>
      </div>
    </div>
  );
}