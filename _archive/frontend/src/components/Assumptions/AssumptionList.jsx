import React, { useState, useEffect } from 'react';
import AssumptionCard from './AssumptionCard';

const AssumptionList = ({
  assumptions = [],
  onVote,
  onMarkCritical,
  onLinkArgument,
  onRefresh,
  isLoading = false
}) => {
  const [sortBy, setSortBy] = useState('aggregateScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCritical, setFilterCritical] = useState('all');
  const [sortedAssumptions, setSortedAssumptions] = useState([]);

  // Sort and filter assumptions whenever dependencies change
  useEffect(() => {
    let filtered = [...assumptions];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Apply critical filter
    if (filterCritical === 'mustAccept') {
      filtered = filtered.filter(a => a.mustAccept);
    } else if (filterCritical === 'mustReject') {
      filtered = filtered.filter(a => a.mustReject);
    } else if (filterCritical === 'critical') {
      filtered = filtered.filter(a => a.mustAccept || a.mustReject);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'aggregateScore':
          aValue = a.aggregateScore || 0;
          bValue = b.aggregateScore || 0;
          break;
        case 'votes':
          aValue = (a.upvotes - a.downvotes) || 0;
          bValue = (b.upvotes - b.downvotes) || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'dependentArguments':
          aValue = a.dependentArguments?.length || 0;
          bValue = b.dependentArguments?.length || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    setSortedAssumptions(filtered);
  }, [assumptions, sortBy, sortOrder, filterStatus, filterCritical]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if clicking same sort option
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'desc' ? '↓' : '↑';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Sort by:</span>
            <button
              onClick={() => handleSortChange('aggregateScore')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'aggregateScore'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Score {getSortIcon('aggregateScore')}
            </button>
            <button
              onClick={() => handleSortChange('votes')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'votes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Votes {getSortIcon('votes')}
            </button>
            <button
              onClick={() => handleSortChange('dependentArguments')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'dependentArguments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Arguments {getSortIcon('dependentArguments')}
            </button>
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'createdAt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Date {getSortIcon('createdAt')}
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Status</option>
              <option value="proposed">Proposed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="debated">Debated</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filterCritical}
              onChange={(e) => setFilterCritical(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Types</option>
              <option value="critical">Critical Only</option>
              <option value="mustAccept">Must Accept</option>
              <option value="mustReject">Must Reject</option>
            </select>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {/* Count Display */}
        <div className="mt-3 text-sm text-gray-600">
          Showing <span className="font-semibold">{sortedAssumptions.length}</span> of{' '}
          <span className="font-semibold">{assumptions.length}</span> assumption
          {assumptions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Critical Assumptions Summary */}
      {assumptions.some(a => a.mustAccept || a.mustReject) && filterCritical === 'all' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">Critical Assumptions</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-semibold text-green-700">
                {assumptions.filter(a => a.mustAccept).length}
              </span>{' '}
              <span className="text-gray-700">must accept</span>
            </div>
            <div>
              <span className="font-semibold text-red-700">
                {assumptions.filter(a => a.mustReject).length}
              </span>{' '}
              <span className="text-gray-700">must reject</span>
            </div>
          </div>
        </div>
      )}

      {/* Assumptions List */}
      {sortedAssumptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">No assumptions found</p>
          <p className="text-gray-400 text-sm mt-2">
            Be the first to propose an assumption for this belief!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssumptions.map((assumption) => (
            <AssumptionCard
              key={assumption._id}
              assumption={assumption}
              onVote={onVote}
              onMarkCritical={onMarkCritical}
              onLinkArgument={onLinkArgument}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssumptionList;
