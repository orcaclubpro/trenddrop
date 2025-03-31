import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface FilterBarProps {
  onFilterChange: (filters: { trendScore?: number; category?: string; region?: string }) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function FilterBar({ onFilterChange, onRefresh, onExport }: FilterBarProps) {
  const [trendScore, setTrendScore] = useState<string>("All Scores");
  const [category, setCategory] = useState<string>("All Categories");
  const [region, setRegion] = useState<string>("Worldwide");

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: regions } = useQuery({
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

    onFilterChange(filters);
  }, [trendScore, category, region, onFilterChange]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:flex items-center justify-between">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Trend Score:</div>
          <select 
            className="bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm py-1 pl-2 pr-8"
            value={trendScore}
            onChange={(e) => setTrendScore(e.target.value)}
          >
            <option>All Scores</option>
            <option>90+</option>
            <option>80+</option>
            <option>70+</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Category:</div>
          <select 
            className="bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm py-1 pl-2 pr-8"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            {categories?.map((cat: string) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Region:</div>
          <select 
            className="bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-sm py-1 pl-2 pr-8"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option>Worldwide</option>
            {regions?.map((reg: string) => (
              <option key={reg}>{reg}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center gap-3">
        <button 
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          onClick={onRefresh}
        >
          <i className="ri-refresh-line"></i> Refresh
        </button>
        
        <button 
          className="flex items-center gap-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm"
          onClick={onExport}
        >
          <i className="ri-download-line"></i> Export
        </button>
      </div>
    </div>
  );
}
