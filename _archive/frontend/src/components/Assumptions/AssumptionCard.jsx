import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AssumptionCard = ({ assumption, onVote, onMarkCritical, onLinkArgument, isOwner = false }) => {
  const [showActions, setShowActions] = useState(false);
  const [showLinkedBeliefs, setShowLinkedBeliefs] = useState(false);
  const [showDependentArgs, setShowDependentArgs] = useState(false);

  // Calculate score color based on aggregate score
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'debated':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default: // proposed
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Get link type color and icon
  const getLinkTypeInfo = (linkType) => {
    switch (linkType) {
      case 'requires':
        return { color: 'text-blue-600', icon: '→', label: 'Requires' };
      case 'contradicts':
        return { color: 'text-red-600', icon: '⊗', label: 'Contradicts' };
      case 'supports':
        return { color: 'text-green-600', icon: '✓', label: 'Supports' };
      case 'implies':
        return { color: 'text-purple-600', icon: '⇒', label: 'Implies' };
      default:
        return { color: 'text-gray-600', icon: '—', label: 'Related' };
    }
  };

  const handleVote = (voteType) => {
    if (onVote) {
      onVote(assumption._id, voteType);
    }
  };

  const handleMarkCritical = (type) => {
    if (onMarkCritical) {
      const reason = prompt(`Please provide a reason why this assumption ${type === 'accept' ? 'must be accepted' : 'must be rejected'}:`);
      if (reason) {
        onMarkCritical(assumption._id, type, reason);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 ${
      assumption.mustAccept ? 'border-green-500' :
      assumption.mustReject ? 'border-red-500' :
      'border-gray-300'
    }`}>
      {/* Header with score and status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {/* Aggregate Score */}
            <span className={`text-2xl font-bold px-3 py-1 rounded ${getScoreColor(assumption.aggregateScore)}`}>
              {assumption.aggregateScore}
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(assumption.status)}`}>
              {assumption.status.toUpperCase()}
            </span>

            {/* Critical Flags */}
            {assumption.mustAccept && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">
                MUST ACCEPT
              </span>
            )}
            {assumption.mustReject && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white">
                MUST REJECT
              </span>
            )}
          </div>

          {/* Author and Views */}
          <div className="text-xs text-gray-500">
            by {assumption.author?.username || 'Anonymous'} • {assumption.views} views
          </div>
        </div>

        {/* Voting */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleVote('up')}
            className="text-green-600 hover:text-green-700 transition-colors p-1"
            title="Upvote"
          >
            ▲
          </button>
          <span className="font-semibold text-sm">
            {assumption.netVotes || (assumption.upvotes - assumption.downvotes)}
          </span>
          <button
            onClick={() => handleVote('down')}
            className="text-red-600 hover:text-red-700 transition-colors p-1"
            title="Downvote"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Assumption Statement */}
      <h3 className="text-lg font-semibold mb-2 text-gray-800">
        {assumption.statement}
      </h3>

      {/* Description */}
      {assumption.description && (
        <p className="text-gray-600 text-sm mb-3">
          {assumption.description}
        </p>
      )}

      {/* Criticality Reason */}
      {assumption.criticalityReason && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
          <p className="text-sm text-yellow-800">
            <strong>Why critical:</strong> {assumption.criticalityReason}
          </p>
        </div>
      )}

      {/* Dependent Arguments Summary */}
      {assumption.dependentArguments && assumption.dependentArguments.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowDependentArgs(!showDependentArgs)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>{showDependentArgs ? '▼' : '▶'}</span>
            {assumption.dependentArguments.length} Dependent Argument{assumption.dependentArguments.length !== 1 ? 's' : ''}
          </button>

          {showDependentArgs && (
            <div className="mt-2 space-y-2 pl-4">
              {assumption.dependentArguments.map((dep) => (
                <div key={dep._id} className="bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {dep.argumentId?.content ? (
                        <p className="text-sm text-gray-700">{dep.argumentId.content.substring(0, 100)}...</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Argument content unavailable</p>
                      )}
                    </div>
                    <div className="ml-2">
                      <span className="text-xs font-semibold text-purple-600">
                        {dep.integralityScore}% integral
                      </span>
                    </div>
                  </div>
                  {dep.argumentId?.reasonRankScore !== undefined && (
                    <div className="mt-1 text-xs text-gray-500">
                      ReasonRank: <span className="font-semibold">{dep.argumentId.reasonRankScore}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked Beliefs */}
      {assumption.linkedBeliefs && assumption.linkedBeliefs.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowLinkedBeliefs(!showLinkedBeliefs)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <span>{showLinkedBeliefs ? '▼' : '▶'}</span>
            {assumption.linkedBeliefs.length} Linked Belief{assumption.linkedBeliefs.length !== 1 ? 's' : ''}
          </button>

          {showLinkedBeliefs && (
            <div className="mt-2 space-y-2 pl-4">
              {assumption.linkedBeliefs.map((link) => {
                const linkInfo = getLinkTypeInfo(link.linkType);
                return (
                  <div key={link._id} className="bg-purple-50 p-2 rounded border border-purple-200">
                    <div className="flex items-start gap-2">
                      <span className={`text-lg ${linkInfo.color}`}>{linkInfo.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-purple-700">{linkInfo.label}</div>
                        {link.beliefId?.statement ? (
                          <Link
                            to={`/beliefs/${link.beliefId._id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {link.beliefId.statement}
                          </Link>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Belief unavailable</p>
                        )}
                        {link.description && (
                          <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Strength: {Math.round(link.linkStrength * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {assumption.tags && assumption.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {assumption.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          {showActions ? 'Hide Actions' : 'Show Actions'}
        </button>

        <div className="text-xs text-gray-400">
          Created {new Date(assumption.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          <button
            onClick={() => handleMarkCritical('accept')}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
          >
            Mark Must Accept
          </button>
          <button
            onClick={() => handleMarkCritical('reject')}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
          >
            Mark Must Reject
          </button>
          {onLinkArgument && (
            <button
              onClick={() => onLinkArgument(assumption._id)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              Link Argument
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AssumptionCard;
