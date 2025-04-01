/**
 * Video Service
 * 
 * This service handles video-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';
import type { Video, InsertVideo } from '@shared/schema';

export class VideoService {
  /**
   * Get videos for a product
   */
  static async getVideosForProduct(productId: number) {
    return apiRequest<Video[]>(API.VIDEOS_FOR_PRODUCT(productId));
  }

  /**
   * Create a new video
   */
  static async createVideo(video: InsertVideo) {
    return apiRequest<Video>(API.VIDEOS, {
      method: 'POST',
      body: JSON.stringify(video),
      queryKey: [API.VIDEOS, video.productId]
    });
  }

  /**
   * Get top videos
   */
  static async getTopVideos(limit: number = 5) {
    return apiRequest<Video[]>(`${API.VIDEOS}/top?limit=${limit}`);
  }

  /**
   * Get platform distribution
   */
  static async getPlatformDistribution() {
    return apiRequest<{ platform: string; count: number }[]>(`${API.VIDEOS}/platforms`);
  }

  /**
   * Get engagement metrics for a video
   */
  static async getVideoEngagement(videoId: number) {
    return apiRequest<{
      likes: number;
      shares: number;
      comments: number;
      views: number;
    }>(`${API.VIDEOS}/${videoId}/engagement`);
  }

  /**
   * Update a video's engagement metrics 
   */
  static async updateVideoEngagement(videoId: number, engagement: { 
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  }) {
    return apiRequest<Video>(`${API.VIDEOS}/${videoId}/engagement`, {
      method: 'PATCH',
      body: JSON.stringify(engagement),
      queryKey: [API.VIDEOS, videoId]
    });
  }
}