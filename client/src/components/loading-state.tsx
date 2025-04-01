// Create a new file: client/src/components/loading-state.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  status: 'connecting' | 'initializing' | 'error';
  message?: string;
  retryIn?: number;
}

export default function LoadingState({ status, message, retryIn }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">TrendDrop</h1>
        
        {status === 'connecting' && (
          <>
            <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Connecting to Database</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {message || "Establishing connection to the product database..."}
            </p>
          </>
        )}
        
        {status === 'initializing' && (
          <>
            <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Initializing Application</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {message || "The database is connected and the application is starting up..."}
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="h-12 w-12 text-red-500 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">Connection Error</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {message || "Could not connect to the database."}
            </p>
            {retryIn && (
              <p className="text-sm text-gray-400">
                Retrying in {Math.ceil(retryIn / 60)} minutes...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
