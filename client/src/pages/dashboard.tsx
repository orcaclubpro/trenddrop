import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  RefreshCw, 
  Loader2, 
  TrendingUp,
  Globe,
  Video
} from "lucide-react";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/api";
import MetricsSummary from "@/components/metrics-summary";
import FilterBar from "@/components/filter-bar";
import ProductList from "@/components/product-list";
import ProductDetail from "@/components/product-detail";
import ProductDashboard from "@/components/product-dashboard";

// Type definition for scraper status response
interface ScraperStatus {
  running: boolean;
  progress: number;
  total_found: number;
  total_products: number;
  error: string | null;
  last_run: string | null;
  next_run: string | null;
  scheduler_active: boolean;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<{
    trendScore?: number;
    category?: string;
    region?: string;
  }>({});
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Query to get scraper status
  const { data: scraperStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['scraperStatus'],
    queryFn: async () => {
      try {
        const response = await apiRequest<ScraperStatus>('/api/scraper/status');
        return response;
      } catch (error) {
        console.error('Failed to fetch scraper status:', error);
        return null;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds if the scraper is running
  });
  
  // Query to get products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/products');
        return response;
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return { products: [] };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Format time remaining based on progress
  const getTimeRemaining = (progress: number) => {
    if (progress <= 0) return 'Calculating...';
    if (progress >= 100) return 'Completed';
    
    // Rough estimate - assumes linear progress
    const percentRemaining = 100 - progress;
    const minutesRemaining = Math.ceil((percentRemaining / 5) * 2); // Very rough estimate
    
    return minutesRemaining === 1 
      ? 'About 1 minute remaining' 
      : `About ${minutesRemaining} minutes remaining`;
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: { 
    trendScore?: number; 
    category?: string; 
    region?: string 
  }) => {
    setFilters(newFilters);
    // Reset selected product when filters change
    setSelectedProductId(null);
  };
  
  // Handle refresh click
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchStatus();
    // This will trigger a refetch in the ProductList component
    setTimeout(() => setIsRefreshing(false), 100);
  };
  
  // Handle export data
  const handleExport = () => {
    // Construct export URL with current filters
    const params = new URLSearchParams();
    if (filters.trendScore) params.append('trendScore', filters.trendScore.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.region) params.append('region', filters.region);
    
    // Open export URL in new tab
    window.open(`/api/export?${params.toString()}`, '_blank');
  };
  
  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
  };
  
  // Handle start scraper click
  const handleStartScraper = async () => {
    try {
      await apiRequest('/api/scraper/start', { 
        method: 'POST',
        body: { count: 1000 }
      });
      refetchStatus();
    } catch (error) {
      console.error('Failed to start scraper:', error);
    }
  };
  
  // Check if database is empty
  const isDatabaseEmpty = scraperStatus?.total_products === 0;
  const isScraperRunning = scraperStatus?.running === true;
  
  return (
    <>
      <header className="bg-background border-b border-border flex items-center justify-between p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            View and analyze trending products to enhance your dropshipping strategy.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isScraperRunning && (
            <div className="hidden md:flex items-center text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Research in progress</span>
            </div>
          )}
          
          <Button 
            onClick={handleStartScraper} 
            disabled={isScraperRunning} 
            variant={isScraperRunning ? "outline" : "default"}
            size="sm"
            className="h-9"
          >
            {isScraperRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin md:hidden" />
                <span className="hidden md:inline">Research Running</span>
                <span className="md:hidden">Running</span>
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Start Product Research</span>
                <span className="md:hidden">Start Research</span>
              </>
            )}
          </Button>
        </div>
      </header>
      
      {/* Show real-time progress if scraper is running */}
      {isScraperRunning && (
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="flex flex-col justify-center">
                <h3 className="flex items-center text-sm font-medium text-foreground mb-1">
                  <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                  Research Progress
                </h3>
                <div className="flex items-center gap-3">
                  <Progress value={scraperStatus?.progress || 0} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{scraperStatus?.progress || 0}%</span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 flex items-center">
                <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-full mr-3">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Products Found</div>
                  <div className="text-lg font-semibold">{scraperStatus?.total_found || 0}</div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 flex items-center">
                <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-full mr-3">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Time</div>
                  <div className="text-lg font-semibold">{getTimeRemaining(scraperStatus?.progress || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Show last run info if available */}
      {!isScraperRunning && scraperStatus?.last_run && (
        <div className="bg-muted/40 border-b border-border px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              <div className="flex items-center mr-4">
                <Clock className="mr-1.5 h-3.5 w-3.5 text-primary" />
                <span>Last scan: {formatRelativeTime(new Date(scraperStatus.last_run))}</span>
              </div>
              
              <div className="flex items-center">
                <Database className="mr-1.5 h-3.5 w-3.5 text-primary" />
                <span>{scraperStatus.total_products} products in database</span>
              </div>
            </div>
            
            <div className="text-xs">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-primary" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show placeholder content if database is empty and no scraper running */}
      {isDatabaseEmpty && !isScraperRunning ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
          <div className="max-w-3xl w-full p-8 bg-background rounded-xl border shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Database className="h-10 w-10 text-primary" />
              </div>
              
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Get Started with TrendDrop</h2>
              
              <p className="text-muted-foreground mb-8 max-w-lg">
                Discover trending products with our AI-powered research system. Start the process to automatically analyze and identify high-potential dropshipping opportunities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left w-full">
                <div className="flex flex-col p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Trend Analysis</h3>
                  <p className="text-sm text-muted-foreground">Discover products with rising demand across multiple platforms</p>
                </div>
                
                <div className="flex flex-col p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Geographic Insights</h3>
                  <p className="text-sm text-muted-foreground">Get regional demand data to target your marketing</p>
                </div>
                
                <div className="flex flex-col p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Marketing Content</h3>
                  <p className="text-sm text-muted-foreground">Find viral videos promoting trending products</p>
                </div>
              </div>
              
              <Button 
                onClick={handleStartScraper} 
                size="lg" 
                className="mb-4 px-8"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Product Research
              </Button>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>The research process takes approximately 30-45 minutes to complete</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <FilterBar 
            onFilterChange={handleFilterChange} 
            onRefresh={handleRefresh} 
            onExport={handleExport} 
          />
          
          <div className="flex-1 p-6 bg-muted/30 overflow-auto">
            <div className="max-w-[1800px] mx-auto">
              <MetricsSummary />
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <ProductDashboard 
                    products={(productsData?.products || [])} 
                    onSelectProduct={handleSelectProduct} 
                    isRefreshing={isRefreshing}
                    onRefresh={handleRefresh}
                  />
                </div>
                
                <div className="lg:w-[450px]">
                  <ProductDetail productId={selectedProductId} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Error message if the scraper encountered an error */}
      {scraperStatus?.error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Scraper Error</AlertTitle>
          <AlertDescription>
            {scraperStatus.error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
