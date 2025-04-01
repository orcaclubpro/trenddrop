import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  LineChart, 
  Layers, 
  Globe, 
  Video, 
  ExternalLink, 
  ShoppingCart 
} from 'lucide-react';
import { API, CHART_COLORS } from '@/lib/constants';
import { 
  formatCurrency, 
  getTrendScoreColor, 
  truncateString 
} from '@/lib/utils';
import { ProductWithDetails } from '@shared/schema';

import { TrendScoreBadge } from '@/components/product/TrendScoreBadge';
import { TrendChart } from '@/components/product/TrendChart';
import { RegionDistribution } from '@/components/product/RegionDistribution';
import { VideoGallery } from '@/components/product/VideoGallery';

interface ProductDetailProps {
  id: number;
}

function ProductDetail({ id }: ProductDetailProps) {
  // Fetch product details
  const { data, isLoading, error } = useQuery<ProductWithDetails>({
    queryKey: [`${API.PRODUCTS}/${id}`],
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-muted rounded-full"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div>
        <Link href="/">
          <a className="inline-flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </a>
        </Link>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error Loading Product</h2>
          <p>There was a problem fetching the product data. This product may not exist or has been removed.</p>
          <Link href="/">
            <a className="mt-4 inline-flex items-center text-destructive-foreground hover:underline">
              Return to Dashboard
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const { product, trends, regions, videos } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Back navigation */}
      <Link href="/">
        <a className="inline-flex items-center text-sm text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </a>
      </Link>

      {/* Product header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {product.category}
            </span>
            {product.subcategory && (
              <span className="text-sm bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {product.subcategory}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Price: {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
            </span>
          </div>
        </div>
        <TrendScoreBadge score={product.trendScore} size="large" />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-semibold">{product.engagementRate}%</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Social media interaction rate
          </div>
        </div>
        
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Sales Velocity</p>
              <p className="text-2xl font-semibold">{product.salesVelocity}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Units sold per week
          </div>
        </div>
        
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Search Volume</p>
              <p className="text-2xl font-semibold">{product.searchVolume}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Layers className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Monthly search frequency
          </div>
        </div>
        
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Geographic Spread</p>
              <p className="text-2xl font-semibold">{product.geographicSpread}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Number of active markets
          </div>
        </div>
      </div>

      {/* Description if available */}
      {product.description && (
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-2">Product Description</h2>
          <p className="text-muted-foreground">{product.description}</p>
        </div>
      )}

      {/* External Links */}
      {(product.aliexpressUrl || product.cjdropshippingUrl) && (
        <div className="bg-card shadow-sm rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-3">Supply Sources</h2>
          <div className="flex flex-wrap gap-3">
            {product.aliexpressUrl && (
              <a 
                href={product.aliexpressUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-[#FF4747]/10 text-[#FF4747] rounded-md hover:bg-[#FF4747]/20 transition-colors"
              >
                <span className="font-medium">AliExpress</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
            
            {product.cjdropshippingUrl && (
              <a 
                href={product.cjdropshippingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-[#295AB9]/10 text-[#295AB9] rounded-md hover:bg-[#295AB9]/20 transition-colors"
              >
                <span className="font-medium">CJ Dropshipping</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Chart and data analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend History Chart */}
        <div className="bg-card shadow-sm rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Trend History</h2>
          </div>
          <div className="p-4 h-64">
            <TrendChart trends={trends || []} />
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-card shadow-sm rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Geographic Distribution</h2>
          </div>
          <div className="p-4 h-64">
            <RegionDistribution regions={regions || []} />
          </div>
        </div>
      </div>

      {/* Marketing Videos */}
      {videos && videos.length > 0 && (
        <div className="bg-card shadow-sm rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Marketing Videos</h2>
            <span className="text-sm text-muted-foreground">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} available
            </span>
          </div>
          <div className="p-4">
            <VideoGallery videos={videos} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;