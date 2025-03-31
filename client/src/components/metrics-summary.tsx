import { useQuery } from "@tanstack/react-query";
import { DashboardSummary } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MetricsSummary() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard"],
  });

  const metrics = [
    {
      title: "Trending Products",
      value: summary?.trendingProductsCount || 0,
      icon: "arrow-up-line",
      color: "success",
      change: { value: 12, label: "increase from last week" }
    },
    {
      title: "Avg. Trend Score",
      value: summary?.averageTrendScore || 0,
      icon: "bar-chart-line",
      color: "warning",
      change: { value: 0, label: "Stable last 24 hours" }
    },
    {
      title: "Top Region",
      value: summary?.topRegion || "",
      icon: "global-line",
      color: "primary",
      change: { value: summary?.topRegionPercentage || 0, label: "of trends originate here" }
    },
    {
      title: "Viral Videos",
      value: summary?.viralVideosCount || 0,
      icon: "video-line",
      color: "success",
      change: { value: summary?.newVideosToday || 0, label: "new videos today" }
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</div>
                <div className="text-2xl font-semibold mt-1">{metric.value}</div>
              </div>
              <div className={`text-${metric.color}-500 bg-${metric.color}-500/10 p-2 rounded`}>
                <i className={`ri-${metric.icon}`}></i>
              </div>
            </div>
            <div className={`text-xs text-${metric.color}-500 mt-2 flex items-center`}>
              {metric.change.value > 0 && <i className="ri-arrow-up-line mr-1"></i>}
              {metric.change.value === 0 && <i className="ri-arrow-right-line mr-1"></i>}
              {metric.change.value < 0 && <i className="ri-arrow-down-line mr-1"></i>}
              {metric.change.value} {metric.change.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
