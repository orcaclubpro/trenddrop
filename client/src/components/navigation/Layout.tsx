import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { WebSocketStatus } from '@/components/websocket/WebSocketStatus';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background/50 lg:block shadow-sm">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <div className="fixed bottom-6 right-6 z-50">
          <WebSocketStatus 
            variant="compact" 
            className="bg-background/80 backdrop-blur-sm shadow-md rounded-full px-4 py-2 border border-border/40 hover:bg-background/90 transition-all"
          />
        </div>
      </div>
    </div>
  );
}