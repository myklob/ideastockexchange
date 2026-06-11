/**
 * Form for creating and editing dimension arguments.
 */
import React, { useState } from 'react';
import { DimensionType, ArgumentDirection, DimensionArgumentCreateRequest } from '../types';
import { argumentAPI } from '../services/api';

interface ArgumentFormProps {
  criterionId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ArgumentForm: React.FC<ArgumentFormProps> = ({ criterionId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<DimensionArgumentCreateRequest>({
    criterion_id: criterionId,
    dimension: DimensionType.VALIDITY,
    direction: ArgumentDirection.SUPPORTING,
    content: '',
    evidence_quality: 50,
    logical_validity: 50,
    importance: 50,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await argumentAPI.create(formData);
      if (onSuccess) onSuccess();
      // Reset form
      setFormData({
        ...formData,
        content: '',
        evidence_quality: 50,
        logical_validity: 50,
        importance: 50,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create argument');
    } finally {
      setSubmitting(false);
    }
  };

  const dimensionDescriptions = {
    [DimensionType.VALIDITY]: 'Does this actually measure what we think it measures?',
    [DimensionType.RELIABILITY]: 'Can different people measure this consistently?',
    [DimensionType.INDEPENDENCE]: 'Is the data source neutral?',
    [DimensionType.LINKAGE]: 'How strongly does this correlate with the goal?',
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Argument</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Dimension Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dimension
        </label>
        <select
          value={formData.dimension}
          onChange={(e) => setFormData({ ...formData, dimension: e.target.value as DimensionType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {Object.values(DimensionType).map((dim) => (
            <option key={dim} value={dim}>
              {dim.charAt(0).toUpperCase() + dim.slice(1)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {dimensionDescriptions[formData.dimension]}
        </p>
      </div>

      {/* Direction Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direction
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value={ArgumentDirection.SUPPORTING}
              checked={formData.direction === ArgumentDirection.SUPPORTING}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value as ArgumentDirection })}
              className="mr-2"
            />
            <span className="text-sm">
              <span className="text-green-600 font-semibold">✓ Supporting</span>
              <span className="text-gray-600 ml-1">(pushes score higher)</span>
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value={ArgumentDirection.OPPOSING}
              checked={formData.direction === ArgumentDirection.OPPOSING}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value as ArgumentDirection })}
              className="mr-2"
            />
            <span className="text-sm">
              <span className="text-red-600 font-semibold">✗ Opposing</span>
              <span className="text-gray-600 ml-1">(pushes score lower)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Argument Content *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          required
          placeholder="Explain why this criterion is/isn't a good measure..."
        />
      </div>

      {/* Quality Scores */}
      <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Argument Quality Scores</h4>

        {/* Evidence Quality */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence Quality: {formData.evidence_quality}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.evidence_quality}
            onChange={(e) => setFormData({ ...formData, evidence_quality: parseInt(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            How well-supported is this argument with evidence?
          </p>
        </div>

        {/* Logical Validity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logical Validity: {formData.logical_validity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.logical_validity}
            onChange={(e) => setFormData({ ...formData, logical_validity: parseInt(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            How logically sound is this argument?
          </p>
        </div>

        {/* Importance */}
        <div className="mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Importance: {formData.importance}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.importance}
            onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            How important is this consideration?
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !formData.content.trim()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? 'Adding...' : 'Add Argument'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ArgumentForm;
