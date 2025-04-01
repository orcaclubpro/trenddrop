import { Link } from 'wouter';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Product } from '@shared/schema';
import { getTrendScoreColor, truncateString } from '@/lib/utils';

interface TrendingProductsProps {
  products: Product[];
}

export function TrendingProducts({ products }: TrendingProductsProps) {
  if (!products.length) {
    return (
      <div className="py-8 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">No trending products</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Trending products will appear here once available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="divide-y divide-border">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <a className="block py-3 px-2 -mx-2 hover:bg-muted/50 rounded-md transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="h-10 w-10 rounded-md object-cover" 
                      />
                    ) : (
                      <span className="font-medium text-primary">
                        {product.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{truncateString(product.name, 30)}</h4>
                    <p className="text-xs text-muted-foreground">
                      {product.category} | ${product.priceRangeLow.toFixed(2)} - ${product.priceRangeHigh.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 text-right">
                    <div className={`text-lg font-bold ${getTrendScoreColor(product.trendScore)}`}>
                      {product.trendScore}
                    </div>
                    <div className="text-xs text-muted-foreground">Trend Score</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}