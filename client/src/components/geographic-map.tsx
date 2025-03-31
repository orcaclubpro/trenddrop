import { Region } from "@shared/schema";

interface GeographicMapProps {
  regions: Region[];
}

export default function GeographicMap({ regions }: GeographicMapProps) {
  // Sort regions by percentage (highest first)
  const sortedRegions = [...regions].sort((a, b) => b.percentage - a.percentage);
  
  // Get top 3 regions for display
  const topRegions = sortedRegions.slice(0, 3);
  
  return (
    <div className="mt-6">
      <div className="text-sm font-medium mb-2">Top Trending Regions</div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden h-40">
        <div className="map-visualization h-full w-full relative">
          {/* Geographic markers */}
          {topRegions.map((region, index) => {
            // Position markers based on region name
            let position;
            
            switch (region.country) {
              case 'USA':
                position = { top: '35%', left: '25%' };
                break;
              case 'Germany':
                position = { top: '40%', left: '45%' };
                break;
              case 'Japan':
                position = { top: '50%', left: '80%' };
                break;
              case 'Canada':
                position = { top: '30%', left: '20%' };
                break;
              case 'UK':
                position = { top: '35%', left: '40%' };
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
            
            // Size based on percentage
            const size = 4 - index; // Decreasing size for lower percentages
            
            return (
              <div 
                key={region.id}
                className="absolute bg-primary-500 rounded-full animate-pulse"
                style={{ 
                  top: position.top, 
                  left: position.left,
                  width: `${size}rem`,
                  height: `${size}rem`,
                  opacity: 1 - (index * 0.25)
                }}
                title={`${region.country} - ${region.percentage}%`}
              ></div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-4 mt-2">
        {topRegions.map((region, index) => (
          <div key={region.id} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 bg-primary-500 rounded-full"
              style={{ opacity: 1 - (index * 0.25) }}
            ></div>
            <span>{region.country} ({region.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
