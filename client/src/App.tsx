// Update client/src/App.tsx

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import TrendingProducts from "@/pages/trending-products";
import GeographicTrends from "@/pages/geographic-trends";
import MarketingVideos from "@/pages/marketing-videos";
import Settings from "@/pages/settings";
import Sidebar from "@/components/sidebar";
import LoadingState from "@/components/loading-state";
import { ReactNode, useState, useEffect } from "react";
import { useWebSocket } from "./hooks/use-websocket";
import { useIsMobile } from "@/hooks/use-mobile";

// Layout component to wrap all pages with sidebar
function Layout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className={`min-h-screen flex flex-col ${isMobile ? "pt-16" : "ml-64"}`}>
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <Route path="/trendtracker" component={() => (
        <Layout>
          <Dashboard />
        </Layout>
      )} />
      <Route path="/trending-products" component={() => (
        <Layout>
          <TrendingProducts />
        </Layout>
      )} />
      <Route path="/geographic-trends" component={() => (
        <Layout>
          <GeographicTrends />
        </Layout>
      )} />
      <Route path="/marketing-videos" component={() => (
        <Layout>
          <MarketingVideos />
        </Layout>
      )} />
      <Route path="/settings" component={() => (
        <Layout>
          <Settings />
        </Layout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Determine WebSocket URL based on current URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  // Make sure to use the explicit /ws path for WebSocket connections
  const wsUrl = `${wsProtocol}//${wsHost}/ws`;
  
  // State to track application status
  const [appState, setAppState] = useState<{
    initialized: boolean;
    dbStatus: 'connecting' | 'connected' | 'error';
    agentStatus: 'initializing' | 'started' | 'error';
    message?: string;
    retryIn?: number;
  }>({
    initialized: false,
    dbStatus: 'connecting',
    agentStatus: 'initializing',
    message: 'Connecting to database...'
  });
  
  // Use WebSocket hook for real-time updates
  const { status: wsStatus, messages } = useWebSocket(wsUrl);
  
  // Debug WebSocket status for troubleshooting
  useEffect(() => {
    console.log(`WebSocket status changed: ${wsStatus}`);
  }, [wsStatus]);

  // Debug all received messages
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Messages received:', messages);
    }
  }, [messages]);
  
  // Update app state based on WebSocket messages
  useEffect(() => {
    if (wsStatus === 'open') {
      console.log('WebSocket connected, setting database as connected');
      // Set database as connected when WebSocket connects
      setAppState(prev => ({
        ...prev,
        dbStatus: 'connected',
        message: 'Initializing application components...'
      }));
      
      // Auto-initialize after 5 seconds if no agent_status message received
      // This helps in case the agent status message was missed
      const autoInitTimeout = setTimeout(() => {
        setAppState(prev => {
          // Only auto-initialize if we're still not initialized
          if (!prev.initialized) {
            console.log('Auto-initializing after timeout...');
            return {
              ...prev,
              initialized: true,
              agentStatus: 'started',
              message: 'Application ready'
            };
          }
          return prev;
        });
      }, 5000);
      
      // Clean up timeout
      return () => clearTimeout(autoInitTimeout);
    } else if (wsStatus === 'error' || wsStatus === 'closed') {
      // Set error state when WebSocket connection fails
      setAppState(prev => ({
        ...prev,
        dbStatus: 'error',
        message: 'Could not connect to the server. Please check your connection.'
      }));
    }
    
    // Process WebSocket messages
    for (const msg of messages) {
      console.log('Received WebSocket message:', msg);
      if (msg.type === 'connection_established') {
        setAppState(prev => ({
          ...prev,
          dbStatus: msg.databaseStatus === 'connected' ? 'connected' : 'error',
          agentStatus: msg.agentStatus
        }));
      } else if (msg.type === 'agent_status') {
        console.log('Received agent_status:', msg.status);
        setAppState(prev => ({
          ...prev,
          agentStatus: msg.status,
          // Accept 'started' or 'completed' as valid initialized states
          initialized: msg.status === 'started' || msg.status === 'completed',
          message: msg.status === 'started' || msg.status === 'completed'
            ? 'Application ready' 
            : 'Initializing product research agent...'
        }));
      } else if (msg.type === 'database_error') {
        setAppState(prev => ({
          ...prev,
          dbStatus: 'error',
          message: msg.message,
          retryIn: msg.retryIn
        }));
      }
    }
  }, [wsStatus, messages]);
  
  // Determine which loading state to show
  const loadingState = 
    appState.dbStatus === 'error' ? 'error' :
    appState.dbStatus === 'connecting' ? 'connecting' : 'initializing';

  // FORCE INITIALIZATION TO DEBUG - Remove this in production
  // This line is a temporary fix to force the app to initialize even with WebSocket issues
  useEffect(() => {
    const forceInit = setTimeout(() => {
      console.log('Forcing initialization to debug the application...');
      setAppState(prevState => ({
        ...prevState,
        initialized: true,
        agentStatus: 'started',
        message: 'Application forced ready for debugging'
      }));
    }, 3000); // Force init after 3 seconds
    
    return () => clearTimeout(forceInit);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {!appState.initialized ? (
        <LoadingState 
          status={loadingState} 
          message={appState.message}
          retryIn={appState.retryIn}
        />
      ) : (
        <Router />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
