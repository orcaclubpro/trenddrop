import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Share2, 
  Globe, 
  ArrowUpRight, 
  Video, 
  MapPin,
  X
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

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    enabled: isOpen && productId !== null,
    throwOnError: false
  });

  // Get trends data
  const { data: trends } = useQuery<Trend[]>({
    queryKey: ['/api/trends/product', productId],
    enabled: isOpen && productId !== null,
    throwOnError: false
  });

  // Get regions data
  const { data: regions } = useQuery<Region[]>({
    queryKey: ['/api/regions/product', productId],
    enabled: isOpen && productId !== null,
    throwOnError: false
  });

  // Get videos data
  const { data: videos } = useQuery<Video[]>({
    queryKey: ['/api/videos/product', productId],
    enabled: isOpen && productId !== null,
    throwOnError: false
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
      onClose();
    }
  }, [error, toast, onClose]);

  const handleViewFullDetails = () => {
    if (productId) {
      navigate(`/products/${productId}`);
      onClose();
    }
  };

  if (!isOpen || !productId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-6 pb-0 flex items-center justify-between">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold">
                {isLoading ? 'Loading...' : product?.name}
              </SheetTitle>
              <SheetDescription className="text-base">
                {isLoading ? '' : `${product?.category || 'Unknown category'}`}
              </SheetDescription>
            </SheetHeader>
            <SheetClose className="rounded-full p-2 hover:bg-muted">
              <X className="h-4 w-4" />
            </SheetClose>
          </div>

          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="py-8 text-center">
                <span>Loading product details...</span>
              </div>
            ) : product ? (
              <div className="py-6 space-y-6">
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
                        {product.regionCount || 0}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Video className="h-5 w-5 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Videos</span>
                      <span className="text-xl font-bold">
                        {product.videoCount || 0}
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
                {regions && regions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Top Regions</h3>
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
                    </div>
                  </div>
                )}

                {/* Marketing Videos */}
                {videos && videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Marketing Videos</h3>
                    <div className="space-y-3">
                      {videos.slice(0, 3).map((video: Video) => (
                        <a 
                          key={video.id} 
                          href={video.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-3 border rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                              <div className="flex items-center text-muted-foreground text-xs mt-1">
                                <span>{video.platform}</span>
                                <span className="mx-2">•</span>
                                <span>{formatCompactNumber(video.views)} views</span>
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wholesale Links */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Wholesale Options</h3>
                  <div className="space-y-3">
                    <a 
                      href={`https://alibaba.com/trade/search?SearchText=${encodeURIComponent(product.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Alibaba</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a 
                      href={`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>AliExpress</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {/* Trend Analysis Summary */}
                {trends && trends.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Trend Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      This product has shown {trends[trends.length - 1].value > trends[0].value ? 'positive' : 'negative'} trend
                      movement over the last {trends.length} days, with a {trends[trends.length - 1].value > trends[0].value ? 'growth' : 'decline'} 
                      rate of approximately {Math.abs(Math.round((trends[trends.length - 1].value - trends[0].value) / trends[0].value * 100))}%.
                    </p>
                  </div>
                )}

                {/* Additional info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Added on {formatDate(product.createdAt)}</span>
                  <span>ID: {product.id}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <span>Product not found</span>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleViewFullDetails}>
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}