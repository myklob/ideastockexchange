import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CreateDebate.css';

const CreateDebate: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="create-debate">
        <div className="card">
          <h2>Create a Debate</h2>
          <p>Please <a href="/login">login</a> to create a debate.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await axios.post('/api/debates', {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagsArray,
        isPublic,
      });

      navigate(`/debates/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create debate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-debate">
      <div className="card">
        <h2>Create a New Debate</h2>
        <p className="subtitle">
          Start a discussion on any topic and invite others to contribute with evidence-based arguments
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Should we invest more in renewable energy?"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context and background for this debate..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., environment, energy, policy (comma-separated)"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public debate (visible to everyone)
            </label>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Debate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDebate;
