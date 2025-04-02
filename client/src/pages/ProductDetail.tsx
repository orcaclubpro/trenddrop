import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart, TrendingUp, MapPin, Video, Download, Globe } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { formatDate, formatCurrency, getTrendScoreColor } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { ProductService, TrendService, RegionService, VideoService } from '@/services';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { useWebSocket } from '@/hooks/use-websocket';

interface ProductDetailProps {
  id: number;
}

interface Region {
  id: number;
  productId: number;
  country: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

interface VideoData {
  id: number;
  productId: number;
  platform: string;
  videoUrl: string;
  title: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // WebSocket integration for real-time updates
  useWebSocket({
    onOpen: () => {
      console.log('WebSocket connection opened on ProductDetail');
    },
    onMessage: (message) => {
      // Handle both potential message types
      if ((message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATE || 
           message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATED) && 
          message.productId === id) {
        console.log(`Product ${id} update received, refreshing details`);
        
        // Invalidate queries to refresh all product data
        queryClient.invalidateQueries({ queryKey: [API.PRODUCTS, id] });
        queryClient.invalidateQueries({ queryKey: [API.TRENDS, id] });
        queryClient.invalidateQueries({ queryKey: [API.REGIONS, id] });
        queryClient.invalidateQueries({ queryKey: [API.VIDEOS, id] });
        
        toast({
          title: 'Product Updated',
          description: 'This product data has been updated',
        });
      }
    }
  });

  // Fetch product data
  const { 
    data: product, 
    isLoading: isProductLoading, 
    error: productError,
    refetch: refetchProduct
  } = useQuery({
    queryKey: [API.PRODUCTS, id],
    queryFn: () => ProductService.getProduct(id),
    enabled: !!id,
    retry: 2, // Retry failed requests
    retryDelay: 1000 // Wait 1 second between retries
  });

  // Get trends data
  const { 
    data: trends,
    isLoading: isTrendsLoading,
    refetch: refetchTrends
  } = useQuery({
    queryKey: [API.TRENDS, id],
    queryFn: () => TrendService.getTrendsForProduct(id),
    enabled: !!id && !!product
  });

  // Get regions data
  const { 
    data: regions,
    isLoading: isRegionsLoading,
    refetch: refetchRegions
  } = useQuery({
    queryKey: [API.REGIONS, id],
    queryFn: () => RegionService.getRegionsForProduct(id),
    enabled: !!id && !!product
  });

  // Get videos data
  const { 
    data: videos,
    isLoading: isVideosLoading,
    refetch: refetchVideos
  } = useQuery({
    queryKey: [API.VIDEOS, id],
    queryFn: () => VideoService.getVideosForProduct(id),
    enabled: !!id && !!product
  });

  // Retry logic for handling errors
  const handleRetry = async () => {
    try {
      await refetchProduct();
      if (product) {
        await Promise.all([
          refetchTrends(),
          refetchRegions(),
          refetchVideos()
        ]);
      }
    } catch (error) {
      toast({
        title: 'Retry Failed',
        description: 'Could not load product data. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (productError) {
      toast({
        title: 'Error',
        description: 'Failed to load product details. You can try refreshing.',
        variant: 'destructive',
      });
    }
  }, [productError, toast]);

  const isLoading = isProductLoading || isTrendsLoading || isRegionsLoading || isVideosLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
        <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6 flex gap-4 justify-center">
          <Button 
            onClick={handleRetry}
            variant="outline"
          >
            Try Again
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
          <p className="text-muted-foreground">
            {product.category} • Added on {formatDate(product.createdAt)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analyze Trends
          </Button>
          <Button variant="default">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trend Score
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getTrendScoreColor(product.trendScore || 0)}>
                {product.trendScore || 0}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {trends?.length || 0} data points
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Price
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(product.price || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Competitive Market Price
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Regions
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {regions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Global Distribution
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marketing Videos
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across Social Platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {trends && trends.length > 0 ? (
              <div className="h-80">
                {/* Here we would implement a chart visualization using the trends data */}
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {/* For now, just display a placeholder */}
                  {`${trends.length} trend data points available for visualization`}
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No trend data available for this product
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {regions && regions.length > 0 ? (
              <div className="h-80">
                {/* Here we would implement a map or chart visualization using the regions data */}
                <div className="h-full flex flex-col justify-center">
                  {/* For now, just list the regions */}
                  <div className="space-y-2">
                    {regions.slice(0, 5).map((region: Region) => (
                      <div key={region.id} className="flex justify-between items-center p-2 rounded-md border">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{region.country}</span>
                        </div>
                        <span className="font-medium">{region.percentage}%</span>
                      </div>
                    ))}
                    {regions.length > 5 && (
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        And {regions.length - 5} more regions
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No regional data available for this product
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video: VideoData) => (
                <a 
                  key={video.id} 
                  href={video.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col h-full">
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{video.title}</h4>
                    <div className="mt-auto flex items-center justify-between text-muted-foreground text-xs">
                      <span>{video.platform}</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground">
              No videos available for this product
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            {product.description || "No product description available."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}