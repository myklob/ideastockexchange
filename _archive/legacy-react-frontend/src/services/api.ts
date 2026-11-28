/**
 * API service for communicating with the backend.
 */
import axios from 'axios';
import {
  Topic,
  TopicWithCriteria,
  TopicCreateRequest,
  Criterion,
  CriterionWithArguments,
  CriterionCreateRequest,
  DimensionArgument,
  DimensionArgumentCreateRequest,
  DimensionArgumentUpdateRequest,
  Evidence,
  EvidenceCreateRequest,
  CriterionScoreBreakdown,
  User,
  UserCreateRequest,
  TradeRequest,
  TradeResponse,
  BetRecord,
  Portfolio,
  MarketSummary
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// TOPIC API
// ============================================================================

export const topicAPI = {
  async create(data: TopicCreateRequest): Promise<Topic> {
    const response = await api.post('/topics/', data);
    return response.data;
  },

  async list(skip: number = 0, limit: number = 100): Promise<Topic[]> {
    const response = await api.get('/topics/', { params: { skip, limit } });
    return response.data;
  },

  async get(topicId: number): Promise<TopicWithCriteria> {
    const response = await api.get(`/topics/${topicId}`);
    return response.data;
  },

  async delete(topicId: number): Promise<void> {
    await api.delete(`/topics/${topicId}`);
  },
};

// ============================================================================
// CRITERION API
// ============================================================================

export const criterionAPI = {
  async create(data: CriterionCreateRequest): Promise<Criterion> {
    const response = await api.post('/criteria/', data);
    return response.data;
  },

  async get(criterionId: number): Promise<CriterionWithArguments> {
    const response = await api.get(`/criteria/${criterionId}`);
    return response.data;
  },

  async listByTopic(topicId: number): Promise<Criterion[]> {
    const response = await api.get(`/topics/${topicId}/criteria/`);
    return response.data;
  },

  async delete(criterionId: number): Promise<void> {
    await api.delete(`/criteria/${criterionId}`);
  },

  async recalculateScores(criterionId: number): Promise<any> {
    const response = await api.post(`/criteria/${criterionId}/recalculate`);
    return response.data;
  },

  async getScoreBreakdown(criterionId: number): Promise<CriterionScoreBreakdown> {
    const response = await api.get(`/criteria/${criterionId}/breakdown`);
    return response.data;
  },

  async getMarketSummary(criterionId: number): Promise<MarketSummary> {
    const response = await api.get(`/criteria/${criterionId}/market`);
    return response.data;
  },

  async listBets(criterionId: number): Promise<BetRecord[]> {
    const response = await api.get(`/criteria/${criterionId}/bets`);
    return response.data;
  },
};

// ============================================================================
// ARGUMENT API
// ============================================================================

export const argumentAPI = {
  async create(data: DimensionArgumentCreateRequest): Promise<DimensionArgument> {
    const response = await api.post('/arguments/', data);
    return response.data;
  },

  async update(argumentId: number, data: DimensionArgumentUpdateRequest): Promise<DimensionArgument> {
    const response = await api.put(`/arguments/${argumentId}`, data);
    return response.data;
  },

  async listByCriterion(criterionId: number): Promise<DimensionArgument[]> {
    const response = await api.get(`/criteria/${criterionId}/arguments/`);
    return response.data;
  },

  async delete(argumentId: number): Promise<void> {
    await api.delete(`/arguments/${argumentId}`);
  },
};

// ============================================================================
// EVIDENCE API
// ============================================================================

export const evidenceAPI = {
  async create(data: EvidenceCreateRequest): Promise<Evidence> {
    const response = await api.post('/evidence/', data);
    return response.data;
  },

  async listByCriterion(criterionId: number): Promise<Evidence[]> {
    const response = await api.get(`/criteria/${criterionId}/evidence/`);
    return response.data;
  },
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
  async create(data: UserCreateRequest): Promise<User> {
    const response = await api.post('/users/', data);
    return response.data;
  },

  async list(): Promise<User[]> {
    const response = await api.get('/users/');
    return response.data;
  },

  async get(userId: number): Promise<User> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async getBets(userId: number): Promise<BetRecord[]> {
    const response = await api.get(`/users/${userId}/bets`);
    return response.data;
  },

  async getPortfolio(userId: number): Promise<Portfolio> {
    const response = await api.get(`/users/${userId}/portfolio`);
    return response.data;
  },
};

// ============================================================================
// TRADE API
// ============================================================================

export const tradeAPI = {
  async executeTrade(data: TradeRequest): Promise<TradeResponse> {
    const response = await api.post('/api/trade', data);
    return response.data;
  },

  async resolveMarket(criterionId: number, resolvedYes: boolean): Promise<any> {
    const response = await api.post('/api/resolve', {
      criterion_id: criterionId,
      resolved_yes: resolvedYes,
    });
    return response.data;
  },
};

export default api;
