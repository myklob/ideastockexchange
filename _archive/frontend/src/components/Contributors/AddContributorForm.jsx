import React, { useState } from 'react';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { contributorAPI } from '../../services/api';

/**
 * AddContributorForm Component
 *
 * Form for adding a new contributor to a belief with:
 * - Basic info (name, bio, expertise, credentials)
 * - Influence Score (I): 0-100
 * - Linkage Score (L): -100 to +100
 * - Influence sources (citations, media, followers, etc.)
 * - Linkage sources (statements, publications, etc.)
 */
const AddContributorForm = ({ beliefId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: [],
    credentials: [],
    influenceScore: 50,
    linkageScore: 0,
    influenceSources: [],
    linkageSources: [],
    externalLinks: [],
    notes: '',
  });

  const [currentExpertise, setCurrentExpertise] = useState('');
  const [currentCredential, setCurrentCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  const addExpertise = () => {
    if (currentExpertise.trim()) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, currentExpertise.trim()],
      }));
      setCurrentExpertise('');
    }
  };

  const removeExpertise = (index) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  const addCredential = () => {
    if (currentCredential.trim()) {
      setFormData(prev => ({
        ...prev,
        credentials: [...prev.credentials, currentCredential.trim()],
      }));
      setCurrentCredential('');
    }
  };

  const removeCredential = (index) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }));
  };

  const addInfluenceSource = () => {
    setFormData(prev => ({
      ...prev,
      influenceSources: [
        ...prev.influenceSources,
        { type: 'academic_citations', description: '', url: '', metric: 0 },
      ],
    }));
  };

  const updateInfluenceSource = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      influenceSources: prev.influenceSources.map((source, i) =>
        i === index ? { ...source, [field]: value } : source
      ),
    }));
  };

  const removeInfluenceSource = (index) => {
    setFormData(prev => ({
      ...prev,
      influenceSources: prev.influenceSources.filter((_, i) => i !== index),
    }));
  };

  const addLinkageSource = () => {
    setFormData(prev => ({
      ...prev,
      linkageSources: [
        ...prev.linkageSources,
        { type: 'direct_statement', description: '', quote: '', url: '' },
      ],
    }));
  };

  const updateLinkageSource = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      linkageSources: prev.linkageSources.map((source, i) =>
        i === index ? { ...source, [field]: value } : source
      ),
    }));
  };

  const removeLinkageSource = (index) => {
    setFormData(prev => ({
      ...prev,
      linkageSources: prev.linkageSources.filter((_, i) => i !== index),
    }));
  };

  const addExternalLink = () => {
    setFormData(prev => ({
      ...prev,
      externalLinks: [
        ...prev.externalLinks,
        { type: 'website', url: '' },
      ],
    }));
  };

  const updateExternalLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      externalLinks: prev.externalLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const removeExternalLink = (index) => {
    setFormData(prev => ({
      ...prev,
      externalLinks: prev.externalLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await contributorAPI.create(beliefId, formData);

      if (response.success) {
        onSuccess?.(response.data.contributor);
      } else {
        setError(response.error || 'Failed to create contributor');
      }
    } catch (err) {
      console.error('Error creating contributor:', err);
      setError(err.response?.data?.error || 'Failed to create contributor');
    } finally {
      setLoading(false);
    }
  };

  const combinedScore = formData.influenceScore * (formData.linkageScore / 100);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Add Contributor</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Milton Friedman"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief biography..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/1000 characters</p>
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expertise
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentExpertise}
                onChange={(e) => setCurrentExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Economics"
              />
              <button
                type="button"
                onClick={addExpertise}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.expertise.map((exp, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {exp}
                    <button
                      type="button"
                      onClick={() => removeExpertise(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Credentials */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credentials
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentCredential}
                onChange={(e) => setCurrentCredential(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCredential())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Nobel Prize in Economics"
              />
              <button
                type="button"
                onClick={addCredential}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.credentials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.credentials.map((cred, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {cred}
                    <button
                      type="button"
                      onClick={() => removeCredential(index)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scoring Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Rating</h3>

          {/* Combined Score Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Combined Score (C = I × L/100)</div>
            <div className="text-3xl font-bold text-gray-900">
              {combinedScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {combinedScore > 50 ? 'Strong Supporter' :
               combinedScore > 0 ? 'Supporter' :
               combinedScore === 0 ? 'Neutral' :
               combinedScore > -50 ? 'Opponent' : 'Strong Opponent'}
            </div>
          </div>

          {/* Influence Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Influence Score (I) <span className="text-red-500 ml-1">*</span>
              <span className="ml-2 text-gray-500">
                <HelpCircle className="w-4 h-4 inline" />
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-2">How far their voice carries (0-100)</p>
            <input
              type="range"
              name="influenceScore"
              min="0"
              max="100"
              value={formData.influenceScore}
              onChange={handleNumberChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Very Low (0)</span>
              <span className="font-bold text-purple-600">{formData.influenceScore}</span>
              <span>Very High (100)</span>
            </div>
          </div>

          {/* Linkage Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Linkage Score (L) <span className="text-red-500 ml-1">*</span>
              <span className="ml-2 text-gray-500">
                <HelpCircle className="w-4 h-4 inline" />
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Stance strength and direction (-100 to +100)</p>
            <input
              type="range"
              name="linkageScore"
              min="-100"
              max="100"
              value={formData.linkageScore}
              onChange={handleNumberChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span className="text-red-600">Strong Opposition (-100)</span>
              <span className={`font-bold ${formData.linkageScore > 0 ? 'text-green-600' : formData.linkageScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {formData.linkageScore > 0 ? '+' : ''}{formData.linkageScore}
              </span>
              <span className="text-green-600">Strong Support (+100)</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional notes or context..."
            maxLength={2000}
          />
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-6 border-t">
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Contributor'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddContributorForm;
