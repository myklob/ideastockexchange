import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { argumentAPI, beliefAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddArgument = () => {
  const { id: beliefId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [belief, setBelief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    content: '',
    type: 'supporting',
    beliefId: beliefId
  });

  const [charCount, setCharCount] = useState(0);
  const MIN_CHARS = 10;
  const MAX_CHARS = 2000;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBelief();
  }, [beliefId, user]);

  const fetchBelief = async () => {
    try {
      setLoading(true);
      const response = await beliefAPI.getById(beliefId);
      setBelief(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load belief');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'content') {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.content.length < MIN_CHARS) {
      setError(`Argument must be at least ${MIN_CHARS} characters`);
      return;
    }

    if (formData.content.length > MAX_CHARS) {
      setError(`Argument must be no more than ${MAX_CHARS} characters`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await argumentAPI.create(formData);

      // Navigate back to belief details
      navigate(`/beliefs/${beliefId}`);
    } catch (err) {
      console.error('Error creating argument:', err);
      setError(err.response?.data?.message || 'Failed to create argument');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!belief) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Belief Not Found</h2>
            <Link to="/beliefs" className="text-blue-600 hover:text-blue-700 underline">
              Back to Beliefs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isValid = formData.content.length >= MIN_CHARS && formData.content.length <= MAX_CHARS;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to={`/beliefs/${beliefId}`}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Belief</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Add Argument</h1>
          <p className="text-gray-600 mb-4">
            Contribute to the debate by adding a supporting or opposing argument
          </p>

          {/* Belief Statement */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Belief:</p>
            <p className="text-gray-800">{belief.statement}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Argument Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Argument Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'supporting' }))}
                className={`p-6 border-2 rounded-lg transition-all ${
                  formData.type === 'supporting'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className={`w-8 h-8 ${
                    formData.type === 'supporting' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className={`font-semibold ${
                  formData.type === 'supporting' ? 'text-green-900' : 'text-gray-700'
                }`}>
                  Supporting
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This argument supports the belief
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'opposing' }))}
                className={`p-6 border-2 rounded-lg transition-all ${
                  formData.type === 'opposing'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <XCircle className={`w-8 h-8 ${
                    formData.type === 'opposing' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className={`font-semibold ${
                  formData.type === 'opposing' ? 'text-red-900' : 'text-gray-700'
                }`}>
                  Opposing
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This argument opposes the belief
                </p>
              </button>
            </div>
          </div>

          {/* Argument Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Argument Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={8}
              placeholder="Enter your argument here. Be clear, logical, and evidence-based..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                charCount > MAX_CHARS ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-600">
                <span className={charCount < MIN_CHARS || charCount > MAX_CHARS ? 'text-red-600 font-medium' : ''}>
                  {charCount}
                </span>
                <span className="text-gray-500"> / {MAX_CHARS} characters</span>
              </div>

              {charCount < MIN_CHARS && charCount > 0 && (
                <span className="text-sm text-red-600">
                  {MIN_CHARS - charCount} more characters needed
                </span>
              )}

              {charCount >= MIN_CHARS && charCount <= MAX_CHARS && (
                <span className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Valid length
                </span>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Guidelines for Quality Arguments:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific and clear in your reasoning</li>
              <li>• Avoid logical fallacies (ad hominem, straw man, etc.)</li>
              <li>• Support claims with evidence when possible</li>
              <li>• Focus on the idea, not the person</li>
              <li>• Be respectful and constructive</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Argument'
              )}
            </button>

            <Link
              to={`/beliefs/${beliefId}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Score Preview Info */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How Arguments Are Scored</h3>
          <p className="text-sm text-gray-600 mb-3">
            Your argument will be evaluated on multiple factors:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">Logical Coherence</div>
              <div className="text-gray-600">Absence of fallacies</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">Linkage Relevance</div>
              <div className="text-gray-600">Direct relation to belief</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">Community Votes</div>
              <div className="text-gray-600">Up/down votes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddArgument;
