import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { argumentAPI } from '../../services/api';

const ArgumentCard = ({ argument, onVote, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const [voting, setVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(argument.votes);

  const hasSubArguments = argument.subArguments && argument.subArguments.length > 0;
  const isSupporting = argument.type === 'supporting';

  const handleVote = async (voteType) => {
    try {
      setVoting(true);
      await argumentAPI.vote(argument._id, voteType);

      // Optimistic update
      setLocalVotes(prev => ({
        up: voteType === 'up' ? prev.up + 1 : prev.up,
        down: voteType === 'down' ? prev.down + 1 : prev.down
      }));

      if (onVote) onVote(argument._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`mb-3 ${depth > 0 ? 'ml-8 border-l-2' : ''} ${
        isSupporting ? 'border-green-300' : 'border-red-300'
      }`}
    >
      <div
        className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow ${
          isSupporting ? 'border-green-200' : 'border-red-200'
        }`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              {hasSubArguments && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 text-gray-500 hover:text-gray-700"
                >
                  {expanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              )}

              <div className="flex-1">
                {/* Type Badge */}
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                    isSupporting
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isSupporting ? '✓ Supporting' : '✗ Opposing'}
                </span>

                {/* Content */}
                <p className="text-gray-800">{argument.content}</p>

                {/* Author and Evidence Count */}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>by {argument.author?.username || 'Anonymous'}</span>
                  {argument.evidence && argument.evidence.length > 0 && (
                    <span className="flex items-center">
                      📎 {argument.evidence.length} evidence
                    </span>
                  )}
                  {hasSubArguments && (
                    <span>
                      💬 {argument.subArguments.length} sub-arguments
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Badge */}
            <div className="ml-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(argument.scores?.overall || 0)}`}>
                {Math.round(argument.scores?.overall || 0)}
              </div>
              <div className="text-xs text-gray-500">score</div>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-semibold text-gray-700">
                {Math.round(argument.scores?.logical || 0)}
              </div>
              <div className="text-xs text-gray-500">Logical</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-semibold text-gray-700">
                {Math.round(argument.scores?.linkage || 0)}
              </div>
              <div className="text-xs text-gray-500">Linkage</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-semibold text-gray-700">
                {Math.round(argument.scores?.importance || 0)}
              </div>
              <div className="text-xs text-gray-500">Importance</div>
            </div>
          </div>

          {/* Voting */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote('up')}
                disabled={voting}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{localVotes?.up || 0}</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={voting}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{localVotes?.down || 0}</span>
              </button>
            </div>

            {argument.reasonRankScore && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>ReasonRank: {argument.reasonRankScore.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-arguments */}
      {hasSubArguments && expanded && (
        <div className="mt-3">
          {argument.subArguments.map((subArg) => (
            <ArgumentCard
              key={subArg._id}
              argument={subArg}
              onVote={onVote}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArgumentCard;
