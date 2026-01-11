import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, MapPin, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

const LawCard = ({ law, showRelationship = false, relationshipData = null }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      enacted: 'bg-blue-100 text-blue-800',
      proposed: 'bg-yellow-100 text-yellow-800',
      amended: 'bg-purple-100 text-purple-800',
      challenged: 'bg-orange-100 text-orange-800',
      repealed: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.active;
  };

  const getRelationshipBadge = (relationship) => {
    if (!relationship) return null;

    const badges = {
      supports: {
        text: 'Supports',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <TrendingUp className="w-3 h-3" />,
      },
      opposes: {
        text: 'Opposes',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      neutral: {
        text: 'Neutral',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <Clock className="w-3 h-3" />,
      },
    };

    const badge = badges[relationship] || badges.neutral;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getVerificationIcon = (status) => {
    if (status === 'verified') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status === 'disputed') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJurisdictionString = () => {
    const parts = [];
    if (law.jurisdiction.city) parts.push(law.jurisdiction.city);
    if (law.jurisdiction.state) parts.push(law.jurisdiction.state);
    if (law.jurisdiction.country) parts.push(law.jurisdiction.country);
    return parts.join(', ') || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              {law.title}
            </h3>
            {getVerificationIcon(law.verificationStatus)}
          </div>

          {law.officialName && (
            <p className="text-sm text-gray-500 mb-2 font-mono">
              {law.officialName}
            </p>
          )}

          {/* Relationship Badge */}
          {showRelationship && relationshipData && (
            <div className="mb-2">
              {getRelationshipBadge(relationshipData.relationship)}
              {relationshipData.strength && (
                <span className="ml-2 text-xs text-gray-600">
                  Strength: {relationshipData.strength}/100
                </span>
              )}
            </div>
          )}
        </div>

        {/* Overall Score Badge */}
        <div className={`flex items-center justify-center w-16 h-16 rounded-lg border-2 ${getScoreColor(law.scores?.overall || 50)}`}>
          <span className="text-2xl font-bold">{Math.round(law.scores?.overall || 50)}</span>
        </div>
      </div>

      {/* Description */}
      {law.description && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {law.description}
        </p>
      )}

      {/* Jurisdiction and Status */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{getJurisdictionString()}</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(law.status)}`}>
          {law.status}
        </span>
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
          {law.jurisdiction.level}
        </span>
      </div>

      {/* Dates */}
      {law.enactedDate && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <Calendar className="w-4 h-4" />
          <span>Enacted: {formatDate(law.enactedDate)}</span>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Coverage</div>
          <div className={`text-lg font-semibold ${getScoreColor(law.scores?.coverage || 50)}`}>
            {Math.round(law.scores?.coverage || 50)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Enforcement</div>
          <div className={`text-lg font-semibold ${getScoreColor(law.scores?.enforcement || 50)}`}>
            {Math.round(law.scores?.enforcement || 50)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Severity</div>
          <div className={`text-lg font-semibold ${getScoreColor(law.scores?.severity || 50)}`}>
            {Math.round(law.scores?.severity || 50)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Stability</div>
          <div className={`text-lg font-semibold ${getScoreColor(law.scores?.stability || 50)}`}>
            {Math.round(law.scores?.stability || 50)}
          </div>
        </div>
      </div>

      {/* Purpose */}
      {law.context?.purpose && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Purpose:</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{law.context.purpose}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {law.statistics?.views || 0} views • {law.statistics?.citationCount || 0} citations
        </div>

        <Link
          to={`/laws/${law._id}`}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default LawCard;
