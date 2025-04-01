/**
 * VideoService - Business logic for videos
 * 
 * This service handles video-related operations and business logic.
 */

import { videoRepository } from '../repositories/index.js';
import * as schema from '../../shared/schema.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class VideoService {
  /**
   * Get videos for a product
   */
  async getVideosForProduct(productId: number): Promise<schema.Video[]> {
    try {
      return await videoRepository.findByProductId(productId);
    } catch (error) {
      log(`Error getting videos for product: ${error}`, 'video-service');
      throw error;
    }
  }

  /**
   * Create a new video record
   */
  async createVideo(videoData: schema.InsertVideo): Promise<schema.Video> {
    try {
      const newVideo = await videoRepository.create(videoData);
      
      // Publish video created event
      eventBus.publish('video:metrics:update', {
        productId: videoData.productId,
        timestamp: new Date().toISOString()
      });
      
      return newVideo;
    } catch (error) {
      log(`Error creating video: ${error}`, 'video-service');
      throw error;
    }
  }

  /**
   * Process video data for display
   */
  processVideoDataForDisplay(videos: schema.Video[]): {
    formattedVideos: Array<schema.Video & { formattedViews: string; formattedDate: string }>;
    platformCounts: { platform: string; count: number }[];
  } {
    // Sort videos by view count (descending)
    const sortedVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);
    
    // Format view counts and dates
    const formattedVideos = sortedVideos.map(video => ({
      ...video,
      formattedViews: this.formatViewCount(video.viewCount),
      formattedDate: this.formatUploadDate(new Date(video.uploadDate))
    }));
    
    // Calculate platform distribution
    const platforms = new Map<string, number>();
    
    videos.forEach(video => {
      const count = platforms.get(video.platform) || 0;
      platforms.set(video.platform, count + 1);
    });
    
    const platformCounts = Array.from(platforms.entries()).map(([platform, count]) => ({
      platform,
      count
    })).sort((a, b) => b.count - a.count);
    
    return {
      formattedVideos,
      platformCounts
    };
  }

  /**
   * Format view count for display (e.g., 1.2M, 4.5K)
   */
  formatViewCount(views: number): string {
    return videoRepository.formatViewCount(views);
  }

  /**
   * Format upload date for display (e.g., "2 days ago", "3 weeks ago")
   */
  formatUploadDate(date: Date): string {
    return videoRepository.formatUploadDate(date);
  }

  /**
   * Get top videos
   */
  async getTopVideos(limit: number = 5): Promise<schema.Video[]> {
    try {
      return await videoRepository.getTopVideos(limit);
    } catch (error) {
      log(`Error getting top videos: ${error}`, 'video-service');
      throw error;
    }
  }

  /**
   * Get platform distribution
   */
  async getPlatformDistribution(): Promise<{ platform: string; count: number }[]> {
    try {
      return await videoRepository.getPlatformCounts();
    } catch (error) {
      log(`Error getting platform distribution: ${error}`, 'video-service');
      throw error;
    }
  }

  /**
   * Generate initial video data for a new product
   */
  generateInitialVideoData(productId: number, productName: string, category: string): schema.InsertVideo[] {
    // Popular platforms
    const platforms = ['YouTube', 'TikTok', 'Instagram'];
    
    // Generate between 2-4 videos
    const numVideos = Math.floor(Math.random() * 3) + 2;
    const videos: schema.InsertVideo[] = [];
    
    for (let i = 0; i < numVideos; i++) {
      // Select platform
      const platform = platforms[i % platforms.length];
      
      // Generate video properties
      const title = this.generateVideoTitle(productName, category, platform);
      const videoId = this.generateRandomId(platform === 'YouTube' ? 11 : 10);
      const viewCount = Math.floor(Math.random() * 500000) + 5000;
      
      // Calculate upload date (between 7-30 days ago)
      const daysAgo = Math.floor(Math.random() * 23) + 7;
      const uploadDate = new Date();
      uploadDate.setDate(uploadDate.getDate() - daysAgo);
      
      videos.push({
        productId,
        title,
        platform,
        videoUrl: this.generateVideoUrl(platform, videoId),
        thumbnailUrl: this.generateThumbnailUrl(platform, videoId),
        viewCount,
        uploadDate: uploadDate.toISOString(),
        channelName: this.generateChannelName(platform),
        videoDuration: this.generateVideoDuration()
      });
    }
    
    return videos;
  }

  /**
   * Generate a video title based on product info
   */
  private generateVideoTitle(productName: string, category: string, platform: string): string {
    const titles = [
      `${productName} - The Next Big Thing in ${category}`,
      `Why Everyone is Buying this ${category} Product (${productName})`,
      `${productName} Review - Best ${category} Product of 2025?`,
      `I Found the Perfect ${category} Product - ${productName}`,
      `${productName}: Unboxing and First Impressions`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * Generate a channel name
   */
  private generateChannelName(platform: string): string {
    const channelNames = [
      'TrendHunter',
      'DropshipDigital',
      'ProductReviewer',
      'TechTrends',
      'GadgetGuru',
      'RetailTrends',
      'EcomExperts',
      'TrendingNow'
    ];
    
    return channelNames[Math.floor(Math.random() * channelNames.length)];
  }

  /**
   * Generate a video URL
   */
  private generateVideoUrl(platform: string, videoId: string): string {
    switch (platform) {
      case 'YouTube':
        return `https://www.youtube.com/watch?v=${videoId}`;
      case 'TikTok':
        return `https://www.tiktok.com/@creator/video/${videoId}`;
      case 'Instagram':
        return `https://www.instagram.com/p/${videoId}`;
      default:
        return `https://www.${platform.toLowerCase()}.com/watch/${videoId}`;
    }
  }

  /**
   * Generate a thumbnail URL
   */
  private generateThumbnailUrl(platform: string, videoId: string): string {
    switch (platform) {
      case 'YouTube':
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      case 'TikTok':
        return `https://via.placeholder.com/480x852/333333/FFFFFF?text=TikTok+Thumbnail`;
      case 'Instagram':
        return `https://via.placeholder.com/640x640/333333/FFFFFF?text=Instagram+Video`;
      default:
        return `https://via.placeholder.com/640x360/333333/FFFFFF?text=${platform}+Thumbnail`;
    }
  }

  /**
   * Generate a random video duration (3-10 minutes)
   */
  private generateVideoDuration(): string {
    const minutes = Math.floor(Math.random() * 8) + 3;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Generate a random ID
   */
  private generateRandomId(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
}

// Export service instance
export const videoService = new VideoService();

// Export default for convenience
export default videoService;