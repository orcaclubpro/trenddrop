import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { WebSocketStatus } from '@/components/websocket/WebSocketStatus';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background lg:block">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <div className="fixed bottom-4 right-4 z-50">
          <WebSocketStatus 
            variant="compact" 
            className="bg-background/60 backdrop-blur-sm shadow-sm rounded-full px-3 py-1 border border-border/40 hover:bg-background/80 transition-all"
          />
        </div>
      </div>
    </div>
  );
}