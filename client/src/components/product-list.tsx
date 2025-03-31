import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);
  
  const { 
    data, 
    isLoading,
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
      case 'Decor':
        bgColor = 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200';
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Trending Products</h3>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <i className="ri-search-line"></i>
          </button>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <i className="ri-filter-3-line"></i>
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer flex items-center gap-4" 
              onClick={() => onSelectProduct(product)}
            >
              <TrendScoreRing score={product.trendScore} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  {renderCategoryBadge(product.category)}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <div className="text-sm font-medium">
                  ${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <i className="ri-global-line mr-1"></i> 
                  {product.id % 2 === 0 ? "USA, Germany" : "Canada, UK"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isLoading 
            ? "Loading products..." 
            : `Showing ${data?.products.length || 0} of ${data?.total || 0} products`
          }
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded ${
              page > 1
                ? "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            }`}
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          
          {data?.totalPages && Array.from({ length: Math.min(data.totalPages, 3) }).map((_, idx) => (
            <button 
              key={idx}
              className={`w-8 h-8 flex items-center justify-center rounded ${
                page === idx + 1
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded ${
              data && page < data.totalPages
                ? "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
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
