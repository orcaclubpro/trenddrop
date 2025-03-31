import { Video } from "@shared/schema";

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  // Format view count (e.g., 1.2M, 500K)
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };
  
  // Format upload date to relative time
  const formatUploadDate = (date: Date | string): string => {
    const uploadDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return `${Math.floor(diffInDays / 7)} weeks ago`;
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <i className="ri-play-fill text-2xl text-white"></i>
          </button>
        </div>
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="p-2">
        <div className="flex justify-between items-center">
          <div className="text-xs font-medium truncate">{video.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{video.platform}</div>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span><i className="ri-eye-line mr-1"></i> {formatViews(video.views)} views</span>
          <span className="mx-2">•</span>
          <span>{formatUploadDate(video.uploadDate)}</span>
        </div>
      </div>
    </div>
  );
}
