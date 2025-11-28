import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Link2,
  BookOpen,
  Video,
  Image as ImageIcon,
  Database,
  MessageCircle,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { argumentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ArgumentCard = ({ argument, onVote, depth = 0, onReply }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const [voting, setVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(argument.votes);
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyType, setReplyType] = useState('opposing'); // Default to counter-argument
  const [submittingReply, setSubmittingReply] = useState(false);

  const hasSubArguments = argument.subArguments && argument.subArguments.length > 0;
  const hasEvidence = argument.evidence && argument.evidence.length > 0;
  const isSupporting = argument.type === 'supporting';
  const MAX_DEPTH = 3;
  const canReply = depth < MAX_DEPTH;

  // Map evidence types to icons
  const evidenceTypeIcons = {
    study: FileText,
    article: Link2,
    book: BookOpen,
    video: Video,
    image: ImageIcon,
    data: Database,
    'expert-opinion': MessageCircle,
    other: HelpCircle,
  };

  // Get verification status badge
  const getVerificationBadge = (status) => {
    const badges = {
      verified: { icon: CheckCircle, text: 'Verified', color: 'text-green-600 bg-green-100' },
      pending: { icon: Clock, text: 'Pending', color: 'text-yellow-600 bg-yellow-100' },
      disputed: { icon: AlertTriangle, text: 'Disputed', color: 'text-orange-600 bg-orange-100' },
      debunked: { icon: XCircle, text: 'Debunked', color: 'text-red-600 bg-red-100' },
      unverified: { icon: HelpCircle, text: 'Unverified', color: 'text-gray-600 bg-gray-100' },
    };
    return badges[status] || badges.unverified;
  };

  // Get credibility color
  const getCredibilityColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Check if user has voted on this argument
  useEffect(() => {
    if (user && user.votedArguments) {
      const existingVote = user.votedArguments.find(
        v => v.argumentId === argument._id || v.argumentId?._id === argument._id
      );
      if (existingVote) {
        setUserVote(existingVote.vote);
      } else {
        setUserVote(null);
      }
    }
  }, [user, argument._id]);

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    try {
      setVoting(true);
      await argumentAPI.vote(argument._id, voteType);

      // Determine new vote state based on current state
      let newVoteState = null;
      let voteDelta = { up: 0, down: 0 };

      if (userVote === voteType) {
        // Clicking same vote - remove vote
        newVoteState = null;
        voteDelta[voteType] = -1;
      } else if (userVote) {
        // Changing vote from one to another
        newVoteState = voteType;
        voteDelta[userVote] = -1;
        voteDelta[voteType] = 1;
      } else {
        // New vote
        newVoteState = voteType;
        voteDelta[voteType] = 1;
      }

      // Update local state
      setUserVote(newVoteState);
      setLocalVotes(prev => ({
        up: prev.up + voteDelta.up,
        down: prev.down + voteDelta.down
      }));

      if (onVote) onVote(argument._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      if (user && user.votedArguments) {
        const existingVote = user.votedArguments.find(
          v => v.argumentId === argument._id || v.argumentId?._id === argument._id
        );
        setUserVote(existingVote ? existingVote.vote : null);
      }
    } finally {
      setVoting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to reply');
      return;
    }

    if (replyContent.trim().length < 10) {
      alert('Reply must be at least 10 characters');
      return;
    }

    try {
      setSubmittingReply(true);

      const replyData = {
        content: replyContent,
        type: replyType,
        beliefId: argument.beliefId,
        parentArgument: argument._id,
      };

      await argumentAPI.create(replyData);

      // Reset form
      setReplyContent('');
      setShowReplyForm(false);

      // Notify parent component to refresh
      if (onReply) {
        onReply();
      }

      // Optionally, could reload the page or update state
      window.location.reload(); // Simple approach for now
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
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
                  {hasEvidence && (
                    <button
                      onClick={() => setEvidenceExpanded(!evidenceExpanded)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      📎 {argument.evidence.length} evidence
                      {evidenceExpanded ? (
                        <ChevronDown className="w-3 h-3 ml-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 ml-1" />
                      )}
                    </button>
                  )}
                  {hasSubArguments && (
                    <span>
                      💬 {argument.subArguments.length} sub-arguments
                    </span>
                  )}
                </div>

                {/* Evidence Details */}
                {hasEvidence && evidenceExpanded && (
                  <div className="mt-3 space-y-2">
                    {argument.evidence.map((evidence, index) => {
                      const EvidenceIcon = evidenceTypeIcons[evidence.type] || HelpCircle;
                      const verificationBadge = getVerificationBadge(evidence.verificationStatus);
                      const VerificationIcon = verificationBadge.icon;

                      return (
                        <div
                          key={evidence._id || index}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start space-x-2">
                            <EvidenceIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              {/* Title and Link */}
                              <div className="flex items-start justify-between gap-2">
                                <a
                                  href={evidence.source?.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 break-words"
                                >
                                  {evidence.title}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </div>

                              {/* Description */}
                              {evidence.description && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {evidence.description}
                                </p>
                              )}

                              {/* Metadata Row */}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                {/* Verification Status */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${verificationBadge.color}`}>
                                  <VerificationIcon className="w-3 h-3 mr-1" />
                                  {verificationBadge.text}
                                </span>

                                {/* Credibility Score */}
                                <span className={`font-semibold ${getCredibilityColor(evidence.credibilityScore || 50)}`}>
                                  {evidence.credibilityScore || 50}% credible
                                </span>

                                {/* Source Info */}
                                {evidence.source?.author && (
                                  <span className="text-gray-600">
                                    by {evidence.source.author}
                                  </span>
                                )}
                                {evidence.source?.publication && (
                                  <span className="text-gray-600">
                                    • {evidence.source.publication}
                                  </span>
                                )}
                                {evidence.source?.date && (
                                  <span className="text-gray-600">
                                    • {new Date(evidence.source.date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              {evidence.tags && evidence.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {evidence.tags.map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                  userVote === 'up'
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
                <span>{localVotes?.up || 0}</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={voting}
                className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                  userVote === 'down'
                    ? 'bg-red-100 text-red-700 font-semibold'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <ThumbsDown className={`w-4 h-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
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

          {/* Reply Button */}
          {canReply && user && (
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showReplyForm ? '✕ Cancel Reply' : '↩️ Reply'}
              </button>
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="pt-3 border-t border-gray-200 mt-3">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyType('supporting')}
                    className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg transition-all ${
                      replyType === 'supporting'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    ✓ Support
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyType('opposing')}
                    className={`flex-1 px-3 py-2 text-sm border-2 rounded-lg transition-all ${
                      replyType === 'opposing'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700 hover:border-red-300'
                    }`}
                  >
                    ✗ Counter
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply (min 10 characters)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  disabled={submittingReply}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {replyContent.length} characters
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={replyContent.trim().length < 10 || submittingReply}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submittingReply ? 'Submitting...' : 'Submit Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!canReply && (
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
              Maximum reply depth reached
            </div>
          )}
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
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArgumentCard;
