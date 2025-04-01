import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Globe, 
  Search, 
  ArrowUpDown, 
  TrendingUp,
  MapPin 
} from 'lucide-react';
import { API } from '@/lib/constants';
import { formatPercentage } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// World regions data structure
interface RegionData {
  name: string;
  products: number; // Number of products popular in this region
  percentage: number; // Average market percentage
  topProducts: Array<{
    id: number;
    name: string;
    percentage: number;
  }>;
}

function Regions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'percentage'>('percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch all regions
  const { 
    data: regions, 
    isLoading: isRegionsLoading 
  } = useQuery<string[]>({
    queryKey: [API.REGIONS],
  });
  
  // Fetch all products (limited quantity)
  const { 
    data: productsData,
    isLoading: isProductsLoading 
  } = useQuery({
    queryKey: [`${API.PRODUCTS}?limit=50`],
  });
  
  // Process region data
  useEffect(() => {
    if (regions && regions.length && productsData && productsData.products) {
      const regionsMap = new Map<string, RegionData>();
      
      // Initialize all regions
      regions.forEach(region => {
        regionsMap.set(region, {
          name: region,
          products: 0,
          percentage: 0,
          topProducts: [],
        });
      });
      
      // Process each product
      productsData.products.forEach(product => {
        // In a real implementation, we would fetch region data for each product
        // Here we'll add the product to a random selection of regions for demo purposes
        const fetchRegionsForProduct = (productId: number) => {
          return fetch(`${API.PRODUCTS}/${productId}`)
            .then(res => res.json())
            .then(data => {
              if (data.regions && data.regions.length) {
                data.regions.forEach((region: any) => {
                  if (regionsMap.has(region.country)) {
                    const regionData = regionsMap.get(region.country)!;
                    regionData.products += 1;
                    regionData.percentage = (regionData.percentage + region.percentage) / 2;
                    
                    // Add to top products if in top 5
                    if (regionData.topProducts.length < 5 || region.percentage > regionData.topProducts[4].percentage) {
                      regionData.topProducts.push({
                        id: product.id,
                        name: product.name,
                        percentage: region.percentage,
                      });
                      
                      // Keep sorted and limited to 5
                      regionData.topProducts.sort((a, b) => b.percentage - a.percentage);
                      if (regionData.topProducts.length > 5) {
                        regionData.topProducts.pop();
                      }
                    }
                  }
                });
              }
            });
        };
        
        // For the first few products, fetch their region data
        if (product.id < 10) {
          fetchRegionsForProduct(product.id);
        }
      });
      
      // Convert map to array
      setRegionData(Array.from(regionsMap.values()));
    }
  }, [regions, productsData]);
  
  // Filter regions based on search query
  const filteredRegions = regionData.filter(region => 
    searchQuery 
      ? region.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );
  
  // Sort regions
  const sortedRegions = [...filteredRegions].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else {
      return sortOrder === 'asc' 
        ? a.percentage - b.percentage
        : b.percentage - a.percentage;
    }
  });
  
  // Handle sort changes
  const handleSort = (field: 'name' | 'percentage') => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for percentage, ascending for name
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };
  
  // Loading state
  const isLoading = isRegionsLoading || isProductsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Regions</h1>
        <div className="h-12 bg-muted rounded-md w-full mb-4 animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Geographic Distribution</h1>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card rounded-lg shadow-sm border p-4">
        <div className="flex-1 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search regions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('name')}
            className="flex items-center gap-1"
          >
            <span>Name</span>
            <ArrowUpDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('percentage')}
            className="flex items-center gap-1"
          >
            <span>Popularity</span>
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* World map visualization - simplified version */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Global Market Presence</h2>
          <span className="text-sm text-muted-foreground">
            {regions?.length || 0} active markets
          </span>
        </div>
        
        <div className="relative w-full bg-muted rounded-lg overflow-hidden">
          <svg 
            viewBox="0 0 1000 500" 
            className="w-full h-auto p-8 text-muted-foreground"
            fill="currentColor"
            stroke="hsl(var(--background))"
            strokeWidth="1"
          >
            {/* This is a simplified world map for illustration */}
            <path d="M181,114l-4,1l-4,-1l-5,2l-1,4l3,2l-2,3l-7,1l-7,0l-7,-2l-8,-1l-1,4l-4,4l1,3l-3,3l-3,0l-3,4l-2,8l-4,5l-2,-1l-3,2l0,3l-7,3l2,3l0,3l-2,2l3,5l7,0l11,5l2,-2l4,1l7,-1l2,-2l2,1l0,2l1,1l3,-1l1,-2l3,1l5,-2l2,2l5,1l3,3l4,0l2,2l4,-1l5,1l3,-1l3,1l2,-1l2,1l3,-3l0,-2l-2,0l-2,-3l1,-1l5,1l0,-2l-3,-1l1,-1l4,1l2,-2l2,1l9,-2l-1,-2l3,-2l2,2l4,-1l3,2l7,0l8,3l10,2l1,-3l-2,-2l-2,-1l-7,-6l5,-2l0,-3l-5,-5l-4,-2l3,-2l2,-4l1,-3l4,-1l-3,-3l-2,-5l-3,-2l-1,-5l-5,-2l-6,-7l-6,-4l-6,-5l-8,-5l-5,-1l-7,-5l-5,0l-1,2l3,2l-1,1l-4,-1l-7,1l-5,-7l-4,2l0,-3Z" />
            <path d="M527,256l2,1l7,-3l4,1l3,-1l3,1l4,3l5,0l4,3l3,-2l4,0l3,-2l3,1l2,-1l1,-2l-1,-2l1,-1l-2,-1l-2,-3l-2,-1l-4,1l-3,-1l-2,1l-1,-2l-3,2l-5,-1l-4,1l-3,-1l-3,2l-3,0l-2,2Z" />
            <path d="M776,270l-3,-4l-3,-5l-5,-4l-4,-5l-7,-4l-4,-5l-9,-2l-5,3l-5,-6l-3,-2l-5,0l-3,5l-4,2l-2,4l-3,3l-6,0l-5,-3l-6,-2l-5,-6l-1,-4l-1,-7l2,-3l-2,-6l-7,-5l-4,3l-5,-3l-4,-1l-5,-9l-3,-3l-5,-6l-2,-5l-5,-3l-4,-8l-4,-3l-9,-2l-1,3l5,6l0,3l4,6l1,4l1,3l-3,4l-3,6l-4,5l0,3l-3,3l-1,4l-1,6l-2,6l5,3l7,4l5,4l3,4l7,2l5,6l8,4l5,8l9,3l5,7l7,3l8,5l4,6l10,4l8,4l7,5l8,3l9,3l0,-2l-4,-6l8,2Z" />
            <path d="M671,359l-2,-7l-2,-5l-4,-5l-2,-5l2,-5l-4,-10l-3,-9l-1,-5l-3,-4l-5,-10l-2,-5l-5,-4l-5,-9l-1,-5l-4,-5l-3,-8l-1,-5l-2,-5l-8,-10l-5,-4l-7,-2l-4,-7l-3,-5l-5,-4l-5,-9l-4,-2l-6,3l-4,4l0,5l-2,9l0,6l0,9l0,8l2,4l3,5l2,7l1,7l-3,4l-2,8l-2,9l0,8l0,4l5,11l3,10l5,3l5,4l8,2l4,4l3,9l2,4l6,7l5,9l4,4l5,4l2,3l4,5l1,5l2,4l4,2l6,0l6,5l9,1l10,4l7,1l3,2l9,2l8,3l9,1l9,3l7,0l4,-3l3,-1l5,-5l-7,-4l-2,-3l-8,-1l-8,-2l-5,-3l-8,-1l-5,-3l-2,-4l-3,-3l-5,-3l-5,-3l-5,-6Z" />
          </svg>
        </div>
      </div>

      {/* Regions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRegions.map((region, index) => (
          <div 
            key={index}
            className="bg-card rounded-lg shadow-sm border overflow-hidden"
          >
            <div className="bg-primary/10 p-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  {region.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {region.products} {region.products === 1 ? 'product' : 'products'} • {formatPercentage(region.percentage)} average share
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="text-sm font-medium mb-2">Top Products</h4>
              {region.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {region.topProducts.map((product, idx) => (
                    <Link key={idx} href={`/products/${product.id}`}>
                      <a className="flex items-center justify-between hover:bg-muted/50 p-1 -mx-1 rounded">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm truncate">{product.name}</span>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {formatPercentage(product.percentage)}
                        </span>
                      </a>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  <p className="text-sm">No product data available</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Regions;