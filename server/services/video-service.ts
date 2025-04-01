import { IStorage } from "../storage.js";
import { InsertVideo, Video } from "@shared/schema.js";
import { log } from "../vite.js";

export class VideoService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    log("VideoService initialized", "service");
  }

  async getVideosForProduct(productId: number): Promise<Video[]> {
    return this.storage.getVideosForProduct(productId);
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    return this.storage.createVideo(video);
  }

  // Format upload date into a human-readable string
  formatUploadDate(date: Date): string {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  }

  // Format view count with proper abbreviations (e.g., 1.2M, 455K)
  formatViewCount(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  }
}
