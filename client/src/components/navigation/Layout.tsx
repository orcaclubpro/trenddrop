import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col sm:pl-64">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
            onClick={toggleSidebar}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-xl sm:hidden">
            <div className="p-4 h-16 border-b flex items-center">
              <h1 className="text-xl font-bold text-primary">TrendDrop</h1>
            </div>
            <Sidebar />
          </div>
        </>
      )}
      
      {/* Global toast notifications */}
      <Toaster />
    </div>
  );
}