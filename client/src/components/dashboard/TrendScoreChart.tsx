import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API, CHART_COLORS, TREND_SCORE_RANGES } from '@/lib/constants';

export function TrendScoreChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Fetch all products to analyze trend score distribution
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: [API.PRODUCTS, { limit: 100 }], // Get a large batch for better analysis
  });
  
  // Process the data for the chart
  useEffect(() => {
    if (productsData?.products) {
      // Create bins for the trend score ranges
      const bins = [
        { name: '0-10', range: [0, 10], count: 0 },
        { name: '11-20', range: [11, 20], count: 0 },
        { name: '21-30', range: [21, 30], count: 0 },
        { name: '31-40', range: [31, 40], count: 0 },
        { name: '41-50', range: [41, 50], count: 0 },
        { name: '51-60', range: [51, 60], count: 0 },
        { name: '61-70', range: [61, 70], count: 0 },
        { name: '71-80', range: [71, 80], count: 0 },
        { name: '81-90', range: [81, 90], count: 0 },
        { name: '91-100', range: [91, 100], count: 0 },
      ];
      
      // Count products in each bin
      productsData.products.forEach((product: any) => {
        const score = product.trendScore;
        const bin = bins.find(bin => score >= bin.range[0] && score <= bin.range[1]);
        if (bin) bin.count++;
      });
      
      // Only include bins with data to save space
      const filteredBins = bins.filter(bin => bin.count > 0);
      setChartData(filteredBins.length ? filteredBins : bins);
    }
  }, [productsData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>Failed to load chart data</p>
      </div>
    );
  }

  // If no data, show empty state
  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mb-3"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <p className="text-sm">No trend score data available</p>
      </div>
    );
  }

  // Determine color based on trend score range
  const getBarColor = (score: string) => {
    const [min] = score.split('-').map(Number);
    
    if (min >= TREND_SCORE_RANGES.HIGH.min) {
      return CHART_COLORS.TREND;
    } else if (min >= TREND_SCORE_RANGES.MEDIUM.min) {
      return CHART_COLORS.SEARCH;
    } else {
      return CHART_COLORS.ENGAGEMENT;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }} 
          tickLine={false} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickLine={false} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickFormatter={(value) => value === 0 ? '0' : value.toString()}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ 
            color: 'hsl(var(--foreground))',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
          itemStyle={{
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value) => [`${value} products`, 'Count']}
          labelFormatter={(label) => `Trend Score: ${label}`}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}