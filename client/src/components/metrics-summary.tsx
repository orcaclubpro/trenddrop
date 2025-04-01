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
      <div className="p-4 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-700">Key Metrics</h2>
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-md bg-white shadow-sm border border-gray-100">
              <div className="flex items-center mb-3">
                <Skeleton className="w-9 h-9 rounded-md mr-3" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-16 mb-3" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-700">Key Metrics</h2>
        <Badge 
          variant={wsStatus === 'open' ? "outline" : "destructive"} 
          className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs"
        >
          {wsStatus === 'open' ? (
            <>
              <Wifi className="h-3 w-3" />
              {isFetching ? "Updating..." : "Live data"}
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Connection lost
            </>
          )}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className="p-6 rounded-md bg-white shadow-sm border border-gray-100"
          >
            <div className="flex items-center mb-3">
              <div className={cn("w-9 h-9 rounded-md flex items-center justify-center mr-3", metric.iconBg)}>
                <div className={metric.iconColor}>{metric.icon}</div>
              </div>
              <span className="text-sm font-medium text-gray-500">{metric.title}</span>
            </div>
            
            <div className="text-3xl font-semibold mb-3 text-gray-800">
              {metric.title === "Avg. Trend Score" && typeof metric.value === 'number' 
                ? metric.value.toFixed(1) 
                : metric.value}
            </div>
            
            <div className={cn("text-xs flex items-center", metric.change.color)}>
              {metric.change.icon}
              <span className="font-medium">{metric.change.value}</span>&nbsp;
              <span className="text-gray-500">{metric.change.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
