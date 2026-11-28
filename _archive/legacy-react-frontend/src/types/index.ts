/**
 * TypeScript type definitions for the Idea Stock Exchange application.
 */

export enum DimensionType {
  VALIDITY = "validity",
  RELIABILITY = "reliability",
  INDEPENDENCE = "independence",
  LINKAGE = "linkage"
}

export enum ArgumentDirection {
  SUPPORTING = "supporting",
  OPPOSING = "opposing"
}

export enum BetType {
  YES = "yes",
  NO = "no"
}

export enum MarketStatus {
  OPEN = "open",
  RESOLVED_YES = "resolved_yes",
  RESOLVED_NO = "resolved_no"
}

export interface Topic {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TopicWithCriteria extends Topic {
  criteria: Criterion[];
}

export interface Criterion {
  id: number;
  topic_id: number;
  name: string;
  description?: string;
  overall_score: number;
  validity_score: number;
  reliability_score: number;
  independence_score: number;
  linkage_score: number;
  market_price: number;
  yes_shares_outstanding: number;
  no_shares_outstanding: number;
  total_liquidity_pool: number;
  market_status: MarketStatus;
  created_at: string;
  updated_at: string;
}

export interface CriterionWithArguments extends Criterion {
  dimension_arguments: DimensionArgument[];
}

export interface DimensionArgument {
  id: number;
  criterion_id: number;
  dimension: DimensionType;
  direction: ArgumentDirection;
  content: string;
  evidence_quality: number;
  logical_validity: number;
  importance: number;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface ArgumentEvidence {
  id: number;
  argument_id: number;
  source: string;
  description: string;
  url?: string;
  reliability_score: number;
  created_at: string;
}

export interface Evidence {
  id: number;
  criterion_id: number;
  claim: string;
  measurement_value?: string;
  source: string;
  url?: string;
  weight: number;
  created_at: string;
}

export interface ArgumentScoreInfo {
  id: number;
  content: string;
  weight: number;
  evidence_quality: number;
  logical_validity: number;
  importance: number;
}

export interface DimensionScoreBreakdown {
  score: number;
  supporting_arguments: ArgumentScoreInfo[];
  opposing_arguments: ArgumentScoreInfo[];
  total_support_weight: number;
  total_oppose_weight: number;
  balance: number;
}

export interface CriterionScoreBreakdown {
  criterion_id: number;
  criterion_name: string;
  overall_score: number;
  argument_count: number;
  dimensions: {
    [key: string]: DimensionScoreBreakdown;
  };
}

export interface TopicCreateRequest {
  title: string;
  description?: string;
}

export interface CriterionCreateRequest {
  topic_id: number;
  name: string;
  description?: string;
}

export interface DimensionArgumentCreateRequest {
  criterion_id: number;
  dimension: DimensionType;
  direction: ArgumentDirection;
  content: string;
  evidence_quality?: number;
  logical_validity?: number;
  importance?: number;
}

export interface DimensionArgumentUpdateRequest {
  content?: string;
  evidence_quality?: number;
  logical_validity?: number;
  importance?: number;
}

export interface EvidenceCreateRequest {
  criterion_id: number;
  claim: string;
  measurement_value?: string;
  source: string;
  url?: string;
}

// User types
export interface User {
  id: number;
  username: string;
  display_name?: string;
  balance: number;
  created_at: string;
}

export interface UserCreateRequest {
  username: string;
  display_name?: string;
}

// Trade / Prediction Market types
export interface TradeRequest {
  user_id: number;
  criterion_id: number;
  bet_type: BetType;
  amount: number;
}

export interface TradeResponse {
  bet_id: number;
  user_id: number;
  criterion_id: number;
  bet_type: BetType;
  amount_spent: number;
  shares_bought: number;
  price_at_trade: number;
  new_market_price: number;
  user_balance_after: number;
}

export interface BetRecord {
  id: number;
  user_id: number;
  criterion_id: number;
  bet_type: BetType;
  amount_spent: number;
  shares_bought: number;
  price_at_trade: number;
  created_at: string;
}

export interface PortfolioPosition {
  criterion_id: number;
  criterion_name: string;
  bet_type: BetType;
  total_shares: number;
  total_spent: number;
  current_price: number;
  market_value: number;
  profit_loss: number;
}

export interface Portfolio {
  user_id: number;
  username: string;
  balance: number;
  positions: PortfolioPosition[];
  total_invested: number;
  total_market_value: number;
  total_profit_loss: number;
}

export interface MarketSummary {
  criterion_id: number;
  criterion_name: string;
  reason_rank_score: number;
  market_price: number;
  yes_price_percent: number;
  no_price_percent: number;
  yes_shares_outstanding: number;
  no_shares_outstanding: number;
  market_status: MarketStatus;
}
