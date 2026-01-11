import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader } from 'lucide-react';
import BeliefCard from '../components/Beliefs/BeliefCard';
import SearchBar from '../components/Beliefs/SearchBar';
import BeliefFilters from '../components/Beliefs/BeliefFilters';
import { beliefAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BeliefsList = () => {
  const { user } = useAuth();
  const [beliefs, setBeliefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    sort: 'recent',
    minScore: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBeliefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        page,
        limit: 20
      };

      if (searchTerm) params.search = searchTerm;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.minScore > 0) params.minScore = filters.minScore;

      // Handle sorting
      switch (filters.sort) {
        case 'score-desc':
          params.sort = '-conclusionScore';
          break;
        case 'score-asc':
          params.sort = 'conclusionScore';
          break;
        case 'arguments':
          params.sort = '-statistics.totalArguments';
          break;
        case 'views':
          params.sort = '-statistics.views';
          break;
        case 'trending':
          params.sort = '-trending,-statistics.totalArguments';
          break;
        default:
          params.sort = '-createdAt';
      }

      const response = await beliefAPI.getAll(params);

      setBeliefs(response.data.beliefs || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching beliefs:', err);
      setError(err.response?.data?.message || 'Failed to load beliefs');
    } finally {
      setLoading(false);
    }
  }, [page, filters, searchTerm]);

  useEffect(() => {
    fetchBeliefs();
  }, [fetchBeliefs]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPage(1); // Reset to first page on new search
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      status: 'all',
      sort: 'recent',
      minScore: 0
    });
    setSearchTerm('');
    setPage(1);
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Idea Stock Exchange</h1>
            <p className="mt-2 text-lg text-gray-600">
              Explore evidence-based beliefs and arguments
            </p>
          </div>
          {user && (
            <Link
              to="/beliefs/create"
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Create Belief</span>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search beliefs by statement or description..."
          />
        </div>

        {/* Filters */}
        <BeliefFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        {!loading && beliefs.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {beliefs.length} belief{beliefs.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading beliefs...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchBeliefs}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && beliefs.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No beliefs found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.category !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a belief!'}
            </p>
            {user && (
              <Link
                to="/beliefs/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Belief</span>
              </Link>
            )}
          </div>
        )}

        {/* Beliefs Grid */}
        {!loading && !error && beliefs.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {beliefs.map((belief) => (
                <BeliefCard key={belief._id} belief={belief} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === page - 2 ||
                      pageNum === page + 2
                    ) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BeliefsList;
