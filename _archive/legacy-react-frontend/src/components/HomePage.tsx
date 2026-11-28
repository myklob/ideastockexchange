/**
 * Home page showing all topics.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topic, TopicCreateRequest } from '../types';
import { topicAPI } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await topicAPI.list();
      setTopics(data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setCreating(true);
    try {
      const request: TopicCreateRequest = {
        title: newTopicTitle,
        description: newTopicDesc || undefined,
      };
      const newTopic = await topicAPI.create(request);
      setNewTopicTitle('');
      setNewTopicDesc('');
      setShowCreateForm(false);
      navigate(`/topics/${newTopic.id}`);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create topic');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p className="text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Idea Stock Exchange
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Objective Criteria: Agreeing on the Yardstick Before the Fight
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          The Moving Goalposts Problem
        </h2>
        <p className="text-gray-700 mb-3">
          Most debates fail not because people can't agree on what's true, but because they can't
          agree on <em>how to measure what's true</em>.
        </p>
        <p className="text-gray-700 mb-4">
          One person defines "good economy" as rising GDP. Another defines it as falling inequality.
          They're measuring different things, calling it the same thing, and wondering why they
          can't convince each other.
        </p>
        <div className="bg-white rounded p-4 border-l-4 border-blue-600">
          <p className="font-semibold text-gray-900">
            The golden rule of reason: Before asking "Who is right?", we must ask "How do we
            measure what is right?"
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Propose Criteria</h3>
              <p className="text-gray-600 text-sm">
                The community brainstorms specific, quantifiable metrics to evaluate a topic.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Score Quality</h3>
              <p className="text-gray-600 text-sm">
                Each criterion is evaluated across four dimensions: Validity, Reliability,
                Independence, and Linkage.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Weigh Evidence</h3>
              <p className="text-gray-600 text-sm">
                Evidence based on high-quality criteria gets weighted heavily. Evidence based on
                poor criteria gets filtered out.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Topics</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create New Topic'}
          </button>
        </div>

        {/* Create Topic Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateTopic} className="mb-6 bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Topic</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic Title *
              </label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Is the Economy Healthy?, Is Climate Change Severe?, etc."
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Provide context or framing for this topic..."
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newTopicTitle.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {creating ? 'Creating...' : 'Create Topic'}
            </button>
          </form>
        )}

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No topics yet.</p>
            <p className="text-sm text-gray-500">
              Create the first topic to start evaluating ideas!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/topics/${topic.id}`)}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{topic.title}</h3>
                {topic.description && (
                  <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  Created {new Date(topic.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>
          Idea Stock Exchange - Building infrastructure for systematic criteria evaluation
        </p>
      </div>
    </div>
  );
};

export default HomePage;
