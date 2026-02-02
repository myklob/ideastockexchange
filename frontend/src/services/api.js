import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
  },
};

// ============================================================================
// BELIEF API
// ============================================================================

export const beliefAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/beliefs', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/beliefs/${id}`);
    return response.data;
  },

  create: async (beliefData) => {
    const response = await api.post('/beliefs', beliefData);
    return response.data;
  },

  update: async (id, beliefData) => {
    const response = await api.put(`/beliefs/${id}`, beliefData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/beliefs/${id}`);
    return response.data;
  },

  getArguments: async (id) => {
    const response = await api.get(`/beliefs/${id}/arguments`);
    return response.data;
  },

  calculateScore: async (id) => {
    const response = await api.post(`/beliefs/${id}/calculate-score`);
    return response.data;
  },

  incrementViews: async (id) => {
    try {
      // Silent increment - doesn't need to block UI
      await api.post(`/beliefs/${id}/increment-views`);
    } catch (error) {
      // Silently fail - view counting is not critical
      console.warn('Failed to increment views:', error);
    }
  },

  // Semantic clustering and similarity
  checkDuplicate: async (statement) => {
    const response = await api.post('/beliefs/check-duplicate', { statement });
    return response.data;
  },

  getSimilar: async (id, threshold = 0.7) => {
    const response = await api.get(`/beliefs/${id}/similar`, {
      params: { threshold },
    });
    return response.data;
  },

  linkSimilar: async (id, similarBeliefId, similarityScore) => {
    const response = await api.post(`/beliefs/${id}/link-similar`, {
      similarBeliefId,
      similarityScore,
    });
    return response.data;
  },

  mergeBelief: async (id, beliefIdToMerge) => {
    const response = await api.post(`/beliefs/${id}/merge`, {
      beliefIdToMerge,
    });
    return response.data;
  },

  updateDimensions: async (id) => {
    const response = await api.post(`/beliefs/${id}/update-dimensions`);
    return response.data;
  },

  searchByDimensions: async (params = {}) => {
    const response = await api.get('/beliefs/search/dimensions', { params });
    return response.data;
  },
};

// ============================================================================
// TOPIC API
// ============================================================================

export const topicAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/topics', { params });
    return response.data;
  },

  getByIdOrSlug: async (idOrSlug) => {
    const response = await api.get(`/topics/${idOrSlug}`);
    return response.data;
  },

  getBeliefs: async (idOrSlug, params = {}) => {
    const response = await api.get(`/topics/${idOrSlug}/beliefs`, { params });
    return response.data;
  },

  create: async (topicData) => {
    const response = await api.post('/topics', topicData);
    return response.data;
  },

  update: async (id, topicData) => {
    const response = await api.put(`/topics/${id}`, topicData);
    return response.data;
  },

  updateStatistics: async (id) => {
    const response = await api.post(`/topics/${id}/update-statistics`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/topics/${id}`);
    return response.data;
  },
};

// ============================================================================
// ARGUMENT API
// ============================================================================

export const argumentAPI = {
  create: async (argumentData) => {
    const response = await api.post('/arguments', argumentData);
    return response.data;
  },

  update: async (id, argumentData) => {
    const response = await api.put(`/arguments/${id}`, argumentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/arguments/${id}`);
    return response.data;
  },

  vote: async (id, voteType) => {
    const response = await api.post(`/arguments/${id}/vote`, { vote: voteType });
    return response.data;
  },

  // Network/Map endpoints
  getNetwork: async (beliefId, params = {}) => {
    const response = await api.get(`/arguments/network/${beliefId}`, { params });
    return response.data;
  },

  getRanked: async (beliefId, params = {}) => {
    const response = await api.get(`/arguments/ranked/${beliefId}`, { params });
    return response.data;
  },

  link: async (sourceId, targetId, linkageType, strength, notes) => {
    const response = await api.post('/arguments/link', {
      sourceId,
      targetId,
      linkageType,
      strength,
      notes,
    });
    return response.data;
  },

  getNetworkContext: async (id) => {
    const response = await api.get(`/arguments/${id}/network-context`);
    return response.data;
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/arguments/${id}/analysis`);
    return response.data;
  },

  // Argument extraction
  extract: async (text, options = {}) => {
    const response = await api.post('/arguments/extract', { text, options });
    return response.data;
  },

  extractAndSave: async (text, beliefId, source = null, options = {}) => {
    const response = await api.post('/arguments/extract-and-save', {
      text,
      beliefId,
      source,
      options,
    });
    return response.data;
  },

  // Aspect ratings
  rateAspect: async (id, aspect, rating) => {
    const response = await api.post(`/arguments/${id}/rate-aspect`, { aspect, rating });
    return response.data;
  },

  getAspectStats: async (id) => {
    const response = await api.get(`/arguments/${id}/aspect-stats`);
    return response.data;
  },
};

// ============================================================================
// EVIDENCE API
// ============================================================================

