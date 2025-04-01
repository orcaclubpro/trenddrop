/**
 * VideoController - Handles video-related API routes
 * 
 * This controller handles all video-related HTTP requests.
 */

import { Request, Response } from 'express';
import { videoService } from '../services/index.js';
import * as schema from '../../shared/schema.js';
import { log } from '../vite.js';

export class VideoController {
  /**
   * Get videos for a product
   */
  async getVideosForProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Get videos from service
      const videos = await videoService.getVideosForProduct(productId);
      
      // Process for display if requested
      if (req.query.format === 'display') {
        const displayData = videoService.processVideoDataForDisplay(videos);
        res.json(displayData);
        return;
      }
      
      // Return videos
      res.json({ videos });
    } catch (error) {
      log(`Error in getVideosForProduct: ${error}`, 'video-controller');
      res.status(500).json({ error: 'Failed to retrieve videos' });
    }
  }

  /**
   * Create a new video
   */
  async createVideo(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate request body
      const videoResult = schema.insertVideoSchema.safeParse(req.body);
      
      if (!videoResult.success) {
        res.status(400).json({
          error: 'Invalid video data',
          details: videoResult.error.errors
        });
        return;
      }
      
      // Create video using service
      const newVideo = await videoService.createVideo(videoResult.data);
      
      // Return created video
      res.status(201).json(newVideo);
    } catch (error) {
      log(`Error in createVideo: ${error}`, 'video-controller');
      res.status(500).json({ error: 'Failed to create video' });
    }
  }

  /**
   * Get top videos
   */
  async getTopVideos(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      
      if (isNaN(limit) || limit < 1 || limit > 20) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }
      
      // Get top videos from service
      const topVideos = await videoService.getTopVideos(limit);
      
      // Return top videos with formatted values
      const formattedVideos = topVideos.map(video => ({
        ...video,
        formattedViews: videoService.formatViewCount(video.viewCount),
        formattedDate: videoService.formatUploadDate(new Date(video.uploadDate))
      }));
      
      res.json({ topVideos: formattedVideos });
    } catch (error) {
      log(`Error in getTopVideos: ${error}`, 'video-controller');
      res.status(500).json({ error: 'Failed to retrieve top videos' });
    }
  }

  /**
   * Get platform distribution
   */
  async getPlatformDistribution(req: Request, res: Response): Promise<void> {
    try {
      // Get platform distribution from service
      const platformDistribution = await videoService.getPlatformDistribution();
      
      // Return platform distribution
      res.json({ platformDistribution });
    } catch (error) {
      log(`Error in getPlatformDistribution: ${error}`, 'video-controller');
      res.status(500).json({ error: 'Failed to retrieve platform distribution' });
    }
  }
}

// Export controller instance
export const videoController = new VideoController();

// Export default for convenience
export default videoController;