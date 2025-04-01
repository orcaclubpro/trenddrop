import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, SlidersHorizontal, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterBarProps {
  onFilterChange: (filters: { trendScore?: number; category?: string; region?: string }) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function FilterBar({ onFilterChange, onRefresh, onExport }: FilterBarProps) {
  const [trendScore, setTrendScore] = useState<string>("All Scores");
  const [category, setCategory] = useState<string>("All Categories");
  const [region, setRegion] = useState<string>("Worldwide");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const isMobile = useIsMobile();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["/api/regions"],
  });

  useEffect(() => {
    // Map UI selections to filter values
    const scoreMap: Record<string, number | undefined> = {
      "All Scores": undefined,
      "90+": 90,
      "80+": 80,
      "70+": 70
    };

    const filters = {
      trendScore: scoreMap[trendScore],
      category: category === "All Categories" ? undefined : category,
      region: region === "Worldwide" ? undefined : region
    };

    // Count active filters for badge
    let count = 0;
    if (filters.trendScore) count++;
    if (filters.category) count++;
    if (filters.region) count++;
    setActiveFiltersCount(count);

    onFilterChange(filters);
  }, [trendScore, category, region, onFilterChange]);

  const handleScoreChange = (value: string) => {
    setTrendScore(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
  };

  const resetFilters = () => {
    setTrendScore("All Scores");
    setCategory("All Categories");
    setRegion("Worldwide");
  };

  const getFiltersContent = () => (
    <div className="flex flex-col gap-4 py-1">
      <div className="space-y-1">
        <p className="text-sm font-medium">Trend Score</p>
        <Select value={trendScore} onValueChange={handleScoreChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Scores">All Scores</SelectItem>
            <SelectItem value="90+">90+ (Excellent)</SelectItem>
            <SelectItem value="80+">80+ (Good)</SelectItem>
            <SelectItem value="70+">70+ (Average)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Category</p>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">All Categories</SelectItem>
            {categories?.map((cat: string) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Region</p>
        <Select value={region} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Worldwide">Worldwide</SelectItem>
            {regions?.map((reg: string) => (
              <SelectItem key={reg} value={reg}>{reg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
        Reset Filters
      </Button>
    </div>
  );

  // Mobile version uses a popover for all filters
  if (isMobile) {
    return (
      <div className="bg-background border-b border-border p-3 flex items-center justify-between sticky top-0 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Filter Products</h4>
              <Badge variant="outline">{activeFiltersCount} active</Badge>
            </div>
            {getFiltersContent()}
          </PopoverContent>
        </Popover>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Export Data">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop version shows filters inline
  return (
    <div className="bg-background border-b border-border p-3 md:flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="inline-flex items-center gap-2">
          <Select value={trendScore} onValueChange={handleScoreChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Trend Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Scores">All Scores</SelectItem>
              <SelectItem value="90+">90+ (Excellent)</SelectItem>
              <SelectItem value="80+">80+ (Good)</SelectItem>
              <SelectItem value="70+">70+ (Average)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="inline-flex items-center gap-2">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              {categories?.map((cat: string) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="inline-flex items-center gap-2">
          <Select value={region} onValueChange={handleRegionChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Worldwide">Worldwide</SelectItem>
              {regions?.map((reg: string) => (
                <SelectItem key={reg} value={reg}>{reg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            Clear All
          </Button>
        )}
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="h-9"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={onExport}
          className="h-9"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}
