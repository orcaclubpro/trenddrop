import { ProductFilter } from "@shared/schema";

// Utility function to convert filter object to URL params
export function filterToParams(filter: ProductFilter): string {
  const params = new URLSearchParams();
  
  if (filter.trendScore !== undefined) {
    params.append('trendScore', filter.trendScore.toString());
  }
  
  if (filter.category) {
    params.append('category', filter.category);
  }
  
  if (filter.region) {
    params.append('region', filter.region);
  }
  
  if (filter.page) {
    params.append('page', filter.page.toString());
  }
  
  if (filter.limit) {
    params.append('limit', filter.limit.toString());
  }
  
  return params.toString();
}

// Formats numbers for display (e.g., 1,200,000 -> 1.2M)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Formats currency values
export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Calculates percentage change between two values
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 100;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

// Formats relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - inputDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    }
    return `${diffInHours} hours ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
}
