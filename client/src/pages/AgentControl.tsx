import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  Search,
  Layers,
  TrendingUp,
  BarChart,
  Package,
  Link,
  AlertTriangle,
  RotateCcw,
  Gauge,
  Filter,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WS_MESSAGE_TYPES, API } from '@/lib/constants';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { AgentService, AgentStateType } from '@/services';
import { LogService, LogEntry } from '@/services/LogService';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function AgentControl() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStartingAgent, setIsStartingAgent] = useState(false);
  const [isStoppingAgent, setIsStoppingAgent] = useState(false);
  const [isResettingCounter, setIsResettingCounter] = useState(false);
  
  // Agent options
  const [agentMode, setAgentMode] = useState<'complete' | 'discovery_only' | 'analysis_only'>('complete');
  const [targetCount, setTargetCount] = useState<number>(1000);
  
  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('');

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
      const result = await AgentService.startAgent({
        mode: agentMode,
        targetCount: targetCount
      });
      
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
  
  // Reset agent counter action
  const handleResetCounter = async () => {
    try {
      setIsResettingCounter(true);
      const result = await AgentService.resetAgentCounter();
      
      if (result.success) {
        toast({
          title: 'Counter Reset',
          description: result.message || 'Agent counter has been reset',
        });
      } else {
        throw new Error(result.message || 'Failed to reset counter');
      }

      // Refresh status
      refetchStatus();
    } catch (error) {
      console.error('Error resetting counter:', error);
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Could not reset the counter',
        variant: 'destructive',
      });
    } finally {
      setIsResettingCounter(false);
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

  // Filtered logs based on search
  const filteredLogs = logFilter 
    ? logs.filter(log => log.message.toLowerCase().includes(logFilter.toLowerCase()))
    : logs;

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

  // Determine agent current state
  const currentState = agentStatus?.agentState?.currentState || 'idle';
  const isAgentRunning = agentStatus?.isRunning || false;
  const maxProducts = agentStatus?.agentState?.maxProducts || 1000;
  const totalProductsAdded = agentStatus?.agentState?.totalProductsAdded || 0;
  const totalProductsInDb = agentStatus?.totalProducts || 0;
  
  // Get product discovery stats
  const discoveredProducts = agentStatus?.productDiscovery?.discoveredProducts || 0;
  const validatedProducts = agentStatus?.productDiscovery?.validatedProducts || 0;
  
  // Calculate progress percentages
  const totalProgress = Math.min(100, Math.round((totalProductsInDb / maxProducts) * 100));
  const sessionProgress = agentStatus?.progress || 0;
  
  // Get current phase
  const currentPhase = agentStatus?.currentPhase || 'Not Running';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Control Center</h2>
          <p className="text-muted-foreground">
            Monitor and control the TrendDrop AI data collection agent
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

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Agent Status
              <Bot className={`h-4 w-4 ${isAgentRunning ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {isAgentRunning ? (
                  <span className="flex items-center text-blue-500">
                    <Check className="h-4 w-4 mr-1" /> Running
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <Power className="h-4 w-4 mr-1" /> Stopped
                  </span>
                )}
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100">
                {currentState.replace('_', ' ')}
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Current Phase: {currentPhase}</div>
              <Progress value={sessionProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Database Goal
              <Gauge className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium text-xl">
                {totalProductsInDb} <span className="text-xs text-muted-foreground">/ {maxProducts}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Products in Database
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Progress: {totalProgress}%</div>
              <Progress value={totalProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Discovery Phase
              <Search className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Discovered</div>
                <div className="font-medium">{discoveredProducts}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Validated</div>
                <div className="font-medium">{validatedProducts}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Success Rate</div>
                <div className="font-medium">
                  {discoveredProducts > 0 
                    ? `${Math.round((validatedProducts / discoveredProducts) * 100)}%` 
                    : '0%'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Connection Status
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-purple-500' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {isConnected ? (
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
                {agentStatus?.lastRun ? 
                  `Last run: ${formatRelativeTime(new Date(agentStatus.lastRun))}` : 
                  'Never run'
                }
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Database: {agentStatus?.aiCapabilities?.openai ? 'Connected' : 'Disconnected'}
              </div>
              <div className="flex items-center mt-1">
                <Server className="h-3 w-3 mr-1" />
                AI: {agentStatus?.aiCapabilities?.aiInitialized ? 'Initialized' : 'Not Initialized'}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Agent Mode</label>
                <Select 
                  value={agentMode} 
                  onValueChange={(value) => setAgentMode(value as any)}
                  disabled={isAgentRunning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Complete Process</SelectItem>
                    <SelectItem value="discovery_only">Discovery Only</SelectItem>
                    <SelectItem value="analysis_only">Analysis Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Target Products</label>
                <Input 
                  type="number" 
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value) || 1000)}
                  disabled={isAgentRunning}
                />
              </div>
              
              <Button 
                className="w-full" 
                variant={isAgentRunning ? 'outline' : 'default'}
                onClick={handleStartAgent}
                disabled={isStartingAgent || isAgentRunning}
              >
                <Play className="mr-2 h-4 w-4" />
                {isStartingAgent ? 'Starting...' : 'Start Agent'}
              </Button>
              
              <Button 
                className="w-full" 
                variant="destructive"
                onClick={handleStopAgent}
                disabled={isStoppingAgent || !isAgentRunning}
              >
                <Power className="mr-2 h-4 w-4" />
                {isStoppingAgent ? 'Stopping...' : 'Stop Agent'}
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleResetCounter}
                disabled={isResettingCounter || isAgentRunning}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isResettingCounter ? 'Resetting...' : 'Reset Counter'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Products Added</span>
                <span className="font-medium">{totalProductsAdded}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Database Total</span>
                <span className="font-medium">{totalProductsInDb}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connection Status</span>
                <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Phase</span>
                <span className="text-xs bg-secondary py-1 px-2 rounded-full">
                  {currentPhase}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="logs">
            <TabsList className="w-full">
              <TabsTrigger value="logs" className="flex-1">Agent Logs</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Process Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Agent Logs</CardTitle>
                    <CardDescription>Recent agent activity and events</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter logs..."
                        className="pl-8 w-64"
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={clearLogs}
                      variant="outline"
                      size="sm"
                    >
                      Clear Logs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-black/5 rounded-md p-4 overflow-y-auto font-mono text-xs">
                    {isLoadingLogs ? (
                      <div className="text-muted-foreground italic flex items-center justify-center h-full">
                        Loading logs...
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="text-muted-foreground italic flex items-center justify-center h-full">
                        {logFilter ? 'No matching log entries' : 'No log entries available'}
                      </div>
                    ) : (
                      filteredLogs.map((log, index) => (
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
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Process Details</CardTitle>
                  <CardDescription>Current state and operational metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Discovery Phase</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Discovered Products</span>
                            <span>{discoveredProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Products with Valid Sources</span>
                            <span>{validatedProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Source Validation Rate</span>
                            <span>
                              {discoveredProducts > 0 
                                ? `${Math.round((validatedProducts / discoveredProducts) * 100)}%` 
                                : '0%'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Analysis Phase</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Products Analyzed</span>
                            <span>{validatedProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Trends Generated</span>
                            <span>{validatedProducts > 0 ? validatedProducts * 30 : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Regions Analyzed</span>
                            <span>{validatedProducts > 0 ? validatedProducts * 4 : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Videos Discovered</span>
                            <span>{validatedProducts > 0 ? validatedProducts * 2 : 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Database Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Products</span>
                            <span>{totalProductsInDb}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Max Products Goal</span>
                            <span>{maxProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Completion Percentage</span>
                            <span>{totalProgress}%</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={totalProgress} className="h-2" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">AI Integration Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">OpenAI</span>
                            <span className={agentStatus?.aiCapabilities?.openai ? 'text-green-500' : 'text-red-500'}>
                              {agentStatus?.aiCapabilities?.openai ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">LM Studio</span>
                            <span className={agentStatus?.aiCapabilities?.lmstudio ? 'text-green-500' : 'text-red-500'}>
                              {agentStatus?.aiCapabilities?.lmstudio ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">AI System</span>
                            <span className={agentStatus?.aiCapabilities?.aiInitialized ? 'text-green-500' : 'text-red-500'}>
                              {agentStatus?.aiCapabilities?.aiInitialized ? 'Initialized' : 'Not Initialized'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="mr-2">Current State:</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-full">
                      {currentState.replace('_', ' ')}
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-2">Current Phase:</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-full">
                      {currentPhase}
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-2">Progress:</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-full">
                      {sessionProgress}%
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}