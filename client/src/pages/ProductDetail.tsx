import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart, TrendingUp, MapPin, Video } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { formatDate, formatCurrency, getTrendScoreColor } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';

interface ProductDetailProps {
  id: number;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', id],
    throwOnError: false
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
        <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist or has been removed.</p>
        <Button 
          className="mt-6" 
          variant="default" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
          <p className="text-muted-foreground">
            {product.category} • Added on {formatDate(product.createdAt)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analyze Trends
          </Button>
          <Button variant="default">
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trend Score
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getTrendScoreColor(product.trendScore || 0)}>
                {product.trendScore || 0}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on 30 days of data
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Price
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(product.price || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Competitive Market Price
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Regions
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.regionCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Global Distribution
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marketing Videos
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.videoCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across Social Platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Trend chart visualization will appear here
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              Region map will appear here
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center text-muted-foreground">
            Video gallery will appear here
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            {product.description || "No product description available."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}