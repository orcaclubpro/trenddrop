import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductWithDetails } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import TrendChart from "./trend-chart";
import GeographicMap from "./geographic-map";
import VideoCard from "./video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/use-websocket";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  X,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Globe,
  PlayCircle,
  ShoppingCart,
  BarChart3
} from "lucide-react";
import { cn } from '@/lib/utils';

interface ScrollingProductSidebarProps {
  productId: number | null;
  onClose: () => void;
}

export default function ScrollingProductSidebar({ productId, onClose }: ScrollingProductSidebarProps) {
  const queryClient = useQueryClient();
  const [minimized, setMinimized] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [animating, setAnimating] = useState(false);
  
  // Determine WebSocket URL based on current URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  
  // Use WebSocket hook for real-time updates
  const { messages } = useWebSocket(wsUrl);
  
  // Query for product details
  const { 
    data: productDetails,
    isLoading,
    isFetching
  } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${productId}`],
    enabled: productId !== null,
  });
  
  // Animation effect when toggling minimized state
  useEffect(() => {
    if (minimized !== undefined) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
      }, 300); // Match duration with CSS transition
      return () => clearTimeout(timer);
    }
  }, [minimized]);
  
  // Listen for WebSocket messages for real-time updates
  useEffect(() => {
    const productUpdates = messages.filter(msg => 
      msg.type === 'product_update' && msg.productId === productId
    );
    
    if (productUpdates.length > 0 && productId) {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
    }
  }, [messages, productId, queryClient]);

  if (!productId) {
    return null;
  }
  
  const { product, trends, regions, videos } = productDetails || {};
  
  return (
    <div className={cn(
      "fixed right-0 top-0 h-full transform transition-all duration-300 ease-in-out z-40",
      minimized 
        ? "w-16 sm:w-20" 
        : "w-[90vw] sm:w-[450px] md:w-[500px]"
    )}>
      {/* Sidebar toggle button */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-50 cursor-pointer"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
          {minimized ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </div>

      {/* Sidebar content */}
      <div className="h-full overflow-hidden flex flex-col bg-background border-l border-border shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-background">
          {!minimized ? (
            <>
              <h3 className="font-medium text-primary flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Product Details
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && !minimized && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mt-6 mb-1" />
            <Skeleton className="h-32 w-full mt-4 mb-4" />
            <Skeleton className="h-4 w-full mt-6 mb-1" />
            <Skeleton className="h-40 w-full mt-4 mb-4" />
            <Skeleton className="h-4 w-full mt-6 mb-1" />
            <Skeleton className="h-56 w-full mt-4" />
          </div>
        )}

        {/* Minimized state content */}
        {minimized && !isLoading && product && (
          <div className="flex-1 flex flex-col items-center pt-4 space-y-6">
            <TrendScoreRing score={product.trendScore} size={40} thickness={4} />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10"
              onClick={() => { setActiveSection('overview'); setMinimized(false); }}
            >
              <BarChart3 className="h-5 w-5 text-primary/80" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10"
              onClick={() => { setActiveSection('trends'); setMinimized(false); }}
            >
              <TrendingUp className="h-5 w-5 text-primary/80" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10"
              onClick={() => { setActiveSection('regions'); setMinimized(false); }}
            >
              <Globe className="h-5 w-5 text-primary/80" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-primary/10"
              onClick={() => { setActiveSection('videos'); setMinimized(false); }}
            >
              <PlayCircle className="h-5 w-5 text-primary/80" />
            </Button>
          </div>
        )}

        {/* Full content */}
        {!minimized && !isLoading && product && (
          <>
            {/* Navigation tabs */}
            <div className="border-b border-border p-1 flex">
              <Button 
                variant={activeSection === 'overview' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setActiveSection('overview')}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Overview
              </Button>
              <Button 
                variant={activeSection === 'trends' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setActiveSection('trends')}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Trends
              </Button>
              <Button 
                variant={activeSection === 'regions' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setActiveSection('regions')}
              >
                <Globe className="h-3.5 w-3.5" /> Regions
              </Button>
              <Button 
                variant={activeSection === 'videos' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-9 text-xs gap-1"
                onClick={() => setActiveSection('videos')}
              >
                <PlayCircle className="h-3.5 w-3.5" /> Videos
              </Button>
            </div>

            {/* Main content area with scroll */}
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-6">
              {/* Realtime update notification */}
              {isFetching && !isLoading && (
                <div className="text-xs bg-primary/10 text-primary py-1.5 px-3 rounded-md flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Updating product data in real-time...
                </div>
              )}

              {/* Product Header - Always shown */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-primary/5">{product.category}</Badge>
                    {product.isNew && (
                      <Badge className="bg-primary/90 hover:bg-primary">New</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-medium">{product.name}</h2>
                  <div className="text-sm text-muted-foreground mt-1">
                    {product.subcategory}
                  </div>
                </div>
                <TrendScoreRing score={product.trendScore} size={60} />
              </div>

              {/* Overview Section */}
              {activeSection === 'overview' && (
                <>
                  {/* Price and Source Info */}
                  <Card className="border border-border/50">
                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Price Range</div>
                        <div className="font-medium">${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Source Platform</div>
                        <div className="font-medium">{product.sourcePlatform}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Sales Volume</div>
                        <div className="font-medium">{product.salesVolume.toLocaleString()} units</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Profit Margin</div>
                        <div className="font-medium">{product.profitMargin}%</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trend Score Breakdown */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Trend Score Breakdown</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div className="text-muted-foreground">Social Engagement</div>
                          <div className="font-medium">{product.engagementRate}/50</div>
                        </div>
                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/70 rounded-full" 
                            style={{ width: `${(product.engagementRate / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div className="text-muted-foreground">Sales Velocity</div>
                          <div className="font-medium">{product.salesVelocity}/30</div>
                        </div>
                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/70 rounded-full" 
                            style={{ width: `${(product.salesVelocity / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div className="text-muted-foreground">Search Interest</div>
                          <div className="font-medium">{product.searchVolume}/20</div>
                        </div>
                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/70 rounded-full" 
                            style={{ width: `${(product.searchVolume / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick summary of other sections */}
                  <div className="grid grid-cols-1 gap-4">
                    <Card className="overflow-hidden border border-border/50 cursor-pointer hover:border-primary/30 transition-colors" 
                      onClick={() => setActiveSection('trends')}>
                      <CardContent className="p-0">
                        <div className="p-3 border-b border-border/50 bg-primary/5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Trend History</span>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="h-32 overflow-hidden">
                          <TrendChart trends={trends || []} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="overflow-hidden border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => setActiveSection('regions')}>
                      <CardContent className="p-0">
                        <div className="p-3 border-b border-border/50 bg-primary/5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Geographic Distribution</span>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="h-32 overflow-hidden">
                          <GeographicMap regions={regions || []} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Trends Section */}
              {activeSection === 'trends' && (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Trend History</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Track how this product's engagement, sales, and search metrics have changed over time.
                    </p>
                    <div className="h-[300px]">
                      <TrendChart trends={trends || []} />
                    </div>
                  </div>
                  
                  {/* Trend statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">30-Day Growth</div>
                        <div className="text-xl font-semibold text-primary">
                          +{product.growth30d}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Trend Velocity</div>
                        <div className="text-xl font-semibold text-primary">
                          {product.trendVelocity}/10
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Regions Section */}
              {activeSection === 'regions' && (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Geographic Distribution</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      See where this product is most popular to target your marketing efforts effectively.
                    </p>
                    <div className="h-[300px]">
                      <GeographicMap regions={regions || []} />
                    </div>
                  </div>
                  
                  {/* Top regions list */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Top Regions</h3>
                    <div className="space-y-2">
                      {regions && regions.slice(0, 5).map((region, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-primary/5 rounded-md">
                          <span className="font-medium">{region.name}</span>
                          <span className="text-sm">{region.interestLevel}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Videos Section */}
              {activeSection === 'videos' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Marketing Videos</h3>
                      {videos && videos.length > 0 && (
                        <Badge variant="outline" className="text-xs font-normal bg-primary/5">
                          {videos.length} videos
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Available marketing videos for this product. Click to play or download.
                    </p>
                    
                    {videos && videos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {videos.map(video => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    ) : (
                      <div className="border border-border rounded-md p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                          <PlayCircle className="h-6 w-6 text-muted-foreground/60" />
                        </div>
                        <h4 className="text-sm font-medium mb-1">No videos available</h4>
                        <p className="text-xs text-muted-foreground">
                          This product doesn't have any marketing videos yet.
                        </p>
                      </div>
                    )}
                    
                    {/* Video statistics summary */}
                    {videos && videos.length > 0 && (
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Card className="overflow-hidden border border-border">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 text-primary rounded-full p-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Total Views</div>
                                <div className="font-medium">
                                  {videos.reduce((acc, vid) => acc + vid.views, 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden border border-border">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-primary/10 text-primary rounded-full p-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Most Popular</div>
                                <div className="font-medium">
                                  {videos.length > 0 ? videos.reduce((prev, curr) => prev.views > curr.views ? prev : curr).platform : ''}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-border flex justify-between items-center bg-background">
              <div className="grid grid-cols-1 gap-2 w-full">
                <div className="text-xs text-muted-foreground mb-1">Wholesaler Links:</div>
                <div className="flex gap-2 w-full">
                  {product.aliexpressUrl && (
                    <a 
                      href={product.aliexpressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 border border-border bg-background hover:bg-muted rounded-md text-xs flex-1 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      AliExpress
                    </a>
                  )}
                  {product.cjdropshippingUrl && (
                    <a 
                      href={product.cjdropshippingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 border border-border bg-background hover:bg-muted rounded-md text-xs flex-1 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      CJ Dropship
                    </a>
                  )}
                </div>
                
                <Button size="sm" className="w-full mt-2">
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  <span>Add to Dropshipping List</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Additional components for the chevrons
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}