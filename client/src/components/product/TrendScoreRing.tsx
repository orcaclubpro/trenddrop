import { useState, useEffect } from 'react';
import { getTrendScoreColor } from '@/lib/utils';

interface TrendScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function TrendScoreRing({
  score,
  size = 60,
  strokeWidth = 4,
  showLabel = true,
  className = '',
}: TrendScoreRingProps) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animation effect for the ring
  useEffect(() => {
    const timer = setTimeout(() => {
      const calculatedOffset = ((100 - score) / 100) * circumference;
      setOffset(calculatedOffset);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [score, circumference]);
  
  const colorClass = getTrendScoreColor(score);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        
        {/* Foreground circle (score indicator) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`trend-score-ring ${colorClass}`}
        />
      </svg>
      
      {/* Score text */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-base font-bold ${colorClass}`}>{score}</span>
        </div>
      )}
    </div>
  );
}