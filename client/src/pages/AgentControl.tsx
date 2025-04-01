import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw,
  Database, 
  Server, 
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';

function AgentControl() {
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [aiAgentStatus, setAIAgentStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [latestLog, setLatestLog] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch status from API
  const { data: healthData, isLoading } = useQuery({
    queryKey: [API.HEALTH],
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Initialize AI Agent
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.AI_AGENT.INITIALIZE, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Agent Initialized',
        description: 'The AI agent has been successfully initialized.',
      });
      // Refresh status
      queryClient.invalidateQueries({ queryKey: [API.HEALTH] });
      setAIAgentStatus(data.status);
    },
    onError: (error) => {
      toast({
        title: 'Initialization Failed',
        description: `Failed to initialize AI agent: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Start AI Agent
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.AI_AGENT.START, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Agent Started',
        description: 'The AI agent has started discovering trending products.',
      });
      // Refresh status
      queryClient.invalidateQueries({ queryKey: [API.HEALTH] });
      setAIAgentStatus(data.status);
    },
    onError: (error) => {
      toast({
        title: 'Start Failed',
        description: `Failed to start AI agent: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Stop AI Agent
  const stopMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(API.AI_AGENT.STOP, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Agent Stopped',
        description: 'The AI agent has been stopped.',
      });
      // Refresh status
      queryClient.invalidateQueries({ queryKey: [API.HEALTH] });
      setAIAgentStatus(data.status);
    },
    onError: (error) => {
      toast({
        title: 'Stop Failed',
        description: `Failed to stop AI agent: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === WS_MESSAGE_TYPES.AGENT_STATUS) {
        setLatestLog(message.message || null);
        if (message.status) {
          setAIAgentStatus(message.status);
        }
      }
    },
  });
  
  // Update status when health data changes
  useEffect(() => {
    if (healthData) {
      setAgentStatus(healthData.agent);
      setAIAgentStatus(healthData.aiAgent);
      setSystemStatus({
        database: healthData.database,
        websocket: healthData.websocket,
      });
    }
  }, [healthData]);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">AI Agent Control</h1>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading agent status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Agent Control</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: [API.HEALTH] })}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent Status Card */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-1">AI Agent</h2>
            <div className="flex items-center mb-4">
              <StatusBadge status={aiAgentStatus?.status || 'unknown'} />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {aiAgentStatus?.isRunning 
                ? 'AI Agent is actively discovering products and trends' 
                : 'AI Agent is idle and ready to discover trending products'}
            </p>
            <div className="w-full space-y-2">
              {!aiAgentStatus?.isRunning && (
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                  <span>Start Agent</span>
                </Button>
              )}
              
              {aiAgentStatus?.isRunning && (
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  variant="destructive"
                  onClick={() => stopMutation.mutate()}
                  disabled={stopMutation.isPending}
                >
                  <Pause className="h-4 w-4" />
                  <span>Stop Agent</span>
                </Button>
              )}
              
              <Button 
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => initializeMutation.mutate()}
                disabled={initializeMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Initialize</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Agent Metrics */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Agent Metrics</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Products Found</span>
                <span className="font-medium">{aiAgentStatus?.productsFound || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${Math.min((aiAgentStatus?.productsFound || 0) / 2, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Model Availability</h3>
              <div className="grid grid-cols-2 gap-2">
                <ModelStatus name="OpenAI" isAvailable={aiAgentStatus?.openai} />
                <ModelStatus name="LM Studio" isAvailable={aiAgentStatus?.lmstudio} />
                <ModelStatus name="Grok" isAvailable={aiAgentStatus?.grok} />
                <ModelStatus name="Local" isAvailable={true} />
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Activity</h3>
              <div className="text-sm">
                {aiAgentStatus?.lastRun ? (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Last run: {formatRelativeTime(aiAgentStatus.lastRun)}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No recent activity</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* System Status */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary" />
                <span>Database</span>
              </div>
              <StatusBadge 
                status={systemStatus?.database?.connected ? 'connected' : 'disconnected'} 
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-primary" />
                <span>API Server</span>
              </div>
              <StatusBadge status="connected" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                <span>WebSocket</span>
              </div>
              <div className="flex items-center">
                <StatusBadge status="connected" />
                <span className="text-xs ml-2">
                  {systemStatus?.websocket?.connections || 0} active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Log */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Live Updates
          </div>
        </div>
        
        <div className="p-4 max-h-64 overflow-y-auto">
          {latestLog ? (
            <div className="border-l-2 border-primary pl-3 py-1 mb-2 text-sm">
              <p>{latestLog}</p>
              <span className="text-xs text-muted-foreground">Just now</span>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <p>No recent activity logs available</p>
              <p className="text-xs mt-1">Start the agent to see activity logs here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  let bgColor = 'bg-muted';
  let textColor = 'text-muted-foreground';
  let Icon = AlertCircle;
  
  switch (status.toLowerCase()) {
    case 'running':
    case 'active':
    case 'connected':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-700 dark:text-green-400';
      Icon = CheckCircle2;
      break;
    case 'idle':
    case 'stopped':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-700 dark:text-yellow-400';
      Icon = Clock;
      break;
    case 'error':
    case 'disconnected':
    case 'failed':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-700 dark:text-red-400';
      Icon = XCircle;
      break;
  }
  
  return (
    <div className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
      <Icon className="h-3 w-3 mr-1" />
      <span>{status}</span>
    </div>
  );
}

interface ModelStatusProps {
  name: string;
  isAvailable: boolean;
}

function ModelStatus({ name, isAvailable }: ModelStatusProps) {
  return (
    <div className="flex items-center bg-muted/50 p-2 rounded">
      <div className={`h-2 w-2 rounded-full mr-2 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs">{name}</span>
    </div>
  );
}

export default AgentControl;