import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AddArgument.css';

interface AddArgumentProps {
  debateId: string;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddArgument: React.FC<AddArgumentProps> = ({ debateId, parentId, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [position, setPosition] = useState<'PRO' | 'CON' | 'NEUTRAL'>('NEUTRAL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('Please login to add arguments');
      return;
    }

    if (content.trim().length < 10) {
      setError('Argument must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/arguments', {
        content: content.trim(),
        debateId,
        parentId,
        position,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add argument');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-argument-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{parentId ? 'Add Reply' : 'Add Argument'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="PRO">Pro (Agrees)</option>
              <option value="CON">Con (Disagrees)</option>
              <option value="NEUTRAL">Neutral (Informational)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Argument</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your argument..."
              rows={5}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddArgument;
