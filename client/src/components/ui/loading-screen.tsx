import { TrendingUp } from 'lucide-react';

/**
 * A loading screen component displayed during data fetching or page transitions
 */
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-8 w-8 text-primary mr-2 animate-pulse" />
        <h1 className="text-2xl font-bold">TrendDrop</h1>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
          <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          Loading data, please wait...
        </div>
      </div>
    </div>
  );
}

/* Loading animation keyframes are defined in index.css */