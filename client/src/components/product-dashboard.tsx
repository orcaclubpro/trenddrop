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
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary-900 dark:text-primary-100 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Trending Products
        </h2>
        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
            <TabsList className="bg-primary/10">
              <TabsTrigger 
                value="grid" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Grid View
              </TabsTrigger>
              <TabsTrigger 
                value="table" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Globe className="h-4 w-4 mr-1" />
                Table View
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/30"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeView} className="w-full">
        <TabsContent value="grid" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProducts.map(product => (
              <Card 
                key={product.id} 
                className="overflow-hidden cursor-pointer border-primary/20 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all"
                onClick={() => onSelectProduct(product)}
              >
                <CardHeader className="pb-2 border-b border-primary/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/15">{product.category}</Badge>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <TrendScoreRing score={product.trendScore} size={50} thickness={5} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative h-40 mb-4 bg-primary/5 rounded-md overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Pocket className="h-16 w-16 text-primary/20" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-primary/5 p-2 rounded-md">
                      <div className="text-primary/70 mb-1 flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" /> Price Range
                      </div>
                      <div className="font-medium">
                        {formatCurrency(product.priceRangeLow)} - {formatCurrency(product.priceRangeHigh)}
                      </div>
                    </div>
                    <div className="bg-primary/5 p-2 rounded-md">
                      <div className="text-primary/70 mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Trend Score
                      </div>
                      <div className={`font-medium ${scoreColorClass(product.trendScore)}`}>
                        {product.trendScore}/100 ({getScoreLabel(product.trendScore)})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
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
                    <span className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary/70 rounded-full">
                      {product.sourcePlatform} <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="w-full">
          <div className="rounded-md border border-primary/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/5">
                  <th className="p-3 text-left font-medium text-primary">Product</th>
                  <th className="p-3 text-left font-medium text-primary">Category</th>
                  <th className="p-3 text-left font-medium text-primary">Price Range</th>
                  <th className="p-3 text-left font-medium text-primary">Trend Score</th>
                  <th className="p-3 text-left font-medium text-primary">Source</th>
                  <th className="p-3 text-left font-medium text-primary">Links</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map(product => (
                  <tr 
                    key={product.id} 
                    className="border-t border-primary/10 cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => onSelectProduct(product)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-md bg-primary/5 flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Pocket className="h-5 w-5 text-primary/20" />
                          )}
                        </div>
                        <div className="font-medium">{product.name}</div>
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
                        <TrendScoreRing score={product.trendScore} size={30} thickness={3} />
                        <span className={scoreColorClass(product.trendScore)}>
                          {product.trendScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {product.sourcePlatform}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
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
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/30"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
}