import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardSummary } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect } from "react";
import { TrendingUp, BarChart2, Globe, Video, ArrowUp, ArrowRight, ArrowDown, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MetricsSummary() {
  const queryClient = useQueryClient();
  
  // Determine WebSocket URL based on current URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  
  // Use WebSocket hook for real-time updates
  const { messages, status: wsStatus } = useWebSocket(wsUrl);
  
  const { 
    data: summary, 
    isLoading,
    isFetching
  } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Listen for WebSocket messages for real-time updates
  useEffect(() => {
    const productUpdates = messages.filter(msg => msg.type === 'product_update');
    
    if (productUpdates.length > 0) {
      // Invalidate the dashboard summary to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    }
  }, [messages, queryClient]);

  const metrics = [
    {
      title: "Trending Products",
      value: summary?.trendingProductsCount || 0,
      icon: <TrendingUp className="h-4 w-4" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      change: { 
        value: 12, 
        label: "increase from last week",
        icon: <ArrowUp className="h-3 w-3 mr-1" />,
        color: "text-emerald-500"
      }
    },
    {
      title: "Avg. Trend Score",
      value: summary?.averageTrendScore || 0,
      icon: <BarChart2 className="h-4 w-4" />,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      change: { 
        value: 0, 
        label: "stable last 24 hours",
        icon: <ArrowRight className="h-3 w-3 mr-1" />,
        color: "text-amber-500"
      }
    },
    {
      title: "Top Region",
      value: summary?.topRegion || "–",
      icon: <Globe className="h-4 w-4" />,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      change: { 
        value: summary?.topRegionPercentage || 0, 
        label: "of trends originate here",
        icon: null,
        color: "text-blue-500"
      }
    },
    {
      title: "Viral Videos",
      value: summary?.viralVideosCount || 0,
      icon: <Video className="h-4 w-4" />,
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-500",
      change: { 
        value: summary?.newVideosToday || 0, 
        label: "new videos today",
        icon: summary?.newVideosToday > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : null,
        color: "text-indigo-500"
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-3 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Key Metrics</h2>
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Key Metrics</h2>
        <Badge 
          variant={wsStatus === 'open' ? "outline" : "destructive"} 
          className="flex items-center gap-1.5 px-2 py-0.5"
        >
          {wsStatus === 'open' ? (
            <>
              <Wifi className="h-3 w-3" />
              {isFetching ? "Updating..." : "Real-time data"}
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Connection lost
            </>
          )}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className="p-5 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{metric.title}</div>
                <div className="text-2xl font-semibold">
                  {metric.title === "Avg. Trend Score" && typeof metric.value === 'number' 
                    ? metric.value.toFixed(1) 
                    : metric.value}
                </div>
              </div>
              <div className={cn("p-2 rounded-full", metric.iconBg, metric.iconColor)}>
                {metric.icon}
              </div>
            </div>
            
            <div className={cn("text-xs flex items-center mt-3", metric.change.color)}>
              {metric.change.icon}
              <span className="font-medium">{metric.change.value}</span>&nbsp;
              <span className="text-muted-foreground">{metric.change.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
