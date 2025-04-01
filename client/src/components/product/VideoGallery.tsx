import { useState } from 'react';
import { Video } from '@shared/schema';
import { formatCompactNumber, formatDate } from '@/lib/utils';
import { Youtube, TikTok, Instagram, Play, ExternalLink } from 'lucide-react';

interface VideoGalleryProps {
  videos: Video[];
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Helper to get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'tiktok':
        return <TikTok className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };
  
  // Format platform name
  const formatPlatform = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'YouTube';
      case 'tiktok':
        return 'TikTok';
      case 'instagram':
        return 'Instagram';
      default:
        return platform;
    }
  };
  
  // If no videos, show empty state
  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Play className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No videos available for this product</p>
      </div>
    );
  }

  // Get selected video or default to the first one
  const currentVideo = selectedVideo || videos[0];
  
  // Extract video ID from URL for embedding (simplified version - would need proper regex in production)
  const getEmbedUrl = (video: Video) => {
    try {
      const url = video.videoUrl;
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // For YouTube
        const videoId = url.includes('?v=') 
          ? url.split('?v=')[1].split('&')[0]
          : url.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('tiktok.com')) {
        // TikTok doesn't have a simple embed URL, would need to use their widget
        return video.videoUrl;
      } else if (url.includes('instagram.com')) {
        // Instagram also requires their embed widget
        return video.videoUrl;
      }
      return video.videoUrl;
    } catch (error) {
      console.error('Error parsing video URL:', error);
      return video.videoUrl;
    }
  };
  
  // Simplified YouTube embed (would need more robust iframe handling in production)
  const canEmbed = currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Video player or thumbnail */}
      <div className="md:col-span-2 bg-muted rounded-lg overflow-hidden">
        {canEmbed ? (
          <div className="relative pb-[56.25%] h-0">
            <iframe 
              src={getEmbedUrl(currentVideo)}
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
              title={currentVideo.title}
            />
          </div>
        ) : (
          <div className="relative aspect-video">
            {currentVideo.thumbnailUrl ? (
              <img 
                src={currentVideo.thumbnailUrl} 
                alt={currentVideo.title}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <a 
              href={currentVideo.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors text-white"
            >
              <div className="flex flex-col items-center">
                <Play className="h-12 w-12 mb-2" />
                <span className="text-sm font-medium">Watch on {formatPlatform(currentVideo.platform)}</span>
              </div>
            </a>
          </div>
        )}
        
        {/* Video details */}
        <div className="p-3">
          <h3 className="font-medium">{currentVideo.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <div className="flex items-center">
              {getPlatformIcon(currentVideo.platform)}
              <span className="ml-1">{formatPlatform(currentVideo.platform)}</span>
            </div>
            <div className="mx-2">•</div>
            <span>{formatCompactNumber(currentVideo.views)} views</span>
            <div className="mx-2">•</div>
            <span>Uploaded {formatDate(currentVideo.uploadDate.toString())}</span>
          </div>
          <div className="mt-2">
            <a 
              href={currentVideo.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              View Original
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Video list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        <h3 className="font-medium text-sm text-muted-foreground mb-3">Related Videos</h3>
        {videos.map((video) => (
          <div 
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className={`flex items-start gap-2 p-2 rounded-md cursor-pointer ${
              currentVideo.id === video.id 
                ? 'bg-primary/10' 
                : 'hover:bg-muted/80'
            }`}
          >
            <div className="relative flex-shrink-0 w-20 h-12 bg-muted rounded overflow-hidden">
              {video.thumbnailUrl ? (
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getPlatformIcon(video.platform)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium line-clamp-2">{video.title}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>{formatCompactNumber(video.views)} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}