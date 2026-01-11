import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AddMedia from '../components/AddMedia';
import './MediaLibrary.css';

interface Media {
  id: string;
  title: string;
  description?: string;
  url?: string;
  mediaType: string;
  author?: string;
  thumbnailUrl?: string;
  credibilityScore?: number;
  biasScore?: number;
  creator: {
    id: string;
    username: string;
  };
  _count: {
    arguments: number;
  };
}

const MediaLibrary: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMedia();
  }, [filterType, searchTerm]);

  const loadMedia = async () => {
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/media', { params });
      setMedia(response.data);
    } catch (err) {
      setError('Failed to load media');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaAdded = () => {
    setShowAddMedia(false);
    loadMedia();
  };

  const getMediaIcon = (type: string) => {
    const icons: any = {
      BOOK: '📚',
      VIDEO: '🎥',
      ARTICLE: '📄',
      IMAGE: '🖼️',
      PODCAST: '🎙️',
      DOCUMENTARY: '🎬',
      PAPER: '📊',
      WEBSITE: '🌐',
    };
    return icons[type] || '📎';
  };

  if (loading) return <div className="loading">Loading media library...</div>;

  return (
    <div className="media-library">
      <div className="library-header">
        <h2>Media Library</h2>
        <p className="subtitle">
          Curated collection of books, videos, articles, and other media for evidence-based argumentation
        </p>
      </div>

      <div className="library-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="BOOK">Books</option>
          <option value="VIDEO">Videos</option>
          <option value="ARTICLE">Articles</option>
          <option value="IMAGE">Images</option>
          <option value="PODCAST">Podcasts</option>
          <option value="DOCUMENTARY">Documentaries</option>
          <option value="PAPER">Academic Papers</option>
          <option value="WEBSITE">Websites</option>
        </select>

        {isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddMedia(true)}
          >
            Add Media
          </button>
        )}
      </div>

      {showAddMedia && (
        <AddMedia
          onClose={() => setShowAddMedia(false)}
          onSuccess={handleMediaAdded}
        />
      )}

      {error && <div className="error">{error}</div>}

      {media.length === 0 ? (
        <div className="empty-state">
          <h3>No media found</h3>
          <p>Be the first to add media to the library!</p>
        </div>
      ) : (
        <div className="media-grid">
          {media.map((item) => (
            <div key={item.id} className="media-card">
              <div className="media-card-header">
                <span className="media-type-icon">{getMediaIcon(item.mediaType)}</span>
                <span className="media-type-label">{item.mediaType}</span>
              </div>

              {item.thumbnailUrl && (
                <img src={item.thumbnailUrl} alt={item.title} className="media-thumbnail" />
              )}

              <div className="media-card-content">
                <h3>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>

                {item.description && (
                  <p className="media-card-description">{item.description}</p>
                )}

                {item.author && (
                  <p className="media-author">By {item.author}</p>
                )}

                <div className="media-card-meta">
                  {item.credibilityScore !== null && (
                    <span className="badge">
                      Credibility: {(item.credibilityScore * 100).toFixed(0)}%
                    </span>
                  )}
                  {item.biasScore !== null && (
                    <span className="badge">
                      Bias: {item.biasScore > 0 ? 'Right' : item.biasScore < 0 ? 'Left' : 'Neutral'}
                    </span>
                  )}
                </div>

                <div className="media-card-footer">
                  <span className="added-by">Added by @{item.creator.username}</span>
                  <span className="usage-count">
                    Used in {item._count.arguments} arguments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
