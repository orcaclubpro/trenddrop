import { useQuery } from "@tanstack/react-query";
import { Product, ProductWithDetails } from "@shared/schema";
import TrendScoreRing from "./trend-score-ring";
import TrendChart from "./trend-chart";
import GeographicMap from "./geographic-map";
import VideoCard from "./video-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductDetailProps {
  productId: number | null;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const { 
    data: productDetails,
    isLoading
  } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${productId}`],
    enabled: productId !== null,
  });
  
  if (!productId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col items-center justify-center h-full">
        <i className="ri-shopping-bag-line text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Select a product to see details</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
          Click on any product from the list on the left to view detailed metrics and insights.
        </p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col items-center justify-center h-full">
        <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
        <h3 className="text-lg font-medium">Product not found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          The requested product could not be loaded.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Product Details</h3>
        <div>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <i className="ri-more-2-fill"></i>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium">{product.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {product.category} • {product.subcategory}
            </div>
          </div>
          <TrendScoreRing score={product.trendScore} />
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">Price Range:</div>
          <div className="font-medium">${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}</div>
        </div>
        
        {/* Trend Score Breakdown */}
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Trend Score Breakdown</div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div>Social Engagement</div>
                <div className="font-medium">{product.engagementRate}/50</div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${(product.engagementRate / 50) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div>Sales Velocity</div>
                <div className="font-medium">{product.salesVelocity}/30</div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${(product.salesVelocity / 30) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div>Search Interest</div>
                <div className="font-medium">{product.searchVolume}/20</div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${(product.searchVolume / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <div>Geographic Spread</div>
                <div className="font-medium">{product.geographicSpread}/10</div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${(product.geographicSpread / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trend Chart */}
        <TrendChart trends={trends || []} />
        
        {/* Geographic Map */}
        <GeographicMap regions={regions || []} />
        
        {/* Marketing Videos */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Marketing Videos</div>
            <button className="text-xs text-primary-600 dark:text-primary-400">View All</button>
          </div>
          
          <div className="space-y-3">
            {videos && videos.length > 0 ? (
              videos.slice(0, 1).map(video => (
                <VideoCard key={video.id} video={video} />
              ))
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No videos available for this product.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
          <i className="ri-external-link-line mr-1"></i> Find Suppliers
        </button>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm">
          <i className="ri-add-line mr-1"></i> Add to List
        </button>
      </div>
    </div>
  );
}
