import React, { useState } from 'react';
import axios from 'axios';
import './AddMedia.css';

interface AddMediaProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddMedia: React.FC<AddMediaProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    mediaType: 'ARTICLE',
    author: '',
    thumbnailUrl: '',
    isbn: '',
    credibilityScore: 0.5,
    biasScore: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Score') ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.title.trim().length === 0) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/media', {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        url: formData.url.trim() || undefined,
        mediaType: formData.mediaType,
        author: formData.author.trim() || undefined,
        thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
        isbn: formData.isbn.trim() || undefined,
        credibilityScore: formData.credibilityScore,
        biasScore: formData.biasScore,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add media');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-media-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Media to Library</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., The Lean Startup"
            />
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select name="mediaType" value={formData.mediaType} onChange={handleChange}>
              <option value="BOOK">Book</option>
              <option value="VIDEO">Video</option>
              <option value="ARTICLE">Article</option>
              <option value="IMAGE">Image</option>
              <option value="PODCAST">Podcast</option>
              <option value="DOCUMENTARY">Documentary</option>
              <option value="PAPER">Academic Paper</option>
              <option value="WEBSITE">Website</option>
            </select>
          </div>

          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this media..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Author/Creator</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="e.g., Eric Ries"
            />
          </div>

          <div className="form-group">
            <label>Thumbnail URL</label>
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          {formData.mediaType === 'BOOK' && (
            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="978-0-..."
              />
            </div>
          )}

          <div className="form-group">
            <label>Credibility Score: {(formData.credibilityScore * 100).toFixed(0)}%</label>
            <input
              type="range"
              name="credibilityScore"
              value={formData.credibilityScore}
              onChange={handleChange}
              min="0"
              max="1"
              step="0.1"
            />
            <small>How credible/trustworthy is this source?</small>
          </div>

          <div className="form-group">
            <label>
              Bias Score: {formData.biasScore < 0 ? 'Left' : formData.biasScore > 0 ? 'Right' : 'Neutral'} ({formData.biasScore.toFixed(1)})
            </label>
            <input
              type="range"
              name="biasScore"
              value={formData.biasScore}
              onChange={handleChange}
              min="-1"
              max="1"
              step="0.1"
            />
            <small>Political/ideological bias (-1 = left, 0 = neutral, 1 = right)</small>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Media'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedia;
