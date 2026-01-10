import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * StudyRankings - Display and search studies with ReasonRank scores
 *
 * Similar to Google Scholar but with actual PageRank-style algorithms applied
 * Shows studies ranked by ReasonRank, with detailed metrics and two-column
 * view for belief-specific searches
 */

const StudyRankings = ({ beliefId = null, beliefStatement = null }) => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    field: '',
    studyType: '',
    minReasonRank: 0,
    minCitations: 0,
    sortBy: 'reasonRankScore',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [viewMode, setViewMode] = useState(beliefId ? 'belief' : 'search');

  useEffect(() => {
    if (beliefId) {
      fetchStudiesByBelief();
    }
  }, [beliefId]);

  const fetchStudies = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/studies';
      const params = new URLSearchParams();

      if (searchQuery) {
        url = '/api/studies/search';
        params.append('q', searchQuery);
      } else if (viewMode === 'top') {
        url = '/api/studies/top';
      } else if (viewMode === 'most-cited') {
        url = '/api/studies/most-cited';
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${url}?${params.toString()}`);
      setStudies(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch studies');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudiesByBelief = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/studies/by-belief/${beliefId}`);
      setStudies(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch studies for belief');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchStudies();
  };

  const toggleDetails = (studyId) => {
    setShowDetails(prev => ({
      ...prev,
      [studyId]: !prev[studyId]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 35) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 65) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (score >= 35) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const StudyCard = ({ study, showPosition = false, position = null }) => {
    const isExpanded = showDetails[study._id || study.study?._id];
    const studyData = study.study || study;

    return (
      <div className="mb-4 p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        {/* Title and ReasonRank Score */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-4">
            {studyData.title}
          </h3>
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBadge(studyData.reasonRankScore)}`}>
              RR: {studyData.reasonRankScore?.toFixed(1)}
            </span>
            {showPosition && position && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                position === 'supporting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                position === 'opposing' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {position.charAt(0).toUpperCase() + position.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Authors */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {studyData.authors?.map(a => a.name).join(', ') || 'Unknown authors'}
        </p>

        {/* Journal and Publication Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {studyData.journal?.name || 'Unknown journal'}
          </span>
          <span>•</span>
          <span>{new Date(studyData.publicationDate).getFullYear()}</span>
          {studyData.citationMetrics?.citationCount !== undefined && (
            <>
              <span>•</span>
              <span>📚 {studyData.citationMetrics.citationCount} citations</span>
            </>
          )}
        </div>

        {/* Metrics Row */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mb-3">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {studyData.studyType?.replace(/-/g, ' ')}
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {studyData.field}
          </span>
          {studyData.methodologyMetrics?.sampleSize && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              n={studyData.methodologyMetrics.sampleSize}
            </span>
          )}
          {studyData.verificationStatus === 'verified' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
              ✓ Verified
            </span>
          )}
          {studyData.replicationInfo?.hasBeenReplicated && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
              ↻ Replicated
            </span>
          )}
        </div>

        {/* Abstract (if available) */}
        {studyData.abstract && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
            {studyData.abstract}
          </p>
        )}

        {/* Extracted Claim (for belief-specific view) */}
        {showPosition && study.extractedClaim && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Key Finding:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {study.extractedClaim}
            </p>
            {study.directQuote && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                "{study.directQuote}"
              </p>
            )}
          </div>
        )}

        {/* Actions and Details Toggle */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3 text-sm">
            {studyData.doi && (
              <a
                href={`https://doi.org/${studyData.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                DOI
              </a>
            )}
            {studyData.url && (
              <a
                href={studyData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Full Text
              </a>
            )}
            {studyData.pdfUrl && (
              <a
                href={studyData.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                PDF
              </a>
            )}
          </div>

          <button
            onClick={() => toggleDetails(study._id || study.study?._id)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Score Breakdown */}
              <div>
                <h4 className="font-semibold mb-2">ReasonRank Score Breakdown:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Citation Impact (30%):</span>
                    <span className="font-medium">
                      {studyData.scoreComponents?.citationImpactScore ?
                        (studyData.scoreComponents.citationImpactScore * 30).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Journal Quality (25%):</span>
                    <span className="font-medium">
                      {studyData.scoreComponents?.journalQualityScore ?
                        (studyData.scoreComponents.journalQualityScore * 25).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Methodology (20%):</span>
                    <span className="font-medium">
                      {studyData.scoreComponents?.methodologicalRigorScore ?
                        (studyData.scoreComponents.methodologicalRigorScore * 20).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Replication (15%):</span>
                    <span className="font-medium">
                      {studyData.scoreComponents?.replicationScore ?
                        (studyData.scoreComponents.replicationScore * 15).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Position (10%):</span>
                    <span className="font-medium">
                      {studyData.scoreComponents?.networkPositionScore ?
                        (studyData.scoreComponents.networkPositionScore * 10).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Citation and Replication Info */}
              <div>
                <h4 className="font-semibold mb-2">Additional Information:</h4>
                <div className="space-y-1 text-xs">
                  {studyData.citationMetrics && (
                    <>
                      <p>Citations: {studyData.citationMetrics.citationCount}</p>
                      <p>Citations/Year: {studyData.citationMetrics.citationsPerYear?.toFixed(1)}</p>
                    </>
                  )}
                  {studyData.replicationInfo && (
                    <>
                      <p>Replication Attempts: {studyData.replicationInfo.replicationAttempts}</p>
                      <p>Successful: {studyData.replicationInfo.successfulReplications}</p>
                      <p>Failed: {studyData.replicationInfo.failedReplications}</p>
                    </>
                  )}
                  {studyData.methodologyMetrics?.pValue !== null && (
                    <p>p-value: {studyData.methodologyMetrics.pValue}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Keywords */}
            {studyData.keywords && studyData.keywords.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-sm mb-2">Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {studyData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistical Findings (for belief-specific view) */}
            {showPosition && study.statisticalFindings && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                <h4 className="font-semibold text-sm mb-2">Statistical Findings:</h4>
                <div className="text-xs space-y-1">
                  {study.statisticalFindings.primaryOutcome && (
                    <p><strong>Outcome:</strong> {study.statisticalFindings.primaryOutcome}</p>
                  )}
                  {study.statisticalFindings.effectSize !== null && (
                    <p><strong>Effect Size:</strong> {study.statisticalFindings.effectSize}</p>
                  )}
                  {study.statisticalFindings.pValue !== null && (
                    <p><strong>p-value:</strong> {study.statisticalFindings.pValue}</p>
                  )}
                  {study.statisticalFindings.confidenceInterval && (
                    <p>
                      <strong>CI:</strong> [{study.statisticalFindings.confidenceInterval.lower}, {study.statisticalFindings.confidenceInterval.upper}] ({study.statisticalFindings.confidenceInterval.level}%)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const BeliefSpecificView = () => {
    if (!studies.supporting && !studies.opposing) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supporting Studies */}
        <div>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
            Studies That Support ({studies.supporting?.length || 0})
          </h2>
          {studies.supporting && studies.supporting.length > 0 ? (
            studies.supporting.map((study, idx) => (
              <StudyCard key={idx} study={study} showPosition={true} position="supporting" />
            ))
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
              No supporting studies found
            </div>
          )}
        </div>

        {/* Opposing Studies */}
        <div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
            Studies That Oppose ({studies.opposing?.length || 0})
          </h2>
          {studies.opposing && studies.opposing.length > 0 ? (
            studies.opposing.map((study, idx) => (
              <StudyCard key={idx} study={study} showPosition={true} position="opposing" />
            ))
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
              No opposing studies found
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {viewMode === 'belief' ? 'Studies Analysis' : 'Study Rankings with ReasonRank'}
        </h1>
        {beliefStatement && (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {beliefStatement}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Studies ranked using PageRank-style algorithms based on citations, methodology, and replication
        </p>
      </div>

      {/* Search and Filters (not shown in belief-specific mode) */}
      {!beliefId && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search studies by title, author, or keywords..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4">
            <select
              value={filters.field}
              onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="">All Fields</option>
              <option value="medicine">Medicine</option>
              <option value="biology">Biology</option>
              <option value="psychology">Psychology</option>
              <option value="neuroscience">Neuroscience</option>
              <option value="computer-science">Computer Science</option>
            </select>

            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="search">Search</option>
              <option value="top">Top Ranked</option>
              <option value="most-cited">Most Cited</option>
            </select>

            <button
              onClick={fetchStudies}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {viewMode === 'belief' || beliefId ? (
            <BeliefSpecificView />
          ) : (
            <div>
              {studies.length === 0 ? (
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">No studies found</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Showing {studies.length} {pagination ? `of ${pagination.total} ` : ''}studies
                  </div>
                  {studies.map((study, idx) => (
                    <StudyCard key={idx} study={study} />
                  ))}
                </>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, page: Math.max(1, filters.page - 1) }));
                      fetchStudies();
                    }}
                    disabled={filters.page === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, filters.page + 1) }));
                      fetchStudies();
                    }}
                    disabled={filters.page === pagination.pages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudyRankings;
