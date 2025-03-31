import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import MetricsSummary from "@/components/metrics-summary";
import FilterBar from "@/components/filter-bar";
import ProductList from "@/components/product-list";
import ProductDetail from "@/components/product-detail";

export default function Dashboard() {
  const [filters, setFilters] = useState<{
    trendScore?: number;
    category?: string;
    region?: string;
  }>({});
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleFilterChange = (newFilters: { 
    trendScore?: number; 
    category?: string; 
    region?: string 
  }) => {
    setFilters(newFilters);
    // Reset selected product when filters change
    setSelectedProductId(null);
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    // This will trigger a refetch in the ProductList component
    setTimeout(() => setIsRefreshing(false), 100); 
  };
  
  const handleExport = () => {
    // Construct export URL with current filters
    const params = new URLSearchParams();
    if (filters.trendScore) params.append('trendScore', filters.trendScore.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.region) params.append('region', filters.region);
    
    // Open export URL in new tab
    window.open(`/api/export?${params.toString()}`, '_blank');
  };
  
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
  };
  
  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">Product Research Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="ri-notification-3-line"></i>
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-400">
            <span className="text-sm font-medium">JD</span>
          </button>
        </div>
      </header>
      
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
  );
}
