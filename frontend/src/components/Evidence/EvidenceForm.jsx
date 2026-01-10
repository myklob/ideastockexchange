import React, { useState } from 'react';
import { FileText, Link2, BookOpen, Video, Image, Database, MessageCircle, HelpCircle, Loader } from 'lucide-react';
import { evidenceAPI } from '../../services/api';

const EvidenceForm = ({ onSuccess, onCancel, argumentId }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    source: {
      url: '',
      author: '',
      publication: '',
      date: ''
    },
    tags: [],
    metadata: {
      doi: '',
      isbn: '',
      pmid: '',
      citations: ''
    }
  });

  const [tagInput, setTagInput] = useState('');

  const evidenceTypes = [
    { value: 'study', label: 'Study', icon: FileText, description: 'Academic research paper' },
    { value: 'article', label: 'Article', icon: Link2, description: 'News article or blog post' },
    { value: 'book', label: 'Book', icon: BookOpen, description: 'Published book' },
    { value: 'video', label: 'Video', icon: Video, description: 'YouTube, Vimeo, etc.' },
    { value: 'image', label: 'Image', icon: Image, description: 'Photo or infographic' },
    { value: 'data', label: 'Data', icon: Database, description: 'Dataset or statistics' },
    { value: 'expert-opinion', label: 'Expert Opinion', icon: MessageCircle, description: 'Expert testimony' },
    { value: 'other', label: 'Other', icon: HelpCircle, description: 'Other type of evidence' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('source.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        source: { ...prev.source, [field]: value }
      }));
    } else if (name.startsWith('metadata.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metadata: { ...prev.metadata, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.source.url) {
      setError('Title and URL are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Clean up metadata - only send non-empty values
      const cleanMetadata = {};
      Object.keys(formData.metadata).forEach(key => {
        if (formData.metadata[key]) {
          cleanMetadata[key] = formData.metadata[key];
        }
      });

      const evidenceData = {
        ...formData,
        metadata: cleanMetadata,
        arguments: argumentId ? [argumentId] : []
      };

      const response = await evidenceAPI.create(evidenceData);

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error creating evidence:', err);
      setError(err.response?.data?.message || 'Failed to create evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = evidenceTypes.find(t => t.value === formData.type);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Evidence</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Evidence Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Evidence Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {evidenceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <Icon className={`w-6 h-6 mb-2 ${
                    formData.type === type.value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-sm font-medium ${
                    formData.type === type.value ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {selectedType && (
          <p className="mt-2 text-sm text-gray-600">{selectedType.description}</p>
        )}
      </div>

      {/* Title */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter evidence title"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe this evidence and its relevance..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Source Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-4">Source Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="source.url" className="block text-sm font-medium text-gray-700 mb-2">
              URL *
            </label>
            <input
              type="url"
              id="source.url"
              name="source.url"
              value={formData.source.url}
              onChange={handleChange}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="source.author" className="block text-sm font-medium text-gray-700 mb-2">
              Author(s)
            </label>
            <input
              type="text"
              id="source.author"
              name="source.author"
              value={formData.source.author}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="source.publication" className="block text-sm font-medium text-gray-700 mb-2">
              Publication
            </label>
            <input
              type="text"
              id="source.publication"
              name="source.publication"
              value={formData.source.publication}
              onChange={handleChange}
              placeholder="Nature, NYTimes, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="source.date" className="block text-sm font-medium text-gray-700 mb-2">
              Publication Date
            </label>
            <input
              type="date"
              id="source.date"
              name="source.date"
              value={formData.source.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Metadata (Optional) */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Metadata (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add scholarly identifiers to increase credibility
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="metadata.doi" className="block text-sm font-medium text-gray-700 mb-2">
              DOI (Digital Object Identifier)
            </label>
            <input
              type="text"
              id="metadata.doi"
              name="metadata.doi"
              value={formData.metadata.doi}
              onChange={handleChange}
              placeholder="10.1234/example.doi"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="metadata.isbn" className="block text-sm font-medium text-gray-700 mb-2">
              ISBN (for books)
            </label>
            <input
              type="text"
              id="metadata.isbn"
              name="metadata.isbn"
              value={formData.metadata.isbn}
              onChange={handleChange}
              placeholder="978-3-16-148410-0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="metadata.pmid" className="block text-sm font-medium text-gray-700 mb-2">
              PMID (PubMed ID)
            </label>
            <input
              type="text"
              id="metadata.pmid"
              name="metadata.pmid"
              value={formData.metadata.pmid}
              onChange={handleChange}
              placeholder="12345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="metadata.citations" className="block text-sm font-medium text-gray-700 mb-2">
              Citation Count
            </label>
            <input
              type="number"
              id="metadata.citations"
              name="metadata.citations"
              value={formData.metadata.citations}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Press Enter to add tags"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit Evidence'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default EvidenceForm;
