import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TREND_SCORE_RANGES } from "./constants";

/**
 * Utility function to merge multiple class names with Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date in a human-readable format
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a number with commas and specified decimal places
 */
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(num);
}

/**
 * Truncates a string to a specified length with ellipsis
 */
export function truncateString(str: string, length = 30): string {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return `${str.substring(0, length)}...`;
}

/**
 * Truncate function alias
 */
export function truncate(str: string, length = 30): string {
  return truncateString(str, length);
}

/**
 * Generates a random color from a string (consistent hash)
 */
export function stringToColor(str: string): string {
  if (!str) return '#6366f1'; // Default indigo color
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

/**
 * Gets the initials from a name string
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Formats large numbers with k, m, b suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1) + 'k';
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1) + 'm';
  } else {
    return (num / 1000000000).toFixed(1) + 'b';
  }
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates time ago from a given date
 */
export function timeAgo(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  
  return Math.floor(seconds) + ' seconds ago';
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date relative to current time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  return timeAgo(date);
}

/**
 * Get a color based on trend score
 */
export function getTrendScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 border-emerald-600';
  if (score >= 60) return 'text-teal-600 border-teal-600';
  if (score >= 40) return 'text-amber-600 border-amber-600';
  if (score >= 20) return 'text-orange-600 border-orange-600';
  return 'text-rose-600 border-rose-600';
}

/**
 * Debounce function for handling rapid events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}