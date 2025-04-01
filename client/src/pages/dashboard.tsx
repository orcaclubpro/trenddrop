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
  TrendingUp 
} from "lucide-react";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/api";
import MetricsSummary from "@/components/metrics-summary";
import FilterBar from "@/components/filter-bar";
import ProductList from "@/components/product-list";
import ProductDetail from "@/components/product-detail";

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
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">TrendDrop Product Research Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {isScraperRunning && (
            <div className="flex items-center text-primary-600 dark:text-primary-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">Scraper Running</span>
            </div>
          )}
          
          <Button 
            onClick={handleStartScraper} 
            disabled={isScraperRunning} 
            variant="outline" 
            size="sm"
            className="hidden md:inline-flex"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isScraperRunning ? 'Scraper Running' : 'Start Research'}
          </Button>
        </div>
      </header>
      
      {/* Show real-time progress if scraper is running */}
      {isScraperRunning && (
        <div className="bg-primary-50 dark:bg-primary-950/30 border-b border-primary-100 dark:border-primary-900/50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
              <div className="flex items-center text-primary-700 dark:text-primary-300 mb-2 sm:mb-0">
                <TrendingUp className="mr-2 h-5 w-5" />
                <h3 className="font-medium">Product Research in Progress</h3>
              </div>
              
              <div className="text-sm text-primary-600 dark:text-primary-400">
                <span className="font-medium">{scraperStatus?.total_found || 0}</span> products found so far
              </div>
            </div>
            
            <Progress value={scraperStatus?.progress || 0} className="h-2 mb-2" />
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{scraperStatus?.progress || 0}% complete</span>
              <span>{getTimeRemaining(scraperStatus?.progress || 0)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Show last run info if available */}
      {!isScraperRunning && scraperStatus?.last_run && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              <span>Last scan: {formatRelativeTime(new Date(scraperStatus.last_run))}</span>
            </div>
            
            <div className="flex items-center">
              <Database className="mr-1 h-3 w-3" />
              <span>Database: {scraperStatus.total_products} products</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Show placeholder content if database is empty and no scraper running */}
      {isDatabaseEmpty && !isScraperRunning ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-2xl w-full p-6">
            <div className="flex flex-col items-center text-center">
              <Database className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Product Data Available</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your product database is currently empty. Start the research agent to automatically discover trending products.
              </p>
              
              <Button 
                onClick={handleStartScraper} 
                size="lg" 
                className="mb-4"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Product Research
              </Button>
              
              <p className="text-xs text-gray-400 dark:text-gray-500">
                The agent will search across multiple platforms to identify products with high trend potential.
                This process may take 30-45 minutes to complete.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <FilterBar 
            onFilterChange={handleFilterChange} 
            onRefresh={handleRefresh} 
            onExport={handleExport} 
          />
          
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
            <MetricsSummary />
            
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <ProductList 
                  filters={filters} 
                  onSelectProduct={handleSelectProduct} 
                  isRefreshing={isRefreshing}
                />
              </div>
              
              <div className="lg:w-[450px]">
                <ProductDetail productId={selectedProductId} />
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
