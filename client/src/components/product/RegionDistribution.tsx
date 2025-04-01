import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Region } from '@shared/schema';
import { formatPercentage } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';

interface RegionDistributionProps {
  regions: Region[];
}

export function RegionDistribution({ regions }: RegionDistributionProps) {
  // Sort regions by percentage (highest first)
  const sortedRegions = [...regions].sort((a, b) => b.percentage - a.percentage);
  
  // Format data for the pie chart
  const chartData = sortedRegions.map(region => ({
    name: region.country,
    value: region.percentage,
  }));
  
  // Define colors for the chart
  const COLORS = [
    CHART_COLORS.TREND,
    CHART_COLORS.ENGAGEMENT,
    CHART_COLORS.SALES,
    CHART_COLORS.SEARCH,
    CHART_COLORS.GEOGRAPHIC,
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--muted))',
    'hsl(var(--accent))',
  ];
  
  // If no data, show empty state
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mx-auto text-muted-foreground mb-3"
          >
            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path>
            <path d="M2 12h20"></path>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <p className="text-muted-foreground">No region data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Percentage']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Legend 
            formatter={(value, entry, index) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}