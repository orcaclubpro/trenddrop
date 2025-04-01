import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WebSocketStatusProps {
  showReconnectButton?: boolean;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function WebSocketStatus({
  showReconnectButton = true,
  variant = 'compact',
  className = '',
}: WebSocketStatusProps) {
  const { isConnected, isConnecting, reconnect, lastMessage } = useWebSocketContext();
  const [connectionDuration, setConnectionDuration] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Update connection stats
  useEffect(() => {
    if (lastMessage) {
      setLastActivity(new Date());
    }
  }, [lastMessage]);

  // Track connection duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setConnectionDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setConnectionDuration(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format last activity time
  const formatLastActivity = () => {
    if (!lastActivity) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className} ${!isConnected && !isConnecting ? 'opacity-80' : 'opacity-60 hover:opacity-100 transition-opacity'}`}>
        {isConnected ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : isConnecting ? (
          <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={reconnect} />
        )}
        
        <span className="text-sm font-medium">
          {isConnected 
            ? 'Connected' 
            : isConnecting 
              ? 'Connecting...' 
              : 'Reconnect'}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          WebSocket Status
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={isConnected ? "success" : isConnecting ? "warning" : "destructive"}>
            {isConnected ? "Connected" : isConnecting ? "Connecting" : "Disconnected"}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Connection Time</span>
          <div className="flex items-center">
            <Timer className="h-3 w-3 mr-1" />
            <span className="text-sm">{formatDuration(connectionDuration)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Last Activity</span>
          <span className="text-sm">{formatLastActivity()}</span>
        </div>
        
        {isConnected && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Signal Quality</span>
              <span>Excellent</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>
        )}
        
        {showReconnectButton && !isConnected && !isConnecting && (
          <Button 
            size="sm" 
            className="w-full" 
            onClick={reconnect}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}