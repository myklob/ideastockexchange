import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * JournalStanceView - Two-column view showing journals that agree/disagree with a belief
 *
 * This component displays peer-reviewed journals in two columns:
 * - Left: Journals that support the belief
 * - Right: Journals that oppose the belief
 *
 * Each journal is displayed with its ReasonRank score and supporting studies
 */

const JournalStanceView = ({ beliefId, beliefStatement }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [minStrength, setMinStrength] = useState(0);
  const [sortBy, setSortBy] = useState('stanceStrength');
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    if (beliefId) {
      fetchJournalStances();
    }
  }, [beliefId, minStrength]);

  const fetchJournalStances = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/journals/by-belief/${beliefId}?minStrength=${minStrength}`
      );
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch journal stances');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (journalId) => {
    setShowDetails(prev => ({
      ...prev,
      [journalId]: !prev[journalId]
    }));
  };

  const sortJournals = (journals) => {
    if (!journals) return [];

    return [...journals].sort((a, b) => {
      if (sortBy === 'stanceStrength') {
        return b.stanceStrength - a.stanceStrength;
      } else if (sortBy === 'journalScore') {
        return b.journal.reasonRankScore - a.journal.reasonRankScore;
      } else if (sortBy === 'studyCount') {
        return b.metrics.totalStudies - a.metrics.totalStudies;
      }
      return 0;
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 35) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStanceColor = (strength) => {
    if (strength >= 80) return 'bg-green-100 dark:bg-green-900';
    if (strength >= 60) return 'bg-blue-100 dark:bg-blue-900';
    if (strength >= 40) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-orange-100 dark:bg-orange-900';
  };

  const JournalCard = ({ journal, position }) => {
    const isExpanded = showDetails[journal.journal.name];

    return (
      <div className={`mb-4 p-4 rounded-lg shadow-md ${getStanceColor(journal.stanceStrength)} border border-gray-200 dark:border-gray-700`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {journal.journal.name}
          </h3>
          <div className="flex flex-col items-end space-y-1">
            <span className={`text-sm font-bold ${getScoreColor(journal.stanceStrength)}`}>
              Stance: {journal.stanceStrength.toFixed(1)}
            </span>
            <span className={`text-xs ${getScoreColor(journal.journal.reasonRankScore)}`}>
              Journal: {journal.journal.reasonRankScore.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>IF: {journal.journal.impactFactor?.toFixed(2) || 'N/A'}</span>
          <span>Studies: {journal.metrics.totalStudies}</span>
          <span>Confidence: {(journal.confidence * 100).toFixed(0)}%</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-500">
            <span className="mr-3">✓ Supporting: {journal.metrics.supporting}</span>
            <span className="mr-3">✗ Opposing: {journal.metrics.opposing}</span>
            <span>○ Neutral: {journal.metrics.neutral}</span>
          </div>

          <button
            onClick={() => toggleDetails(journal.journal.name)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Quality Metrics:</p>
                <p>Average Study Quality: {journal.metrics.averageQuality.toFixed(1)}</p>
                <p>Consistency: {(journal.metrics.consistency * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Time Range:</p>
                <p>First: {journal.timeRange.first ? new Date(journal.timeRange.first).getFullYear() : 'N/A'}</p>
                <p>Latest: {journal.timeRange.last ? new Date(journal.timeRange.last).getFullYear() : 'N/A'}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="font-semibold text-sm mb-1">Score Breakdown:</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Journal Quality (40%):</span>
                  <span>{(journal.journal.reasonRankScore * 0.4).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Study Quality (30%):</span>
                  <span>{(journal.metrics.averageQuality * 0.3).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Study Count (20%):</span>
                  <span>{(Math.min(journal.metrics.totalStudies / 10, 1) * 100 * 0.2).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consistency (10%):</span>
                  <span>{(journal.metrics.consistency * 100 * 0.1).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const supporting = sortJournals(data.supporting);
  const opposing = sortJournals(data.opposing);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Peer-Reviewed Journal Analysis
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {beliefStatement || data.belief.statement}
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
            Belief Score: {data.belief.conclusionScore.toFixed(1)}
          </span>
          <span className="px-3 py-1 bg-green-200 dark:bg-green-700 rounded-full">
            {data.summary.supportingCount} Supporting
          </span>
          <span className="px-3 py-1 bg-red-200 dark:bg-red-700 rounded-full">
            {data.summary.opposingCount} Opposing
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Min Strength:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={minStrength}
              onChange={(e) => setMinStrength(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {minStrength}
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="stanceStrength">Stance Strength</option>
              <option value="journalScore">Journal Score</option>
              <option value="studyCount">Study Count</option>
            </select>
          </label>
        </div>

        <button
          onClick={fetchJournalStances}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supporting Journals */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Journals That Agree ({supporting.length})
            </h2>
          </div>

          {supporting.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center text-gray-600 dark:text-gray-400">
              No supporting journals found
            </div>
          ) : (
            <div className="space-y-4">
              {supporting.map((journal, idx) => (
                <JournalCard key={idx} journal={journal} position="supporting" />
              ))}
            </div>
          )}
        </div>

        {/* Opposing Journals */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
              Journals That Disagree ({opposing.length})
            </h2>
          </div>

          {opposing.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center text-gray-600 dark:text-gray-400">
              No opposing journals found
            </div>
          ) : (
            <div className="space-y-4">
              {opposing.map((journal, idx) => (
                <JournalCard key={idx} journal={journal} position="opposing" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mixed and Neutral Journals */}
      {(data.mixed?.length > 0 || data.neutral?.length > 0) && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
            Other Journals
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.mixed?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400 mb-3">
                  Mixed Position ({data.mixed.length})
                </h3>
                <div className="space-y-4">
                  {sortJournals(data.mixed).map((journal, idx) => (
                    <JournalCard key={idx} journal={journal} position="mixed" />
                  ))}
                </div>
              </div>
            )}

            {data.neutral?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Neutral ({data.neutral.length})
                </h3>
                <div className="space-y-4">
                  {sortJournals(data.neutral).map((journal, idx) => (
                    <JournalCard key={idx} journal={journal} position="neutral" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalStanceView;
