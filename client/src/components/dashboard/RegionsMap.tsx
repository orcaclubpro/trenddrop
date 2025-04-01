import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API, CHART_COLORS } from '@/lib/constants';
import { formatPercentage } from '@/lib/utils';

// Simple SVG world map component
export function RegionsMap() {
  const [regionData, setRegionData] = useState<Map<string, number>>(new Map());
  const [topRegions, setTopRegions] = useState<{country: string, percentage: number}[]>([]);
  
  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: [API.PRODUCTS, { limit: 50 }],
  });
  
  // Fetch regions data
  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: [API.REGIONS],
  });

  useEffect(() => {
    if (productsData?.products && productsData.products.length > 0) {
      // Here in a real implementation, we would process region data from products
      // For now we'll just use the first few products to show some sample data
      const regionsMap = new Map<string, number>();
      const tempTopRegions: {country: string, percentage: number}[] = [];
      
      // We would normally fetch this data from the API or compute it
      const sampleRegions = [
        { country: 'United States', percentage: 38 },
        { country: 'Europe', percentage: 25 },
        { country: 'Asia', percentage: 20 },
        { country: 'South America', percentage: 10 },
        { country: 'Australia', percentage: 7 },
      ];
      
      sampleRegions.forEach(region => {
        regionsMap.set(region.country, region.percentage);
        tempTopRegions.push(region);
      });
      
      tempTopRegions.sort((a, b) => b.percentage - a.percentage);
      setRegionData(regionsMap);
      setTopRegions(tempTopRegions.slice(0, 5)); // Top 5 regions
    }
  }, [productsData, regionsData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>Failed to load region data</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Simple world map visualization - replace with a proper mapping library in production */}
      <div className="flex-1 flex items-center justify-center">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-auto max-h-full p-2 text-muted-foreground"
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
      
      {/* Top regions list */}
      <div className="flex-1 pl-4">
        <h3 className="text-sm font-medium mb-2">Top Markets</h3>
        <div className="space-y-3">
          {topRegions.map((region, index) => (
            <div key={index} className="flex items-center">
              <div className="w-full mr-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{region.country}</span>
                  <span className="font-medium">{formatPercentage(region.percentage)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${region.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}