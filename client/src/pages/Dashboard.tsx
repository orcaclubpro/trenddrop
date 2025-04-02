import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  Package, 
  TrendingUp, 
  MapPin, 
  Video, 
  RefreshCcw,
  Globe,
  Zap,
  Filter
} from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { WS_MESSAGE_TYPES, API } from '@/lib/constants';
import { DashboardService, ProductService } from '@/services';
import { RecentProductsCarousel } from '@/components/products/RecentProductsCarousel';

export default function Dashboard() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();
  
  // WebSocket integration for real-time updates
  useWebSocket({
    onOpen: () => {
      console.log('WebSocket connection opened');
    },
    onMessage: (message) => {
      if (message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATE) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [API.DASHBOARD] });
        console.log('Product update received, refreshing data');
      }
    }
  });

  // Fetch dashboard summary data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: [API.DASHBOARD],
    queryFn: () => DashboardService.getDashboardSummary()
  });
  
  // Fetch trending products
  const {
    data: trendingProducts,
    isLoading: isTrendingLoading,
    error: trendingError
  } = useQuery({
    queryKey: [API.TRENDING_PRODUCTS],
    queryFn: () => ProductService.getTrendingProducts(5)
  });

  useEffect(() => {
    if (dashboardError) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
    
    if (trendingError) {
      toast({
        title: 'Error',
        description: 'Failed to load trending products',
        variant: 'destructive',
      });
    }
  }, [dashboardError, trendingError, toast]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchDashboard(),
        queryClient.invalidateQueries({ queryKey: [API.TRENDING_PRODUCTS] })
      ]);
      
      toast({
        title: 'Dashboard Refreshed',
        description: 'Latest data has been loaded',
      });
    } catch (err) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isDashboardLoading || isTrendingLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your product trend intelligence at a glance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Recent Products Carousel */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent</h3>
        <RecentProductsCarousel products={dashboardData?.recentProducts || []} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Products Tracked
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactNumber(dashboardData?.productCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.newProductCount ? `+${dashboardData.newProductCount} this week` : 'No new products this week'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Average Trend Score
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.averageTrendScore?.toFixed(1) || '0'}/100
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.trendScoreChange !== undefined 
                ? (dashboardData.trendScoreChange > 0 
                  ? `↑ ${dashboardData.trendScoreChange.toFixed(1)} points` 
                  : dashboardData.trendScoreChange < 0 
                    ? `↓ ${Math.abs(dashboardData.trendScoreChange).toFixed(1)} points` 
                    : 'No change in trend score')
                : 'No change in trend score'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Active Regions
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactNumber(dashboardData?.regionCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {dashboardData?.countryCount || 0} countries
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-medium">
              Avg. Market Value
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.averagePrice || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.priceChange !== undefined 
                ? (dashboardData.priceChange > 0 
                  ? `↑ ${dashboardData.priceChange.toFixed(1)}% increase` 
                  : dashboardData.priceChange < 0 
                    ? `↓ ${Math.abs(dashboardData.priceChange).toFixed(1)}% decrease` 
                    : 'No price change')
                : 'No price change'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Score Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Trend Score Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Product trend scores across categories
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Trend score chart visualization will appear here
            </div>
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Products</CardTitle>
            <p className="text-sm text-muted-foreground">
              Highest trending items
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {trendingProducts?.length ? (
                trendingProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mr-3">
                      <span className="font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="font-medium">
                      {product.trendScore}/100
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Top Categories
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData?.topCategories?.length ? (
                dashboardData.topCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-sm">{category.count} products</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Popular Regions
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Region map visualization will appear here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Popular Videos
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Video gallery will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}