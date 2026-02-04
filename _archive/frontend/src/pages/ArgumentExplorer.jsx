import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Map,
  GitBranch,
  BarChart3,
  TrendingUp,
  Filter,
  ChevronRight,
  Target,
  Layers,
  Eye,
} from 'lucide-react';
import { beliefAPI } from '../services/api';

// ============================================================================
// BELIEF MAP CARD - Preview card for a belief's argument map
// ============================================================================
const BeliefMapCard = ({ belief }) => {
  const totalArgs = (belief.statistics?.supportingCount || 0) + (belief.statistics?.opposingCount || 0);
  const supportRatio = totalArgs > 0
    ? (belief.statistics?.supportingCount || 0) / totalArgs * 100
    : 50;

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Link
      to={`/beliefs/${belief._id}/map`}
      className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Header with belief statement */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
              {belief.statement}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">{belief.category}</span>
              {belief.trending && (
                <span className="flex items-center gap-1 text-orange-600">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className={`text-lg font-bold ${getScoreColor(belief.conclusionScore || 50)}`}>
              {Math.round(belief.conclusionScore || 50)}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{totalArgs}</div>
            <div className="text-xs text-gray-500">Arguments</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {belief.statistics?.supportingCount || 0}
            </div>
            <div className="text-xs text-gray-500">Pro</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {belief.statistics?.opposingCount || 0}
            </div>
            <div className="text-xs text-gray-500">Con</div>
          </div>
        </div>

        {/* Balance bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${supportRatio}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${100 - supportRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <Eye className="w-4 h-4" />
          {belief.statistics?.views || 0} views
        </div>
        <div className="flex items-center gap-1 text-blue-600 font-medium">
          View Map
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

// ============================================================================
// TOP DEBATES SECTION - Most active argument maps
// ============================================================================
const TopDebatesSection = ({ beliefs }) => {
  const topDebates = useMemo(() => {
    return [...beliefs]
      .sort((a, b) => {
        const aArgs = (a.statistics?.totalArguments || 0);
        const bArgs = (b.statistics?.totalArguments || 0);
        return bArgs - aArgs;
      })
      .slice(0, 5);
  }, [beliefs]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        Most Active Debates
      </h3>
      <div className="space-y-3">
        {topDebates.map((belief, idx) => (
          <Link
            key={belief._id}
            to={`/beliefs/${belief._id}/map`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                idx === 1 ? 'bg-gray-200 text-gray-700' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-1">{belief.statement}</p>
              <p className="text-xs text-gray-500">
                {belief.statistics?.totalArguments || 0} arguments
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CATEGORY FILTER SECTION
// ============================================================================
const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" />
        Categories
      </h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            !selectedCategory
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
              selectedCategory === cat.name
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="capitalize">{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ARGUMENT EXPLORER PAGE
// ============================================================================
const ArgumentExplorer = () => {
  const [beliefs, setBeliefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('arguments'); // arguments, score, recent, views

  // Fetch beliefs
  useEffect(() => {
    const fetchBeliefs = async () => {
      try {
        setLoading(true);
        const response = await beliefAPI.getAll({ limit: 100 });
        if (response.success) {
          setBeliefs(response.data.beliefs || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load beliefs');
      } finally {
        setLoading(false);
      }
    };

    fetchBeliefs();
  }, []);

  // Calculate categories
  const categories = useMemo(() => {
    const catMap = {};
    beliefs.forEach(b => {
      const cat = b.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [beliefs]);

  // Filter and sort beliefs
  const filteredBeliefs = useMemo(() => {
    let result = [...beliefs];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.statement?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query) ||
        b.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(b => b.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'arguments':
          return (b.statistics?.totalArguments || 0) - (a.statistics?.totalArguments || 0);
        case 'score':
          return (b.conclusionScore || 50) - (a.conclusionScore || 50);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'views':
          return (b.statistics?.views || 0) - (a.statistics?.views || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [beliefs, searchQuery, selectedCategory, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const totalArgs = beliefs.reduce((sum, b) => sum + (b.statistics?.totalArguments || 0), 0);
    const avgScore = beliefs.length > 0
      ? beliefs.reduce((sum, b) => sum + (b.conclusionScore || 50), 0) / beliefs.length
      : 50;
    return {
      totalBeliefs: beliefs.length,
      totalArguments: totalArgs,
      avgScore: avgScore.toFixed(1),
      categories: categories.length,
    };
  }, [beliefs, categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Map className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Argument Explorer</h1>
              <p className="text-indigo-200">
                Visualize and explore networks of arguments and sub-arguments
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalBeliefs}</div>
              <div className="text-sm text-indigo-200">Beliefs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalArguments}</div>
              <div className="text-sm text-indigo-200">Arguments</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.avgScore}</div>
              <div className="text-sm text-indigo-200">Avg Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.categories}</div>
              <div className="text-sm text-indigo-200">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-72 shrink-0 space-y-6">
            <TopDebatesSection beliefs={beliefs} />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {/* Main Grid */}
          <div className="flex-1">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search beliefs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="arguments">Most Arguments</option>
                  <option value="score">Highest Score</option>
                  <option value="views">Most Viewed</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredBeliefs.length} of {beliefs.length} beliefs
              {selectedCategory && ` in ${selectedCategory}`}
            </div>

            {/* Grid of Belief Cards */}
            {filteredBeliefs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No beliefs found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBeliefs.map((belief) => (
                  <BeliefMapCard key={belief._id} belief={belief} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArgumentExplorer;
