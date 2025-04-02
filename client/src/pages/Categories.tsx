import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package,
  TrendingUp,
  Video,
  MapPin
} from 'lucide-react';
import { formatCurrency, getTrendScoreColor } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { ProductSearch, ProductFilters } from '@/components/products/ProductSearch';
import { ProductService } from '@/services';
import { API } from '@/lib/constants';

// Define Product interface
interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  priceRangeLow: number;
  priceRangeHigh: number;
  trendScore: number;
  engagementRate: number;
  salesVelocity: number;
  searchVolume: number;
  geographicSpread: number;
  aliexpressUrl: string | null;
  cjdropshippingUrl: string | null;
  imageUrl: string | null;
  sourcePlatform: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  regionCount?: number;
  videoCount?: number;
}

export default function Categories() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    priceRange: [0, 1000],
    trendScore: [0, 100],
    engagementRate: [0, 100],
    salesVelocity: [0, 100],
    searchVolume: [0, 100],
    geographicSpread: [0, 100],
    sortBy: 'trendScore',
    sortDirection: 'desc'
  });

  // For pagination
  const itemsPerPage = 12;

  const { data: productsData, isLoading: isProductsLoading, error } = useQuery({
    queryKey: [API.PRODUCTS, { 
      ...filters,
      page: currentPage,
      limit: itemsPerPage
    }],
    queryFn: () => ProductService.getProducts({ 
      ...filters, 
      page: currentPage, 
      limit: itemsPerPage 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (error) {
      console.error("Products fetch error:", error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleSearch = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isProductsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>

      <ProductSearch 
        onSearch={handleSearch}
        isLoading={isProductsLoading}
      />

      {productsData?.products && productsData.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.products.map((product: any) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-40 bg-accent/30 relative">
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${getTrendScoreColor(product.trendScore || 0)}`}>
                      {product.trendScore || 0}/100
                    </div>
                  </div>
                </div>
                <CardHeader className="pt-4 px-4 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{product.name}</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground">{product.category}</div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="font-medium">{formatCurrency(product.priceRangeLow)}</div>
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{product.regionCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Video className="h-3.5 w-3.5 mr-1" />
                        <span>{product.videoCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        <span>{product.engagementRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            {filters.search 
              ? `No products matching "${filters.search}" in ${filters.category === 'all' ? 'all categories' : filters.category}`
              : `No products found in ${filters.category === 'all' ? 'all categories' : filters.category}`
            }
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleSearch({
              search: '',
              category: 'all',
              priceRange: [0, 1000],
              trendScore: [0, 100],
              engagementRate: [0, 100],
              salesVelocity: [0, 100],
              searchVolume: [0, 100],
              geographicSpread: [0, 100],
              sortBy: 'trendScore',
              sortDirection: 'desc'
            })}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {productsData?.total && productsData.total > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= productsData.total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}