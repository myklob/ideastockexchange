import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AddArgument from './AddArgument';
import MediaList from './MediaList';
import './ArgumentNode.css';

interface ArgumentNodeProps {
  argument: any;
  onRefresh: () => void;
  depth?: number;
}

const ArgumentNode: React.FC<ArgumentNodeProps> = ({ argument, onRefresh, depth = 0 }) => {
  const { isAuthenticated } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [voted, setVoted] = useState<'UPVOTE' | 'DOWNVOTE' | null>(null);

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      if (voted === voteType) {
        // Remove vote
        await axios.delete(`/api/arguments/${argument.id}/vote`);
        setVoted(null);
      } else {
        // Add or change vote
        await axios.post(`/api/arguments/${argument.id}/vote`, { voteType });
        setVoted(voteType);
      }
      onRefresh();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleReplyAdded = () => {
    setShowReply(false);
    onRefresh();
  };

  const positionClass = argument.position.toLowerCase();

  return (
    <div className={`argument-node depth-${depth} position-${positionClass}`}>
      <div className="argument-content">
        <div className="argument-header">
          <span className={`position-badge ${positionClass}`}>
            {argument.position}
          </span>
          <span className="author">@{argument.author.username}</span>
          {argument.reasonRank !== null && (
            <span className="rank-score">
              Rank: {(argument.reasonRank * 100).toFixed(0)}
            </span>
          )}
        </div>

        <p className="argument-text">{argument.content}</p>

        {(argument.truthScore || argument.importanceScore || argument.relevanceScore) && (
          <div className="scores">
            {argument.truthScore !== null && (
              <span className="score">
                Truth: {(argument.truthScore * 100).toFixed(0)}%
              </span>
            )}
            {argument.importanceScore !== null && (
              <span className="score">
                Importance: {(argument.importanceScore * 100).toFixed(0)}%
              </span>
            )}
            {argument.relevanceScore !== null && (
              <span className="score">
                Relevance: {(argument.relevanceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {argument.media && argument.media.length > 0 && (
          <MediaList media={argument.media} />
        )}

        <div className="argument-actions">
          <button
            className={`vote-btn ${voted === 'UPVOTE' ? 'active' : ''}`}
            onClick={() => handleVote('UPVOTE')}
          >
            ↑ Upvote
          </button>
          <button
            className={`vote-btn ${voted === 'DOWNVOTE' ? 'active' : ''}`}
            onClick={() => handleVote('DOWNVOTE')}
          >
            ↓ Downvote
          </button>
          <button
            className="reply-btn"
            onClick={() => setShowReply(!showReply)}
          >
            Reply
          </button>
          {argument._count.children > 0 && (
            <button
              className="toggle-children-btn"
              onClick={() => setShowChildren(!showChildren)}
            >
              {showChildren ? 'Hide' : 'Show'} {argument._count.children} replies
            </button>
          )}
        </div>

        {showReply && (
          <AddArgument
            debateId={argument.debateId}
            parentId={argument.id}
            onClose={() => setShowReply(false)}
            onSuccess={handleReplyAdded}
          />
        )}
      </div>

      {showChildren && argument.children && argument.children.length > 0 && (
        <div className="argument-children">
          {argument.children.map((child: any) => (
            <ArgumentNode
              key={child.id}
              argument={child}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArgumentNode;
