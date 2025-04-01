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
  GlobeIcon,
  MapPinIcon,
  PackageIcon,
  BarChart4
} from 'lucide-react';
import { formatPercentage } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';

export default function Regions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState('all');

  // Simulate continents list
  const continents = [
    { id: 'all', name: 'All Regions' },
    { id: 'north-america', name: 'North America' },
    { id: 'europe', name: 'Europe' },
    { id: 'asia', name: 'Asia' },
    { id: 'south-america', name: 'South America' },
    { id: 'oceania', name: 'Oceania' },
    { id: 'africa', name: 'Africa' }
  ];

  const { data: regionsData, isLoading: isRegionsLoading, error } = useQuery({
    queryKey: ['/api/regions', { 
      search: searchQuery, 
      continent: continentFilter !== 'all' ? continentFilter : undefined
    }]
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load region data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    setIsLoading(isRegionsLoading);
  }, [isRegionsLoading]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle continent filter changes
  const handleContinentChange = (continentId: string) => {
    setContinentFilter(continentId);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Regional Distribution</h2>
        <p className="text-muted-foreground">
          Analyze trend performance across different regions
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search regions..."
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
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto py-2 scrollbar-hide">
        <div className="flex space-x-2">
          {continents.map(continent => (
            <Button
              key={continent.id}
              variant={continentFilter === continent.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleContinentChange(continent.id)}
              className="whitespace-nowrap"
            >
              {continent.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Global Distribution Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Interactive regional map visualization will appear here
            </div>
          </CardContent>
        </Card>

        {regionsData?.regions && regionsData.regions.length > 0 ? (
          regionsData.regions.map(region => (
            <Card key={region.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">{region.name}</CardTitle>
                  <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{region.continent}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Share</span>
                    <span className="font-medium">{formatPercentage(region.marketShare || 0)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(region.marketShare || 0) * 100}%` }}></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <div className="flex flex-col items-center">
                        <PackageIcon className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Products</span>
                        <span className="font-medium">{region.productCount || 0}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex flex-col items-center">
                        <BarChart4 className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Trend</span>
                        <span className="font-medium">{region.trendScore || 0}/100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex flex-col items-center">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Cities</span>
                        <span className="font-medium">{region.cityCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Link href={`/regions/${region.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 border rounded-lg">
            <GlobeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Regions Found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No regions matching "${searchQuery}" in ${continentFilter === 'all' ? 'all continents' : continentFilter}`
                : `No regions found in ${continentFilter === 'all' ? 'all continents' : continentFilter}`
              }
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setContinentFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}