export const evidenceAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/evidence', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/evidence/${id}`);
    return response.data;
  },

  create: async (evidenceData) => {
    const response = await api.post('/evidence', evidenceData);
    return response.data;
  },

  update: async (id, evidenceData) => {
    const response = await api.put(`/evidence/${id}`, evidenceData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/evidence/${id}`);
    return response.data;
  },

  verify: async (id, verificationData) => {
    const response = await api.post(`/evidence/${id}/verify`, verificationData);
    return response.data;
  },
};

// ============================================================================
// ALGORITHM API
// ============================================================================

export const algorithmAPI = {
  calculateArgumentRank: async (matrix, iterations = 100, dampingFactor = 0.85) => {
    const response = await api.post('/argumentrank', {
      matrix,
      iterations,
      dampingFactor,
    });
    return response.data;
  },

  calculateConclusionScore: async (argumentsList) => {
    const response = await api.post('/conclusion-score', {
      arguments: argumentsList,
    });
    return response.data;
  },

  getExample: async () => {
    const response = await api.get('/examples/argumentrank');
    return response.data;
  },
};

// ============================================================================
// CONFLICT RESOLUTION API
// ============================================================================

export const conflictAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/conflicts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/conflicts/${id}`);
    return response.data;
  },

  detectForBelief: async (beliefId) => {
    const response = await api.post(`/conflicts/detect/${beliefId}`);
    return response.data;
  },

  createForBelief: async (beliefId) => {
    const response = await api.post(`/conflicts/create/${beliefId}`);
    return response.data;
  },

  getSuggestions: async (conflictId) => {
    const response = await api.get(`/conflicts/${conflictId}/suggestions`);
    return response.data;
  },

  advanceWorkflow: async (conflictId, outcome) => {
    const response = await api.put(`/conflicts/${conflictId}/advance`, { outcome });
    return response.data;
  },

  communicate: async (conflictId, messageData) => {
    const response = await api.post(`/conflicts/${conflictId}/communicate`, messageData);
    return response.data;
  },

  proposeSolution: async (conflictId, solutionData) => {
    const response = await api.post(`/conflicts/${conflictId}/propose-solution`, solutionData);
    return response.data;
  },

  voteSolution: async (conflictId, solutionId, vote) => {
    const response = await api.post(`/conflicts/${conflictId}/vote-solution/${solutionId}`, { vote });
    return response.data;
  },

  proposeConcession: async (conflictId, concessionData) => {
    const response = await api.post(`/conflicts/${conflictId}/concession`, concessionData);
    return response.data;
  },

  acceptConcession: async (conflictId, concessionIndex) => {
    const response = await api.post(`/conflicts/${conflictId}/accept-concession/${concessionIndex}`);
    return response.data;
  },

  startCoolingOff: async (conflictId, hours = 24) => {
    const response = await api.post(`/conflicts/${conflictId}/cooling-off`, { hours });
    return response.data;
  },

  resolve: async (conflictId, resolutionData) => {
    const response = await api.put(`/conflicts/${conflictId}/resolve`, resolutionData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/conflicts/stats/summary');
    return response.data;
  },

  scanAll: async (category) => {
    const response = await api.post('/conflicts/scan', { category });
    return response.data;
  },
};

// ============================================================================
// ASSUMPTION API
// ============================================================================

export const assumptionAPI = {
  // Get all assumptions for a belief
  getForBelief: async (beliefId, params = {}) => {
    const response = await api.get(`/assumptions/belief/${beliefId}`, { params });
    return response.data;
  },

  // Get critical assumptions for a belief
  getCriticalForBelief: async (beliefId) => {
    const response = await api.get(`/assumptions/belief/${beliefId}/critical`);
    return response.data;
  },

  // Get single assumption by ID
  getById: async (id) => {
    const response = await api.get(`/assumptions/${id}`);
    return response.data;
  },

  // Get assumptions by status
  getByStatus: async (status, params = {}) => {
    const response = await api.get(`/assumptions/status/${status}`, { params });
    return response.data;
  },

  // Create new assumption
  create: async (assumptionData) => {
    const response = await api.post('/assumptions', assumptionData);
    return response.data;
  },

  // Update assumption
  update: async (id, assumptionData) => {
    const response = await api.put(`/assumptions/${id}`, assumptionData);
    return response.data;
  },

  // Delete assumption
  delete: async (id) => {
    const response = await api.delete(`/assumptions/${id}`);
    return response.data;
  },

  // Add dependent argument to assumption
  addDependentArgument: async (id, argumentId, integralityScore = 50) => {
    const response = await api.post(`/assumptions/${id}/arguments`, {
      argumentId,
      integralityScore
    });
    return response.data;
  },

  // Remove dependent argument from assumption
  removeDependentArgument: async (id, argumentId) => {
    const response = await api.delete(`/assumptions/${id}/arguments/${argumentId}`);
    return response.data;
  },

  // Update integrality score for a dependent argument
  updateIntegralityScore: async (id, argumentId, integralityScore) => {
    const response = await api.put(`/assumptions/${id}/arguments/${argumentId}`, {
      integralityScore
    });
    return response.data;
  },

  // Link assumption to another belief
  linkToBelief: async (id, linkData) => {
    const response = await api.post(`/assumptions/${id}/link-belief`, linkData);
    return response.data;
  },

  // Mark assumption as must-accept
  markAsMustAccept: async (id, reason = '') => {
    const response = await api.post(`/assumptions/${id}/mark-accept`, { reason });
    return response.data;
  },

  // Mark assumption as must-reject
  markAsMustReject: async (id, reason = '') => {
    const response = await api.post(`/assumptions/${id}/mark-reject`, { reason });
    return response.data;
  },

  // Vote on assumption
  vote: async (id, voteType) => {
    const response = await api.post(`/assumptions/${id}/vote`, { voteType });
    return response.data;
  },

  // Recalculate aggregate score
  recalculateScore: async (id) => {
    const response = await api.post(`/assumptions/${id}/recalculate`);
    return response.data;
  },
};

