import React, { useMemo } from 'react';
import { TREND_SCORE_COLORS } from '../lib/constants';

interface TrendScoreRingProps {
  score: number;
  size?: number;
  thickness?: number;
  className?: string;
}

export default function TrendScoreRing({ 
  score, 
  size = 60, 
  thickness = 8,
  className = ""
}: TrendScoreRingProps) {
  
  // Calculate dimensions
  const center = size / 2;
  const radius = center - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const ringColor = useMemo(() => {
    if (score >= 90) return TREND_SCORE_COLORS.excellent;
    if (score >= 80) return TREND_SCORE_COLORS.good;
    if (score >= 70) return TREND_SCORE_COLORS.average;
    if (score >= 60) return TREND_SCORE_COLORS.fair;
    return TREND_SCORE_COLORS.poor;
  }, [score]);
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={thickness}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        {/* Score text */}
        <text
          x={center}
          y={center}
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.26}
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
    </div>
  );
}