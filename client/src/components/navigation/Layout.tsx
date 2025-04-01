import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
  
  // Check server health
  const { data: healthData, isLoading: isHealthLoading, isError: isHealthError } = useQuery({
    queryKey: [API.HEALTH],
    retry: 3,
  });

  // Setup WebSocket for real-time updates
  const { lastMessage } = useWebSocket({
    onOpen: () => {
      toast({
        title: 'Connected',
        description: 'Real-time connection established',
      });
    },
    onClose: () => {
      toast({
        title: 'Disconnected',
        description: 'Real-time connection lost',
        variant: 'destructive',
      });
    },
    onMessage: (message) => {
      if (message.type === WS_MESSAGE_TYPES.CONNECTION_ESTABLISHED) {
        console.log('WebSocket connection established');
      } else if (message.type === WS_MESSAGE_TYPES.AGENT_STATUS) {
        console.log('Agent status update:', message.status);
      } else if (message.type === WS_MESSAGE_TYPES.NEW_PRODUCT) {
        toast({
          title: 'New Product Discovered',
          description: `${message.product?.name || 'New product'} added`,
        });
      } else if (message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATE) {
        console.log('Product updated:', message.productId);
      }
    },
  });

  // Set application as ready when health check passes
  useEffect(() => {
    if (healthData && !isHealthLoading && !isHealthError) {
      setIsReady(true);
    }
  }, [healthData, isHealthLoading, isHealthError]);

  // Show loading screen if not ready
  if (!isReady && isHealthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingScreen message="Connecting to TrendDrop..." />
      </div>
    );
  }

  // Show error screen if health check fails
  if (isHealthError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-destructive">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-6">
          Unable to connect to the TrendDrop server. Please try again later.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isOpen={isSidebarOpen} 
        closeSidebar={() => setIsSidebarOpen(false)} 
      />
      <div className="flex flex-col w-full overflow-hidden">
        <Topbar 
          openSidebar={() => setIsSidebarOpen(true)} 
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}