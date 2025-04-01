
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, ProductWithDetails } from "@shared/schema";
import FilterBar from "@/components/filter-bar";
import ProductList from "@/components/product-list";
import ProductDetailDialog from "@/components/product-detail-dialog";
import ScrollingProductSidebar from "@/components/scrolling-product-sidebar";

export default function TrendingProducts() {
  const [filters, setFilters] = useState<{
    trendScore?: number;
    category?: string;
    region?: string;
  }>({});
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleFilterChange = (newFilters: { 
    trendScore?: number; 
    category?: string; 
    region?: string 
  }) => {
    setFilters(newFilters);
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
    // Use the sidebar for a more persistent experience
    setShowSidebar(true);
    // Also show dialog for users who prefer it
    setIsDetailDialogOpen(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSelectedProductId(null);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDetailDialogOpen(open);
    // Don't reset selectedProductId when closing dialog
    // as the sidebar might still be showing details
  };

  // Query for product details
  const { 
    data: productDetails,
    isLoading,
  } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${selectedProductId}`],
    enabled: selectedProductId !== null,
  });
  
  return (
    <div className="flex flex-col h-full">
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">Trending Products</h2>
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
        <div className="container mx-auto">
          <ProductList 
            filters={filters} 
            onSelectProduct={handleSelectProduct} 
            isRefreshing={isRefreshing}
          />
        </div>
      </div>

      {/* Product Detail Dialog (Modal) */}
      <ProductDetailDialog
        productId={selectedProductId}
        isOpen={isDetailDialogOpen}
        onOpenChange={handleCloseDialog}
        productDetails={productDetails}
        isLoading={isLoading}
      />

      {/* Persistent Product Sidebar */}
      {showSidebar && selectedProductId && (
        <ScrollingProductSidebar 
          productId={selectedProductId} 
          onClose={handleCloseSidebar} 
        />
      )}
    </div>
  );
}
