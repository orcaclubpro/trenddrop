
import React, { useEffect, useRef } from 'react';
import { ProductWithDetails } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import TrendChart from "./trend-chart";
import GeographicMap from "./geographic-map";
import VideoCard from "./video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ProductDetailDialogProps {
  productId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productDetails?: ProductWithDetails;
  isLoading: boolean;
}

export default function ProductDetailDialog({ 
  productId, 
  isOpen, 
  onOpenChange, 
  productDetails, 
  isLoading 
}: ProductDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Handler to copy product details to clipboard
  const handleCopyLink = () => {
    if (!product) return;
    
    const productInfo = `${product.name} - $${product.priceRangeLow.toFixed(2)} to $${product.priceRangeHigh.toFixed(2)}`;
    const supplierInfo = product.aliexpressUrl ? `\nAliExpress: ${product.aliexpressUrl}` : '';
    const cjInfo = product.cjdropshippingUrl ? `\nCJ Dropshipping: ${product.cjdropshippingUrl}` : '';
    
    navigator.clipboard.writeText(`${productInfo}${supplierInfo}${cjInfo}`)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Product details copied successfully",
          duration: 3000,
        });
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
      });
  };
  
  // Reset dialog scroll position when product changes
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.scrollTop = 0;
    }
  }, [productId, isOpen]);
  
  if (!productId) return null;
  
  const { product, trends, regions, videos } = productDetails || {};
  
  const scoreColorClass = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-gray-400';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-4xl max-h-[90vh] overflow-auto"
        onInteractOutside={(e) => {
          // Prevent closing when user clicks inside but outside of inputs
          if (dialogRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}>
        {isLoading ? (
          <>
            <DialogHeader>
              <DialogTitle><Skeleton className="h-8 w-48" /></DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </>
        ) : product ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge className="mb-1" variant="outline">{product.category}</Badge>
                  <DialogTitle className="text-xl">{product.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{product.subcategory}</p>
                </div>
                <div className="flex items-start gap-4">
                  <TrendScoreRing score={product.trendScore} size={60} thickness={6} />
                  <DialogClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </div>
              </div>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Price and supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary-50 dark:bg-primary-950/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 text-primary-700 dark:text-primary-300">Price Range</h3>
                  <p className="text-2xl font-semibold">${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}</p>
                </div>
                
                <div className="bg-primary-50 dark:bg-primary-950/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 text-primary-700 dark:text-primary-300">Source Platform</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{product.sourcePlatform}</p>
                    <div className="flex gap-2 mt-1">
                      {product.aliexpressUrl && (
                        <a 
                          href={product.aliexpressUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                        >
                          AliExpress <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {product.cjdropshippingUrl && (
                        <a 
                          href={product.cjdropshippingUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          CJ <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trend Score Breakdown */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-4">Trend Score Breakdown</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="text-muted-foreground">Social Engagement</div>
                      <div className="font-medium">{product.engagementRate}/50</div>
                    </div>
                    <div className="h-2 bg-primary-100 dark:bg-primary-950/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full" 
                        style={{ width: `${(product.engagementRate / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="text-muted-foreground">Sales Velocity</div>
                      <div className="font-medium">{product.salesVelocity}/30</div>
                    </div>
                    <div className="h-2 bg-primary-100 dark:bg-primary-950/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${(product.salesVelocity / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="text-muted-foreground">Search Interest</div>
                      <div className="font-medium">{product.searchVolume}/20</div>
                    </div>
                    <div className="h-2 bg-primary-100 dark:bg-primary-950/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${(product.searchVolume / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <div className="text-muted-foreground">Geographic Spread</div>
                      <div className="font-medium">{product.geographicSpread}/10</div>
                    </div>
                    <div className="h-2 bg-primary-100 dark:bg-primary-950/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${(product.geographicSpread / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts and Maps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="border border-border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Trend History</h3>
                  <TrendChart trends={trends || []} />
                </div>
                
                {/* Geographic Map */}
                <div className="border border-border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Geographic Distribution</h3>
                  <GeographicMap regions={regions || []} />
                </div>
              </div>
              
              {/* Marketing Videos */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">Marketing Videos</h3>
                </div>
                
                <div className="space-y-3">
                  {videos && videos.length > 0 ? (
                    videos.slice(0, 1).map(video => (
                      <VideoCard key={video.id} video={video} />
                    ))
                  ) : (
                    <div className="bg-primary-50 dark:bg-primary-950/30 rounded-md p-4 text-center text-sm text-muted-foreground">
                      No videos available for this product.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                {product.aliexpressUrl && (
                  <a 
                    href={product.aliexpressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 inline mr-1.5" />
                    AliExpress
                  </a>
                )}
                {product.cjdropshippingUrl && (
                  <a 
                    href={product.cjdropshippingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 inline mr-1.5" />
                    CJ Dropshipping
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="px-4 py-2 border border-border text-foreground rounded-md text-sm hover:bg-accent transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 inline mr-1.5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Info
                </Button>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  toast({
                    title: "Added to list",
                    description: `${product.name} has been added to your list.`,
                    duration: 3000,
                  });
                  onOpenChange(false);
                }}
              >
                Add to List
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-500">Product not found</h3>
              <p className="text-sm text-gray-400 mt-2">
                The requested product could not be loaded. Please try another product.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
