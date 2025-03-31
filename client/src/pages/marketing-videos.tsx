import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import VideoCard from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingVideos() {
  const [platform, setPlatform] = useState<string>("All Platforms");
  
  const { data: productsWithVideos, isLoading } = useQuery({
    queryKey: ["/api/products", { limit: 10 }],
  });
  
  const platforms = ["All Platforms", "TikTok", "Instagram", "YouTube"];
  
  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">Marketing Videos</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="ri-notification-3-line"></i>
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-400">
            <span className="text-sm font-medium">JD</span>
          </button>
        </div>
      </header>
      
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center">
        <div className="mr-3 text-sm text-gray-500 dark:text-gray-400">Platform:</div>
        <div className="flex gap-2">
          {platforms.map(p => (
            <button
              key={p}
              className={`px-3 py-1 rounded-md text-sm ${
                platform === p
                  ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setPlatform(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-2">Trending Marketing Videos</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Discover viral marketing videos for trending dropshipping products
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsWithVideos?.products.map(product => {
              // Each product query would have its own videos in a real scenario
              // Here we're using the product ID to fetch mock videos
              const { data: productDetails } = useQuery({
                queryKey: [`/api/products/${product.id}`],
              });
              
              const videos = productDetails?.videos || [];
              
              // Filter by platform if needed
              const filteredVideos = platform === "All Platforms" 
                ? videos 
                : videos.filter(v => v.platform === platform);
              
              return filteredVideos.map(video => (
                <Card key={video.id}>
                  <CardContent className="p-4">
                    <VideoCard video={video} />
                    <div className="mt-2">
                      <h3 className="text-sm font-medium">Related Product</h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <i className="ri-shopping-bag-line"></i> {product.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            }).flat()}
          </div>
        )}
      </div>
    </>
  );
}
