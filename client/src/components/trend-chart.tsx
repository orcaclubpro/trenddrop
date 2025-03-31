import { useEffect, useRef } from "react";
import { Trend } from "@shared/schema";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface TrendChartProps {
  trends: Trend[];
}

interface ChartData {
  date: string;
  engagement: number;
  sales: number;
  search: number;
}

export default function TrendChart({ trends }: TrendChartProps) {
  // Process trend data for chart
  const chartData: ChartData[] = [];
  
  // If trends are available, format them for the chart
  if (trends.length > 0) {
    // Sort by date
    const sortedTrends = [...trends].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Format for chart
    sortedTrends.forEach(trend => {
      const date = new Date(trend.date);
      chartData.push({
        date: format(date, "MM/dd"),
        engagement: trend.engagementValue,
        sales: trend.salesValue,
        search: trend.searchValue
      });
    });
  } 
  // If no trends, create mock data
  else {
    // Create 30 days of mock data
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      chartData.push({
        date: format(date, "MM/dd"),
        engagement: 0,
        sales: 0,
        search: 0
      });
    }
  }
  
  return (
    <div className="mt-6">
      <div className="text-sm font-medium mb-2">30-Day Performance</div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 h-48">
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                fontSize={10}
                stroke="#6B7280"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                fontSize={10}
                stroke="#6B7280"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.375rem',
                  color: '#F3F4F6',
                  fontSize: '0.75rem'
                }}
              />
              <Legend 
                iconSize={8}
                iconType="circle"
                fontSize={10}
                wrapperStyle={{ fontSize: '0.75rem' }}
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="#6366F1" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="search" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No trend data available
          </div>
        )}
      </div>
    </div>
  );
}
