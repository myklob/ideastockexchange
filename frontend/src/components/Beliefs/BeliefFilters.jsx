import React from 'react';
import { Filter, X } from 'lucide-react';

const BeliefFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const categories = [
    'all',
    'politics',
    'science',
    'technology',
    'philosophy',
    'economics',
    'social',
    'other'
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'score-desc', label: 'Highest Score' },
    { value: 'score-asc', label: 'Lowest Score' },
    { value: 'arguments', label: 'Most Arguments' },
    { value: 'views', label: 'Most Views' },
    { value: 'trending', label: 'Trending' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ];

  const hasActiveFilters = () => {
    return filters.category !== 'all' ||
           filters.status !== 'all' ||
           filters.sort !== 'recent';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Score Range Filter */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conclusion Score Range
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="100"
            value={filters.minScore || 0}
            onChange={(e) => onFilterChange({ ...filters, minScore: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-16 text-center">
            {filters.minScore || 0} - 100
          </span>
        </div>
      </div>
    </div>
  );
};

export default BeliefFilters;
