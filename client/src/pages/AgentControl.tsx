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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WS_MESSAGE_TYPES, API } from '@/lib/constants';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { AgentService } from '@/services';
import { LogService, LogEntry } from '@/services/LogService';

export default function AgentControl() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStartingAgent, setIsStartingAgent] = useState(false);
  const [isStoppingAgent, setIsStoppingAgent] = useState(false);
  
  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Initialize agent action
  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      // API endpoint for initialize doesn't exist in AgentService yet
      // Will trigger the getConfig() method instead
      const config = await AgentService.getAgentConfig();
      
      toast({
        title: 'Agent Initialized',
        description: 'Agent system has been initialized',
      });

      // Refresh status
      refetchStatus();
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
      const result = await AgentService.startAgent();
      
      if (result.success) {
        toast({
          title: 'Agent Started',
          description: result.message || 'Agent system is now running',
        });
      } else {
        throw new Error(result.message || 'Failed to start agent');
      }

      // Refresh status
      refetchStatus();
      // Load latest logs after starting agent
      loadLogs();
    } catch (error) {
      console.error('Error starting agent:', error);
      toast({
        title: 'Start Failed',
        description: error instanceof Error ? error.message : 'Could not start the agent system',
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
      const result = await AgentService.stopAgent();
      
      if (result.success) {
        toast({
          title: 'Agent Stopped',
          description: result.message || 'Agent system has been stopped',
        });
      } else {
        throw new Error(result.message || 'Failed to stop agent');
      }

      // Refresh status
      refetchStatus();
    } catch (error) {
      console.error('Error stopping agent:', error);
      toast({
        title: 'Stop Failed',
        description: error instanceof Error ? error.message : 'Could not stop the agent system',
        variant: 'destructive',
      });
    } finally {
      setIsStoppingAgent(false);
    }
  };
  
  // Load logs function
  const loadLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const response = await LogService.getLogs(100, 'agent');
      if (response?.logs) {
        setLogs(response.logs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Clear logs function
  const clearLogs = async () => {
    try {
      await LogService.clearLogs();
      setLogs([]);
      toast({
        title: 'Logs Cleared',
        description: 'All logs have been cleared',
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear logs',
        variant: 'destructive',
      });
    }
  };

  const queryClient = useQueryClient();
  
  // Fetch agent status using React Query
  const { 
    data: agentStatus, 
    isLoading: isStatusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: [`${API.AI_AGENT}/status`],
    queryFn: () => AgentService.getStatus(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
  
  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Default agent status structure for when data is loading
  const defaultAgentStatus = {
    agent: {
      isInitialized: false,
      isRunning: false,
      status: 'idle',
      lastRun: null,
      discoveredItems: 0,
      version: '1.0.0'
    },
    aiAgent: {
      isInitialized: false,
      isRunning: false,
      status: 'idle',
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
  };
  
  // Merge fetched data with default structure to ensure all properties exist
  const currentStatus = agentStatus ? {
    ...defaultAgentStatus,
    ...agentStatus
  } : defaultAgentStatus;

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    onOpen: () => {
      console.log('WebSocket connection established');
      sendMessage({ type: WS_MESSAGE_TYPES.CLIENT_CONNECTED, clientId: 'agent_control' });
    },
    onMessage: (message) => {
      console.log('WebSocket message received:', message);
      if (message.type === WS_MESSAGE_TYPES.AGENT_STATUS) {
        // Invalidate the query to refresh data
        queryClient.invalidateQueries({ queryKey: [`${API.AI_AGENT}/status`] });
      } else if (message.type === 'log_entry' && message.entry?.source === 'agent') {
        // Add new log entry
        setLogs(currentLogs => [message.entry, ...currentLogs].slice(0, 100));
      }
    }
  });

  // Display error if agent status fetch fails
  useEffect(() => {
    if (statusError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch agent status',
        variant: 'destructive',
      });
    }
  }, [statusError, toast]);

  // Handle status refresh
  const handleRefresh = () => {
    refetchStatus();
    loadLogs();
  };

  // Display loading screen while initial data is being fetched
  if (isStatusLoading && !agentStatus) {
    return <LoadingScreen />;
  }

  const agentRunning = currentStatus.agent.isRunning;
  const agentInitialized = currentStatus.agent.isInitialized;
  const aiAgentRunning = currentStatus.aiAgent.isRunning;
  const aiAgentInitialized = currentStatus.aiAgent.isInitialized;
  const databaseConnected = currentStatus.database.isConnected;
  const websocketRunning = currentStatus.websocket.isRunning;

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
          disabled={isStatusLoading || isLoadingLogs}
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
                {currentStatus.agent.lastRun ? 
                  `Last run: ${formatRelativeTime(new Date(currentStatus.agent.lastRun))}` : 
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
                {currentStatus.aiAgent.lastRun ? 
                  `Last run: ${formatRelativeTime(new Date(currentStatus.aiAgent.lastRun))}` : 
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
                {`${currentStatus.database.recordCount} records`}
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
                {`${currentStatus.websocket.connectedClients} clients connected`}
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
                <span className="font-medium">{currentStatus.agent.discoveredItems}</span>
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
                  {currentStatus.agent.version}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Agent Logs</CardTitle>
              <CardDescription>Recent agent activity and events</CardDescription>
            </div>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
            >
              Clear Logs
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-black/5 rounded-md p-4 overflow-y-auto font-mono text-xs">
              {isLoadingLogs ? (
                <div className="text-muted-foreground italic flex items-center justify-center h-full">
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-muted-foreground italic flex items-center justify-center h-full">
                  No log entries available
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 pb-1 border-b border-gray-100 ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-500' : ''}`}>
                    <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className="text-blue-500">[{log.source}]</span>{' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}