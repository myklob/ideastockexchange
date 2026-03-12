import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import LawCard from './LawCard';
import { lawAPI } from '../../services/api';

const LawList = ({ beliefId, onAddLaw }) => {
  const [laws, setLaws] = useState({ supporting: [], opposing: [], neutral: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'supporting', 'opposing', 'neutral'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (beliefId) {
      fetchLaws();
    }
  }, [beliefId]);

  const fetchLaws = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lawAPI.getBeliefLaws(beliefId);

      if (response.success) {
        setLaws(response.data);
      }
    } catch (err) {
      console.error('Error fetching laws:', err);
      setError('Failed to load laws. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLaws = () => {
    let lawsToShow = [];

    if (activeTab === 'all') {
      lawsToShow = [...laws.supporting, ...laws.opposing, ...laws.neutral];
    } else if (activeTab === 'supporting') {
      lawsToShow = laws.supporting;
    } else if (activeTab === 'opposing') {
      lawsToShow = laws.opposing;
    } else if (activeTab === 'neutral') {
      lawsToShow = laws.neutral;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      lawsToShow = lawsToShow.filter(law =>
        law.title.toLowerCase().includes(query) ||
        law.description?.toLowerCase().includes(query) ||
        law.jurisdiction?.country?.toLowerCase().includes(query)
      );
    }

    return lawsToShow;
  };

  const filteredLaws = getFilteredLaws();
  const totalLaws = laws.supporting.length + laws.opposing.length + laws.neutral.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchLaws}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Legal Framework</h2>
        </div>
        {onAddLaw && (
          <button
            onClick={onAddLaw}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Law
          </button>
        )}
      </div>

      {/* Description */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          Laws provide concrete, measurable evidence of societal values and consensus.
          They show what society has already decided about this belief and how strongly those decisions are enforced.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Laws ({totalLaws})
        </button>
        <button
          onClick={() => setActiveTab('supporting')}
          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'supporting'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Supporting ({laws.supporting.length})
        </button>
        <button
          onClick={() => setActiveTab('opposing')}
          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'opposing'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Opposing ({laws.opposing.length})
        </button>
        <button
          onClick={() => setActiveTab('neutral')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'neutral'
              ? 'border-gray-600 text-gray-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Neutral ({laws.neutral.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search laws by title, description, or jurisdiction..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Summary Stats */}
      {totalLaws > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-600 font-medium mb-1">Supporting Laws</div>
            <div className="text-2xl font-bold text-green-900">{laws.supporting.length}</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-600 font-medium mb-1">Opposing Laws</div>
            <div className="text-2xl font-bold text-red-900">{laws.opposing.length}</div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-1">Net Support</div>
            <div className={`text-2xl font-bold ${
              laws.supporting.length > laws.opposing.length ? 'text-green-900' :
              laws.supporting.length < laws.opposing.length ? 'text-red-900' : 'text-gray-900'
            }`}>
              {laws.supporting.length > laws.opposing.length ? '+' : ''}
              {laws.supporting.length - laws.opposing.length}
            </div>
          </div>
        </div>
      )}

      {/* Laws Grid */}
      {filteredLaws.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          {totalLaws === 0 ? (
            <>
              <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Laws Yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to add a law related to this belief!
              </p>
              {onAddLaw && (
                <button
                  onClick={onAddLaw}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Law
                </button>
              )}
            </>
          ) : (
            <>
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Matching Laws</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLaws.map((law) => (
            <LawCard
              key={law._id}
              law={law}
              showRelationship={true}
              relationshipData={law.relationshipToThisBelief}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LawList;
