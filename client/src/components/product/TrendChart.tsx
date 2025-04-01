import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Trend } from '@shared/schema';
import { CHART_COLORS } from '@/lib/constants';

interface TrendChartProps {
  trends: Trend[];
}

export function TrendChart({ trends }: TrendChartProps) {
  const [visibleDatasets, setVisibleDatasets] = useState({
    engagement: true,
    sales: true,
    search: true,
  });

  // Sort trends by date (oldest to newest)
  const sortedTrends = [...trends].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format the data for the chart
  const chartData = sortedTrends.map(trend => ({
    date: trend.date,
    engagement: trend.engagementValue,
    sales: trend.salesValue,
    search: trend.searchValue,
    // Calculate the moving average if needed
    engagementMA: null,
    salesMA: null,
    searchMA: null,
  }));

  // Toggle visibility of datasets
  const toggleDataset = (dataset: 'engagement' | 'sales' | 'search') => {
    setVisibleDatasets(prev => ({
      ...prev,
      [dataset]: !prev[dataset],
    }));
  };

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
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
          <p className="text-muted-foreground">No trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-8 flex items-center justify-end space-x-4 mb-2">
        <button
          onClick={() => toggleDataset('engagement')}
          className={`text-xs px-2 py-1 rounded-full ${
            visibleDatasets.engagement 
              ? `bg-[${CHART_COLORS.ENGAGEMENT}]/20 text-[${CHART_COLORS.ENGAGEMENT}]` 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Engagement
        </button>
        <button
          onClick={() => toggleDataset('sales')}
          className={`text-xs px-2 py-1 rounded-full ${
            visibleDatasets.sales 
              ? `bg-[${CHART_COLORS.SALES}]/20 text-[${CHART_COLORS.SALES}]` 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Sales
        </button>
        <button
          onClick={() => toggleDataset('search')}
          className={`text-xs px-2 py-1 rounded-full ${
            visibleDatasets.search 
              ? `bg-[${CHART_COLORS.SEARCH}]/20 text-[${CHART_COLORS.SEARCH}]` 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Search
        </button>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke="hsl(var(--foreground))"
          />
          <YAxis 
            stroke="hsl(var(--foreground))"
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '0.5rem',
              color: 'hsl(var(--foreground))',
            }}
            labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
          />
          <Legend />
          
          {visibleDatasets.engagement && (
            <Line
              type="monotone"
              dataKey="engagement"
              name="Engagement"
              stroke={CHART_COLORS.ENGAGEMENT}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          )}
          
          {visibleDatasets.sales && (
            <Line
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke={CHART_COLORS.SALES}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          )}
          
          {visibleDatasets.search && (
            <Line
              type="monotone"
              dataKey="search"
              name="Search"
              stroke={CHART_COLORS.SEARCH}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}