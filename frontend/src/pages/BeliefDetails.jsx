import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, TrendingUp, Edit, Trash2, Loader } from 'lucide-react';
import ArgumentCard from '../components/Arguments/ArgumentCard';
import ScoreBreakdown from '../components/Beliefs/ScoreBreakdown';
import ConflictResolution from '../components/ConflictResolution';
import { beliefAPI, conflictAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BeliefDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [belief, setBelief] = useState(null);
  const [arguments, setArguments] = useState({ supporting: [], opposing: [] });
  const [similarBeliefs, setSimilarBeliefs] = useState([]);
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, supporting, opposing
  const [showSimilar, setShowSimilar] = useState(false);

  useEffect(() => {
    fetchBeliefDetails();
  }, [id]);

  const fetchBeliefDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch belief with populated arguments
      const response = await beliefAPI.getById(id);
      const beliefData = response.data;

      setBelief(beliefData);

      // Organize arguments by type
      const allArgs = beliefData.supportingArguments.concat(beliefData.opposingArguments);

      setArguments({
        supporting: beliefData.supportingArguments || [],
        opposing: beliefData.opposingArguments || []
      });

      // Fetch similar beliefs
      try {
        const similarResponse = await beliefAPI.getSimilar(id);
        if (similarResponse.data && similarResponse.data.success) {
          setSimilarBeliefs(similarResponse.data.data || []);
        }
      } catch (similarErr) {
        console.error('Error fetching similar beliefs:', similarErr);
        // Don't fail the whole page if similar beliefs fail
      }

      // Increment view count
      await beliefAPI.incrementViews(id);

      // Detect/fetch conflict if exists
      try {
        const conflictResponse = await conflictAPI.detectForBelief(id);
        if (conflictResponse.analysis?.hasConflict) {
          // Try to get or create conflict resolution workflow
          const conflictData = await conflictAPI.getAll({ beliefId: id, limit: 1 });
          if (conflictData.conflicts && conflictData.conflicts.length > 0) {
            setConflict(conflictData.conflicts[0]);
          }
        }
      } catch (conflictErr) {
        console.error('Error fetching conflict:', conflictErr);
        // Don't fail the whole page if conflict detection fails
      }
    } catch (err) {
      console.error('Error fetching belief:', err);
      setError(err.response?.data?.message || 'Failed to load belief details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this belief? This action cannot be undone.')) {
      return;
    }

    try {
      await beliefAPI.delete(id);
      navigate('/beliefs');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete belief');
    }
  };

  const handleArgumentVote = async (argumentId, voteType) => {
    // Refresh belief data to get updated scores
    await fetchBeliefDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading belief...</span>
        </div>
      </div>
    );
  }

  if (error || !belief) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Belief</h2>
            <p className="text-red-600 mb-4">{error || 'Belief not found'}</p>
            <Link to="/beliefs" className="text-blue-600 hover:text-blue-700 underline">
              Back to Beliefs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && belief.author && user._id === belief.author._id;
  const allArguments = [...arguments.supporting, ...arguments.opposing];

  const filteredArguments = () => {
    if (activeTab === 'supporting') return arguments.supporting;
    if (activeTab === 'opposing') return arguments.opposing;
    return allArguments;
  };

  const getCategoryColor = (category) => {
    const colors = {
      politics: 'bg-blue-100 text-blue-800',
      science: 'bg-purple-100 text-purple-800',
      technology: 'bg-indigo-100 text-indigo-800',
      philosophy: 'bg-pink-100 text-pink-800',
      economics: 'bg-green-100 text-green-800',
      social: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/beliefs"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Beliefs</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Belief Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {belief.statement}
                  </h1>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(belief.category)}`}>
                      {belief.category}
                    </span>

                    {belief.trending && (
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-orange-700 bg-orange-100 rounded-full">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Trending
                      </span>
                    )}

                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>{belief.statistics?.views || 0} views</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {belief.tags && belief.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {belief.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {belief.description && (
                    <p className="text-gray-700 leading-relaxed">{belief.description}</p>
                  )}

                  {/* Author */}
                  <div className="mt-4 text-sm text-gray-500">
                    Created by <span className="font-medium text-gray-700">{belief.author?.username || 'Anonymous'}</span>
                    {' '} on {new Date(belief.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                {isOwner && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/beliefs/${id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Conflict Resolution Component */}
            {conflict && (
              <ConflictResolution
                beliefId={id}
                conflict={conflict}
                onRefresh={fetchBeliefDetails}
              />
            )}

            {/* Arguments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Arguments</h2>
                <Link
                  to={`/beliefs/${id}/add-argument`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Argument</span>
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex items-center space-x-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'all'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({allArguments.length})
                </button>
                <button
                  onClick={() => setActiveTab('supporting')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'supporting'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Supporting ({arguments.supporting.length})
                </button>
                <button
                  onClick={() => setActiveTab('opposing')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'opposing'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Opposing ({arguments.opposing.length})
                </button>
              </div>

              {/* Arguments List */}
              {filteredArguments().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    No {activeTab !== 'all' ? activeTab : ''} arguments yet.
                  </p>
                  <Link
                    to={`/beliefs/${id}/add-argument`}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Argument</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArguments().map((argument) => (
                    <ArgumentCard
                      key={argument._id}
                      argument={argument}
                      onVote={handleArgumentVote}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Score Breakdown */}
            <ScoreBreakdown belief={belief} arguments={allArguments} />

            {/* Three-Dimensional Position */}
            {belief.dimensions && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Belief Dimensions</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Three-dimensional positioning for semantic navigation
                </p>
                <div className="space-y-4">
                  {/* Specificity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Specificity
                      </span>
                      <span className="text-sm text-gray-600">
                        {belief.dimensions.specificity || 50}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${belief.dimensions.specificity || 50}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>General</span>
                      <span>Specific</span>
                    </div>
                  </div>

                  {/* Strength (Conclusion Score) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Strength
                      </span>
                      <span className="text-sm text-gray-600">
                        {belief.conclusionScore || 50}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          belief.conclusionScore >= 60
                            ? 'bg-green-600'
                            : belief.conclusionScore >= 40
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${belief.conclusionScore || 50}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Weaker</span>
                      <span>Stronger</span>
                    </div>
                  </div>

                  {/* Sentiment Polarity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Sentiment
                      </span>
                      <span className="text-sm text-gray-600">
                        {belief.dimensions.sentimentPolarity || 0}
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-2">
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400" />
                      {/* Sentiment bar */}
                      <div
                        className={`absolute h-2 rounded-full ${
                          (belief.dimensions.sentimentPolarity || 0) > 0
                            ? 'bg-green-600'
                            : (belief.dimensions.sentimentPolarity || 0) < 0
                            ? 'bg-red-600'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          left: (belief.dimensions.sentimentPolarity || 0) < 0
                            ? `${50 + (belief.dimensions.sentimentPolarity || 0) / 2}%`
                            : '50%',
                          width: `${Math.abs((belief.dimensions.sentimentPolarity || 0) / 2)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Negative</span>
                      <span>Neutral</span>
                      <span>Positive</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Beliefs */}
            {similarBeliefs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Similar Beliefs
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Semantically similar statements grouped together
                </p>
                <div className="space-y-3">
                  {similarBeliefs.slice(0, showSimilar ? similarBeliefs.length : 3).map((similar) => (
                    <Link
                      key={similar.belief._id}
                      to={`/beliefs/${similar.belief._id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 flex-1">
                          {similar.belief.statement}
                        </p>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            similar.isOpposite
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {similar.isOpposite ? 'Opposite' : 'Similar'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Similarity: {(similar.similarityScore * 100).toFixed(0)}%
                      </div>
                    </Link>
                  ))}
                </div>
                {similarBeliefs.length > 3 && (
                  <button
                    onClick={() => setShowSimilar(!showSimilar)}
                    className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showSimilar ? 'Show Less' : `Show ${similarBeliefs.length - 3} More`}
                  </button>
                )}
              </div>
            )}

            {/* Related Beliefs */}
            {belief.relatedBeliefs && belief.relatedBeliefs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Related Beliefs</h3>
                <div className="space-y-3">
                  {belief.relatedBeliefs.map((related) => (
                    <Link
                      key={related.beliefId._id}
                      to={`/beliefs/${related.beliefId._id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 flex-1">
                          {related.beliefId.statement}
                        </p>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            related.relationship === 'supports'
                              ? 'bg-green-100 text-green-800'
                              : related.relationship === 'opposes'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {related.relationship}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Linkage: {(related.linkageStrength * 100).toFixed(0)}%
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeliefDetails;
