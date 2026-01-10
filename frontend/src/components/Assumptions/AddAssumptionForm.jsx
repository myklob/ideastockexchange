import React, { useState } from 'react';

const AddAssumptionForm = ({ beliefId, arguments: availableArguments = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    statement: '',
    description: '',
    mustAccept: false,
    mustReject: false,
    criticalityReason: '',
    tags: '',
    dependentArguments: []
  });

  const [selectedArguments, setSelectedArguments] = useState([]);
  const [showArgumentSelector, setShowArgumentSelector] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // Ensure mustAccept and mustReject are mutually exclusive
      if (name === 'mustAccept' && checked) {
        setFormData({
          ...formData,
          mustAccept: true,
          mustReject: false
        });
      } else if (name === 'mustReject' && checked) {
        setFormData({
          ...formData,
          mustAccept: false,
          mustReject: true
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleArgumentToggle = (argumentId) => {
    const exists = selectedArguments.find(a => a.argumentId === argumentId);

    if (exists) {
      setSelectedArguments(selectedArguments.filter(a => a.argumentId !== argumentId));
    } else {
      setSelectedArguments([
        ...selectedArguments,
        { argumentId, integralityScore: 50 }
      ]);
    }
  };

  const handleIntegralityChange = (argumentId, score) => {
    setSelectedArguments(
      selectedArguments.map(a =>
        a.argumentId === argumentId
          ? { ...a, integralityScore: parseInt(score) }
          : a
      )
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.statement.trim()) {
      newErrors.statement = 'Statement is required';
    } else if (formData.statement.length < 10) {
      newErrors.statement = 'Statement must be at least 10 characters';
    } else if (formData.statement.length > 500) {
      newErrors.statement = 'Statement cannot exceed 500 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters';
    }

    if ((formData.mustAccept || formData.mustReject) && !formData.criticalityReason.trim()) {
      newErrors.criticalityReason = 'Please provide a reason for marking this as critical';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submissionData = {
      ...formData,
      beliefId,
      tags: formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0),
      dependentArguments: selectedArguments
    };

    onSubmit(submissionData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Propose New Assumption</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Statement */}
        <div>
          <label htmlFor="statement" className="block text-sm font-semibold text-gray-700 mb-1">
            Assumption Statement *
          </label>
          <textarea
            id="statement"
            name="statement"
            value={formData.statement}
            onChange={handleChange}
            rows="3"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.statement
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="What assumption do you believe underlies this belief?"
          />
          {errors.statement && (
            <p className="text-red-500 text-xs mt-1">{errors.statement}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.statement.length}/500 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            Detailed Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Provide more context or explanation for this assumption..."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/2000 characters
          </p>
        </div>

        {/* Critical Flags */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Criticality</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="mustAccept"
                checked={formData.mustAccept}
                onChange={handleChange}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-gray-700">
                This assumption <strong>must be accepted</strong> for the belief to hold
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="mustReject"
                checked={formData.mustReject}
                onChange={handleChange}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">
                This assumption <strong>must be rejected</strong> for the belief to hold
              </span>
            </label>
          </div>

          {(formData.mustAccept || formData.mustReject) && (
            <div className="mt-3">
              <label htmlFor="criticalityReason" className="block text-sm font-semibold text-gray-700 mb-1">
                Reason for Criticality *
              </label>
              <textarea
                id="criticalityReason"
                name="criticalityReason"
                value={formData.criticalityReason}
                onChange={handleChange}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.criticalityReason
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Explain why this assumption is critical..."
              />
              {errors.criticalityReason && (
                <p className="text-red-500 text-xs mt-1">{errors.criticalityReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Dependent Arguments */}
        {availableArguments && availableArguments.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-gray-700">
                Link to Dependent Arguments
              </h3>
              <button
                type="button"
                onClick={() => setShowArgumentSelector(!showArgumentSelector)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showArgumentSelector ? 'Hide' : 'Show'} Arguments ({selectedArguments.length} selected)
              </button>
            </div>

            {showArgumentSelector && (
              <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                {availableArguments.map((arg) => {
                  const isSelected = selectedArguments.some(a => a.argumentId === arg._id);
                  const selectedArg = selectedArguments.find(a => a.argumentId === arg._id);

                  return (
                    <div key={arg._id} className="bg-white p-3 rounded border border-gray-200">
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleArgumentToggle(arg._id)}
                          className="mt-1 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            {arg.content?.substring(0, 150)}
                            {arg.content?.length > 150 ? '...' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {arg.type} • ReasonRank: {arg.reasonRankScore || 0}
                          </p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="mt-2 pl-6">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            How integral is this assumption to the argument? (0-100)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedArg?.integralityScore || 50}
                            onChange={(e) => handleIntegralityChange(arg._id, e.target.value)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>Not integral</span>
                            <span className="font-semibold">{selectedArg?.integralityScore || 50}%</span>
                            <span>Critical</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-1">
            Tags (Optional)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Propose Assumption
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddAssumptionForm;
