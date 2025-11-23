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

export default api;
