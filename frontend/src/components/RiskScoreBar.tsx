import React from 'react';

interface RiskScoreBarProps {
  score: number; // 0 to 100
  showLabel?: boolean;
  compact?: boolean;
}

export const RiskScoreBar: React.FC<RiskScoreBarProps> = ({
  score,
  showLabel = true,
  compact = false,
}) => {
  // Clamped between 0 and 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  let statusColor = '#22C55E'; // green
  let statusText = 'Low Risk';
  let badgeClass = 'text-[#22C55E]';

  if (normalizedScore > 70) {
    statusColor = '#EF4444'; // red
    statusText = 'High Risk';
    badgeClass = 'text-[#EF4444]';
  } else if (normalizedScore > 30) {
    statusColor = '#F59E0B'; // amber
    statusText = 'Elevated';
    badgeClass = 'text-[#F59E0B]';
  }

  return (
    <div className={`flex items-center gap-2.5 ${compact ? 'min-w-[110px]' : 'min-w-[140px]'}`}>
      <div className="flex-1">
        <div className="h-1.5 w-full bg-[#1F1F26] rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${normalizedScore}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>
      
      {showLabel && (
        <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
          <span className={`font-semibold ${badgeClass}`}>{normalizedScore}</span>
          <span className="text-[#606070] text-[11px]">/100</span>
        </div>
      )}
    </div>
  );
};