// ============================================================================
// CONTRIBUTOR API (People Evaluation - Ranking Contributors to Beliefs)
// ============================================================================

export const contributorAPI = {
  // Get ranked contributors for a belief
  getBeliefContributors: async (beliefId, params = {}) => {
    const response = await api.get(`/beliefs/${beliefId}/contributors`, { params });
    return response.data;
  },

  // Get single contributor
  getById: async (id) => {
    const response = await api.get(`/contributors/${id}`);
    return response.data;
  },

  // Create new contributor
  create: async (beliefId, contributorData) => {
    const response = await api.post(`/beliefs/${beliefId}/contributors`, contributorData);
    return response.data;
  },

  // Update contributor
  update: async (id, contributorData) => {
    const response = await api.put(`/contributors/${id}`, contributorData);
    return response.data;
  },

  // Delete contributor
  delete: async (id) => {
    const response = await api.delete(`/contributors/${id}`);
    return response.data;
  },

  // Search contributors
  search: async (query, beliefId = null) => {
    const params = { query };
    if (beliefId) params.beliefId = beliefId;
    const response = await api.get('/contributors/search', { params });
    return response.data;
  },

  // Flag contributor for moderation
  flag: async (id, reason) => {
    const response = await api.post(`/contributors/${id}/flag`, { reason });
    return response.data;
  },

  // Recalculate contributor scores (admin only)
  recalculateScores: async (id) => {
    const response = await api.post(`/contributors/${id}/recalculate`);
    return response.data;
  },

  // Get contributor statistics
  getStats: async () => {
    const response = await api.get('/contributors/stats');
    return response.data;
  },
};

// ============================================================================
// LAW API
// ============================================================================

export const lawAPI = {
  // Get all laws
  getAll: async (params = {}) => {
    const response = await api.get('/laws', { params });
    return response.data;
  },

  // Get law by ID
  getById: async (id) => {
    const response = await api.get(`/laws/${id}`);
    return response.data;
  },

  // Create new law
  create: async (lawData) => {
    const response = await api.post('/laws', lawData);
    return response.data;
  },

  // Update law
  update: async (id, lawData) => {
    const response = await api.put(`/laws/${id}`, lawData);
    return response.data;
  },

  // Delete law
  delete: async (id) => {
    const response = await api.delete(`/laws/${id}`);
    return response.data;
  },

  // Get laws for a specific belief
  getBeliefLaws: async (beliefId, relationship = null) => {
    const params = relationship ? { relationship } : {};
    const response = await api.get(`/beliefs/${beliefId}/laws`, { params });
    return response.data;
  },

  // Link law to belief
  linkToBelief: async (lawId, beliefId, relationship, strength = 50, notes = '') => {
    const response = await api.post(`/laws/${lawId}/link-belief`, {
      beliefId,
      relationship,
      strength,
      notes,
    });
    return response.data;
  },

  // Unlink law from belief
  unlinkFromBelief: async (lawId, beliefId) => {
    const response = await api.delete(`/laws/${lawId}/unlink-belief/${beliefId}`);
    return response.data;
  },

  // Verify law (admin/moderator only)
  verify: async (id) => {
    const response = await api.post(`/laws/${id}/verify`);
    return response.data;
  },

  // Calculate law scores
  calculateScores: async (id) => {
    const response = await api.post(`/laws/${id}/calculate-scores`);
    return response.data;
  },

  // Get law analysis
  getAnalysis: async (id) => {
    const response = await api.get(`/laws/${id}/analysis`);
    return response.data;
  },

  // Search laws
  search: async (query, params = {}) => {
    const response = await api.get('/laws/search', { params: { q: query, ...params } });
    return response.data;
  },
};

export default api;
