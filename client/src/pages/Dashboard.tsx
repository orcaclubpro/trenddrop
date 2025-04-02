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

// Define types for product data
interface Product {
  id: number;
  name: string;
  category: string;
  trendScore: number;
  price?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardData {
  productCount: number;
  newProductCount: number;
  averageTrendScore?: number;
  trendScoreChange?: number;
  regionCount: number;
  countryCount: number;
  averagePrice?: number;
  priceChange?: number;
  recentProducts: Product[];
  trendDistribution?: Record<string, number>;
  topCategories?: Category[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();
  
  // WebSocket integration for real-time updates
  useWebSocket({
    onOpen: () => {
      console.log('WebSocket connection opened on Dashboard');
      // Optionally refresh data when WebSocket connects
      queryClient.invalidateQueries({ queryKey: [API.DASHBOARD] });
    },
    onMessage: (message) => {
      // Handle both message types that the server might send
      if (message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATE || 
          message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATED) {
        console.log('Product update received, refreshing dashboard data');
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [API.DASHBOARD] });
        queryClient.invalidateQueries({ queryKey: [API.DASHBOARD + '/products'] });
        queryClient.invalidateQueries({ queryKey: [API.PRODUCTS] });
        
        // Show toast notification for product update
        toast({
          title: 'Product Update',
          description: 'Product data has been updated',
        });
      }
    },
    onError: (error) => {
      console.error('WebSocket error in Dashboard:', error);
    }
  });

  // Fetch dashboard summary data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useQuery<DashboardData>({
    queryKey: [API.DASHBOARD],
    queryFn: () => DashboardService.getDashboardSummary()
  });
  
  // Fetch trending products
  const {
    data: trendingProducts,
    isLoading: isTrendingLoading,
    error: trendingError
  } = useQuery<Product[]>({
    queryKey: [API.DASHBOARD + '/products'],
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
        queryClient.invalidateQueries({ queryKey: [API.DASHBOARD + '/products'] })
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

  // Ensure we have the dashboard data
  if (!dashboardData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No Dashboard Data Available</h2>
        <p className="text-muted-foreground mt-2">There was an issue loading the dashboard data.</p>
        <Button className="mt-6" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Your product trend intelligence at a glance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-full px-4 h-10 border-2 hover:border-primary transition-all"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Recent Products Carousel */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Recent Products
        </h3>
        <RecentProductsCarousel products={dashboardData?.recentProducts || []} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-[6px] border-l-primary shadow-sm hover-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-semibold">
              Products Tracked
              <Package className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCompactNumber(dashboardData?.productCount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              {dashboardData?.newProductCount ? (
                <>
                  <span className="text-emerald-500 font-medium">+{dashboardData.newProductCount}</span> 
                  <span>this week</span>
                </>
              ) : 'No new products this week'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-[6px] border-l-emerald-500 shadow-sm hover-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-semibold">
              Average Trend Score
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData?.averageTrendScore?.toFixed(1) || '0'}/100
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              {dashboardData?.trendScoreChange !== undefined 
                ? (dashboardData.trendScoreChange > 0 
                  ? (
                    <>
                      <span className="text-emerald-500 font-medium">↑ {dashboardData.trendScoreChange.toFixed(1)}</span>
                      <span>points</span>
                    </>
                  ) : dashboardData.trendScoreChange < 0 
                    ? (
                      <>
                        <span className="text-rose-500 font-medium">↓ {Math.abs(dashboardData.trendScoreChange).toFixed(1)}</span>
                        <span>points</span>
                      </>
                    ) : 'No change in trend score')
                : 'No change in trend score'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-[6px] border-l-amber-500 shadow-sm hover-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-semibold">
              Active Regions
              <Globe className="h-5 w-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCompactNumber(dashboardData?.regionCount || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {dashboardData?.countryCount ? `Across ${dashboardData.countryCount} countries` : 'No country data available'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-[6px] border-l-teal-500 shadow-sm hover-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-base font-semibold">
              Average Price
              <Zap className="h-5 w-5 text-teal-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData?.averagePrice ? formatCurrency(dashboardData.averagePrice) : '$0.00'}
            </div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              {dashboardData?.priceChange !== undefined 
                ? (dashboardData.priceChange > 0 
                  ? (
                    <>
                      <span className="text-emerald-500 font-medium">↑ {formatCurrency(dashboardData.priceChange)}</span>
                      <span>from previous</span>
                    </>
                  ) : dashboardData.priceChange < 0 
                    ? (
                      <>
                        <span className="text-rose-500 font-medium">↓ {formatCurrency(Math.abs(dashboardData.priceChange))}</span>
                        <span>from previous</span>
                      </>
                    ) : 'No change in average price')
                : 'No price change data available'}
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
            {dashboardData?.trendDistribution ? (
              <div className="h-[300px]">
                {/* Chart visualization would go here */}
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Trend score chart visualization with {Object.keys(dashboardData.trendDistribution).length} categories
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend distribution data available
              </div>
            )}
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
            {trendingProducts && trendingProducts.length > 0 ? (
              <div className="space-y-4">
                {trendingProducts.map((product: Product, index: number) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <span className="text-muted-foreground font-medium">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{product.trendScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No trending products found
              </div>
            )}
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
                dashboardData.topCategories.map((category: Category, index: number) => (
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