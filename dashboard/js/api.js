/**
 * API Client
 * Handles all API requests
 */

class API {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
  }

  /**
   * Remove authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
  }

  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // === Claims API ===

  async getClaims(params = {}) {
    return this.get(CONFIG.ENDPOINTS.CLAIMS, params);
  }

  async getClaim(id) {
    return this.get(CONFIG.ENDPOINTS.CLAIM_DETAIL(id));
  }

  async createClaim(claimData) {
    return this.post(CONFIG.ENDPOINTS.CLAIMS, claimData);
  }

  async updateClaim(id, claimData) {
    return this.put(CONFIG.ENDPOINTS.CLAIM_DETAIL(id), claimData);
  }

  async deleteClaim(id) {
    return this.delete(CONFIG.ENDPOINTS.CLAIM_DETAIL(id));
  }

  async getClaimStats() {
    return this.get(`${CONFIG.ENDPOINTS.CLAIMS}/stats`);
  }

  async getCategories() {
    return this.get(`${CONFIG.ENDPOINTS.CLAIMS}/categories`);
  }

  // === Analytics API ===

  async getDetectionAnalytics() {
    return this.get(CONFIG.ENDPOINTS.ANALYTICS_DETECTIONS);
  }

  async getTrends() {
    return this.get(CONFIG.ENDPOINTS.ANALYTICS_TRENDS);
  }

  async getCategoryAnalytics() {
    return this.get(CONFIG.ENDPOINTS.ANALYTICS_CATEGORIES);
  }

  // === User API ===

  async register(userData) {
    return this.post(CONFIG.ENDPOINTS.REGISTER, userData);
  }

  async login(credentials) {
    const result = await this.post(CONFIG.ENDPOINTS.LOGIN, credentials);
    if (result.token) {
      this.setToken(result.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(result.user));
    }
    return result;
  }

  async logout() {
    this.clearToken();
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  }
}

// Create global API instance
window.api = new API(CONFIG.API_BASE_URL);
