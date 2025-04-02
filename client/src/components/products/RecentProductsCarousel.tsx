import { useState, useEffect } from 'react';
import { TrendingUp, Package, MapPin, Video, ImageOff, Calendar } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getTrendScoreColor, formatDate } from '@/lib/utils';
import { ProductDrawer } from './ProductDrawer';

interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price?: number;
  trendScore?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  regionCount?: number;
  videoCount?: number;
}

interface RecentProductsCarouselProps {
  products: Product[];
}

export function RecentProductsCarousel({ products }: RecentProductsCarouselProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Reset image errors when products change
  useEffect(() => {
    setImageErrors({});
  }, [products]);

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No recent products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative px-4 sm:px-12">
        <Carousel 
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <div className="p-1">
                  <Card 
                    className="overflow-hidden border hover-card cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="relative h-40 bg-muted/50 flex items-center justify-center overflow-hidden">
                      {product.imageUrl && !imageErrors[product.id] ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(product.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {imageErrors[product.id] ? (
                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                          ) : (
                            <Package className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className={`px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm ${getTrendScoreColor(product.trendScore || 0)}`}>
                          {product.trendScore || 0}/100
                        </Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className="px-2 py-1 text-xs font-medium bg-accent/80 backdrop-blur-sm text-accent-foreground">
                          {product.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.price || 0)}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(product.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{product.regionCount || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <Video className="h-3 w-3 mr-1" />
                          <span>{product.videoCount || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span>{product.trendScore || 0}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute -left-3 top-1/2 -translate-y-1/2">
            <CarouselPrevious className="relative left-0 translate-y-0 bg-background/80 backdrop-blur-sm border shadow-md hover:bg-background" />
          </div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2">
            <CarouselNext className="relative right-0 translate-y-0 bg-background/80 backdrop-blur-sm border shadow-md hover:bg-background" />
          </div>
        </Carousel>
      </div>

      <ProductDrawer 
        productId={selectedProductId} 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
      />
    </>
  );
}