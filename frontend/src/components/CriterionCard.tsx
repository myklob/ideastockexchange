/**
 * Component for displaying a criterion with its scores, quality dimensions,
 * and prediction market trading interface.
 */
import React, { useState } from 'react';
import { Criterion, CriterionScoreBreakdown, TradeResponse } from '../types';
import { criterionAPI } from '../services/api';
import ScoreBar from './ScoreBar';
import DimensionBreakdown from './DimensionBreakdown';
import MarketPriceBar from './MarketPriceBar';
import TradingPanel from './TradingPanel';

interface CriterionCardProps {
  criterion: Criterion;
  onUpdate?: () => void;
  userId?: number | null;
  userBalance?: number;
  onTradeComplete?: (trade: TradeResponse) => void;
}

const CriterionCard: React.FC<CriterionCardProps> = ({
  criterion,
  onUpdate,
  userId,
  userBalance = 0,
  onTradeComplete,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showTrading, setShowTrading] = useState(false);
  const [breakdown, setBreakdown] = useState<CriterionScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBreakdown = async () => {
    if (breakdown) {
      setShowBreakdown(!showBreakdown);
      return;
    }

    setLoading(true);
    try {
      const data = await criterionAPI.getScoreBreakdown(criterion.id);
      setBreakdown(data);
      setShowBreakdown(true);
    } catch (error) {
      console.error('Failed to load breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Weak';
  };

  const handleTradeComplete = (trade: TradeResponse) => {
    if (onTradeComplete) onTradeComplete(trade);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{criterion.name}</h3>
          {criterion.description && (
            <p className="text-gray-600 text-sm mb-3">{criterion.description}</p>
          )}
        </div>
        <div className="ml-4 text-right">
          <div className={`text-3xl font-bold ${getScoreColor(criterion.overall_score)}`}>
            {criterion.overall_score.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">
            {getScoreLabel(criterion.overall_score)}
          </div>
        </div>
      </div>

      {/* Dual-Score Dashboard: ReasonRank + Market Price */}
      <div className="mb-4">
        <MarketPriceBar
          marketPrice={criterion.market_price}
          reasonRankScore={criterion.overall_score}
          marketStatus={criterion.market_status}
        />
      </div>

      {/* Overall Score Bar */}
      <div className="mb-4">
        <ScoreBar score={criterion.overall_score} label="Overall Quality" />
      </div>

      {/* Dimension Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <ScoreBar
            score={criterion.validity_score}
            label="Validity"
            size="sm"
            showIcon="✓"
          />
          <p className="text-xs text-gray-500 mt-1">Does this measure what we think?</p>
        </div>
        <div>
          <ScoreBar
            score={criterion.reliability_score}
            label="Reliability"
            size="sm"
            showIcon="⚖"
          />
          <p className="text-xs text-gray-500 mt-1">Consistent measurement?</p>
        </div>
        <div>
          <ScoreBar
            score={criterion.independence_score}
            label="Independence"
            size="sm"
            showIcon="◉"
          />
          <p className="text-xs text-gray-500 mt-1">Neutral data source?</p>
        </div>
        <div>
          <ScoreBar
            score={criterion.linkage_score}
            label="Linkage"
            size="sm"
            showIcon="↔"
          />
          <p className="text-xs text-gray-500 mt-1">Correlation with goal?</p>
        </div>
      </div>

      {/* Trading toggle and Breakdown buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
        <button
          onClick={() => setShowTrading(!showTrading)}
          className="bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm px-3 py-1 rounded-md transition-colors"
        >
          {showTrading ? 'Hide Trading' : 'Trade'}
        </button>
        <button
          onClick={loadBreakdown}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">&#x27F3;</span>
              Loading...
            </>
          ) : (
            <>
              {showBreakdown ? '▼' : '▶'} {showBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
            </>
          )}
        </button>
      </div>

      {/* Trading Panel */}
      {showTrading && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <TradingPanel
            criterion={criterion}
            userId={userId || null}
            userBalance={userBalance}
            onTradeComplete={handleTradeComplete}
          />
        </div>
      )}

      {/* Detailed Breakdown */}
      {showBreakdown && breakdown && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <DimensionBreakdown breakdown={breakdown} />
        </div>
      )}
    </div>
  );
};

export default CriterionCard;
