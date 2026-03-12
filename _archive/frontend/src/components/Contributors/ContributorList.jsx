import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Filter, Users, TrendingUp, TrendingDown } from 'lucide-react';
import ContributorCard from './ContributorCard';
import { contributorAPI } from '../../services/api';

/**
 * ContributorList Component
 *
 * Displays a ranked list of contributors for a belief with sorting and filtering options.
 * Supports sorting by:
 * - Combined Score (C = I × L/100) - default
 * - Influence (I) - to show fame/reach
 * - Stance Strength (|L|) - to show clarity
 */
const ContributorList = ({ beliefId, showActions = false, onEdit, onDelete }) => {
  const [contributors, setContributors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('combined'); // 'combined', 'influence', 'stance'
  const [filterRole, setFilterRole] = useState('all'); // 'all', 'supporter', 'opponent'

  // Fetch contributors
  useEffect(() => {
    fetchContributors();
  }, [beliefId, sortBy, filterRole]);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await contributorAPI.getBeliefContributors(beliefId, {
        sortBy,
        filterRole,
      });

      if (response.success) {
        setContributors(response.data.contributors);
        setSummary(response.data.summary);
      } else {
        setError(response.error || 'Failed to load contributors');
      }
    } catch (err) {
      console.error('Error fetching contributors:', err);
      setError(err.response?.data?.error || 'Failed to load contributors');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleFilterChange = (newFilter) => {
    setFilterRole(newFilter);
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading contributors</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Contributor Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-sm text-gray-500">Total Contributors</div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{summary.totalSupporters}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Supporters
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-red-600">{summary.totalOpponents}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                Opponents
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{summary.totalNeutral}</div>
              <div className="text-sm text-gray-500">Neutral</div>
            </div>
          </div>

          {/* Top Contributors Preview */}
          {summary.topSupporters && summary.topSupporters.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Supporters</h4>
              <div className="flex flex-wrap gap-2">
                {summary.topSupporters.slice(0, 3).map((contributor) => (
                  <span
                    key={contributor._id}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full"
                  >
                    {contributor.name} ({(contributor.combinedScore || 0).toFixed(1)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.topOpponents && summary.topOpponents.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Opponents</h4>
              <div className="flex flex-wrap gap-2">
                {summary.topOpponents.slice(0, 3).map((contributor) => (
                  <span
                    key={contributor._id}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full"
                  >
                    {contributor.name} ({(contributor.combinedScore || 0).toFixed(1)})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls - Sort and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSortChange('combined')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'combined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Combined (C)
            </button>
            <button
              onClick={() => handleSortChange('influence')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'influence'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Influence (I)
            </button>
            <button
              onClick={() => handleSortChange('stance')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'stance'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Stance (|L|)
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterRole === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('supporter')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterRole === 'supporter'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Supporters
            </button>
            <button
              onClick={() => handleFilterChange('opponent')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterRole === 'opponent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Opponents
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {contributors.length} Contributor{contributors.length !== 1 ? 's' : ''}
          {filterRole !== 'all' && ` (${filterRole}s)`}
        </h3>
        <p className="text-sm text-gray-500">
          Sorted by {sortBy === 'combined' ? 'Combined Score' : sortBy === 'influence' ? 'Influence' : 'Stance Strength'}
        </p>
      </div>

      {/* Contributor Cards */}
      {contributors.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contributors yet</h3>
          <p className="text-gray-500">
            Be the first to add a contributor to this belief!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributors.map((contributor) => (
            <ContributorCard
              key={contributor._id}
              contributor={contributor}
              showActions={showActions}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributorList;
