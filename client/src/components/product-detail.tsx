import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Product, ProductWithDetails } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import TrendChart from "./trend-chart";
import GeographicMap from "./geographic-map";
import VideoCard from "./video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

interface ProductDetailProps {
  productId: number | null;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const queryClient = useQueryClient();
  
  // Determine WebSocket URL based on current URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  
  // Use WebSocket hook for real-time updates
  const { messages } = useWebSocket(wsUrl);
  
  // Query for product details
  const { 
    data: productDetails,
    isLoading,
    isFetching
  } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${productId}`],
    enabled: productId !== null,
  });
  
  // Listen for WebSocket messages for real-time updates
  useEffect(() => {
    const productUpdates = messages.filter(msg => 
      msg.type === 'product_update' && msg.productId === productId
    );
    
    if (productUpdates.length > 0 && productId) {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
    }
  }, [messages, productId, queryClient]);

  if (!productId) {
    return (
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-500">Select a product to see details</h3>
        <p className="text-sm text-gray-400 mt-2 text-center">
          Click on any product from the list to view detailed metrics and insights.
        </p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-md shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mt-6 mb-1" />
          <Skeleton className="h-32 w-full mt-4 mb-4" />
          <Skeleton className="h-4 w-full mt-6 mb-1" />
          <Skeleton className="h-40 w-full mt-4 mb-4" />
          <Skeleton className="h-4 w-full mt-6 mb-1" />
          <Skeleton className="h-56 w-full mt-4" />
        </div>
      </div>
    );
  }
  
  const { product, trends, regions, videos } = productDetails || {};
  
  if (!product) {
    return (
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700">Product not found</h3>
        <p className="text-sm text-gray-500 mt-2 text-center">
          The requested product could not be loaded. Please try another product.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Product Details</h3>
        <div>
          {isFetching && !isLoading && (
            <span className="text-xs mr-2 text-blue-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updating
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium text-gray-800">{product.name}</h2>
            <div className="text-sm text-gray-500 mt-1">
              {product.category} • {product.subcategory}
            </div>
          </div>
          <TrendScoreRing score={product.trendScore} size={60} />
        </div>
        
        <div className="mt-5 flex flex-col gap-2 bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Price Range:</div>
            <div className="font-medium text-gray-800">${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}</div>
          </div>
          
          {/* Supplier Link */}
          {product.supplierUrl && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Supplier:</div>
              <a 
                href={product.supplierUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Supplier
              </a>
            </div>
          )}
        </div>
        
        {/* Trend Score Breakdown */}
        <div className="mt-8">
          <div className="text-sm font-medium text-gray-700 mb-3">Trend Score Breakdown</div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="text-gray-600">Social Engagement</div>
                <div className="font-medium text-gray-800">{product.engagementRate}/50</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(product.engagementRate / 50) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="text-gray-600">Sales Velocity</div>
                <div className="font-medium text-gray-800">{product.salesVelocity}/30</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${(product.salesVelocity / 30) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="text-gray-600">Search Interest</div>
                <div className="font-medium text-gray-800">{product.searchVolume}/20</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${(product.searchVolume / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="text-gray-600">Geographic Spread</div>
                <div className="font-medium text-gray-800">{product.geographicSpread}/10</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${(product.geographicSpread / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trend Chart */}
        <div className="mt-8">
          <div className="text-sm font-medium text-gray-700 mb-3">Trend History</div>
          <TrendChart trends={trends || []} />
        </div>
        
        {/* Geographic Map */}
        <div className="mt-8">
          <div className="text-sm font-medium text-gray-700 mb-3">Geographic Distribution</div>
          <GeographicMap regions={regions || []} />
        </div>
        
        {/* Marketing Videos */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium text-gray-700">Marketing Videos</div>
            <button className="text-xs text-blue-600 hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            {videos && videos.length > 0 ? (
              videos.slice(0, 1).map(video => (
                <VideoCard key={video.id} video={video} />
              ))
            ) : (
              <div className="bg-gray-50 rounded-md p-4 text-center text-sm text-gray-500">
                No videos available for this product.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-5 border-t border-gray-100 flex justify-between items-center">
        {product.supplierUrl ? (
          <a 
            href={product.supplierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Supplier
          </a>
        ) : (
          <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Suppliers
          </button>
        )}
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to List
        </button>
      </div>
    </div>
  );
}
