import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ChevronRight,
  ChevronDown,
  Plus,
  Link as LinkIcon,
  BarChart3,
  Eye,
  EyeOff,
  Layers,
  GitBranch,
  Target,
  ArrowRight,
  X,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { beliefAPI, argumentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// ARGUMENT NODE COMPONENT - Individual node in the map
// ============================================================================
const ArgumentNode = ({
  argument,
  depth = 0,
  expanded,
  onToggleExpand,
  onSelect,
  isSelected,
  showScores,
  showLinks,
  highlightedPath,
  parentType,
}) => {
  const isSupporting = argument.type === 'supporting';
  const hasSubArguments = argument.subArguments && argument.subArguments.length > 0;
  const isInPath = highlightedPath?.includes(argument._id);

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBorderColor = () => {
    if (isSelected) return 'border-blue-500 ring-2 ring-blue-200';
    if (isInPath) return 'border-purple-500 ring-1 ring-purple-200';
    return isSupporting ? 'border-green-300 hover:border-green-400' : 'border-red-300 hover:border-red-400';
  };

  const getBackgroundColor = () => {
    if (isSelected) return 'bg-blue-50';
    if (isInPath) return 'bg-purple-50';
    return 'bg-white';
  };

  return (
    <div className={`relative ${depth > 0 ? 'ml-6' : ''}`}>
      {/* Connection line to parent */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none">
          <div
            className={`absolute left-0 top-6 h-px w-6 ${
              isSupporting ? 'bg-green-300' : 'bg-red-300'
            }`}
          />
          <div
            className={`absolute left-0 top-0 w-px h-6 ${
              isSupporting ? 'bg-green-300' : 'bg-red-300'
            }`}
          />
        </div>
      )}

      {/* Node Card */}
      <div
        className={`
          relative rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200
          ${getBorderColor()} ${getBackgroundColor()}
          hover:shadow-md
        `}
        onClick={() => onSelect(argument)}
      >
        <div className="p-3">
          {/* Header Row */}
          <div className="flex items-start gap-2">
            {/* Expand/Collapse Button */}
            {hasSubArguments && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(argument._id);
                }}
                className="mt-0.5 p-0.5 hover:bg-gray-100 rounded"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}

            {/* Type Badge */}
            <span
              className={`
                shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full
                ${isSupporting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}
            >
              {isSupporting ? 'PRO' : 'CON'}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-2">{argument.content}</p>

              {/* Meta info */}
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>{argument.author?.username || 'Anonymous'}</span>
                {hasSubArguments && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {argument.subArguments.length}
                  </span>
                )}
                {argument.evidence?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    {argument.evidence.length}
                  </span>
                )}
              </div>
            </div>

            {/* Score Badge */}
            {showScores && (
              <div className="shrink-0 text-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${getScoreColor(argument.scores?.overall || 0)}
                  `}
                >
                  {Math.round(argument.scores?.overall || 0)}
                </div>
                {argument.reasonRankScore && (
                  <div className="mt-1 text-xs text-gray-500">
                    RR: {argument.reasonRankScore.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Score Breakdown (if expanded and scores enabled) */}
          {showScores && isSelected && (
            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className={`text-sm font-semibold ${getScoreTextColor(argument.scores?.logical || 0)}`}>
                  {Math.round(argument.scores?.logical || 0)}
                </div>
                <div className="text-xs text-gray-500">Logic</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${getScoreTextColor(argument.scores?.linkage || 0)}`}>
                  {Math.round(argument.scores?.linkage || 0)}
                </div>
                <div className="text-xs text-gray-500">Linkage</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${getScoreTextColor(argument.scores?.importance || 0)}`}>
                  {Math.round(argument.scores?.importance || 0)}
                </div>
                <div className="text-xs text-gray-500">Impact</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-arguments (recursive) */}
      {hasSubArguments && expanded && (
        <div className="mt-2 space-y-2">
          {argument.subArguments.map((subArg) => (
            <ArgumentNode
              key={subArg._id}
              argument={subArg}
              depth={depth + 1}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              isSelected={isSelected}
              showScores={showScores}
              showLinks={showLinks}
              highlightedPath={highlightedPath}
              parentType={argument.type}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ARGUMENT DETAIL SIDEBAR - Shows detailed view of selected argument
// ============================================================================
const ArgumentDetailSidebar = ({ argument, belief, onClose, onAddSubArgument }) => {
  const { isAuthenticated } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);

  if (!argument) return null;

  const isSupporting = argument.type === 'supporting';

  const getScoreInterpretation = (score) => {
    if (score >= 80) return { text: 'Very Strong', color: 'text-green-600', icon: TrendingUp };
    if (score >= 60) return { text: 'Strong', color: 'text-green-500', icon: TrendingUp };
    if (score >= 40) return { text: 'Moderate', color: 'text-yellow-600', icon: Minus };
    if (score >= 20) return { text: 'Weak', color: 'text-orange-500', icon: TrendingDown };
    return { text: 'Very Weak', color: 'text-red-600', icon: TrendingDown };
  };

  const interpretation = getScoreInterpretation(argument.scores?.overall || 0);
  const InterpretationIcon = interpretation.icon;

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Argument Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Type and Status */}
        <div className="flex items-center gap-2">
          <span
            className={`
              px-3 py-1 text-sm font-semibold rounded-full
              ${isSupporting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            `}
          >
            {isSupporting ? 'Supporting' : 'Opposing'}
          </span>
          {argument.lifecycleStatus && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {argument.lifecycleStatus}
            </span>
          )}
        </div>

        {/* Argument Content */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Argument</h4>
          <p className="text-gray-800">{argument.content}</p>
        </div>

        {/* Author */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Author</h4>
          <p className="text-gray-700">{argument.author?.username || 'Anonymous'}</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Overall Score</h4>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {Math.round(argument.scores?.overall || 0)}
            </div>
            <div className={`flex items-center gap-1 ${interpretation.color}`}>
              <InterpretationIcon className="w-5 h-5" />
              <span className="font-medium">{interpretation.text}</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Score Breakdown</h4>
          <div className="space-y-3">
            {[
              { label: 'Logical Coherence', value: argument.scores?.logical, key: 'logical' },
              { label: 'Linkage Relevance', value: argument.scores?.linkage, key: 'linkage' },
              { label: 'Importance', value: argument.scores?.importance, key: 'importance' },
            ].map(({ label, value, key }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{Math.round(value || 0)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (value || 0) >= 70 ? 'bg-green-500' :
                      (value || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ReasonRank */}
        {argument.reasonRankScore && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">ReasonRank Score</h4>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {argument.reasonRankScore.toFixed(3)}
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Network influence based on supporting evidence and counterargument resistance
            </p>
          </div>
        )}

        {/* Health Metrics */}
        {argument.healthMetrics && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Health Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Strength', value: argument.healthMetrics.strength },
                { label: 'Integrity', value: argument.healthMetrics.integrity },
                { label: 'Freshness', value: argument.healthMetrics.freshness },
                { label: 'Relevance', value: argument.healthMetrics.relevance },
                { label: 'Impact', value: argument.healthMetrics.impact },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-lg font-semibold text-gray-900">{Math.round(value || 0)}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {argument.evidence && argument.evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Evidence ({argument.evidence.length})
            </h4>
            <div className="space-y-2">
              {argument.evidence.slice(0, 3).map((ev, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="text-gray-700 line-clamp-2">{ev.title || ev.content}</p>
                  {ev.qualityScore && (
                    <span className="text-xs text-gray-500">
                      Quality: {ev.qualityScore}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-arguments Summary */}
        {argument.subArguments && argument.subArguments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Sub-arguments ({argument.subArguments.length})
            </h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-green-50 rounded p-2 text-center">
                <div className="text-lg font-semibold text-green-700">
                  {argument.subArguments.filter(sa => sa.type === 'supporting').length}
                </div>
                <div className="text-xs text-green-600">Supporting</div>
              </div>
              <div className="flex-1 bg-red-50 rounded p-2 text-center">
                <div className="text-lg font-semibold text-red-700">
                  {argument.subArguments.filter(sa => sa.type === 'opposing').length}
                </div>
                <div className="text-xs text-red-600">Opposing</div>
              </div>
            </div>
          </div>
        )}

        {/* Voting */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Community Votes</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium">{argument.votes?.up || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium">{argument.votes?.down || 0}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isAuthenticated && (
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <Link
              to={`/beliefs/${belief?._id}/add-argument?parentId=${argument._id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Sub-argument
            </Link>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Link Evidence
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// BELIEF HEADER - Shows the main belief/claim being mapped
// ============================================================================
const BeliefHeader = ({ belief }) => {
  if (!belief) return null;

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-blue-200 text-sm font-medium">Main Claim</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{belief.statement}</h1>
          {belief.description && (
            <p className="text-blue-100 text-sm">{belief.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              {belief.statistics?.totalArguments || 0} arguments
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {belief.statistics?.views || 0} views
            </span>
          </div>
        </div>

        <div className="text-center bg-white/10 rounded-lg p-4">
          <div className="text-sm text-blue-200 mb-1">Conclusion Score</div>
          <div className={`text-4xl font-bold ${belief.conclusionScore >= 50 ? 'text-green-300' : 'text-red-300'}`}>
            {Math.round(belief.conclusionScore || 50)}
          </div>
          <div className="text-xs text-blue-200 mt-1">
            {belief.conclusionScore >= 70 ? 'Strongly Supported' :
             belief.conclusionScore >= 50 ? 'Moderately Supported' :
             belief.conclusionScore >= 30 ? 'Contested' : 'Weakly Supported'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// NETWORK STATS - Shows statistics about the argument network
// ============================================================================
const NetworkStats = ({ belief, arguments: args }) => {
  const stats = useMemo(() => {
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
    const avgScore = allArgs.length > 0
      ? allArgs.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) / allArgs.length
      : 0;
    const avgReasonRank = allArgs.length > 0
      ? allArgs.reduce((sum, a) => sum + (a.reasonRankScore || 0), 0) / allArgs.length
      : 0;
    const maxDepth = (() => {
      let max = 0;
      const calcDepth = (argList, depth) => {
        argList.forEach(a => {
          max = Math.max(max, depth);
          if (a.subArguments) calcDepth(a.subArguments, depth + 1);
        });
      };
      calcDepth(args, 1);
      return max;
    })();

    return {
      total: allArgs.length,
      supporting: supporting.length,
      opposing: opposing.length,
      avgScore: avgScore.toFixed(1),
      avgReasonRank: avgReasonRank.toFixed(3),
      maxDepth,
    };
  }, [args]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Network Statistics
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Args</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-xl font-bold text-green-700">{stats.supporting}</div>
          <div className="text-xs text-green-600">Supporting</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="text-xl font-bold text-red-700">{stats.opposing}</div>
          <div className="text-xs text-red-600">Opposing</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-xl font-bold text-blue-700">{stats.avgScore}</div>
          <div className="text-xs text-blue-600">Avg Score</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="text-xl font-bold text-purple-700">{stats.avgReasonRank}</div>
          <div className="text-xs text-purple-600">Avg RR</div>
        </div>
        <div className="text-center p-2 bg-indigo-50 rounded">
          <div className="text-xl font-bold text-indigo-700">{stats.maxDepth}</div>
          <div className="text-xs text-indigo-600">Max Depth</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOP RANKED ARGUMENTS - Shows highest ReasonRank arguments
// ============================================================================
const TopRankedArguments = ({ arguments: args, onSelect }) => {
  const topArgs = useMemo(() => {
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
      .filter(a => a.reasonRankScore)
      .sort((a, b) => (b.reasonRankScore || 0) - (a.reasonRankScore || 0))
      .slice(0, 5);
  }, [args]);

  if (topArgs.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Top Ranked Arguments
      </h3>
      <div className="space-y-2">
        {topArgs.map((arg, idx) => (
          <button
            key={arg._id}
            onClick={() => onSelect(arg)}
            className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 line-clamp-1">{arg.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      arg.type === 'supporting'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {arg.type === 'supporting' ? 'PRO' : 'CON'}
                  </span>
                  <span className="text-xs text-gray-500">
                    RR: {arg.reasonRankScore?.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ARGUMENT MAP PAGE
// ============================================================================
const ArgumentMap = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  // State
  const [belief, setBelief] = useState(null);
  const [arguments_, setArguments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArgument, setSelectedArgument] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showScores, setShowScores] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, supporting, opposing
  const [sortBy, setSortBy] = useState('reasonRank'); // reasonRank, score, recent
  const [highlightedPath, setHighlightedPath] = useState(null);

  // Fetch belief and arguments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const beliefResponse = await beliefAPI.getById(id);

        if (beliefResponse.success) {
          setBelief(beliefResponse.data);

          // Combine supporting and opposing arguments
          const allArgs = [
            ...(beliefResponse.data.supportingArguments || []),
            ...(beliefResponse.data.opposingArguments || []),
          ];
          setArguments(allArgs);

          // Auto-expand first level
          const firstLevel = new Set(allArgs.map(a => a._id));
          setExpandedNodes(firstLevel);
        }
      } catch (err) {
        setError(err.message || 'Failed to load argument map');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Toggle node expansion
  const handleToggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Select argument
  const handleSelectArgument = useCallback((argument) => {
    setSelectedArgument(argument);

    // Build path from root to selected argument
    const buildPath = (args, targetId, currentPath = []) => {
      for (const arg of args) {
        const newPath = [...currentPath, arg._id];
        if (arg._id === targetId) {
          return newPath;
        }
        if (arg.subArguments) {
          const result = buildPath(arg.subArguments, targetId, newPath);
          if (result) return result;
        }
      }
      return null;
    };

    const path = buildPath(arguments_, argument._id);
    setHighlightedPath(path);
  }, [arguments_]);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const allIds = new Set();
    const collectIds = (args) => {
      args.forEach(arg => {
        allIds.add(arg._id);
        if (arg.subArguments) collectIds(arg.subArguments);
      });
    };
    collectIds(arguments_);
    setExpandedNodes(allIds);
  }, [arguments_]);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Filter and sort arguments
  const filteredArguments = useMemo(() => {
    let result = [...arguments_];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(arg => arg.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reasonRank':
          return (b.reasonRankScore || 0) - (a.reasonRankScore || 0);
        case 'score':
          return (b.scores?.overall || 0) - (a.scores?.overall || 0);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filterBySearch = (args) => {
        return args.filter(arg => {
          const matches = arg.content?.toLowerCase().includes(query) ||
            arg.author?.username?.toLowerCase().includes(query);
          if (matches) return true;
          if (arg.subArguments) {
            const filteredSubs = filterBySearch(arg.subArguments);
            return filteredSubs.length > 0;
          }
          return false;
        });
      };
      result = filterBySearch(result);
    }

    return result;
  }, [arguments_, filterType, sortBy, searchQuery]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const beliefResponse = await beliefAPI.getById(id);
      if (beliefResponse.success) {
        setBelief(beliefResponse.data);
        const allArgs = [
          ...(beliefResponse.data.supportingArguments || []),
          ...(beliefResponse.data.opposingArguments || []),
        ];
        setArguments(allArgs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Link to="/beliefs" className="text-blue-600 hover:underline">
          Back to Beliefs
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/beliefs/${id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Argument Map</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search arguments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Arguments</option>
              <option value="supporting">Supporting Only</option>
              <option value="opposing">Opposing Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="reasonRank">Sort by ReasonRank</option>
              <option value="score">Sort by Score</option>
              <option value="recent">Sort by Recent</option>
            </select>

            {/* Toggle Scores */}
            <button
              onClick={() => setShowScores(!showScores)}
              className={`p-2 rounded-lg border ${
                showScores ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-500'
              }`}
              title="Toggle Scores"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Expand/Collapse All */}
            <button
              onClick={handleExpandAll}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
              title="Expand All"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
              title="Collapse All"
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Add Argument */}
            {isAuthenticated && (
              <Link
                to={`/beliefs/${id}/add-argument`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Argument
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Stats */}
        <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto space-y-4">
          <NetworkStats belief={belief} arguments={arguments_} />
          <TopRankedArguments arguments={arguments_} onSelect={handleSelectArgument} />
        </div>

        {/* Center - Map */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Belief Header */}
          <BeliefHeader belief={belief} />

          {/* Arguments Tree */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            {/* Supporting Arguments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Supporting Arguments</h2>
                <span className="text-sm text-gray-500">
                  ({filteredArguments.filter(a => a.type === 'supporting').length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredArguments
                  .filter(arg => arg.type === 'supporting')
                  .map((argument) => (
                    <ArgumentNode
                      key={argument._id}
                      argument={argument}
                      depth={0}
                      expanded={expandedNodes.has(argument._id)}
                      onToggleExpand={handleToggleExpand}
                      onSelect={handleSelectArgument}
                      isSelected={selectedArgument?._id === argument._id}
                      showScores={showScores}
                      showLinks={showLinks}
                      highlightedPath={highlightedPath}
                    />
                  ))}
                {filteredArguments.filter(a => a.type === 'supporting').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No supporting arguments yet
                  </div>
                )}
              </div>
            </div>

            {/* Opposing Arguments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Opposing Arguments</h2>
                <span className="text-sm text-gray-500">
                  ({filteredArguments.filter(a => a.type === 'opposing').length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredArguments
                  .filter(arg => arg.type === 'opposing')
                  .map((argument) => (
                    <ArgumentNode
                      key={argument._id}
                      argument={argument}
                      depth={0}
                      expanded={expandedNodes.has(argument._id)}
                      onToggleExpand={handleToggleExpand}
                      onSelect={handleSelectArgument}
                      isSelected={selectedArgument?._id === argument._id}
                      showScores={showScores}
                      showLinks={showLinks}
                      highlightedPath={highlightedPath}
                    />
                  ))}
                {filteredArguments.filter(a => a.type === 'opposing').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No opposing arguments yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Selected Argument Details */}
        {selectedArgument && (
          <ArgumentDetailSidebar
            argument={selectedArgument}
            belief={belief}
            onClose={() => {
              setSelectedArgument(null);
              setHighlightedPath(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ArgumentMap;
