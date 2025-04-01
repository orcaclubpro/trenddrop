import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Package,
  Video,
  MapPin
} from 'lucide-react';
import { debounce, formatCurrency, getTrendScoreColor } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';

export default function Categories() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('trendScore');
  const [sortOrder, setSortOrder] = useState('desc');

  // For pagination
  const itemsPerPage = 12;

  // Simulate categories list
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home', name: 'Home Goods' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'sports', name: 'Sports & Outdoors' },
    { id: 'toys', name: 'Toys & Games' }
  ];

  const { data: productsData, isLoading: isProductsLoading, error } = useQuery({
    queryKey: ['/api/products', { 
      search: searchQuery, 
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      page: currentPage,
      limit: itemsPerPage,
      sortBy,
      sortOrder
    }],
    keepPreviousData: true
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    setIsLoading(isProductsLoading);
  }, [isProductsLoading]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle category filter changes
  const handleCategoryChange = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setCurrentPage(1); // Reset to first page on category change
  };

  // Handle sorting changes
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default desc order
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Product Categories</h2>
        <p className="text-muted-foreground">
          Browse and filter trending products by category
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSortChange('trendScore')}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortBy === 'trendScore' ? (sortOrder === 'desc' ? 'Highest Trend' : 'Lowest Trend') : 'Sort by Trend'}
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto py-2 scrollbar-hide">
        <div className="flex space-x-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={categoryFilter === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {productsData?.products && productsData.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.products.map(product => (
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
                    <div className="font-medium">{formatCurrency(product.price || 0)}</div>
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
                        <span>{product.engagementScore || 0}%</span>
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
            {searchQuery 
              ? `No products matching "${searchQuery}" in ${categoryFilter === 'all' ? 'all categories' : categoryFilter}`
              : `No products found in ${categoryFilter === 'all' ? 'all categories' : categoryFilter}`
            }
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {productsData?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, productsData.total)}
            </span>{' '}
            of <span className="font-medium">{productsData.total}</span> products
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, productsData.totalPages) }, (_, i) => {
              // Show pages around the current page
              let pageNum = currentPage;
              if (currentPage > 2) {
                pageNum = i + currentPage - 2;
              } else {
                pageNum = i + 1;
              }
              
              // Don't show page numbers beyond total pages
              if (pageNum <= productsData.totalPages) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(productsData.totalPages, p + 1))}
              disabled={currentPage === productsData.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}