/**
 * Dashboard Configuration
 */

const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  APP_NAME: 'IdeaStockExchange',
  VERSION: '1.0.0',

  // Local storage keys
  STORAGE_KEYS: {
    TOKEN: 'ise_auth_token',
    USER: 'ise_user',
    THEME: 'ise_theme'
  },

  // API endpoints
  ENDPOINTS: {
    CLAIMS: '/claims',
    CLAIM_DETAIL: (id) => `/claims/${id}`,
    CLAIM_DETECT: (id) => `/claims/${id}/detect`,
    USERS: '/users',
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    ANALYTICS: '/analytics',
    ANALYTICS_DETECTIONS: '/analytics/detections',
    ANALYTICS_TRENDS: '/analytics/trends',
    ANALYTICS_CATEGORIES: '/analytics/categories'
  },

  // Pagination
  ITEMS_PER_PAGE: 20,

  // Chart colors
  CHART_COLORS: [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0'
  ],

  // Categories
  CATEGORIES: [
    'health',
    'science',
    'technology',
    'psychology',
    'nutrition',
    'economics',
    'environment',
    'history',
    'language',
    'nature',
    'conspiracy'
  ]
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
