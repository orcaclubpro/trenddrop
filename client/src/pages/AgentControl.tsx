import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Server, 
  Database, 
  Globe, 
  Wifi, 
  Power, 
  Play, 
  Download,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Check,
  RefreshCcw,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';

export default function AgentControl() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStartingAgent, setIsStartingAgent] = useState(false);
  const [isStoppingAgent, setIsStoppingAgent] = useState(false);

  // Initialize agent action
  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('/api/agent/initialize', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize agent');
      }
      
      const data = await response.json();
      toast({
        title: 'Agent Initialized',
        description: data.message || 'Agent system has been initialized',
      });

      // Refresh status after initialization
      setTimeout(fetchAgentStatus, 1000);
    } catch (error) {
      console.error('Error initializing agent:', error);
      toast({
        title: 'Initialization Failed',
        description: 'Could not initialize the agent system',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Start agent action
  const handleStartAgent = async () => {
    try {
      setIsStartingAgent(true);
      const response = await fetch('/api/agent/start', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start agent');
      }
      
      const data = await response.json();
      toast({
        title: 'Agent Started',
        description: data.message || 'Agent system is now running',
      });

      // Refresh status after starting
      setTimeout(fetchAgentStatus, 1000);
    } catch (error) {
      console.error('Error starting agent:', error);
      toast({
        title: 'Start Failed',
        description: 'Could not start the agent system',
        variant: 'destructive',
      });
    } finally {
      setIsStartingAgent(false);
    }
  };

  // Stop agent action
  const handleStopAgent = async () => {
    try {
      setIsStoppingAgent(true);
      const response = await fetch('/api/agent/stop', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop agent');
      }
      
      const data = await response.json();
      toast({
        title: 'Agent Stopped',
        description: data.message || 'Agent system has been stopped',
      });

      // Refresh status after stopping
      setTimeout(fetchAgentStatus, 1000);
    } catch (error) {
      console.error('Error stopping agent:', error);
      toast({
        title: 'Stop Failed',
        description: 'Could not stop the agent system',
        variant: 'destructive',
      });
    } finally {
      setIsStoppingAgent(false);
    }
  };

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    onOpen: () => {
      console.log('WebSocket connection established');
      sendMessage({ type: 'client_connected', clientId: 'agent_control' });
    },
    onMessage: (message) => {
      console.log('WebSocket message received:', message);
      if (message.type === 'agent_status') {
        setAgentStatus(prevStatus => ({
          ...prevStatus,
          ...message.data
        }));
      }
    }
  });

  // Mock agent status
  const [agentStatus, setAgentStatus] = useState({
    agent: {
      isInitialized: false,
      isRunning: false,
      status: 'stopped',
      lastRun: null,
      discoveredItems: 0,
      version: '1.0.0'
    },
    aiAgent: {
      isInitialized: false,
      isRunning: false,
      status: 'stopped',
      lastRun: null
    },
    database: {
      isConnected: false,
      lastBackup: null,
      recordCount: 0
    },
    websocket: {
      isRunning: false,
      connectedClients: 0
    }
  });

  // Fetch agent status
  const fetchAgentStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agent/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent status');
      }
      
      const data = await response.json();
      setAgentStatus(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch agent status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch status on component mount
  useEffect(() => {
    fetchAgentStatus();
  }, []);

  // Handle status refresh
  const handleRefresh = () => {
    fetchAgentStatus();
  };

  // Display loading screen while initial data is being fetched
  if (isLoading && !agentStatus) {
    return <LoadingScreen />;
  }

  const agentRunning = agentStatus.agent.isRunning;
  const agentInitialized = agentStatus.agent.isInitialized;
  const aiAgentRunning = agentStatus.aiAgent.isRunning;
  const aiAgentInitialized = agentStatus.aiAgent.isInitialized;
  const databaseConnected = agentStatus.database.isConnected;
  const websocketRunning = agentStatus.websocket.isRunning;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Control Center</h2>
          <p className="text-muted-foreground">
            Monitor and control the TrendDrop data collection agent
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${agentRunning ? 'border-l-green-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Agent Status
              <Bot className={`h-4 w-4 ${agentRunning ? 'text-green-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {agentRunning ? (
                  <span className="flex items-center text-green-500">
                    <Check className="h-4 w-4 mr-1" /> Running
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <Power className="h-4 w-4 mr-1" /> Stopped
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {agentStatus.agent.lastRun ? 
                  `Last run: ${formatRelativeTime(new Date(agentStatus.agent.lastRun))}` : 
                  'Never run'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${aiAgentRunning ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              AI Agent Status
              <Server className={`h-4 w-4 ${aiAgentRunning ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {aiAgentRunning ? (
                  <span className="flex items-center text-blue-500">
                    <Check className="h-4 w-4 mr-1" /> Running
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <Power className="h-4 w-4 mr-1" /> Stopped
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {agentStatus.aiAgent.lastRun ? 
                  `Last run: ${formatRelativeTime(new Date(agentStatus.aiAgent.lastRun))}` : 
                  'Never run'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${databaseConnected ? 'border-l-purple-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Database Status
              <Database className={`h-4 w-4 ${databaseConnected ? 'text-purple-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {databaseConnected ? (
                  <span className="flex items-center text-purple-500">
                    <Check className="h-4 w-4 mr-1" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mr-1" /> Disconnected
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {`${agentStatus.database.recordCount} records`}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${websocketRunning ? 'border-l-amber-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              WebSocket Status
              <Wifi className={`h-4 w-4 ${websocketRunning ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {websocketRunning ? (
                  <span className="flex items-center text-amber-500">
                    <Check className="h-4 w-4 mr-1" /> Running
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mr-1" /> Stopped
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {`${agentStatus.websocket.connectedClients} clients connected`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Controls</CardTitle>
              <CardDescription>Manage data collection agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                variant={agentInitialized ? 'outline' : 'default'}
                onClick={handleInitialize}
                disabled={isInitializing || agentInitialized}
              >
                <Download className="mr-2 h-4 w-4" />
                {isInitializing ? 'Initializing...' : 'Initialize Agent'}
              </Button>
              
              <Button 
                className="w-full" 
                variant={agentRunning ? 'outline' : 'default'}
                onClick={handleStartAgent}
                disabled={isStartingAgent || agentRunning || !agentInitialized}
              >
                <Play className="mr-2 h-4 w-4" />
                {isStartingAgent ? 'Starting...' : 'Start Agent'}
              </Button>
              
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={handleStopAgent}
                disabled={isStoppingAgent || !agentRunning}
              >
                <Power className="mr-2 h-4 w-4" />
                {isStoppingAgent ? 'Stopping...' : 'Stop Agent'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Discovered Items</span>
                <span className="font-medium">{agentStatus.agent.discoveredItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connection Status</span>
                <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Agent Version</span>
                <span className="text-xs bg-secondary py-1 px-2 rounded-full">
                  {agentStatus.agent.version}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Agent Logs</CardTitle>
            <CardDescription>Recent agent activity and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-black/5 rounded-md p-4 overflow-y-auto font-mono text-xs">
              {/* Agent log entries would appear here */}
              <div className="text-muted-foreground italic flex items-center justify-center h-full">
                No log entries available
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}