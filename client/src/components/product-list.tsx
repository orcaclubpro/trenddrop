import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/use-websocket";

interface ProductListProps {
  filters: {
    trendScore?: number;
    category?: string;
    region?: string;
  };
  onSelectProduct: (product: Product) => void;
  isRefreshing: boolean;
}

export default function ProductList({ 
  filters, 
  onSelectProduct,
  isRefreshing
}: ProductListProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  
  // Determine WebSocket URL based on current URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Make sure to use the explicit /ws path for WebSocket connections
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  
  // Use WebSocket hook for real-time updates with error handling
  const { messages, status } = useWebSocket(wsUrl);
  
  // Reconnect WebSocket if connection fails
  useEffect(() => {
    if (status === 'error' || status === 'closed') {
      console.log('WebSocket connection failed or closed, will reconnect automatically');
    }
  }, [status]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);
  
  const { 
    data, 
    isLoading,
    isFetching,
    refetch
  } = useQuery<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: [
      "/api/products", 
      {
        trendScore: filters.trendScore,
        category: filters.category,
        region: filters.region,
        page,
        limit: 5
      }
    ],
  });
  
  // Listen for WebSocket messages for real-time updates
  useEffect(() => {
    const productUpdates = messages.filter(msg => msg.type === 'product_update');
    
    if (productUpdates.length > 0) {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  }, [messages, queryClient]);
  
  // Refresh data when isRefreshing prop changes
  useEffect(() => {
    if (isRefreshing) {
      refetch();
    }
  }, [isRefreshing, refetch]);
  
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };
  
  const renderCategoryBadge = (category: string) => {
    let bgColor;
    
    switch (category) {
      case 'Home':
        bgColor = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        break;
      case 'Tech':
        bgColor = 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
        break;
      case 'Fitness':
        bgColor = 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
        break;
      case 'Beauty':
        bgColor = 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200';
        break;
      case 'Fashion':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        break;
      default:
        bgColor = 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
    }
    
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${bgColor}`}>
        {category}
      </span>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-primary-100 dark:border-primary-900/50 overflow-hidden">
      <div className="p-4 border-b border-primary-100 dark:border-primary-900/50 flex justify-between items-center bg-primary-50/50 dark:bg-primary-950/30">
        <h3 className="font-medium text-primary-800 dark:text-primary-200">
          Trending Products
          {isFetching && !isLoading && (
            <span className="ml-2 text-xs text-primary-500 animate-pulse">
              <i className="ri-refresh-line animate-spin"></i> Updating...
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition-colors">
            <i className="ri-search-line"></i>
          </button>
          <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition-colors">
            <i className="ri-filter-3-line"></i>
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-primary-100 dark:divide-primary-900/30">
        {isLoading ? (
          // Loading skeleton
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex flex-col items-end">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : (
          // Product list
          data?.products.map(product => (
            <div 
              key={product.id}
              className="p-4 hover:bg-primary-50/50 dark:hover:bg-primary-950/10 cursor-pointer flex items-center gap-4 transition-colors" 
              onClick={() => onSelectProduct(product)}
            >
              <TrendScoreRing score={product.trendScore} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate text-primary-900 dark:text-primary-100">{product.name}</h4>
                  {renderCategoryBadge(product.category)}
                </div>
                <div className="flex items-center text-xs text-primary-600 dark:text-primary-400 mt-1">
                  <span className="flex items-center">
                    <i className="ri-line-chart-line mr-1"></i> 
                    +{product.engagementRate * 6}% TikTok
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <i className="ri-shopping-cart-line mr-1"></i> 
                    +{product.salesVelocity * 7}% Sales
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  ${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-primary-600 dark:text-primary-400 mt-1">
                  {product.aliexpressUrl ? (
                    <a 
                      href={product.aliexpressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="ri-external-link-line mr-1"></i> 
                      AliExpress
                    </a>
                  ) : product.cjdropshippingUrl ? (
                    <a 
                      href={product.cjdropshippingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="ri-external-link-line mr-1"></i> 
                      CJ Dropshipping
                    </a>
                  ) : (
                    <>
                      <i className="ri-global-line mr-1"></i> 
                      {product.id % 2 === 0 ? "USA, Germany" : "Canada, UK"}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-primary-100 dark:border-primary-900/50 flex justify-between items-center bg-primary-50/50 dark:bg-primary-950/30">
        <div className="text-sm text-primary-600 dark:text-primary-400">
          {isLoading 
            ? "Loading products..." 
            : `Showing ${data?.products.length || 0} of ${data?.total || 0} products`
          }
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              page > 1
                ? "text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                : "text-primary-300 dark:text-primary-800 cursor-not-allowed"
            }`}
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          
          {data?.totalPages && Array.from({ length: Math.min(data.totalPages, 3) }).map((_, idx) => (
            <button 
              key={idx}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                page === idx + 1
                  ? "bg-primary text-white dark:bg-primary dark:text-white"
                  : "text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
              }`}
              onClick={() => setPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              data && page < data.totalPages
                ? "text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                : "text-primary-300 dark:text-primary-800 cursor-not-allowed"
            }`}
            onClick={handleNextPage}
            disabled={!data || page >= data.totalPages}
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
