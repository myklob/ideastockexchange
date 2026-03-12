/**
 * Distributed AI Framework - Core Types
 * Types for generating interconnected argument analysis pages
 */

// ==================== Argument Analysis Types ====================

export interface ArgumentScore {
  truthScore: number;        // 0-100: How well-supported by evidence
  linkageScore: number;      // 0-100%: How directly relevant to the thesis
  strengthening?: number;    // Computed: truthScore * linkageScore / 100
  weakening?: number;        // Negative impact on thesis
}

export interface SubArgument {
  id: string;
  content: string;
  position: 'supporting' | 'destroying';
  score?: ArgumentScore;
  linkedPageId?: string;     // Link to its own analysis page
}

export interface Argument {
  id: string;
  content: string;
  title?: string;            // Bold title like "Budget Insanity"
  position: 'pro' | 'con';
  score: ArgumentScore;
  subArguments?: SubArgument[];
  linkedPageId?: string;     // Each argument can become its own page
  verdict?: string;          // Summary verdict for counter-arguments
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  score: number;             // 0-100
  linkageScore: number;      // 0-100%
  type: 'T1' | 'T2' | 'T3' | 'T4';  // Evidence tier
  typeName: string;          // "Official Record", "Institutional Analysis", etc.
  position: 'supporting' | 'weakening';
  contribution: number;      // Computed impact
  critique?: string;         // Why this evidence might be limited
  linkedPageId?: string;
}

export interface ObjectiveCriteria {
  id: string;
  description: string;
  independenceScore: number;
  linkageScore: number;
  criteriaType: string;
  totalScore: number;
}

export interface ValueConflict {
  supportingSide: {
    advertised: string[];
    actual: string[];
    fears: string;
    desire: string;
  };
  opposingSide: {
    advertised: string[];
    actual: string[];
    fears: string;
    desire: string;
  };
}

export interface Assumption {
  statement: string;
  requiredToAccept: boolean;  // true for accept, false for reject
}

export interface CostBenefitItem {
  description: string;
  category: string;
}

export interface CompromiseSolution {
  id: string;
  title: string;
  description: string;
}

export interface Obstacle {
  description: string;
  affectsSide: 'supporters' | 'opponents' | 'both';
}

export interface Interest {
  stakeholder: string;
  interests: string[];
  side: 'supporters' | 'opponents';
}

export interface MediaResource {
  type: 'book' | 'article' | 'podcast' | 'movie';
  title: string;
  description?: string;
  position: 'supporting' | 'opposing';
}

export interface LegalItem {
  description: string;
  position: 'supporting' | 'contradicting';
}

export interface BeliefMapping {
  level: 'general' | 'specific';
  supportBeliefs: string[];
  opposeBeliefs: string[];
}

export interface Bias {
  name: string;
  description: string;
  affectsSide: 'supporters' | 'opponents';
}

// ==================== Complete Issue Analysis ====================

export interface IssueAnalysis {
  id: string;
  title: string;
  shortTitle: string;
  topic: string;
  topicHierarchy: string;     // e.g., "Governance > Immigration Enforcement"
  topicId?: string;           // Dewey decimal or other classification
  beliefPositivity: number;   // -100 to +100
  beliefPositivityLabel: string;

  // Core argument trees
  reasonsToAgree: Argument[];
  reasonsToDisagree: Argument[];  // Counter-arguments

  // Evidence sections
  supportingEvidence: EvidenceItem[];
  weakeningEvidence: EvidenceItem[];

  // Objective criteria
  objectiveCriteria: ObjectiveCriteria[];

  // Values and assumptions
  valueConflict: ValueConflict;
  acceptAssumptions: string[];
  rejectAssumptions: string[];

  // Cost-benefit
  benefits: CostBenefitItem[];
  costs: CostBenefitItem[];

  // Solutions and obstacles
  compromiseSolutions: CompromiseSolution[];
  obstacles: Obstacle[];
  blindSpots: { supporters: string[]; opponents: string[] };

  // Interests
  supporterInterests: Interest[];
  opponentInterests: Interest[];
  sharedInterests: string[];
  conflictingInterests: string[];

  // Media resources
  mediaResources: MediaResource[];

  // Legal framework
  supportingLaws: LegalItem[];
  contradictingLaws: LegalItem[];

  // Belief mapping
  generalBeliefs: BeliefMapping;
  specificBeliefs: BeliefMapping;

  // Similar beliefs
  extremeVersions: string[];
  moderateVersions: string[];

  // Biases
  biases: Bias[];

  // Most important facts
  importantFacts: string[];
  unintendedConsequences: string[];

  // Final score
  finalScore: number;
  scoreInterpretation: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  generatedBy: string;        // AI model used
  linkedPages: string[];      // IDs of linked argument pages
}

// ==================== Distributed Task Types ====================

export interface AnalysisTask {
  id: string;
  type: 'full_analysis' | 'argument_expansion' | 'evidence_research' | 'sub_argument_analysis';
  input: {
    thesis?: string;
    argument?: Argument;
    parentAnalysisId?: string;
    depth?: number;           // How deep in the argument tree
    maxDepth?: number;        // Maximum recursion depth
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: IssueAnalysis | Argument;
  error?: string;
  workerId?: string;
}

export interface TaskQueue {
  tasks: AnalysisTask[];
  completedTasks: AnalysisTask[];
  workers: WorkerStatus[];
}

export interface WorkerStatus {
  id: string;
  status: 'idle' | 'processing' | 'offline';
  currentTaskId?: string;
  completedCount: number;
  lastHeartbeat: Date;
  systemInfo: {
    platform: string;
    cpuUsage: number;
    memoryUsage: number;
    gpuAvailable: boolean;
  };
}

// ==================== AI Provider Types ====================

export interface AIProviderConfig {
  provider: 'ollama' | 'lmstudio' | 'openai' | 'anthropic' | 'custom';
  apiBase: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

// ==================== Output Configuration ====================

export interface OutputConfig {
  format: 'html' | 'markdown' | 'json';
  outputDir: string;
  baseUrl: string;
  linkPrefix: string;
  includeStyles: boolean;
  generateIndex: boolean;
}

// ==================== Framework Configuration ====================

export interface FrameworkConfig {
  ai: AIProviderConfig;
  output: OutputConfig;
  queue: {
    maxConcurrentTasks: number;
    taskTimeoutMs: number;
    retryAttempts: number;
    priorityBoost: number;
  };
  analysis: {
    maxDepth: number;          // How deep to recurse arguments
    minScoreForExpansion: number;  // Min score to expand into own page
    evidenceTiers: string[];
    generateLinks: boolean;
  };
}
