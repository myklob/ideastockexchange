import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

interface Debate {
  id: string;
  title: string;
  description?: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: string;
  tags: string[];
  _count: {
    arguments: number;
  };
}

const Home: React.FC = () => {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDebates();
  }, []);

  const loadDebates = async () => {
    try {
      const response = await axios.get('/api/debates');
      setDebates(response.data);
    } catch (err) {
      setError('Failed to load debates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading debates...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      <div className="home-header">
        <h2>Active Debates</h2>
        <p className="subtitle">
          Explore debates enhanced with media evidence from books, videos, articles, and more
        </p>
      </div>

      {debates.length === 0 ? (
        <div className="empty-state">
          <h3>No debates yet</h3>
          <p>Be the first to create a debate!</p>
          <Link to="/debates/create" className="btn btn-primary">
            Create Debate
          </Link>
        </div>
      ) : (
        <div className="debates-grid">
          {debates.map((debate) => (
            <Link to={`/debates/${debate.id}`} key={debate.id} className="debate-card">
              <h3>{debate.title}</h3>
              {debate.description && (
                <p className="debate-description">{debate.description}</p>
              )}
              <div className="debate-meta">
                <span className="author">by {debate.author.username}</span>
                <span className="count">{debate._count.arguments} arguments</span>
              </div>
              {debate.tags.length > 0 && (
                <div className="tags">
                  {debate.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
