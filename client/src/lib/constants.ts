// Category Colors
export const CATEGORY_COLORS = {
  Home: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200"
  },
  Tech: {
    bg: "bg-indigo-100 dark:bg-indigo-900",
    text: "text-indigo-800 dark:text-indigo-200"
  },
  Fitness: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200"
  },
  Decor: {
    bg: "bg-pink-100 dark:bg-pink-900",
    text: "text-pink-800 dark:text-pink-200"
  },
  Beauty: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-800 dark:text-purple-200"
  },
  Fashion: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200"
  }
};

// Social Media Platforms
export const PLATFORMS = [
  { name: "TikTok", icon: "ri-tiktok-line" },
  { name: "Instagram", icon: "ri-instagram-line" },
  { name: "YouTube", icon: "ri-youtube-line" }
];

// Trend Score Thresholds
export const TREND_SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70
};

// Trend Score Colors
export const TREND_SCORE_COLORS = {
  excellent: "rgb(16, 185, 129)", // Green
  good: "rgb(79, 70, 229)",       // Indigo
  average: "rgb(245, 158, 11)",   // Amber
  poor: "rgb(220, 38, 38)"        // Red
};

// Dashboard Refresh Interval (in milliseconds)
export const DASHBOARD_REFRESH_INTERVAL = 300000; // 5 minutes

// Default Page Size for product listings
export const DEFAULT_PAGE_SIZE = 5;

// Chart Colors
export const CHART_COLORS = {
  engagement: "rgb(99, 102, 241)", // Indigo
  sales: "rgb(16, 185, 129)",      // Green
  search: "rgb(245, 158, 11)"      // Amber
};
