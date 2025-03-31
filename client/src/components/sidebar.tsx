import { useLocation, Link } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard-line" },
    { path: "/trending-products", label: "Trending Products", icon: "fire-line" },
    { path: "/geographic-trends", label: "Geographic Trends", icon: "global-line" },
    { path: "/marketing-videos", label: "Marketing Videos", icon: "video-line" },
    { path: "/settings", label: "Settings", icon: "settings-line" }
  ];
  
  return (
    <aside className="w-full md:w-64 md:fixed md:h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
          <i className="ri-shopping-bag-line"></i> TrendDrop
        </h1>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    location === item.path 
                      ? "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <i className={`ri-${item.icon}`}></i> {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          className="px-4 py-2 w-full flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={toggleTheme}
        >
          <i className="ri-contrast-2-line"></i> 
          <span className="hidden md:inline">Toggle Theme</span>
        </button>
      </div>
    </aside>
  );
}
