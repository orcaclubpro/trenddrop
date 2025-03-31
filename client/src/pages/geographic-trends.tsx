import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeographicTrends() {
  const { data: regions } = useQuery<string[]>({
    queryKey: ["/api/regions"],
  });
  
  const { data: products } = useQuery({
    queryKey: ["/api/products", { limit: 100 }],
  });
  
  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-gray-500 dark:text-gray-400">
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h2 className="text-lg font-medium">Geographic Trends</h2>
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
      
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-2">Global Trend Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Analyze product trends by geographic region to target your dropshipping business effectively.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="map-visualization h-80 w-full relative">
            {regions?.slice(0, 6).map((region, index) => {
              // Position markers based on region name
              let position;
              
              switch (region) {
                case 'USA':
                  position = { top: '35%', left: '25%' };
                  break;
                case 'Germany':
                  position = { top: '35%', left: '45%' };
                  break;
                case 'Japan':
                  position = { top: '40%', left: '80%' };
                  break;
                case 'Canada':
                  position = { top: '30%', left: '20%' };
                  break;
                case 'UK':
                  position = { top: '32%', left: '42%' };
                  break;
                case 'Australia':
                  position = { top: '65%', left: '80%' };
                  break;
                case 'Brazil':
                  position = { top: '60%', left: '30%' };
                  break;
                default:
                  position = { top: '50%', left: '50%' };
              }
              
              // Size based on regional importance
              const size = 6 - (index * 0.8); // Decreasing size
              
              return (
                <div 
                  key={region}
                  className="absolute bg-primary-500 rounded-full animate-pulse flex items-center justify-center"
                  style={{ 
                    top: position.top, 
                    left: position.left,
                    width: `${size}rem`,
                    height: `${size}rem`,
                    opacity: 1 - (index * 0.1)
                  }}
                >
                  <div className="absolute whitespace-nowrap bg-black/75 text-white text-xs px-2 py-1 rounded -top-7">
                    {region}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {regions?.slice(0, 6).map((region, index) => (
            <Card key={region}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <i className="ri-global-line"></i> {region}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mt-1">
                  {Math.floor(10 + Math.random() * 60)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Market penetration
                </div>
                
                <div className="mt-3">
                  <div className="text-sm font-medium">Top Categories</div>
                  <div className="mt-2 space-y-2">
                    {['Home', 'Tech', 'Fitness'].slice(0, 2 + index % 2).map(category => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-xs">{category}</span>
                        <div className="w-2/3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
                            style={{ width: `${Math.floor(40 + Math.random() * 60)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
