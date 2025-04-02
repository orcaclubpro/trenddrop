/**
 * VideoRepository - Repository for video data
 * 
 * This repository handles all video-related data operations.
 */

import { eq, desc, asc, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
import { BaseRepository } from './Repository.js';
import databaseService from '../services/database-service.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class VideoRepository extends BaseRepository<schema.Video, number> {
  /**
   * Find a video by ID
   */
  async findById(id: number): Promise<schema.Video | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(schema.videos).where(eq(schema.videos.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding video by ID: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Find all videos with optional filtering
   */
  async findAll(filter: any = {}): Promise<{ data: schema.Video[], total: number }> {
    try {
      const db = databaseService.getDb();
      const { productId, platform, page = 1, pageSize = 10 } = filter;

      // Calculate pagination
      const offset = (page - 1) * pageSize;

      // Build the query
      let query = db.select().from(schema.videos);
      let conditions = [];
      
      // Add product filter if specified
      if (productId) {
        conditions.push(eq(schema.videos.productId, productId));
      }
      
      // Add platform filter if specified
      if (platform) {
        conditions.push(eq(schema.videos.platform, platform));
      }
      
      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`);
      }
      
      // Add sorting and pagination
      const videos = await query
        .orderBy(desc(schema.videos.views))
        .limit(pageSize)
        .offset(offset);

      // Count total
      let countQuery = db.select({ count: sql`count(*)` }).from(schema.videos);
      
      if (conditions.length > 0) {
        countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`);
      }
      
      const totalResult = await countQuery;
      const total = Number(totalResult[0].count);

      return { data: videos, total };
    } catch (error) {
      log(`Error finding videos: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Create a new video
   */
  async create(videoData: schema.InsertVideo): Promise<schema.Video> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(schema.videos).values(videoData).returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create video');
      }
      
      const newVideo = result[0];
      
      // Publish video created event
      eventBus.publish('video:created', {
        videoId: newVideo.id,
        productId: newVideo.productId,
        video: newVideo,
        timestamp: new Date().toISOString()
      });
      
      return newVideo;
    } catch (error) {
      log(`Error creating video: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Update an existing video
   */
  async update(id: number, videoData: Partial<schema.InsertVideo>): Promise<schema.Video | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .update(schema.videos)
        .set(videoData)
        .where(eq(schema.videos.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedVideo = result[0];
      
      // Publish video updated event
      eventBus.publish('video:updated', {
        videoId: updatedVideo.id,
        productId: updatedVideo.productId,
        video: updatedVideo,
        timestamp: new Date().toISOString()
      });
      
      return updatedVideo;
    } catch (error) {
      log(`Error updating video: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Delete a video
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      
      // Get the video first to retrieve the productId
      const video = await this.findById(id);
      
      if (!video) {
        return false;
      }
      
      const result = await db
        .delete(schema.videos)
        .where(eq(schema.videos.id, id))
        .returning({ id: schema.videos.id });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish video deleted event
        eventBus.publish('video:deleted', {
          videoId: id,
          productId: video.productId,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting video: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Find videos for a specific product
   */
  async findByProductId(productId: number): Promise<schema.Video[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.productId, productId))
        .orderBy(desc(schema.videos.views));
    } catch (error) {
      log(`Error finding videos for product: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Get top videos by view count
   */
  async getTopVideos(limit: number = 5): Promise<schema.Video[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.videos)
        .orderBy(desc(schema.videos.views))
        .limit(limit);
    } catch (error) {
      log(`Error getting top videos: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Get video platforms with counts
   */
  async getPlatformCounts(): Promise<{ platform: string; count: number }[]> {
    try {
      const db = databaseService.getDb();
      
      // Group by platform and count occurrences
      const result = await db
        .select({
          platform: schema.videos.platform,
          count: sql`count(${schema.videos.id})`
        })
        .from(schema.videos)
        .groupBy(schema.videos.platform)
        .orderBy(desc(sql`count(${schema.videos.id})`));
      
      return result.map(row => ({
        platform: row.platform,
        count: Number(row.count)
      }));
    } catch (error) {
      log(`Error getting platform counts: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Format view count for display (e.g., 1.2M, 4.5K)
   */
  formatViewCount(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  }

  /**
   * Format upload date for display (e.g., "2 days ago", "3 weeks ago")
   */
  formatUploadDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} weeks ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} months ago`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} years ago`;
    }
  }

  /**
   * Get count of viral videos (views > 50k)
   */
  async getViralVideosCount(): Promise<number> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select({ count: sql`count(*)` })
        .from(schema.videos)
        .where(sql`views >= 50000`);
      
      return Number(result[0].count);
    } catch (error) {
      log(`Error getting viral videos count: ${error}`, 'video-repo');
      throw error;
    }
  }

  /**
   * Get count of new videos after a given date
   */
  async getNewVideosCount(afterDate: Date): Promise<number> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select({ count: sql`count(*)` })
        .from(schema.videos)
        .where(sql`upload_date >= ${afterDate.toISOString()}`);
      
      return Number(result[0].count);
    } catch (error) {
      log(`Error getting new videos count: ${error}`, 'video-repo');
      throw error;
    }
  }
}

// Export repository instance
export const videoRepository = new VideoRepository();

// Export default for convenience
export default videoRepository;