import React from 'react';
import './MediaList.css';

interface MediaListProps {
  media: any[];
}

const MediaList: React.FC<MediaListProps> = ({ media }) => {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'BOOK': return '📚';
      case 'VIDEO': return '🎥';
      case 'ARTICLE': return '📄';
      case 'IMAGE': return '🖼️';
      case 'PODCAST': return '🎙️';
      case 'DOCUMENTARY': return '🎬';
      case 'PAPER': return '📊';
      case 'WEBSITE': return '🌐';
      default: return '📎';
    }
  };

  const getPositionClass = (position: string) => {
    return position.toLowerCase();
  };

  return (
    <div className="media-list">
      <h4>Supporting Media</h4>
      {media.map((item) => (
        <div key={item.id} className={`media-item ${getPositionClass(item.position)}`}>
          <div className="media-icon">{getMediaIcon(item.media.mediaType)}</div>
          <div className="media-info">
            <div className="media-header">
              <span className="media-title">
                {item.media.url ? (
                  <a href={item.media.url} target="_blank" rel="noopener noreferrer">
                    {item.media.title}
                  </a>
                ) : (
                  item.media.title
                )}
              </span>
              <span className={`position-indicator ${getPositionClass(item.position)}`}>
                {item.position}
              </span>
            </div>
            {item.media.description && (
              <p className="media-description">{item.media.description}</p>
            )}
            <div className="media-meta">
              {item.media.author && <span>By {item.media.author}</span>}
              {item.media.credibilityScore !== null && (
                <span className="credibility">
                  Credibility: {(item.media.credibilityScore * 100).toFixed(0)}%
                </span>
              )}
              {item.relevance !== null && (
                <span className="relevance">
                  Relevance: {(item.relevance * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaList;
