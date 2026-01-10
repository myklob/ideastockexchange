import React, { useState, useEffect } from 'react';
import { beliefAPI } from '../../services/api';

const BeliefForm = ({ beliefId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    statement: '',
    description: '',
    category: 'other',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (beliefId) {
      // Load existing belief for editing
      loadBelief();
    }
  }, [beliefId]);

  const loadBelief = async () => {
    try {
      const response = await beliefAPI.getById(beliefId);
      if (response.success) {
        const belief = response.data;
        setFormData({
          statement: belief.statement,
          description: belief.description || '',
          category: belief.category,
          tags: belief.tags.join(', '),
        });
      }
    } catch (err) {
      setError('Failed to load belief');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const beliefData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    try {
      const response = beliefId
        ? await beliefAPI.update(beliefId, beliefData)
        : await beliefAPI.create(beliefData);

      if (response.success) {
        onSuccess && onSuccess(response.data);
      } else {
        setError(response.error || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {beliefId ? 'Edit Belief' : 'Create New Belief'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="statement" className="block text-sm font-medium text-gray-700 mb-2">
            Belief Statement *
          </label>
          <input
            type="text"
            id="statement"
            name="statement"
            value={formData.statement}
            onChange={handleChange}
            required
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a clear, concise belief statement..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.statement.length}/500 characters</p>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide additional context or explanation..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="politics">Politics</option>
            <option value="science">Science</option>
            <option value="technology">Technology</option>
            <option value="philosophy">Philosophy</option>
            <option value="economics">Economics</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="climate, environment, policy (comma separated)"
          />
          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : beliefId ? 'Update Belief' : 'Create Belief'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BeliefForm;
