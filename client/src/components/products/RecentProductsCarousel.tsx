import { useState } from 'react';
import { TrendingUp, Package, MapPin, Video } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getTrendScoreColor } from '@/lib/utils';
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
                    className="overflow-hidden border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="h-32 bg-muted/40 relative flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="absolute top-2 right-2">
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${getTrendScoreColor(product.trendScore || 0)}`}>
                          {product.trendScore || 0}/100
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                        <span className="text-xs font-medium">
                          {formatCurrency(product.price || 0)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
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
          <div className="absolute -left-2 top-1/2 -translate-y-1/2">
            <CarouselPrevious className="relative left-0 translate-y-0 bg-background border shadow-sm hover:bg-background" />
          </div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2">
            <CarouselNext className="relative right-0 translate-y-0 bg-background border shadow-sm hover:bg-background" />
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