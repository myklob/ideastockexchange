/**
 * Visual score bar component showing a score from 0-100.
 */
import React from 'react';

interface ScoreBarProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: string;
  showPercentage?: boolean;
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  label,
  size = 'md',
  showIcon,
  showPercentage = true,
}) => {
  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBarHeight = (): string => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-6';
      default:
        return 'h-4';
    }
  };

  const getTextSize = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <div className={`flex items-center justify-between mb-1 ${getTextSize()}`}>
          <span className="font-medium text-gray-700">
            {showIcon && <span className="mr-1">{showIcon}</span>}
            {label}
          </span>
          {showPercentage && (
            <span className="text-gray-600 font-semibold">
              {score.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Bar */}
      <div className={`w-full bg-gray-200 rounded-full ${getBarHeight()} overflow-hidden`}>
        <div
          className={`${getBarColor(score)} ${getBarHeight()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreBar;
