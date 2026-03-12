import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArgumentTree from '../components/ArgumentTree';
import AddArgument from '../components/AddArgument';
import './DebateView.css';

interface Debate {
  id: string;
  title: string;
  description?: string;
  author: {
    id: string;
    username: string;
  };
  arguments: any[];
  tags: string[];
}

const DebateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddArgument, setShowAddArgument] = useState(false);

  useEffect(() => {
    if (id) {
      loadDebate();
    }
  }, [id]);

  const loadDebate = async () => {
    try {
      const response = await axios.get(`/api/debates/${id}`);
      setDebate(response.data);
    } catch (err) {
      setError('Failed to load debate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArgumentAdded = () => {
    setShowAddArgument(false);
    loadDebate();
  };

  if (loading) return <div className="loading">Loading debate...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!debate) return <div className="error">Debate not found</div>;

  return (
    <div className="debate-view">
      <div className="debate-header">
        <h1>{debate.title}</h1>
        {debate.description && (
          <p className="description">{debate.description}</p>
        )}
        <div className="debate-info">
          <span className="author">Created by {debate.author.username}</span>
          {debate.tags.length > 0 && (
            <div className="tags">
              {debate.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary add-argument-btn"
          onClick={() => setShowAddArgument(true)}
        >
          Add Root Argument
        </button>
      </div>

      {showAddArgument && (
        <AddArgument
          debateId={debate.id}
          onClose={() => setShowAddArgument(false)}
          onSuccess={handleArgumentAdded}
        />
      )}

      <div className="arguments-section">
        <h2>Arguments</h2>
        {debate.arguments.length === 0 ? (
          <div className="empty-state">
            <p>No arguments yet. Be the first to contribute!</p>
          </div>
        ) : (
          <ArgumentTree arguments={debate.arguments} onRefresh={loadDebate} />
        )}
      </div>
    </div>
  );
};

export default DebateView;
