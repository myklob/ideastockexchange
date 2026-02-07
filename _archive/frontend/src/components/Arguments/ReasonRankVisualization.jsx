import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Shield,
  Zap,
  Link as LinkIcon,
  Users,
  Target,
} from 'lucide-react';

// ============================================================================
// REASON RANK BREAKDOWN - Shows how ReasonRank is calculated
// ============================================================================
const ReasonRankBreakdown = ({ argument }) => {
  const components = useMemo(() => {
    const healthMetrics = argument.healthMetrics || {};
    const votes = argument.votes || { up: 0, down: 0 };

    // Evidence Support (40%)
    const evidenceSupport = (
      (healthMetrics.strength || 50) * 0.6 +
      ((argument.scores?.verificationCredibility || 0.5) * 100) * 0.4
    ) / 100;

    // Counterargument Resistance (30%)
    const subArgs = argument.subArguments || [];
    const supportingSubArgs = subArgs.filter(sa => sa.type === 'supporting').length;
    const opposingSubArgs = subArgs.filter(sa => sa.type === 'opposing').length;
    const totalSubArgs = supportingSubArgs + opposingSubArgs;
    let resistance = 0.5;
    if (totalSubArgs > 0) {
      resistance = (supportingSubArgs / totalSubArgs) * 0.7 + 0.3;
    }

    // Network Position (20%)
    const networkMetrics = argument.networkMetrics || {};
    const centrality = networkMetrics.centrality || 0.5;
    const supportedByCount = networkMetrics.supportedByCount || 0;
    const challengedByCount = networkMetrics.challengedByCount || 0;
    const networkPosition = (
      centrality * 0.5 +
      (supportedByCount / (supportedByCount + challengedByCount + 1)) * 0.5
    );

    // Expert Consensus (10%)
    const expertConsensus = votes.up / (votes.up + votes.down + 1);

    // Final score
    const total =
      evidenceSupport * 0.40 * 100 +
      resistance * 0.30 * 100 +
      networkPosition * 0.20 * 100 +
      expertConsensus * 0.10 * 100;

    return {
      evidenceSupport: { value: evidenceSupport * 100, weight: 0.40, contribution: evidenceSupport * 0.40 * 100 },
      resistance: { value: resistance * 100, weight: 0.30, contribution: resistance * 0.30 * 100 },
      networkPosition: { value: networkPosition * 100, weight: 0.20, contribution: networkPosition * 0.20 * 100 },
      expertConsensus: { value: expertConsensus * 100, weight: 0.10, contribution: expertConsensus * 0.10 * 100 },
      total,
    };
  }, [argument]);

  const componentsList = [
    {
      key: 'evidenceSupport',
      label: 'Evidence Support',
      description: 'Quality and quantity of supporting evidence',
      icon: Shield,
      color: 'blue',
      ...components.evidenceSupport,
    },
    {
      key: 'resistance',
      label: 'Counter-Resistance',
      description: 'Ability to withstand opposing arguments',
      icon: Target,
      color: 'green',
      ...components.resistance,
    },
    {
      key: 'networkPosition',
      label: 'Network Position',
      description: 'Centrality and connections in argument graph',
      icon: LinkIcon,
      color: 'purple',
      ...components.networkPosition,
    },
    {
      key: 'expertConsensus',
      label: 'Community Consensus',
      description: 'Upvotes vs downvotes from community',
      icon: Users,
      color: 'orange',
      ...components.expertConsensus,
    },
  ];

  const getColorClass = (color, type) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
    };
    return colors[color]?.[type] || '';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">ReasonRank Analysis</h3>
              <p className="text-sm text-indigo-200">PageRank-style argument scoring</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {(argument.reasonRankScore || components.total / 100).toFixed(3)}
            </div>
            <div className="text-xs text-indigo-200">Final Score</div>
          </div>
        </div>
      </div>

      {/* Components Breakdown */}
      <div className="p-4 space-y-4">
        {componentsList.map((comp) => {
          const Icon = comp.icon;
          return (
            <div key={comp.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${getColorClass(comp.color, 'bg')} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${getColorClass(comp.color, 'text')}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{comp.label}</div>
                    <div className="text-xs text-gray-500">{comp.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {comp.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    x {(comp.weight * 100).toFixed(0)}% = {comp.contribution.toFixed(1)}
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getColorClass(comp.color, 'bar')}`}
                  style={{ width: `${comp.value}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Calculated Total</div>
            <div className="text-lg font-bold text-gray-900">{components.total.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            ReasonRank uses a PageRank-inspired algorithm to rank arguments based on their
            evidence quality, resistance to counterarguments, network position, and community
            consensus. Higher scores indicate more influential arguments.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REASON RANK LEADERBOARD - Top arguments by ReasonRank
// ============================================================================
const ReasonRankLeaderboard = ({ arguments: args, onSelect, title = 'Top Ranked Arguments' }) => {
  const rankedArgs = useMemo(() => {
    const flattenArgs = (argList) => {
      let result = [];
      argList.forEach(arg => {
        result.push(arg);
        if (arg.subArguments) {
          result = result.concat(flattenArgs(arg.subArguments));
        }
      });
      return result;
    };

    return flattenArgs(args)
      .filter(a => a.reasonRankScore !== undefined)
      .sort((a, b) => (b.reasonRankScore || 0) - (a.reasonRankScore || 0))
      .slice(0, 10);
  }, [args]);

  const getScoreInterpretation = (score) => {
    if (score >= 0.8) return { label: 'Exceptional', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 0.6) return { label: 'Strong', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 0.2) return { label: 'Weak', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Very Weak', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (rankedArgs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        No ranked arguments available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {rankedArgs.map((arg, idx) => {
          const interpretation = getScoreInterpretation(arg.reasonRankScore);
          const isSupporting = arg.type === 'supporting';

          return (
            <button
              key={arg._id}
              onClick={() => onSelect?.(arg)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isSupporting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isSupporting ? 'PRO' : 'CON'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${interpretation.bg} ${interpretation.color}`}>
                      {interpretation.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{arg.content}</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-gray-900">
                    {arg.reasonRankScore?.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">RR Score</div>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isSupporting ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(arg.reasonRankScore || 0) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// REASON RANK COMPARISON - Compare two arguments
// ============================================================================
const ReasonRankComparison = ({ argument1, argument2 }) => {
  if (!argument1 || !argument2) return null;

  const score1 = argument1.reasonRankScore || 0;
  const score2 = argument2.reasonRankScore || 0;
  const winner = score1 > score2 ? 1 : score1 < score2 ? 2 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4" />
        ReasonRank Comparison
      </h3>

      <div className="flex items-stretch gap-4">
        {/* Argument 1 */}
        <div
          className={`flex-1 p-4 rounded-lg border-2 ${
            winner === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                argument1.type === 'supporting'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {argument1.type === 'supporting' ? 'PRO' : 'CON'}
            </span>
            {winner === 1 && (
              <span className="text-xs text-green-600 font-medium">Winner</span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-3 mb-3">{argument1.content}</p>
          <div className="text-2xl font-bold text-gray-900">{score1.toFixed(3)}</div>
        </div>

        {/* VS */}
        <div className="flex items-center">
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-500">
            vs
          </div>
        </div>

        {/* Argument 2 */}
        <div
          className={`flex-1 p-4 rounded-lg border-2 ${
            winner === 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                argument2.type === 'supporting'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {argument2.type === 'supporting' ? 'PRO' : 'CON'}
            </span>
            {winner === 2 && (
              <span className="text-xs text-green-600 font-medium">Winner</span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-3 mb-3">{argument2.content}</p>
          <div className="text-2xl font-bold text-gray-900">{score2.toFixed(3)}</div>
        </div>
      </div>

      {/* Difference */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Difference: <span className="font-semibold">{Math.abs(score1 - score2).toFixed(3)}</span>
        {winner !== 0 && (
          <span className="ml-2">
            ({winner === 1 ? 'Argument 1' : 'Argument 2'} is {(Math.abs(score1 - score2) / Math.min(score1, score2) * 100).toFixed(1)}% stronger)
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MINI REASON RANK BADGE - Small inline display
// ============================================================================
const ReasonRankBadge = ({ score, size = 'md' }) => {
  const getColorClass = (s) => {
    if (s >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
    if (s >= 0.6) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (s >= 0.4) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (s >= 0.2) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        getColorClass(score)
      } ${sizeClasses[size]}`}
    >
      <BarChart3 className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      {score?.toFixed(3)}
    </span>
  );
};

// ============================================================================
// NETWORK INFLUENCE CHART - Visual representation of argument influence
// ============================================================================
const NetworkInfluenceChart = ({ arguments: args }) => {
  const data = useMemo(() => {
    const flattenArgs = (argList) => {
      let result = [];
      argList.forEach(arg => {
        result.push(arg);
        if (arg.subArguments) {
          result = result.concat(flattenArgs(arg.subArguments));
        }
      });
      return result;
    };

    const allArgs = flattenArgs(args);
    const supporting = allArgs.filter(a => a.type === 'supporting');
    const opposing = allArgs.filter(a => a.type === 'opposing');

    const avgReasonRankSupporting = supporting.length > 0
      ? supporting.reduce((sum, a) => sum + (a.reasonRankScore || 0), 0) / supporting.length
      : 0;
    const avgReasonRankOpposing = opposing.length > 0
      ? opposing.reduce((sum, a) => sum + (a.reasonRankScore || 0), 0) / opposing.length
      : 0;

    const totalInfluenceSupporting = supporting.reduce((sum, a) => sum + (a.reasonRankScore || 0), 0);
    const totalInfluenceOpposing = opposing.reduce((sum, a) => sum + (a.reasonRankScore || 0), 0);
    const totalInfluence = totalInfluenceSupporting + totalInfluenceOpposing;

    return {
      supporting: {
        count: supporting.length,
        avgReasonRank: avgReasonRankSupporting,
        totalInfluence: totalInfluenceSupporting,
        percentage: totalInfluence > 0 ? (totalInfluenceSupporting / totalInfluence) * 100 : 50,
      },
      opposing: {
        count: opposing.length,
        avgReasonRank: avgReasonRankOpposing,
        totalInfluence: totalInfluenceOpposing,
        percentage: totalInfluence > 0 ? (totalInfluenceOpposing / totalInfluence) * 100 : 50,
      },
    };
  }, [args]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Network Influence Balance
      </h3>

      {/* Tug-of-war visualization */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-green-600 font-medium">PRO</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${data.supporting.percentage}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${data.opposing.percentage}%` }}
            />
          </div>
          <span className="text-xs text-red-600 font-medium">CON</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{data.supporting.percentage.toFixed(1)}%</span>
          <span>{data.opposing.percentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Supporting */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 font-medium mb-1">Supporting</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Count</span>
              <span className="text-xs font-semibold">{data.supporting.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Avg RR</span>
              <span className="text-xs font-semibold">{data.supporting.avgReasonRank.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Total</span>
              <span className="text-xs font-semibold">{data.supporting.totalInfluence.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Opposing */}
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-xs text-red-600 font-medium mb-1">Opposing</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Count</span>
              <span className="text-xs font-semibold">{data.opposing.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Avg RR</span>
              <span className="text-xs font-semibold">{data.opposing.avgReasonRank.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Total</span>
              <span className="text-xs font-semibold">{data.opposing.totalInfluence.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  ReasonRankBreakdown,
  ReasonRankLeaderboard,
  ReasonRankComparison,
  ReasonRankBadge,
  NetworkInfluenceChart,
};

export default ReasonRankBreakdown;
