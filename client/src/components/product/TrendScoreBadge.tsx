import { getTrendScoreColor } from '@/lib/utils';

interface TrendScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export function TrendScoreBadge({ score, size = 'medium' }: TrendScoreBadgeProps) {
  const scoreColor = getTrendScoreColor(score);
  
  // Determine the size of the badge
  const dimensions = {
    small: {
      width: 'w-10',
      height: 'h-10',
      fontSize: 'text-sm',
      label: 'text-xs',
    },
    medium: {
      width: 'w-16',
      height: 'h-16',
      fontSize: 'text-lg',
      label: 'text-xs',
    },
    large: {
      width: 'w-20',
      height: 'h-20',
      fontSize: 'text-2xl',
      label: 'text-sm',
    },
  };
  
  const { width, height, fontSize, label } = dimensions[size];
  
  // Calculate the circumference and stroke-dashoffset for the circular progress
  const radius = size === 'small' ? 18 : size === 'medium' ? 30 : 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className={`relative ${width} ${height} flex flex-col items-center justify-center`}>
      {/* SVG Circular Progress */}
      <svg 
        className="absolute inset-0 w-full h-full -rotate-90" 
        viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
      >
        {/* Background circle */}
        <circle
          cx={radius + 2}
          cy={radius + 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={radius + 2}
          cy={radius + 2}
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`trend-score-ring ${scoreColor}`}
        />
      </svg>
      
      {/* Score text */}
      <div className="relative flex flex-col items-center">
        <span className={`font-bold ${fontSize}`}>{score}</span>
        <span className={`${label} text-muted-foreground`}>Score</span>
      </div>
    </div>
  );
}