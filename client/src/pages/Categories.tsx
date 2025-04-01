import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Download,
  Grid2X2,
  List 
} from 'lucide-react';
import { API, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { debounce, formatCurrency, getTrendScoreColor } from '@/lib/utils';
import { Product } from '@shared/schema';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendScoreBadge } from '@/components/product/TrendScoreBadge';

function Categories() {
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('trendScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Create the API query string
  const getQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', DEFAULT_PAGE_SIZE.toString());
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    return params.toString();
  };

  // Fetch categories
  const { 
    data: categories,
    isLoading: isCategoriesLoading,
  } = useQuery<string[]>({
    queryKey: [API.CATEGORIES],
  });
  
  // Fetch products with filtering
  const { 
    data: productsData, 
    isLoading: isProductsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: [`${API.PRODUCTS}?${getQueryString()}`],
  });
  
  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      setPage(1); // Reset to first page on search
    }, 300),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  // Handle sort changes
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Filter products by search query if needed
  const filteredProducts = productsData?.products
    ? productsData.products.filter(product => 
        searchQuery 
          ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.subcategory && product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()))
          : true
      )
    : [];
    
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Type assertion since we know it's a product property
    const aValue = a[sortBy as keyof Product];
    const bValue = b[sortBy as keyof Product];
    
    // Handle string vs number sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      // For numbers and other types
      return sortOrder === 'asc' 
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    }
  });
  
  // Export to CSV
  const handleExport = () => {
    window.open(`${API.EXPORT}${selectedCategory ? `?category=${selectedCategory}` : ''}`, '_blank');
  };
  
  // Loading state
  const isLoading = isCategoriesLoading || isProductsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Product Categories</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="h-12 bg-muted rounded-md w-full mb-4 animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded-md w-full mb-2 animate-pulse"></div>
            ))}
          </div>
          <div className="md:col-span-3">
            <div className="h-12 bg-muted rounded-md w-full mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Product Categories</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                className="pl-8"
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedCategory === null 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All Categories
              </button>
              
              {categories?.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedCategory === category 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Products grid */}
        <div className="md:col-span-3 space-y-4">
          {/* Sort and filter bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card rounded-lg shadow-sm border p-4">
            <div className="flex-1 flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('trendScore')}
                className="flex items-center"
              >
                <span>Trend</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('priceRangeLow')}
                className="flex items-center"
              >
                <span>Price</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Products listing */}
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              {selectedCategory && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedProducts.map(product => (
                    <ProductListItem key={product.id} product={product} />
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {productsData && productsData.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {page} of {productsData.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= productsData.totalPages}
                      onClick={() => setPage(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <a className="block bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-40 bg-muted">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-xl font-medium text-primary">
                {product.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <TrendScoreBadge score={product.trendScore} size="small" />
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-medium line-clamp-1">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {product.category} {product.subcategory ? `/ ${product.subcategory}` : ''}
              </p>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t flex justify-between items-center">
            <span className="text-sm">
              {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {product.engagementRate}% engagement
            </span>
          </div>
        </div>
      </a>
    </Link>
  );
}

interface ProductListItemProps {
  product: Product;
}

function ProductListItem({ product }: ProductListItemProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <a className="block bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-lg font-medium text-primary">
                  {product.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{product.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{product.category}</span>
              {product.subcategory && (
                <>
                  <span className="mx-1">•</span>
                  <span>{product.subcategory}</span>
                </>
              )}
              <span className="mx-1">•</span>
              <span>
                {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={`text-lg font-bold ${getTrendScoreColor(product.trendScore)}`}>
                {product.trendScore}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </a>
    </Link>
  );
}

export default Categories;