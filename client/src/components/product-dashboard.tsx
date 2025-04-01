import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import TrendScoreRing from './trend-score-ring';
import { formatCurrency, formatNumber } from '../lib/api';
import { Product } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ExternalLink, ArrowUpRight, Pocket, ShoppingCart, TrendingUp, BarChart3, Globe, Video } from 'lucide-react';
import { TREND_SCORE_COLORS } from '../lib/constants';

interface ProductDashboardProps {
  products: Product[];
  isRefreshing: boolean;
  onSelectProduct: (product: Product) => void;
  onRefresh: () => void;
}

export default function ProductDashboard({ products, isRefreshing, onSelectProduct, onRefresh }: ProductDashboardProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [activeView, setActiveView] = useState('grid');
  
  useEffect(() => {
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      onRefresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [onRefresh]);
  
  // Sort products by trend score (highest first)
  const sortedProducts = [...products].sort((a, b) => b.trendScore - a.trendScore);
  const displayProducts = sortedProducts.slice(0, displayCount);
  
  const scoreColorClass = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-indigo-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-gray-400';
  };
  
  const getTrendColor = (score: number) => {
    if (score >= 90) return TREND_SCORE_COLORS.excellent;
    if (score >= 80) return TREND_SCORE_COLORS.good;
    if (score >= 70) return TREND_SCORE_COLORS.average;
    if (score >= 60) return TREND_SCORE_COLORS.fair;
    return TREND_SCORE_COLORS.poor;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };
  
  const loadMore = () => {
    setDisplayCount(prev => prev + 10);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
          <TabsList className="bg-background border border-border">
            <TabsTrigger 
              value="grid" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger 
              value="table" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Globe className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Tabs value={activeView} className="w-full">
        <TabsContent value="grid" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProducts.map(product => (
              <Card 
                key={product.id} 
                className="overflow-hidden cursor-pointer border-border hover:border-primary hover:shadow-md transition-all"
                onClick={() => onSelectProduct(product)}
              >
                <div className="relative h-40 overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <Pocket className="h-16 w-16 text-muted" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-background/90 text-foreground hover:bg-background/95 backdrop-blur-sm">{product.category}</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <TrendScoreRing score={product.trendScore} size={40} thickness={4} />
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-2 line-clamp-1">{product.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Score</span>
                      <span className={`font-medium ${scoreColorClass(product.trendScore)}`}>
                        {product.trendScore}/100 ({getScoreLabel(product.trendScore)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {product.aliexpressUrl && (
                      <a 
                        href={product.aliexpressUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        AliExpress <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {product.cjdropshippingUrl && (
                      <a 
                        href={product.cjdropshippingUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        CJ <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span className="text-xs flex items-center gap-1 px-2 py-1 bg-muted/80 text-muted-foreground rounded-full">
                      {product.sourcePlatform}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="w-full">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-3 text-left font-medium text-foreground">Product</th>
                  <th className="p-3 text-left font-medium text-foreground">Category</th>
                  <th className="p-3 text-left font-medium text-foreground">Price Range</th>
                  <th className="p-3 text-left font-medium text-foreground">Trend Score</th>
                  <th className="p-3 text-left font-medium text-foreground">Wholesaler Links</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map(product => (
                  <tr 
                    key={product.id} 
                    className="border-t border-border cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => onSelectProduct(product)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Pocket className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="font-medium line-clamp-1 max-w-[200px]">{product.name}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{product.category}</Badge>
                    </td>
                    <td className="p-3">
                      {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <TrendScoreRing score={product.trendScore} size={28} thickness={3} />
                        <span className={scoreColorClass(product.trendScore)}>
                          {product.trendScore} ({getScoreLabel(product.trendScore)})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {product.aliexpressUrl && (
                          <a 
                            href={product.aliexpressUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            AliExpress <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {product.cjdropshippingUrl && (
                          <a 
                            href={product.cjdropshippingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            CJ <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      
      {displayCount < products.length && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={loadMore} 
            variant="outline"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
}