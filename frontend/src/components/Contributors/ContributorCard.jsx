import React from 'react';
import { User, TrendingUp, TrendingDown, Minus, Award, ExternalLink } from 'lucide-react';

/**
 * ContributorCard Component
 *
 * Displays a single contributor's information with their two-factor rating:
 * - Influence Score (I): 0-100 - how far their voice carries
 * - Linkage Score (L): -100 to +100 - stance strength and direction
 * - Combined Score (C = I × L/100) - overall impact
 */
const ContributorCard = ({ contributor, showActions = false, onEdit, onDelete }) => {
  // Calculate combined score if not provided
  const influenceScore = contributor.influenceScore || 0;
  const linkageScore = contributor.linkageScore || 0;
  const combinedScore = influenceScore * (linkageScore / 100);
  const stanceStrength = Math.abs(linkageScore);

  // Determine role based on combined score
  const getRole = () => {
    if (combinedScore > 50) return 'Strong Supporter';
    if (combinedScore > 0) return 'Supporter';
    if (combinedScore === 0) return 'Neutral';
    if (combinedScore > -50) return 'Opponent';
    return 'Strong Opponent';
  };

  // Get color for combined score
  const getCombinedScoreColor = () => {
    if (combinedScore > 50) return 'text-green-700 bg-green-50 border-green-300';
    if (combinedScore > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (combinedScore === 0) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (combinedScore > -50) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-red-700 bg-red-50 border-red-300';
  };

  // Get icon for stance
  const getStanceIcon = () => {
    if (linkageScore > 0) return <TrendingUp className="w-4 h-4" />;
    if (linkageScore < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Get color for influence score
  const getInfluenceColor = () => {
    if (influenceScore >= 80) return 'text-purple-700';
    if (influenceScore >= 60) return 'text-purple-600';
    if (influenceScore >= 40) return 'text-purple-500';
    if (influenceScore >= 20) return 'text-purple-400';
    return 'text-gray-500';
  };

  // Get color for linkage score
  const getLinkageColor = () => {
    const absScore = Math.abs(linkageScore);
    if (absScore >= 80) return linkageScore > 0 ? 'text-green-700' : 'text-red-700';
    if (absScore >= 60) return linkageScore > 0 ? 'text-green-600' : 'text-red-600';
    if (absScore >= 40) return linkageScore > 0 ? 'text-green-500' : 'text-red-500';
    if (absScore >= 20) return linkageScore > 0 ? 'text-green-400' : 'text-red-400';
    return 'text-gray-500';
  };

  const role = getRole();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-5 border border-gray-200">
      {/* Header with Name and Combined Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {contributor.name}
            </h3>
            {contributor.verified && (
              <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Combined Score Badge */}
        <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${getCombinedScoreColor()}`}>
          {getStanceIcon()}
          <span className="text-xl font-bold">{combinedScore.toFixed(1)}</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
          combinedScore > 0
            ? 'bg-green-100 text-green-800'
            : combinedScore < 0
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {role}
        </span>
      </div>

      {/* Bio */}
      {contributor.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {contributor.bio}
        </p>
      )}

      {/* Expertise Tags */}
      {contributor.expertise && contributor.expertise.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {contributor.expertise.slice(0, 3).map((exp, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full"
            >
              {exp}
            </span>
          ))}
          {contributor.expertise.length > 3 && (
            <span className="text-xs text-gray-500 self-center">
              +{contributor.expertise.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg mb-3">
        {/* Influence Score */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Influence (I)</div>
          <div className={`text-2xl font-bold ${getInfluenceColor()}`}>
            {influenceScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {influenceScore >= 80 ? 'Very High' :
             influenceScore >= 60 ? 'High' :
             influenceScore >= 40 ? 'Moderate' :
             influenceScore >= 20 ? 'Low' : 'Very Low'}
          </div>
        </div>

        {/* Linkage Score */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Linkage (L)</div>
          <div className={`text-2xl font-bold ${getLinkageColor()}`}>
            {linkageScore > 0 ? '+' : ''}{linkageScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stanceStrength >= 80 ? 'Very Strong' :
             stanceStrength >= 60 ? 'Strong' :
             stanceStrength >= 40 ? 'Moderate' :
             stanceStrength >= 20 ? 'Weak' : 'Minimal'}
          </div>
        </div>
      </div>

      {/* Formula Display */}
      <div className="text-center text-xs text-gray-500 mb-3 font-mono bg-gray-100 rounded px-2 py-1">
        C = I × (L/100) = {influenceScore} × ({linkageScore}/100) = {combinedScore.toFixed(1)}
      </div>

      {/* External Links */}
      {contributor.externalLinks && contributor.externalLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {contributor.externalLinks.slice(0, 3).map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {link.type}
            </a>
          ))}
        </div>
      )}

      {/* Footer with Credentials and Sources */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {contributor.influenceSources?.length > 0 && (
              <span>{contributor.influenceSources.length} influence source{contributor.influenceSources.length !== 1 ? 's' : ''}</span>
            )}
            {contributor.influenceSources?.length > 0 && contributor.linkageSources?.length > 0 && (
              <span className="mx-1">•</span>
            )}
            {contributor.linkageSources?.length > 0 && (
              <span>{contributor.linkageSources.length} linkage source{contributor.linkageSources.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {contributor.addedBy && (
            <span className="text-gray-400">
              Added by {contributor.addedBy.username || 'user'}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons (if enabled) */}
      {showActions && (
        <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(contributor)}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(contributor)}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContributorCard;
