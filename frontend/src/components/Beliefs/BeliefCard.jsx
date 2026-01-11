import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MessageSquare, Eye, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const BeliefCard = ({ belief }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 70) return <ArrowUp className="w-4 h-4" />;
    if (score >= 30) return <Minus className="w-4 h-4" />;
    return <ArrowDown className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      politics: 'bg-blue-100 text-blue-800',
      science: 'bg-purple-100 text-purple-800',
      technology: 'bg-indigo-100 text-indigo-800',
      philosophy: 'bg-pink-100 text-pink-800',
      economics: 'bg-green-100 text-green-800',
      social: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            to={`/beliefs/${belief._id}`}
            className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {belief.statement}
          </Link>
          {belief.trending && (
            <span className="inline-flex items-center ml-2 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </span>
          )}
        </div>

        {/* Conclusion Score Badge */}
        <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${getScoreColor(belief.conclusionScore)}`}>
          {getScoreIcon(belief.conclusionScore)}
          <span className="text-2xl font-bold">{Math.round(belief.conclusionScore)}</span>
        </div>
      </div>

      {/* Description */}
      {belief.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {belief.description}
        </p>
      )}

      {/* Tags and Category */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(belief.category)}`}>
          {belief.category}
        </span>
        {belief.tags && belief.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full"
          >
            #{tag}
          </span>
        ))}
        {belief.tags && belief.tags.length > 3 && (
          <span className="text-xs text-gray-500">
            +{belief.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span>{belief.statistics?.totalArguments || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{belief.statistics?.views || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">
              ↑ {belief.statistics?.supportingCount || 0}
            </span>
            <span className="text-red-600">
              ↓ {belief.statistics?.opposingCount || 0}
            </span>
          </div>
        </div>

        {/* Author */}
        <div className="text-sm text-gray-500">
          by <span className="font-medium text-gray-700">{belief.author?.username || 'Anonymous'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-4">
        <Link
          to={`/beliefs/${belief._id}`}
          className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Debate
        </Link>
        <Link
          to={`/beliefs/${belief._id}/add-argument`}
          className="flex-1 px-4 py-2 text-sm font-medium text-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Add Argument
        </Link>
      </div>
    </div>
  );
};

export default BeliefCard;
