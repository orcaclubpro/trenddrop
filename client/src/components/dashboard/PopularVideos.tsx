import { useQuery } from '@tanstack/react-query';
import { Youtube, TikTok, Instagram, Play } from 'lucide-react';
import { API } from '@/lib/constants';
import { formatCompactNumber, formatRelativeTime, truncateString } from '@/lib/utils';

export function PopularVideos() {
  // Fetch the first few products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: [API.PRODUCTS, { limit: 3 }],
  });

  // A helper function to get videos for all fetched products
  async function getVideosForProducts(productIds: number[]) {
    const promises = productIds.map(id => 
      fetch(`${API.PRODUCTS}/${id}`).then(res => res.json())
    );
    
    const results = await Promise.all(promises);
    let allVideos: any[] = [];
    
    results.forEach(result => {
      if (result.videos && result.videos.length) {
        allVideos = [...allVideos, ...result.videos];
      }
    });
    
    // Sort by views (highest first) and take top 5
    return allVideos
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }
  
  // Fetch videos for products
  const { 
    data: videos, 
    isLoading: isVideosLoading, 
    error: videosError 
  } = useQuery({
    queryKey: ['videos'],
    queryFn: () => getVideosForProducts(productsData?.products.map((p: any) => p.id) || []),
    enabled: !!(productsData?.products && productsData.products.length > 0),
  });

  const isLoadingAny = isLoading || isVideosLoading;
  const hasError = error || videosError;

  // Loading state
  if (isLoadingAny) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="h-12 w-16 rounded bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <Play className="mx-auto h-10 w-10 mb-2" />
        <p>Unable to load videos data</p>
      </div>
    );
  }

  // Empty state
  if (!videos || videos.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <Play className="mx-auto h-10 w-10 mb-2" />
        <p>No videos available</p>
      </div>
    );
  }

  // Helper to get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-500" />;
      case 'tiktok':
        return <TikTok className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {videos.map((video: any, index: number) => (
        <a 
          key={index} 
          href={video.videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-start space-x-3 hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors"
        >
          <div className="relative flex-shrink-0 h-12 w-16 rounded-md overflow-hidden bg-muted">
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <Play className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{truncateString(video.title, 50)}</h4>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                {getPlatformIcon(video.platform)}
                <span className="ml-1">{video.platform}</span>
              </div>
              <div className="mx-2">•</div>
              <span>{formatCompactNumber(video.views)} views</span>
              <div className="mx-2">•</div>
              <span>{formatRelativeTime(video.uploadDate)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}