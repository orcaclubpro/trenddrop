import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Package,
  Video,
  MapPin,
  DollarSign,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductSearchProps {
  onSearch: (filters: ProductFilters) => void;
  isLoading?: boolean;
}

export interface ProductFilters {
  search: string;
  category: string;
  priceRange: [number, number];
  trendScore: [number, number];
  engagementRate: [number, number];
  salesVelocity: [number, number];
  searchVolume: [number, number];
  geographicSpread: [number, number];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home Goods' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'sports', name: 'Sports & Outdoors' },
  { id: 'toys', name: 'Toys & Games' }
];

const sortOptions = [
  { id: 'trendScore', name: 'Trend Score' },
  { id: 'engagementRate', name: 'Engagement Rate' },
  { id: 'salesVelocity', name: 'Sales Velocity' },
  { id: 'searchVolume', name: 'Search Volume' },
  { id: 'geographicSpread', name: 'Geographic Spread' },
  { id: 'price', name: 'Price' },
  { id: 'createdAt', name: 'Date Added' }
];

export function ProductSearch({ onSearch, isLoading }: ProductSearchProps) {
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

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
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
    onSearch({
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
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Product Search</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters */}
          {isExpanded && (
            <div className="space-y-6 pt-4 border-t">
              {/* Price Range */}
              <div>
                <Label>Price Range</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                    min={0}
                    max={1000}
                    step={10}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
                  </div>
                </div>
              </div>

              {/* Trend Score */}
              <div>
                <Label>Trend Score</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.trendScore}
                    onValueChange={(value) => handleFilterChange('trendScore', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {filters.trendScore[0]} - {filters.trendScore[1]}
                  </div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div>
                <Label>Engagement Rate</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.engagementRate}
                    onValueChange={(value) => handleFilterChange('engagementRate', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {filters.engagementRate[0]}% - {filters.engagementRate[1]}%
                  </div>
                </div>
              </div>

              {/* Sales Velocity */}
              <div>
                <Label>Sales Velocity</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.salesVelocity}
                    onValueChange={(value) => handleFilterChange('salesVelocity', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {filters.salesVelocity[0]}% - {filters.salesVelocity[1]}%
                  </div>
                </div>
              </div>

              {/* Search Volume */}
              <div>
                <Label>Search Volume</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.searchVolume}
                    onValueChange={(value) => handleFilterChange('searchVolume', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {filters.searchVolume[0]}% - {filters.searchVolume[1]}%
                  </div>
                </div>
              </div>

              {/* Geographic Spread */}
              <div>
                <Label>Geographic Spread</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={filters.geographicSpread}
                    onValueChange={(value) => handleFilterChange('geographicSpread', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground min-w-[120px] text-right">
                    {filters.geographicSpread[0]}% - {filters.geographicSpread[1]}%
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Sort Direction</Label>
                  <Select
                    value={filters.sortDirection}
                    onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortDirection', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 