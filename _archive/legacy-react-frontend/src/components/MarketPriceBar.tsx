/**
 * Visual bar showing the prediction market price (0-100%) alongside the ReasonRank score.
 * Displays both scores side-by-side for the dual-score dashboard.
 */
import React from 'react';
import { MarketStatus } from '../types';

interface MarketPriceBarProps {
  marketPrice: number; // 0.0 to 1.0
  reasonRankScore: number; // 0 to 100
  marketStatus: MarketStatus;
}

const MarketPriceBar: React.FC<MarketPriceBarProps> = ({
  marketPrice,
  reasonRankScore,
  marketStatus,
}) => {
  const marketPercent = Math.round(marketPrice * 100);

  const getMarketColor = (percent: number): string => {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getReasonRankColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isResolved = marketStatus !== MarketStatus.OPEN;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Dual Score Dashboard
        </h4>
        {isResolved && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            marketStatus === MarketStatus.RESOLVED_YES
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            Resolved {marketStatus === MarketStatus.RESOLVED_YES ? 'YES' : 'NO'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ReasonRank Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              ReasonRank (Logic)
            </span>
            <span className="text-sm font-bold text-gray-800">
              {reasonRankScore.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`${getReasonRankColor(reasonRankScore)} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, reasonRankScore))}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Evidence & argument quality</p>
        </div>

        {/* Market Price */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              Market Price (Crowd)
            </span>
            <span className="text-sm font-bold text-gray-800">
              {marketPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`${getMarketColor(marketPercent)} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, marketPercent))}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Crowd sentiment & betting</p>
        </div>
      </div>

      {/* Divergence indicator */}
      {Math.abs(reasonRankScore - marketPercent) > 20 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          Large divergence detected: The crowd sentiment ({marketPercent}%) differs significantly
          from the logical score ({reasonRankScore.toFixed(0)}%).
          This may indicate a trading opportunity.
        </div>
      )}
    </div>
  );
};

export default MarketPriceBar;
