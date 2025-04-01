import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShoppingBag, TrendingUp, Globe, Video } from 'lucide-react';
import { formatDate, formatCurrency, truncate } from '@/lib/utils';
import { API } from '@/lib/constants';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

const DashboardCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => (
  <div className="bg-card rounded-lg p-5 shadow-sm border">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    trendingProducts: 0,
    totalRegions: 0,
    totalVideos: 0,
    recentProducts: [],
    popularCategories: [],
    productsByRegion: [],
    trendScores: [],
  });

  // Websocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    onOpen: () => {
      toast({
        title: 'Connected',
        description: 'Real-time dashboard updates enabled',
      });
    },
    onMessage: (message) => {
      if (message.type === 'product_added' || message.type === 'product_updated') {
        refetch();
      }
    }
  });

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [API.DASHBOARD],
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    if (data) {
      setDashboardData(data);
    }
  }, [data]);

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <h2 className="text-lg font-semibold">Error loading dashboard</h2>
        <p className="mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  // For demo purposes, creating mock data while the backend is being developed
  const mockData = {
    totalProducts: 124,
    trendingProducts: 18,
    totalRegions: 32,
    totalVideos: 560,
    recentProducts: [
      { id: 1, name: 'Smart Plant Monitor', category: 'Home Tech', trendScore: 87, createdAt: '2025-03-28T14:23:00Z', priceRangeLow: 19.99, priceRangeHigh: 45.99 },
      { id: 2, name: 'Foldable Solar Charger', category: 'Eco Gadgets', trendScore: 92, createdAt: '2025-03-27T09:15:00Z', priceRangeLow: 34.99, priceRangeHigh: 49.99 },
      { id: 3, name: 'Portable Blender', category: 'Kitchen', trendScore: 76, createdAt: '2025-03-26T16:42:00Z', priceRangeLow: 24.99, priceRangeHigh: 39.99 },
      { id: 4, name: 'LED Dog Collar', category: 'Pet Accessories', trendScore: 81, createdAt: '2025-03-25T11:30:00Z', priceRangeLow: 14.99, priceRangeHigh: 29.99 },
    ],
    popularCategories: [
      { name: 'Smart Home', count: 28 },
      { name: 'Eco Gadgets', count: 22 },
      { name: 'Kitchen', count: 19 },
      { name: 'Pet Accessories', count: 16 },
      { name: 'Beauty Tech', count: 12 },
    ],
  };

  // Use mock data for demonstration
  const displayData = data?.products?.length > 0 ? dashboardData : mockData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-700 text-sm mb-4">
          Not connected to real-time updates. Some information may be outdated.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Total Products" 
          value={displayData.totalProducts} 
          icon={ShoppingBag} 
          trend={12}
        />
        <DashboardCard 
          title="Trending Products" 
          value={displayData.trendingProducts} 
          icon={TrendingUp} 
          trend={24}
          color="violet"
        />
        <DashboardCard 
          title="Global Regions" 
          value={displayData.totalRegions} 
          icon={Globe} 
          trend={5}
          color="blue"
        />
        <DashboardCard 
          title="Social Videos" 
          value={displayData.totalVideos} 
          icon={Video} 
          trend={18}
          color="pink"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-5 rounded-lg shadow-sm border lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recently Added Products</h2>
            <Link href="/categories">
              <a className="text-sm text-primary hover:underline">View all</a>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Product Name</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Trend Score</th>
                  <th className="pb-2 font-medium">Price Range</th>
                  <th className="pb-2 font-medium">Date Added</th>
                </tr>
              </thead>
              <tbody>
                {displayData.recentProducts.map((product) => (
                  <tr key={product.id} className="border-b border-muted hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <Link href={`/products/${product.id}`}>
                        <a className="font-medium hover:text-primary">
                          {truncate(product.name, 30)}
                        </a>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{product.category}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.trendScore >= 80 ? 'bg-green-100 text-green-800' : 
                        product.trendScore >= 60 ? 'bg-blue-100 text-blue-800' : 
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {product.trendScore}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-card p-5 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Popular Categories</h2>
          <div className="space-y-3">
            {displayData.popularCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="ml-3 font-medium">{category.name}</span>
                </div>
                <span className="bg-muted px-2 py-1 rounded text-sm">
                  {category.count} products
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Link href="/categories">
              <a className="text-sm text-primary hover:underline flex items-center justify-center">
                View all categories
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}