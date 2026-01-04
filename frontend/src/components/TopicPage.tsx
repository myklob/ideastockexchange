/**
 * Main page for viewing and interacting with a topic and its criteria.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TopicWithCriteria, Criterion, CriterionCreateRequest } from '../types';
import { topicAPI, criterionAPI } from '../services/api';
import CriterionCard from './CriterionCard';
import ArgumentForm from './ArgumentForm';

const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<TopicWithCriteria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCriterion, setShowAddCriterion] = useState(false);
  const [showAddArgument, setShowAddArgument] = useState<number | null>(null);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionDesc, setNewCriterionDesc] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent'>('score');

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    if (!topicId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await topicAPI.get(parseInt(topicId));
      setTopic(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriterion = async () => {
    if (!topicId || !newCriterionName.trim()) return;

    try {
      const request: CriterionCreateRequest = {
        topic_id: parseInt(topicId),
        name: newCriterionName,
        description: newCriterionDesc || undefined,
      };
      await criterionAPI.create(request);
      setNewCriterionName('');
      setNewCriterionDesc('');
      setShowAddCriterion(false);
      loadTopic();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create criterion');
    }
  };

  const getSortedCriteria = (criteria: Criterion[]): Criterion[] => {
    const sorted = [...criteria];
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.overall_score - a.overall_score);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return sorted;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p className="text-gray-600">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error || 'Topic not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{topic.title}</h1>
        {topic.description && (
          <p className="text-lg text-gray-600">{topic.description}</p>
        )}
      </div>

      {/* Intro Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-2">
          Objective Criteria: Deciding the Yardstick First
        </h2>
        <p className="text-blue-800 mb-3">
          Before debating conclusions, we agree on measurement standards. Each criterion below
          is evaluated across four dimensions: <strong>Validity</strong>, <strong>Reliability</strong>,
          <strong>Independence</strong>, and <strong>Linkage</strong>.
        </p>
        <p className="text-sm text-blue-700">
          Community arguments determine each criterion's quality score. Better measures get more
          weight when evaluating evidence. This makes debates transparent and resolvable.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="score">Highest Score</option>
            <option value="name">Name (A-Z)</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddCriterion(!showAddCriterion)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
        >
          {showAddCriterion ? '✕ Cancel' : '+ Propose New Criterion'}
        </button>
      </div>

      {/* Add Criterion Form */}
      {showAddCriterion && (
        <div className="mb-6 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Propose New Criterion</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criterion Name *
            </label>
            <input
              type="text"
              value={newCriterionName}
              onChange={(e) => setNewCriterionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., GDP Growth Rate, Median Wage Growth, etc."
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newCriterionDesc}
              onChange={(e) => setNewCriterionDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Explain what this criterion measures and why it might be relevant..."
            />
          </div>
          <button
            onClick={handleAddCriterion}
            disabled={!newCriterionName.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            Create Criterion
          </button>
        </div>
      )}

      {/* Criteria List */}
      <div className="space-y-4">
        {topic.criteria.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No criteria yet for this topic.</p>
            <p className="text-sm text-gray-500">
              Be the first to propose a measurement standard!
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-2">
              Showing {topic.criteria.length} {topic.criteria.length === 1 ? 'criterion' : 'criteria'}
            </div>
            {getSortedCriteria(topic.criteria).map((criterion) => (
              <div key={criterion.id}>
                <CriterionCard criterion={criterion} onUpdate={loadTopic} />

                {/* Add Argument for this Criterion */}
                {showAddArgument === criterion.id ? (
                  <div className="ml-8 mb-4">
                    <ArgumentForm
                      criterionId={criterion.id}
                      onSuccess={() => {
                        setShowAddArgument(null);
                        loadTopic();
                      }}
                      onCancel={() => setShowAddArgument(null)}
                    />
                  </div>
                ) : (
                  <div className="ml-8 mb-4">
                    <button
                      onClick={() => setShowAddArgument(criterion.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Argument for this Criterion
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default TopicPage;
