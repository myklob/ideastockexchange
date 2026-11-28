/**
 * Component showing detailed breakdown of how dimension scores were calculated.
 */
import React from 'react';
import { CriterionScoreBreakdown, DimensionScoreBreakdown, ArgumentScoreInfo } from '../types';
import ScoreBar from './ScoreBar';

interface DimensionBreakdownProps {
  breakdown: CriterionScoreBreakdown;
}

const ArgumentCard: React.FC<{ arg: ArgumentScoreInfo; isSupporting: boolean }> = ({
  arg,
  isSupporting,
}) => {
  return (
    <div className={`p-3 rounded border ${
      isSupporting ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm text-gray-800">{arg.content}</p>
        </div>
        <div className="ml-3">
          <span className={`text-xs font-bold ${
            isSupporting ? 'text-green-700' : 'text-red-700'
          }`}>
            Weight: {arg.weight.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Evidence:</span>
          <span className="ml-1 font-semibold">{arg.evidence_quality.toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Logic:</span>
          <span className="ml-1 font-semibold">{arg.logical_validity.toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Importance:</span>
          <span className="ml-1 font-semibold">{arg.importance.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

const DimensionSection: React.FC<{
  name: string;
  data: DimensionScoreBreakdown;
  icon: string;
  description: string;
}> = ({ name, data, icon, description }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="mr-2">{icon}</span>
          {name}
        </h4>
        <div className="text-2xl font-bold text-blue-600">
          {data.score.toFixed(0)}%
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>

      <div className="mb-3">
        <ScoreBar score={data.score} label={`${name} Score`} />
      </div>

      {/* Balance Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Support Weight:</span>
            <div className="font-semibold text-green-700">
              {data.total_support_weight.toFixed(1)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Oppose Weight:</span>
            <div className="font-semibold text-red-700">
              {data.total_oppose_weight.toFixed(1)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Balance:</span>
            <div className={`font-semibold ${
              data.balance > 0 ? 'text-green-700' : data.balance < 0 ? 'text-red-700' : 'text-gray-700'
            }`}>
              {data.balance > 0 ? '+' : ''}{data.balance.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Arguments */}
      {data.supporting_arguments.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-semibold text-green-700 mb-2">
            ✓ Supporting Arguments ({data.supporting_arguments.length})
          </h5>
          <div className="space-y-2">
            {data.supporting_arguments.map((arg) => (
              <ArgumentCard key={arg.id} arg={arg} isSupporting={true} />
            ))}
          </div>
        </div>
      )}

      {data.opposing_arguments.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-red-700 mb-2">
            ✗ Opposing Arguments ({data.opposing_arguments.length})
          </h5>
          <div className="space-y-2">
            {data.opposing_arguments.map((arg) => (
              <ArgumentCard key={arg.id} arg={arg} isSupporting={false} />
            ))}
          </div>
        </div>
      )}

      {data.supporting_arguments.length === 0 && data.opposing_arguments.length === 0 && (
        <div className="text-sm text-gray-500 italic text-center py-4">
          No arguments yet for this dimension
        </div>
      )}
    </div>
  );
};

const DimensionBreakdown: React.FC<DimensionBreakdownProps> = ({ breakdown }) => {
  const dimensionInfo = {
    validity: {
      icon: '✓',
      description: 'Does this actually measure what we think it measures?'
    },
    reliability: {
      icon: '⚖',
      description: 'Can different people measure this consistently?'
    },
    independence: {
      icon: '◉',
      description: 'Is the data source neutral and unbiased?'
    },
    linkage: {
      icon: '↔',
      description: 'How strongly does this metric correlate with the ultimate goal?'
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Score Calculation Breakdown
        </h3>
        <p className="text-sm text-blue-800 mb-2">
          Overall Score: <span className="font-bold">{breakdown.overall_score.toFixed(0)}%</span>
          {' '} | Total Arguments: <span className="font-bold">{breakdown.argument_count}</span>
        </p>
        <p className="text-xs text-blue-700">
          The overall score is calculated from the four dimension scores below.
          Each dimension's score is determined by the balance of supporting vs. opposing arguments,
          weighted by their evidence quality, logical validity, and importance.
        </p>
      </div>

      {Object.entries(breakdown.dimensions).map(([name, data]) => (
        <DimensionSection
          key={name}
          name={name.charAt(0).toUpperCase() + name.slice(1)}
          data={data}
          icon={dimensionInfo[name as keyof typeof dimensionInfo]?.icon || '•'}
          description={dimensionInfo[name as keyof typeof dimensionInfo]?.description || ''}
        />
      ))}
    </div>
  );
};

export default DimensionBreakdown;
