import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { TREND_SCORE_RANGES, DATE_FORMAT } from "./constants";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formats a number with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formats a percentage (0-100)
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Gets the color class for a trend score
 */
export function getTrendScoreColor(score: number): string {
  if (score >= TREND_SCORE_RANGES.HIGH.min) {
    return TREND_SCORE_RANGES.HIGH.color;
  } else if (score >= TREND_SCORE_RANGES.MEDIUM.min) {
    return TREND_SCORE_RANGES.MEDIUM.color;
  } else {
    return TREND_SCORE_RANGES.LOW.color;
  }
}

/**
 * Formats a date string using date-fns
 */
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), DATE_FORMAT);
  } catch (error) {
    return dateString;
  }
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (error) {
    return dateString;
  }
}

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncates a string to a maximum length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Returns the browser's WebSocket implementation or undefined if not supported
 */
export function getWebSocketSupport(): typeof WebSocket | undefined {
  return typeof WebSocket !== 'undefined' ? WebSocket : undefined;
}

/**
 * Exports data as CSV
 */
export function exportAsCSV(data: any[], filename: string): void {
  if (!data.length) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers
        .map(header => {
          const cell = row[header];
          // Handle strings with commas and quotes
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ];
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}