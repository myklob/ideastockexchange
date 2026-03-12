import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { lawAPI } from '../../services/api';

const AddLawForm = ({ beliefId, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    officialName: '',
    description: '',
    jurisdiction: {
      country: '',
      state: '',
      city: '',
      level: 'national',
      populationCovered: '',
    },
    enactedDate: '',
    effectiveDate: '',
    status: 'active',
    category: 'other',
    relationship: 'supports', // Default relationship to the belief
    relationshipStrength: 50,
    relationshipNotes: '',
    enforcement: {
      enforcementLevel: 50,
      convictionRate: '',
      averageViolationsPerYear: '',
    },
    penalties: {
      hasCriminalPenalties: false,
      hasCivilPenalties: false,
      severityScore: 50,
      maxPrisonTime: '',
      maxFine: { amount: '', currency: 'USD' },
    },
    context: {
      purpose: '',
      exceptions: '',
      isContested: false,
      contestationDetails: '',
    },
    publicSupport: {
      supportPercentage: '',
      sourceType: 'estimated',
    },
    sources: [{ type: 'official-text', url: '', title: '' }],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic'); // 'basic', 'jurisdiction', 'enforcement', 'penalties', 'context'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    } else if (keys.length === 2) {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...formData[keys[0]],
          [keys[1]]: type === 'checkbox' ? checked : value,
        },
      });
    } else if (keys.length === 3) {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...formData[keys[0]],
          [keys[1]]: {
            ...formData[keys[0]][keys[1]],
            [keys[2]]: type === 'checkbox' ? checked : value,
          },
        },
      });
    }
  };

  const handleSourceChange = (index, field, value) => {
    const newSources = [...formData.sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setFormData({ ...formData, sources: newSources });
  };

  const addSource = () => {
    setFormData({
      ...formData,
      sources: [...formData.sources, { type: 'official-text', url: '', title: '' }],
    });
  };

  const removeSource = (index) => {
    const newSources = formData.sources.filter((_, i) => i !== index);
    setFormData({ ...formData, sources: newSources });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission
      const lawData = {
        ...formData,
        relatedBeliefs: [{
          beliefId,
          relationship: formData.relationship,
          strength: parseInt(formData.relationshipStrength),
          notes: formData.relationshipNotes,
        }],
      };

      // Remove form-specific fields
      delete lawData.relationship;
      delete lawData.relationshipStrength;
      delete lawData.relationshipNotes;

      // Convert numeric fields
      if (lawData.jurisdiction.populationCovered) {
        lawData.jurisdiction.populationCovered = parseInt(lawData.jurisdiction.populationCovered);
      }
      if (lawData.enforcement.convictionRate) {
        lawData.enforcement.convictionRate = parseFloat(lawData.enforcement.convictionRate);
      }
      if (lawData.enforcement.averageViolationsPerYear) {
        lawData.enforcement.averageViolationsPerYear = parseInt(lawData.enforcement.averageViolationsPerYear);
      }
      if (lawData.penalties.maxPrisonTime) {
        lawData.penalties.maxPrisonTime = parseInt(lawData.penalties.maxPrisonTime);
      }
      if (lawData.penalties.maxFine.amount) {
        lawData.penalties.maxFine.amount = parseFloat(lawData.penalties.maxFine.amount);
      }
      if (lawData.publicSupport.supportPercentage) {
        lawData.publicSupport.supportPercentage = parseFloat(lawData.publicSupport.supportPercentage);
      }

      const response = initialData
        ? await lawAPI.update(initialData._id, lawData)
        : await lawAPI.create(lawData);

      if (response.success) {
        onSuccess?.(response.data);
        onClose();
      }
    } catch (err) {
      console.error('Error saving law:', err);
      setError(err.response?.data?.message || 'Failed to save law. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Law Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Clean Air Act"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Official Name or Statute Number
              </label>
              <input
                type="text"
                name="officialName"
                value={formData.officialName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 42 U.S.C. § 7401"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this law does and its key provisions..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="administrative">Administrative</option>
                  <option value="constitutional">Constitutional</option>
                  <option value="environmental">Environmental</option>
                  <option value="labor">Labor</option>
                  <option value="tax">Tax</option>
                  <option value="commercial">Commercial</option>
                  <option value="family">Family</option>
                  <option value="property">Property</option>
                  <option value="immigration">Immigration</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="consumer-protection">Consumer Protection</option>
                  <option value="anti-discrimination">Anti-Discrimination</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="proposed">Proposed</option>
                  <option value="enacted">Enacted</option>
                  <option value="active">Active</option>
                  <option value="amended">Amended</option>
                  <option value="repealed">Repealed</option>
                  <option value="challenged">Challenged</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship to Belief <span className="text-red-500">*</span>
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="supports">Supports (law aligns with this belief)</option>
                <option value="opposes">Opposes (law contradicts this belief)</option>
                <option value="neutral">Neutral (law is relevant but neither supports nor opposes)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Strength: {formData.relationshipStrength}/100
              </label>
              <input
                type="range"
                name="relationshipStrength"
                value={formData.relationshipStrength}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                How strongly does this law support/oppose the belief?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes on Relationship
              </label>
              <textarea
                name="relationshipNotes"
                value={formData.relationshipNotes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain how this law relates to the belief..."
              />
            </div>
          </div>
        );

      case 'jurisdiction':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jurisdiction.country"
                value={formData.jurisdiction.country}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., United States"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  name="jurisdiction.state"
                  value={formData.jurisdiction.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., California"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City/Municipality
                </label>
                <input
                  type="text"
                  name="jurisdiction.city"
                  value={formData.jurisdiction.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction Level
              </label>
              <select
                name="jurisdiction.level"
                value={formData.jurisdiction.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="international">International</option>
                <option value="federal">Federal</option>
                <option value="national">National</option>
                <option value="state">State</option>
                <option value="provincial">Provincial</option>
                <option value="local">Local</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Population Covered (optional)
              </label>
              <input
                type="number"
                name="jurisdiction.populationCovered"
                value={formData.jurisdiction.populationCovered}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 330000000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enacted Date
                </label>
                <input
                  type="date"
                  name="enactedDate"
                  value={formData.enactedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 'enforcement':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enforcement Level: {formData.enforcement.enforcementLevel}/100
              </label>
              <input
                type="range"
                name="enforcement.enforcementLevel"
                value={formData.enforcement.enforcementLevel}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = Never enforced, 100 = Strictly enforced
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conviction Rate (%)
                </label>
                <input
                  type="number"
                  name="enforcement.convictionRate"
                  value={formData.enforcement.convictionRate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Violations/Year
                </label>
                <input
                  type="number"
                  name="enforcement.averageViolationsPerYear"
                  value={formData.enforcement.averageViolationsPerYear}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Support (%)
              </label>
              <input
                type="number"
                name="publicSupport.supportPercentage"
                value={formData.publicSupport.supportPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 65.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Type
              </label>
              <select
                name="publicSupport.sourceType"
                value={formData.publicSupport.sourceType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="poll">Poll</option>
                <option value="survey">Survey</option>
                <option value="referendum">Referendum</option>
                <option value="election">Election</option>
                <option value="estimated">Estimated</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        );

      case 'penalties':
        return (
          <div className="space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="penalties.hasCriminalPenalties"
                  checked={formData.penalties.hasCriminalPenalties}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Has Criminal Penalties</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="penalties.hasCivilPenalties"
                  checked={formData.penalties.hasCivilPenalties}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Has Civil Penalties</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity Score: {formData.penalties.severityScore}/100
              </label>
              <input
                type="range"
                name="penalties.severityScore"
                value={formData.penalties.severityScore}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = Minor fines, 100 = Death penalty
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Prison Time (months)
              </label>
              <input
                type="number"
                name="penalties.maxPrisonTime"
                value={formData.penalties.maxPrisonTime}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 60 (5 years)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Fine
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="penalties.maxFine.amount"
                  value={formData.penalties.maxFine.amount}
                  onChange={handleChange}
                  min="0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Amount"
                />
                <select
                  name="penalties.maxFine.currency"
                  value={formData.penalties.maxFine.currency}
                  onChange={handleChange}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <textarea
                name="context.purpose"
                value={formData.context.purpose}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What is the stated purpose or justification of this law?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exceptions
              </label>
              <textarea
                name="context.exceptions"
                value={formData.context.exceptions}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notable exceptions or exemptions to this law..."
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="context.isContested"
                  checked={formData.context.isContested}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Law is Currently Contested</span>
              </label>
            </div>

            {formData.context.isContested && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contestation Details
                </label>
                <textarea
                  name="context.contestationDetails"
                  value={formData.context.contestationDetails}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe ongoing challenges or litigation..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sources
              </label>
              {formData.sources.map((source, index) => (
                <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <select
                      value={source.type}
                      onChange={(e) => handleSourceChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="official-text">Official Text</option>
                      <option value="government-website">Government Website</option>
                      <option value="legal-database">Legal Database</option>
                      <option value="news-article">News Article</option>
                      <option value="academic-paper">Academic Paper</option>
                      <option value="other">Other</option>
                    </select>
                    {formData.sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={source.title}
                    onChange={(e) => handleSourceChange(index, 'title', e.target.value)}
                    placeholder="Source title"
                    className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    value={source.url}
                    onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSource}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Another Source
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Law' : 'Add New Law'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'jurisdiction', label: 'Jurisdiction' },
            { id: 'enforcement', label: 'Enforcement' },
            { id: 'penalties', label: 'Penalties' },
            { id: 'context', label: 'Context & Sources' },
          ].map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {renderSection()}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {initialData ? 'Update Law' : 'Add Law'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLawForm;
