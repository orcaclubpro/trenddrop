/**
 * Trend Analysis Service
 * 
 * Provides functionality for analyzing product trends across different platforms.
 */

import { log } from '../../vite.js';
import llmService from './llm-service.js';
import { 
  InsertTrend, 
  InsertRegion, 
  InsertVideo, 
  DiscoveredProduct, 
  ProductMetrics, 
  SocialMediaPost 
} from './interfaces.js';

export class TrendAnalysisService {
  private static instance: TrendAnalysisService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): TrendAnalysisService {
    if (!TrendAnalysisService.instance) {
      TrendAnalysisService.instance = new TrendAnalysisService();
    }
    return TrendAnalysisService.instance;
  }

  /**
   * Calculate a comprehensive trend score for a product
   */
  public calculateTrendScore(product: DiscoveredProduct): number {
    if (product.metrics) {
      // If we have detailed metrics, use them for a more accurate score
      return this.calculateDetailedTrendScore(product.metrics);
    } else if (product.trendScore) {
      // If a trend score is already provided, use it as a base
      return product.trendScore;
    } else {
      // Calculate a basic score based on available data
      return this.calculateBasicTrendScore(product);
    }
  }

  /**
   * Generate trend data for a product over time
   */
  public async generateTrendData(productId: number, productName: string): Promise<InsertTrend[]> {
    log(`Generating trend data for product: ${productName}`, 'trend-analysis');
    
    const trends: InsertTrend[] = [];
    const today = new Date();
    
    // Generate 30 days of trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate trend data with an upward trend for newer dates
      // This creates a realistic trending pattern
      const dayFactor = (30 - i) / 30; // 0 to 1 scale with recent days closer to 1
      const randomVariance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 random variance
      const trendAcceleration = 1 + (dayFactor * dayFactor); // Exponential growth for trending products
      
      // Generate realistic values that show growth over time
      const engagementBase = 10 + (i * 3);
      const salesBase = 5 + (i * 1.5);
      const searchBase = 8 + (i * 2);
      
      // Apply the factors to create realistic trend data
      const engagementValue = Math.floor(engagementBase * trendAcceleration * randomVariance);
      const salesValue = Math.floor(salesBase * trendAcceleration * randomVariance);
      const searchValue = Math.floor(searchBase * trendAcceleration * randomVariance);
      
      trends.push({
        productId,
        date,
        engagementValue,
        salesValue,
        searchValue
      });
    }
    
    log(`Generated ${trends.length} trend data points for product: ${productName}`, 'trend-analysis');
    return trends;
  }

  /**
   * Generate geographic distribution data for a product
   */
  public async generateGeographicData(
    productId: number, 
    productName: string
  ): Promise<InsertRegion[]> {
    log(`Generating geographic data for product: ${productName}`, 'trend-analysis');
    
    // Use AI to generate realistic regional distribution
    const systemPrompt = `You are a market research expert specializing in global product trends.
Your task is to create a realistic geographic distribution for a trending product.`;

    const userPrompt = `Create a realistic geographic distribution for the trending product: "${productName}"

Provide 5-8 countries or regions where this product is likely to be popular, 
with a percentage that represents each region's share of global interest.
The percentages should add up to 100%.

For example:
- United States: 35%
- United Kingdom: 15%
- Canada: 10%
- etc.

Base your analysis on what would be realistic for this type of product.`;

    const jsonSchema = `{
  "regions": [
    {
      "country": "string",
      "percentage": "number"
    }
  ]
}`;

    try {
      const response = await llmService.executeTask<{ regions: { country: string; percentage: number }[] }>(
        systemPrompt,
        userPrompt,
        jsonSchema
      );

      // Convert to InsertRegion format
      const regions: InsertRegion[] = response.regions.map(region => ({
        productId,
        country: region.country,
        percentage: region.percentage
      }));

      // Ensure percentages add up to 100%
      const totalPercentage = regions.reduce((sum, region) => sum + region.percentage, 0);
      if (totalPercentage !== 100) {
        regions.forEach(region => {
          region.percentage = Math.round((region.percentage / totalPercentage) * 100);
        });
        
        // Handle rounding errors to make sure total is exactly 100%
        const adjustedTotal = regions.reduce((sum, region) => sum + region.percentage, 0);
        if (adjustedTotal !== 100) {
          regions[0].percentage += (100 - adjustedTotal);
        }
      }

      log(`Generated ${regions.length} regional data points for product: ${productName}`, 'trend-analysis');
      return regions;
    } catch (error) {
      log(`Error generating geographic data: ${error}`, 'trend-analysis');
      
      // Fallback to default regions
      return this.generateDefaultRegions(productId);
    }
  }

  /**
   * Generate marketing videos for a product
   */
  public async generateVideoData(
    productId: number, 
    productName: string
  ): Promise<InsertVideo[]> {
    log(`Generating video data for product: ${productName}`, 'trend-analysis');
    
    // Use AI to generate realistic video data
    const systemPrompt = `You are a social media trend analysis expert.
Your task is to create realistic marketing videos that might exist for a trending product.`;

    const userPrompt = `Create 3-5 realistic social media marketing videos for the trending product: "${productName}"

For each video, provide:
1. A catchy, realistic title that would attract viewers
2. The platform (TikTok, Instagram, YouTube, etc.)
3. A realistic view count (appropriate for the platform)
4. An upload date within the last 2 months
5. A realistic thumbnail URL
6. A realistic video URL for the specified platform

Make these videos appear authentic, with realistic engagement metrics and titles 
that would actually be used by content creators or marketers.`;

    const jsonSchema = `{
  "videos": [
    {
      "title": "string",
      "platform": "string",
      "views": "number",
      "uploadDate": "string",
      "thumbnailUrl": "string",
      "videoUrl": "string"
    }
  ]
}`;

    try {
      const response = await llmService.executeTask<{ 
        videos: {
          title: string;
          platform: string;
          views: number;
          uploadDate: string;
          thumbnailUrl: string;
          videoUrl: string;
        }[] 
      }>(
        systemPrompt,
        userPrompt,
        jsonSchema
      );

      // Convert to InsertVideo format
      const videos: InsertVideo[] = [];
      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      for (const videoData of response.videos) {
        try {
          // Parse upload date, ensuring it's within the last 2 months
          let uploadDate: Date;
          try {
            uploadDate = new Date(videoData.uploadDate);
            // Validate the date is in acceptable range
            if (uploadDate < twoMonthsAgo || uploadDate > now) {
              uploadDate = new Date(now);
              uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 60));
            }
          } catch (e) {
            // Use a random recent date if parsing fails
            uploadDate = new Date(now);
            uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 60));
          }
          
          // Validate platform is one of the expected values
          const platform = ['TikTok', 'Instagram', 'YouTube'].includes(videoData.platform)
            ? videoData.platform
            : ['TikTok', 'Instagram', 'YouTube'][Math.floor(Math.random() * 3)];
          
          // Validate URLs
          let videoUrl = videoData.videoUrl;
          let thumbnailUrl = videoData.thumbnailUrl;
          
          // If URLs don't look valid, generate fallbacks
          if (!videoUrl.startsWith('http') || !this.isValidUrl(videoUrl)) {
            videoUrl = this.generateVideoUrl(platform, productName);
          }
          
          if (!thumbnailUrl.startsWith('http') || !this.isValidUrl(thumbnailUrl)) {
            const videoId = Math.floor(Math.random() * 1000);
            thumbnailUrl = `https://picsum.photos/seed/${platform.toLowerCase()}-${videoId}/400/${platform === 'YouTube' ? '225' : '400'}`;
          }
          
          videos.push({
            productId,
            title: videoData.title,
            platform,
            views: videoData.views,
            uploadDate,
            thumbnailUrl,
            videoUrl
          });
        } catch (error) {
          log(`Error processing video: ${error}`, 'trend-analysis');
        }
      }

      // If we have no valid videos, add a default one
      if (videos.length === 0) {
        videos.push(this.generateDefaultVideo(productId, productName));
      }

      log(`Generated ${videos.length} marketing videos for product: ${productName}`, 'trend-analysis');
      return videos;
    } catch (error) {
      log(`Error generating video data: ${error}`, 'trend-analysis');
      
      // Fallback to default videos
      return this.generateDefaultVideos(productId, productName);
    }
  }

  /**
   * Analyze social media posts to extract product metrics
   */
  public async analyzeSocialMediaTrends(
    productName: string, 
    posts: SocialMediaPost[]
  ): Promise<ProductMetrics> {
    log(`Analyzing social media trends for product: ${productName} (${posts.length} posts)`, 'trend-analysis');
    
    // Default metrics structure
    const metrics: ProductMetrics = {
      engagementScores: {},
      salesData: {},
      searchData: {},
      sentimentScore: 0
    };
    
    // If no posts, return default metrics
    if (!posts || posts.length === 0) {
      return metrics;
    }
    
    // Analyze posts by platform
    const platformPosts: Record<string, SocialMediaPost[]> = {};
    
    // Group posts by platform
    for (const post of posts) {
      const platform = post.platform.toLowerCase();
      platformPosts[platform] = platformPosts[platform] || [];
      platformPosts[platform].push(post);
    }
    
    // Calculate engagement scores for each platform
    for (const platform of Object.keys(platformPosts)) {
      const platformEngagement = this.calculatePlatformEngagement(platformPosts[platform]);
      
      // Set platform-specific engagement score
      switch (platform) {
        case 'tiktok':
          metrics.engagementScores.tiktok = platformEngagement;
          break;
        case 'instagram':
          metrics.engagementScores.instagram = platformEngagement;
          break;
        case 'facebook':
          metrics.engagementScores.facebook = platformEngagement;
          break;
        case 'pinterest':
          metrics.engagementScores.pinterest = platformEngagement;
          break;
        case 'youtube':
          metrics.engagementScores.youtube = platformEngagement;
          break;
      }
    }
    
    // Calculate overall sentiment score
    metrics.sentimentScore = await this.analyzeSentiment(posts);
    
    // Estimate sales metrics
    metrics.salesData = {
      estimatedVolume: this.estimateSalesVolume(posts, metrics.sentimentScore || 0),
      growthRate: this.estimateGrowthRate(posts)
    };
    
    // Estimate search metrics
    metrics.searchData = {
      volumeScore: this.estimateSearchVolume(posts),
      growthTrend: this.estimateSearchGrowth(posts)
    };
    
    return metrics;
  }

  /**
   * Calculate a detailed trend score based on comprehensive metrics
   */
  private calculateDetailedTrendScore(metrics: ProductMetrics): number {
    // Weights for different components of the trend score
    const weights = {
      engagement: 0.3,  // 30% contribution from engagement
      sales: 0.3,       // 30% contribution from sales data
      search: 0.25,     // 25% contribution from search metrics
      sentiment: 0.15   // 15% contribution from sentiment
    };
    
    // Calculate engagement score (average across platforms)
    const engagementScores = Object.values(metrics.engagementScores).filter(score => typeof score === 'number');
    const avgEngagement = engagementScores.length > 0
      ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
      : 50; // Default if no data
    
    // Calculate sales score
    const salesScore = this.calculateSalesScore(metrics.salesData);
    
    // Calculate search score
    const searchScore = this.calculateSearchScore(metrics.searchData);
    
    // Normalize sentiment score to 0-100 scale
    const sentimentScore = metrics.sentimentScore 
      ? ((metrics.sentimentScore + 100) / 2) // Convert -100 to 100 range to 0-100
      : 50; // Default if no data
    
    // Calculate weighted trend score
    const trendScore = (
      (avgEngagement * weights.engagement) +
      (salesScore * weights.sales) +
      (searchScore * weights.search) +
      (sentimentScore * weights.sentiment)
    );
    
    // Ensure the score is in range 1-100
    return Math.max(1, Math.min(100, Math.round(trendScore)));
  }

  /**
   * Calculate a basic trend score when limited data is available
   */
  private calculateBasicTrendScore(product: DiscoveredProduct): number {
    // If we have the component scores, use them
    if (product.engagementRate && product.salesVelocity && product.searchVolume) {
      // Weight the components (adjust weights as needed)
      const engagementWeight = 0.4;
      const salesWeight = 0.4;
      const searchWeight = 0.2;
      
      // Calculate weighted score
      const weightedScore = (
        (product.engagementRate * engagementWeight) +
        (product.salesVelocity * 2 * salesWeight) + // Normalize to 0-100 scale
        (product.searchVolume * 2 * searchWeight)   // Normalize to 0-100 scale
      );
      
      // Ensure score is in range 1-100
      return Math.max(1, Math.min(100, Math.round(weightedScore)));
    }
    
    // Default score if we don't have component data
    return 70;
  }

  /**
   * Calculate platform-specific engagement score
   */
  private calculatePlatformEngagement(posts: SocialMediaPost[]): number {
    if (!posts || posts.length === 0) {
      return 50; // Default engagement score
    }
    
    // Calculate average engagement metrics
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let postsWithMetrics = 0;
    
    for (const post of posts) {
      if (post.engagement) {
        totalLikes += post.engagement.likes || 0;
        totalComments += post.engagement.comments || 0;
        totalShares += post.engagement.shares || 0;
        postsWithMetrics++;
      }
    }
    
    if (postsWithMetrics === 0) {
      return 50; // Default if no engagement metrics
    }
    
    // Calculate average metrics
    const avgLikes = totalLikes / postsWithMetrics;
    const avgComments = totalComments / postsWithMetrics;
    const avgShares = totalShares / postsWithMetrics;
    
    // Calculate engagement score (adjust the formula as needed)
    // This is a simplified formula; a real implementation would use platform-specific benchmarks
    const engagementScore = (
      (avgLikes * 1) +     // Weight for likes
      (avgComments * 2) +  // Comments are worth more than likes
      (avgShares * 3)      // Shares are worth more than comments
    ) / 6;  // Normalize to get a score between 0-100
    
    // Scale to 0-100 range (adjust as needed based on typical engagement rates)
    return Math.min(100, Math.max(1, Math.round(engagementScore)));
  }

  /**
   * Analyze sentiment across social media posts
   */
  private async analyzeSentiment(posts: SocialMediaPost[]): Promise<number> {
    if (!posts || posts.length === 0) {
      return 0; // Neutral sentiment if no posts
    }
    
    // Extract text content from posts
    const postTexts = posts
      .filter(post => post.text)
      .map(post => post.text)
      .join('\n\n');
    
    if (!postTexts) {
      return 0; // Neutral sentiment if no text content
    }
    
    // Use AI to analyze sentiment
    try {
      const systemPrompt = `You are a sentiment analysis expert.
Your task is to analyze the sentiment of social media posts about a product.
Provide a score from -100 (extremely negative) to 100 (extremely positive).`;

      const userPrompt = `Analyze the sentiment in these social media posts:

${postTexts}

Return only a single number between -100 and 100 representing the overall sentiment.
-100 = Extremely negative
0 = Neutral
100 = Extremely positive`;

      const response = await llmService.sendPrompt(
        systemPrompt,
        userPrompt,
        { temperature: 0.3 }
      );
      
      // Extract numeric sentiment score from response
      const match = response.match(/-?\d+/);
      if (match) {
        const score = parseInt(match[0]);
        // Ensure score is in valid range
        return Math.max(-100, Math.min(100, score));
      }
      
      return 0; // Default to neutral if parsing fails
    } catch (error) {
      log(`Error analyzing sentiment: ${error}`, 'trend-analysis');
      return 0; // Default to neutral on error
    }
  }

  /**
   * Estimate sales volume based on social media data
   */
  private estimateSalesVolume(posts: SocialMediaPost[], sentiment: number): number {
    if (!posts || posts.length === 0) {
      return 100; // Default estimation
    }
    
    // Calculate a base volume based on post count and positivity
    const positivityFactor = (sentiment + 100) / 200; // 0 to 1 scale
    const postCountFactor = Math.min(1, posts.length / 20); // 0 to 1 scale, max at 20 posts
    
    // Calculate estimated volume
    return Math.floor(100 + (900 * postCountFactor * positivityFactor));
  }

  /**
   * Estimate sales growth rate based on social media post dates
   */
  private estimateGrowthRate(posts: SocialMediaPost[]): number {
    if (!posts || posts.length < 2) {
      return 10; // Default growth rate
    }
    
    // Sort posts by date
    const datedPosts = posts.filter(p => p.date).sort((a, b) => {
      return (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
    });
    
    if (datedPosts.length < 2) {
      return 10; // Default if not enough dated posts
    }
    
    // Divide posts into two time periods
    const midpoint = Math.floor(datedPosts.length / 2);
    const earlierPosts = datedPosts.slice(0, midpoint);
    const laterPosts = datedPosts.slice(midpoint);
    
    // Compare engagement between time periods
    const earlierEngagement = this.calculatePeriodEngagement(earlierPosts);
    const laterEngagement = this.calculatePeriodEngagement(laterPosts);
    
    // Calculate growth rate
    if (earlierEngagement === 0) {
      return 100; // Avoid division by zero, assume high growth
    }
    
    const growthRate = ((laterEngagement - earlierEngagement) / earlierEngagement) * 100;
    
    // Ensure growth rate is reasonable
    return Math.max(0, Math.min(200, Math.round(growthRate)));
  }

  /**
   * Calculate total engagement for a set of posts
   */
  private calculatePeriodEngagement(posts: SocialMediaPost[]): number {
    let totalEngagement = 0;
    
    for (const post of posts) {
      if (post.engagement) {
        totalEngagement += (
          (post.engagement.likes || 0) +
          (post.engagement.comments || 0) * 2 +
          (post.engagement.shares || 0) * 3
        );
      }
    }
    
    return totalEngagement;
  }

  /**
   * Calculate sales score from sales data
   */
  private calculateSalesScore(salesData: ProductMetrics['salesData']): number {
    // Default score if no data
    if (!salesData) {
      return 50;
    }
    
    // Calculate score based on available metrics
    let score = 50; // Start with neutral score
    
    // Adjust based on estimated volume
    if (salesData.estimatedVolume !== undefined) {
      // Scale volume to 0-100 score (adjust thresholds as needed)
      const volumeScore = Math.min(100, Math.max(0, salesData.estimatedVolume / 20));
      score = (score + volumeScore) / 2;
    }
    
    // Adjust based on growth rate
    if (salesData.growthRate !== undefined) {
      // Scale growth rate to 0-100 score
      const growthScore = Math.min(100, Math.max(0, salesData.growthRate));
      score = (score + growthScore) / 2;
    }
    
    // Adjust based on restock frequency (lower is better)
    if (salesData.restockFrequency !== undefined) {
      // Scale restock frequency to 0-100 score (adjust thresholds as needed)
      // 3 days (very frequent) = 100, 30 days (infrequent) = 0
      const restockScore = Math.max(0, 100 - (salesData.restockFrequency * 100 / 30));
      score = (score + restockScore) / 2;
    }
    
    return Math.round(score);
  }

  /**
   * Calculate search score from search data
   */
  private calculateSearchScore(searchData: ProductMetrics['searchData']): number {
    // Default score if no data
    if (!searchData) {
      return 50;
    }
    
    // Calculate score based on available metrics
    let score = 50; // Start with neutral score
    
    // Adjust based on volume score
    if (searchData.volumeScore !== undefined) {
      score = (score + searchData.volumeScore) / 2;
    }
    
    // Adjust based on growth trend
    if (searchData.growthTrend !== undefined) {
      // Scale growth trend to 0-100 score
      const growthScore = Math.min(100, Math.max(0, searchData.growthTrend));
      score = (score + growthScore) / 2;
    }
    
    return Math.round(score);
  }

  /**
   * Estimate search volume score based on social media posts
   */
  private estimateSearchVolume(posts: SocialMediaPost[]): number {
    if (!posts || posts.length === 0) {
      return 50; // Default search volume score
    }
    
    // Simple estimation based on post count
    // A more sophisticated approach would use actual search volume data
    const postCountFactor = Math.min(1, posts.length / 30); // 0 to 1 scale, max at 30 posts
    
    return Math.round(50 + (postCountFactor * 50));
  }

  /**
   * Estimate search growth based on post dates
   */
  private estimateSearchGrowth(posts: SocialMediaPost[]): number {
    // Similar logic to growth rate estimate but with different weights
    if (!posts || posts.length < 2) {
      return 15; // Default growth
    }
    
    // Sort posts by date
    const datedPosts = posts.filter(p => p.date).sort((a, b) => {
      return (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
    });
    
    if (datedPosts.length < 2) {
      return 15; // Default if not enough dated posts
    }
    
    // Calculate days between first and last post
    const firstDate = datedPosts[0].date?.getTime() || 0;
    const lastDate = datedPosts[datedPosts.length - 1].date?.getTime() || 0;
    const daysBetween = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (daysBetween < 1) {
      return 50; // If all posts are from same day, assume moderate growth
    }
    
    // Calculate posts per day in first half vs second half
    const midpoint = Math.floor(datedPosts.length / 2);
    const halfwayDate = datedPosts[midpoint].date?.getTime() || 0;
    
    const firstHalfDays = (halfwayDate - firstDate) / (1000 * 60 * 60 * 24);
    const secondHalfDays = (lastDate - halfwayDate) / (1000 * 60 * 60 * 24);
    
    const firstHalfPostsPerDay = firstHalfDays > 0 ? midpoint / firstHalfDays : midpoint;
    const secondHalfPostsPerDay = secondHalfDays > 0 ? (datedPosts.length - midpoint) / secondHalfDays : (datedPosts.length - midpoint);
    
    // Calculate growth percentage
    let growthPercentage = 0;
    if (firstHalfPostsPerDay > 0) {
      growthPercentage = ((secondHalfPostsPerDay - firstHalfPostsPerDay) / firstHalfPostsPerDay) * 100;
    } else {
      growthPercentage = secondHalfPostsPerDay * 100;
    }
    
    // Cap at reasonable values
    return Math.max(0, Math.min(100, Math.round(growthPercentage)));
  }

  /**
   * Generate a set of default regions
   */
  private generateDefaultRegions(productId: number): InsertRegion[] {
    return [
      { productId, country: 'United States', percentage: 35 },
      { productId, country: 'United Kingdom', percentage: 20 },
      { productId, country: 'Canada', percentage: 15 },
      { productId, country: 'Australia', percentage: 10 },
      { productId, country: 'Germany', percentage: 10 },
      { productId, country: 'France', percentage: 5 },
      { productId, country: 'Other', percentage: 5 }
    ];
  }

  /**
   * Generate a default video
   */
  private generateDefaultVideo(productId: number, productName: string): InsertVideo {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const uploadDate = new Date(now);
    uploadDate.setDate(uploadDate.getDate() - daysAgo);
    
    const platform = ['TikTok', 'Instagram', 'YouTube'][Math.floor(Math.random() * 3)];
    const views = 10000 + Math.floor(Math.random() * 90000);
    
    const titles = [
      `I can't believe this ${productName} changed my life!`,
      `Honest review: ${productName} after 30 days`,
      `${productName} - Is it worth the hype?`,
      `Unboxing the viral ${productName}`,
      `${productName} hack that nobody talks about`
    ];
    
    const title = titles[Math.floor(Math.random() * titles.length)];
    const videoUrl = this.generateVideoUrl(platform, productName);
    const thumbnailUrl = `https://picsum.photos/seed/${encodeURIComponent(productName)}/400/${platform === 'YouTube' ? '225' : '400'}`;
    
    return {
      productId,
      title,
      platform,
      views,
      uploadDate,
      thumbnailUrl,
      videoUrl
    };
  }

  /**
   * Generate multiple default videos
   */
  private generateDefaultVideos(productId: number, productName: string): InsertVideo[] {
    const videoCount = 2 + Math.floor(Math.random() * 3); // 2-4 videos
    const videos: InsertVideo[] = [];
    
    for (let i = 0; i < videoCount; i++) {
      videos.push(this.generateDefaultVideo(productId, productName));
    }
    
    return videos;
  }

  /**
   * Generate a realistic video URL
   */
  private generateVideoUrl(platform: string, productName: string): string {
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const randomId = this.generateRandomId(11);
    
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return `https://www.tiktok.com/@trendsetter${Math.floor(Math.random() * 1000)}/video/${Math.floor(Math.random() * 1000000000)}`;
      case 'instagram':
        return `https://www.instagram.com/p/${randomId}/`;
      case 'youtube':
        return `https://www.youtube.com/watch?v=${randomId}`;
      default:
        return `https://www.tiktok.com/@trendsetter${Math.floor(Math.random() * 1000)}/video/${Math.floor(Math.random() * 1000000000)}`;
    }
  }

  /**
   * Generate a random ID for videos
   */
  private generateRandomId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate if a URL is properly formatted
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Export singleton instance
export default TrendAnalysisService.getInstance();