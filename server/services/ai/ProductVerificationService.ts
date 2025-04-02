/**
 * ProductVerificationService - Data quality validation for discovered products
 * 
 * This service provides comprehensive data quality verification for products
 * discovered by the AI agent, helping ensure high-quality data before storage.
 */

import { log } from '../../vite.js';
import { DiscoveredProduct } from './interfaces.js';
import llmService from './llm-service.js';
import webSearchService from './web-search-service.js';
import { eventBus } from '../../core/EventBus.js';

// Thresholds for data quality assessment
const QUALITY_THRESHOLDS = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MIN_PRICE_LOW: 0.1,
  MAX_PRICE_DELTA_FACTOR: 5, // Max price high can be 5x price low
  MIN_TREND_SCORE: 0,
  MAX_TREND_SCORE: 100,
  MIN_COUNTRIES_FOR_GLOBAL: 3,
};

// Helper type for quality check results
interface QualityCheckResult {
  isValid: boolean;
  issues: string[];
  repaired?: boolean;
  originalValues?: Record<string, any>;
}

export class ProductVerificationService {
  private static instance: ProductVerificationService;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ProductVerificationService {
    if (!ProductVerificationService.instance) {
      ProductVerificationService.instance = new ProductVerificationService();
    }
    return ProductVerificationService.instance;
  }

  /**
   * Verify and validate a discovered product
   * @returns An object with verification results and optionally repaired product data
   */
  public async verifyProduct(product: DiscoveredProduct): Promise<{
    product: DiscoveredProduct;
    qualityScore: number;
    isValid: boolean;
    issues: string[];
    repaired: boolean;
  }> {
    const startTime = Date.now();
    log(`Verifying product: ${product.name}`, 'product-verification');
    
    // Store the original product for comparison
    const originalProduct = { ...product };
    
    // Initialize verification state
    let isValid = true;
    const issues: string[] = [];
    let repaired = false;
    
    try {
      // Perform sequential verification steps
      const nameCheck = this.verifyName(product);
      if (!nameCheck.isValid) {
        isValid = false;
        issues.push(...nameCheck.issues);
        
        // Attempt to repair name issues if possible
        if (nameCheck.issues.some(issue => issue.includes('suspicious character'))) {
          const repairedName = await this.repairProductName(product.name);
          if (repairedName && repairedName !== product.name) {
            log(`Repaired product name: "${product.name}" → "${repairedName}"`, 'product-verification');
            product.name = repairedName;
            repaired = true;
          }
        }
      }
      
      const descriptionCheck = this.verifyDescription(product);
      if (!descriptionCheck.isValid) {
        isValid = false;
        issues.push(...descriptionCheck.issues);
        
        // Attempt to repair insufficient description
        if (descriptionCheck.issues.some(issue => issue.includes('too short'))) {
          const enhancedDescription = await this.enhanceProductDescription(product);
          if (enhancedDescription && enhancedDescription !== product.description) {
            log(`Enhanced product description for: ${product.name}`, 'product-verification');
            product.description = enhancedDescription;
            repaired = true;
          }
        }
      }
      
      const priceCheck = this.verifyPriceRange(product);
      if (!priceCheck.isValid) {
        isValid = false;
        issues.push(...priceCheck.issues);
        
        // Attempt to repair price range issues
        if (priceCheck.repaired) {
          log(`Repaired price range for ${product.name}: $${priceCheck.originalValues?.priceRangeLow}-$${priceCheck.originalValues?.priceRangeHigh} → $${product.priceRangeLow}-$${product.priceRangeHigh}`, 'product-verification');
          repaired = true;
        }
      }
      
      const categoryCheck = this.verifyCategory(product);
      if (!categoryCheck.isValid) {
        isValid = false;
        issues.push(...categoryCheck.issues);
      }
      
      // Verify product against external databases if the basic checks pass
      if (issues.length === 0 || repaired) {
        const externalCheck = await this.verifyExternalSources(product);
        if (!externalCheck.isValid) {
          isValid = false;
          issues.push(...externalCheck.issues);
        }
      }
      
      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(product, issues.length);
      
      const duration = Date.now() - startTime;
      log(`Product verification completed for "${product.name}" in ${duration}ms. Valid: ${isValid}, Issues: ${issues.length}, Repaired: ${repaired}`, 'product-verification');
      
      // Publish verification result event
      eventBus.publish('product:verification:complete', {
        productName: product.name,
        isValid,
        issueCount: issues.length,
        repaired,
        qualityScore
      });
      
      return {
        product,
        qualityScore,
        isValid,
        issues,
        repaired
      };
    } catch (error) {
      log(`Error verifying product "${product.name}": ${error}`, 'product-verification');
      return {
        product: originalProduct, // Return original in case of error
        qualityScore: 0,
        isValid: false,
        issues: [`Verification error: ${error}`],
        repaired: false
      };
    }
  }

