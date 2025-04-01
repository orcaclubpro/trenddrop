import { Video } from "@shared/schema";
import { ExternalLink, PlayCircle } from "lucide-react";

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
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (video.videoUrl) {
      window.open(video.videoUrl, '_blank');
    }
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (video.videoUrl) {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div className="rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-all">
      <div className="aspect-video bg-muted/30 relative">
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group">
          <button 
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-transform group-hover:scale-110"
          >
            <PlayCircle className="h-6 w-6 text-white" />
          </button>
        </div>
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <a 
            href={video.videoUrl} 
            target="_blank" 
            rel="noreferrer"
            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/50 text-white">
            {video.platform}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium line-clamp-1 mb-1">{video.title}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {formatViews(video.views)} views
          </div>
          <div>{formatUploadDate(video.uploadDate)}</div>
        </div>
      </div>
    </div>
  );
}
