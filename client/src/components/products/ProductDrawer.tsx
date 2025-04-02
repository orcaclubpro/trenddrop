import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Share2, 
  Globe, 
  ArrowUpRight, 
  Video, 
  MapPin,
  X,
  RefreshCcw,
  ImageOff
} from 'lucide-react';

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetClose 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatCompactNumber, formatDate, getTrendScoreColor } from '@/lib/utils';
import { ProductService, TrendService, RegionService, VideoService } from '@/services';
import { API, WS_MESSAGE_TYPES } from '@/lib/constants';
import { useWebSocket } from '@/hooks/use-websocket';

interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price?: number;
  trendScore?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  regionCount?: number;
  videoCount?: number;
}

interface Trend {
  id: number;
  productId: number;
  date: string;
  value: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: number;
  productId: number;
  country: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

interface Video {
  id: number;
  productId: number;
  platform: string;
  videoUrl: string;
  title: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductDrawerProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDrawer({ productId, isOpen, onClose }: ProductDrawerProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image error when productId changes
  useEffect(() => {
    setImageError(false);
  }, [productId]);

  // WebSocket integration for real-time updates
  useWebSocket({
    onMessage: (message) => {
      // Handle both potential message types
      if ((message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATE || 
           message.type === WS_MESSAGE_TYPES.PRODUCT_UPDATED) && 
          message.productId === productId) {
        console.log(`Product ${productId} update received, refreshing drawer data`);
        
        // Invalidate queries to refresh all product data
        queryClient.invalidateQueries({ queryKey: [API.PRODUCTS, productId] });
        queryClient.invalidateQueries({ queryKey: [API.TRENDS, productId] });
        queryClient.invalidateQueries({ queryKey: [API.REGIONS, productId] });
        queryClient.invalidateQueries({ queryKey: [API.VIDEOS, productId] });
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
    queryKey: [API.PRODUCTS, productId],
    queryFn: () => productId ? ProductService.getProduct(productId) : null,
    enabled: isOpen && productId !== null,
    retry: 2
  });

  // Get trends data
  const { 
    data: trends,
    isLoading: isTrendsLoading,
    refetch: refetchTrends
  } = useQuery({
    queryKey: [API.TRENDS, productId],
    queryFn: () => productId ? TrendService.getTrendsForProduct(productId) : [],
    enabled: isOpen && productId !== null && !!product,
    retry: 1
  });

  // Get regions data
  const { 
    data: regions,
    isLoading: isRegionsLoading,
    refetch: refetchRegions
  } = useQuery({
    queryKey: [API.REGIONS, productId],
    queryFn: () => productId ? RegionService.getRegionsForProduct(productId) : [],
    enabled: isOpen && productId !== null && !!product,
    retry: 1
  });

  // Get videos data
  const { 
    data: videos,
    isLoading: isVideosLoading,
    refetch: refetchVideos
  } = useQuery({
    queryKey: [API.VIDEOS, productId],
    queryFn: () => productId ? VideoService.getVideosForProduct(productId) : [],
    enabled: isOpen && productId !== null && !!product,
    retry: 1
  });

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Refresh all data
  const handleRefresh = async () => {
    if (!productId) return;
    
    setIsRefreshing(true);
    try {
      await refetchProduct();
      
      if (product) {
        await Promise.all([
          refetchTrends(),
          refetchRegions(),
          refetchVideos()
        ]);
      }
      
      toast({
        title: 'Data Refreshed',
        description: 'Latest product data has been loaded'
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh product data',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (productError) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    }
  }, [productError, toast]);

  const handleViewFullDetails = () => {
    if (productId) {
      navigate(`/products/${productId}`);
      onClose();
    }
  };

  const isLoading = isProductLoading || isTrendsLoading || isRegionsLoading || isVideosLoading;

  if (!isOpen || !productId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-6 pb-0 flex items-center justify-between">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold">
                {isLoading ? 'Loading...' : product?.name || 'Product Details'}
              </SheetTitle>
              <SheetDescription className="text-base">
                {isLoading ? '' : `${product?.category || 'Unknown category'}`}
              </SheetDescription>
            </SheetHeader>
            <div className="flex gap-2">
              {product && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <SheetClose className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </SheetClose>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="py-8 text-center">
                <span>Loading product details...</span>
              </div>
            ) : productError ? (
              <div className="py-8 text-center">
                <p className="text-destructive mb-4">Failed to load product details</p>
                <Button onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            ) : product ? (
              <div className="py-6 space-y-6">
                {/* Product Image */}
                {product.imageUrl && !imageError ? (
                  <div className="rounded-md overflow-hidden h-48 bg-muted/40 relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="rounded-md overflow-hidden h-48 bg-muted/40 flex items-center justify-center">
                    {imageError ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ImageOff className="h-10 w-10 mb-2" />
                        <span className="text-sm">Image unavailable</span>
                      </div>
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-5 w-5 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Trend Score</span>
                      <span className={`text-xl font-bold ${getTrendScoreColor(product.trendScore || 0)}`}>
                        {product.trendScore || 0}/100
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <ShoppingCart className="h-5 w-5 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Price Range</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(product.price || 0)}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <MapPin className="h-5 w-5 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Regions</span>
                      <span className="text-xl font-bold">
                        {regions?.length || 0}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Video className="h-5 w-5 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Videos</span>
                      <span className="text-xl font-bold">
                        {videos?.length || 0}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                {/* Product Description */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {product.description || "No product description available."}
                  </p>
                </div>

                {/* Regional Data */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Top Regions</h3>
                  {regions && regions.length > 0 ? (
                    <div className="space-y-3">
                      {regions.slice(0, 3).map((region: Region) => (
                        <div key={region.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{region.country}</span>
                          </div>
                          <span className="font-medium">{region.percentage}%</span>
                        </div>
                      ))}
                      {regions.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          + {regions.length - 3} more regions
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm p-4 text-center border rounded-md">
                      No regional data available
                    </div>
                  )}
                </div>

                {/* Marketing Videos */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Marketing Videos</h3>
                  {videos && videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.slice(0, 3).map((video: Video) => (
                        <a 
                          key={video.id} 
                          href={video.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex justify-between items-center p-2 rounded-md border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center overflow-hidden">
                            <Video className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{video.title || 'Untitled Video'}</span>
                          </div>
                          <ArrowUpRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </a>
                      ))}
                      {videos.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          + {videos.length - 3} more videos
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm p-4 text-center border rounded-md">
                      No video data available
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleViewFullDetails} 
                    className="w-full"
                  >
                    View Full Details
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Product not found</p>
                <Button onClick={onClose}>Close</Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}