  /**
   * Verify product name for quality and consistency
   */
  private verifyName(product: DiscoveredProduct): QualityCheckResult {
    const issues: string[] = [];
    
    // Check name length
    if (!product.name || product.name.length < QUALITY_THRESHOLDS.MIN_NAME_LENGTH) {
      issues.push(`Product name too short (${product.name?.length || 0} chars)`);
    }
    
    if (product.name && product.name.length > QUALITY_THRESHOLDS.MAX_NAME_LENGTH) {
      issues.push(`Product name too long (${product.name.length} chars)`);
    }
    
    // Check for suspicious characters that might indicate scraping errors
    const suspiciousChars = /[^\w\s\-.,()&+]/g;
    if (product.name && suspiciousChars.test(product.name)) {
      issues.push(`Product name contains suspicious characters: ${product.name.match(suspiciousChars)?.join('')}`);
    }
    
    // Check for all uppercase (shouting) names
    if (product.name && product.name === product.name.toUpperCase() && product.name.length > 10) {
      issues.push('Product name is all uppercase');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Verify product description for quality and completeness
   */
  private verifyDescription(product: DiscoveredProduct): QualityCheckResult {
    const issues: string[] = [];
    
    // Check description length
    if (!product.description) {
      issues.push('Missing product description');
    } else if (product.description.length < QUALITY_THRESHOLDS.MIN_DESCRIPTION_LENGTH) {
      issues.push(`Product description too short (${product.description.length} chars)`);
    }
    
    // Check for suspicious patterns that might indicate template text
    if (product.description && 
        (product.description.includes('[') || 
         product.description.includes(']') ||
         product.description.includes('{') ||
         product.description.includes('}'))) {
      issues.push('Product description contains template markers');
    }
    
    // Check for description that's too similar to the name (lazy generation)
    if (product.name && product.description && 
        product.description.startsWith(product.name) && 
        product.description.length < product.name.length + 30) {
      issues.push('Product description is too similar to the name');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Verify product price range for sanity and consistency
   */
  private verifyPriceRange(product: DiscoveredProduct): QualityCheckResult {
    const issues: string[] = [];
    const originalValues = {
      priceRangeLow: product.priceRangeLow,
      priceRangeHigh: product.priceRangeHigh
    };
    let repaired = false;
    
    // Check for missing prices
    if (product.priceRangeLow === undefined || product.priceRangeLow === null) {
      issues.push('Missing minimum price');
      product.priceRangeLow = 9.99; // Set a default value
      repaired = true;
    }
    
    if (product.priceRangeHigh === undefined || product.priceRangeHigh === null) {
      issues.push('Missing maximum price');
      product.priceRangeHigh = product.priceRangeLow ? product.priceRangeLow * 2 : 19.99;
      repaired = true;
    }
    
    // Check for negative prices
    if (product.priceRangeLow < 0) {
      issues.push(`Negative minimum price: ${product.priceRangeLow}`);
      product.priceRangeLow = Math.abs(product.priceRangeLow);
      repaired = true;
    }
    
    if (product.priceRangeHigh < 0) {
      issues.push(`Negative maximum price: ${product.priceRangeHigh}`);
      product.priceRangeHigh = Math.abs(product.priceRangeHigh);
      repaired = true;
    }
    
    // Check for minimum price greater than maximum
    if (product.priceRangeLow > product.priceRangeHigh) {
      issues.push(`Minimum price (${product.priceRangeLow}) greater than maximum (${product.priceRangeHigh})`);
      // Swap them
      const temp = product.priceRangeLow;
      product.priceRangeLow = product.priceRangeHigh;
      product.priceRangeHigh = temp;
      repaired = true;
    }
    
    // Check for unreasonable price span
    if (product.priceRangeLow > 0 && 
        product.priceRangeHigh / product.priceRangeLow > QUALITY_THRESHOLDS.MAX_PRICE_DELTA_FACTOR) {
      issues.push(`Price range span too large (${product.priceRangeLow} - ${product.priceRangeHigh})`);
      product.priceRangeHigh = product.priceRangeLow * QUALITY_THRESHOLDS.MAX_PRICE_DELTA_FACTOR;
      repaired = true;
    }
    
    // Check for very small prices that might indicate errors (like $0.01)
    if (product.priceRangeLow < QUALITY_THRESHOLDS.MIN_PRICE_LOW) {
      issues.push(`Minimum price too low: ${product.priceRangeLow}`);
      product.priceRangeLow = QUALITY_THRESHOLDS.MIN_PRICE_LOW;
      repaired = true;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      repaired,
      originalValues
    };
  }

  /**
   * Verify product category for consistency
   */
  private verifyCategory(product: DiscoveredProduct): QualityCheckResult {
    const issues: string[] = [];
    
    // Check for missing category
    if (!product.category) {
      issues.push('Missing product category');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Verify product against external sources
   */
  private async verifyExternalSources(product: DiscoveredProduct): Promise<QualityCheckResult> {
    const issues: string[] = [];
    
    try {
      // Check if the product can be found on wholesaler sites
      const verificationResult = await webSearchService.verifyProduct(product.name, product.category);
      
      if (!verificationResult.found) {
        issues.push(`Product not found on any verified wholesaler sites`);
      }
      
      if (verificationResult.priceInconsistency) {
        issues.push(`Wholesaler price inconsistency detected`);
      }
      
      // If wholesale price range found, check if our range is realistic
      if (verificationResult.averagePriceLow && verificationResult.averagePriceHigh) {
        const ourMidpoint = (product.priceRangeLow + product.priceRangeHigh) / 2;
        const wholesaleMidpoint = (verificationResult.averagePriceLow + verificationResult.averagePriceHigh) / 2;
        
        // If our price is significantly different from wholesale price, flag it
        const priceDifference = Math.abs(ourMidpoint - wholesaleMidpoint) / wholesaleMidpoint;
        if (priceDifference > 0.5) { // More than 50% difference
          issues.push(`Price significantly different from wholesale average`);
        }
      }
    } catch (error) {
      log(`Error verifying product against external sources: ${error}`, 'product-verification');
      issues.push(`External verification error: ${error}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Repair a problematic product name
   */
  private async repairProductName(name: string): Promise<string> {
    try {
      const response = await llmService.askLLM({
        system: "You are a product name cleaner. Fix the provided product name by removing special characters, correcting capitalization, and ensuring it follows standard product naming conventions.",
        user: `Clean up this product name: "${name}"`,
        temperature: 0.2
      });
      
      return response.trim();
    } catch (error) {
      log(`Error repairing product name: ${error}`, 'product-verification');
      return name; // Return original on error
    }
  }

  /**
   * Enhance an insufficient product description
   */
  private async enhanceProductDescription(product: DiscoveredProduct): Promise<string> {
    try {
      const response = await llmService.askLLM({
        system: "You are a product description writer. Create or enhance product descriptions to be informative, accurate, and compelling.",
        user: `Enhance this product description for "${product.name}" in the "${product.category}" category. Current description: "${product.description || 'No description provided'}"`,
        temperature: 0.4
      });
      
      return response.trim();
    } catch (error) {
      log(`Error enhancing product description: ${error}`, 'product-verification');
      return product.description || ''; // Return original on error
    }
  }

  /**
   * Calculate overall quality score for a product (0-100)
   */
  private calculateQualityScore(product: DiscoveredProduct, issueCount: number): number {
    // Base score starts at 100, reduced by issues
    let score = 100;
    
    // Deduct points for issues
    score -= issueCount * 15;
    
    // Add points for completeness of data
    if (product.name) score += 5;
    if (product.description && product.description.length > 50) score += 10;
    if (product.priceRangeLow && product.priceRangeHigh) score += 5;
    if (product.category) score += 5;
    if (product.subcategory) score += 3;
    if (product.engagementRate !== undefined) score += 3;
    if (product.salesVelocity !== undefined) score += 3;
    if (product.searchVolume !== undefined) score += 3;
    if (product.geographicSpread !== undefined) score += 3;
    if (product.aliexpressUrl) score += 5;
    if (product.cjdropshippingUrl) score += 5;
    if (product.imageUrl) score += 5;
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }
}

// Export singleton instance
export const productVerificationService = ProductVerificationService.getInstance();

// Export default for convenience
export default productVerificationService;