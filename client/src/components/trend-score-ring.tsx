import { useEffect, useState } from "react";

interface TrendScoreRingProps {
  score: number;
  size?: number;
  thickness?: number;
  className?: string;
}

export default function TrendScoreRing({ 
  score, 
  size = 50, 
  thickness = 6,
  className = ""
}: TrendScoreRingProps) {
  const [color, setColor] = useState("rgb(79, 70, 229)"); // Default primary color
  
  useEffect(() => {
    // Set color based on score
    if (score >= 90) {
      setColor("rgb(16, 185, 129)"); // Green for excellent scores
    } else if (score >= 80) {
      setColor("rgb(79, 70, 229)"); // Purple/indigo for good scores
    } else if (score >= 70) {
      setColor("rgb(245, 158, 11)"); // Yellow/amber for average scores
    } else {
      setColor("rgb(220, 38, 38)"); // Red for below average scores
    }
  }, [score]);
  
  const percentage = `${score}%`;
  
  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        "--percentage": percentage,
        "--thickness": `${thickness}px`,
        "--primary-color": color
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 rounded-full bg-conic-gradient" 
           style={{
              background: `conic-gradient(${color} ${percentage}, #e5e7eb 0)`,
              maskImage: `radial-gradient(transparent calc(50% - ${thickness}px), #000 calc(50% - ${thickness}px + 1px))`,
              WebkitMaskImage: `radial-gradient(transparent calc(50% - ${thickness}px), #000 calc(50% - ${thickness}px + 1px))`,
           }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {score}
      </div>
    </div>
  );
}
