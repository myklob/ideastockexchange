import mongoose from 'mongoose';

const ArgumentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide argument content'],
    trim: true,
    minlength: [10, 'Argument must be at least 10 characters'],
    maxlength: [2000, 'Argument cannot exceed 2000 characters'],
  },
  type: {
    type: String,
    enum: ['supporting', 'opposing'],
    required: [true, 'Please specify argument type'],
  },
  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scores: {
    overall: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    logical: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    linkage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    importance: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    evidenceStrength: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    logicalCoherence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    verificationCredibility: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    linkageRelevance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    uniqueness: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    argumentImportance: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
  },
  evidence: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence',
  }],
  subArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  }],
  parentArgument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
  },
  votes: {
    up: {
      type: Number,
      default: 0,
    },
    down: {
      type: Number,
      default: 0,
    },
  },
  reasonRankScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active',
  },
  // Argument Evolution Lifecycle (from manifesto)
  lifecycleStatus: {
    type: String,
    enum: ['active', 'weakened', 'outdated', 'refuted', 'conditional'],
    default: 'active',
  },
  // Dynamic Argument Health Metrics (from manifesto)
  healthMetrics: {
    strength: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'Evidence network power - quality and quantity of supporting evidence',
    },
    integrity: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'Logic connection strength - how well the argument holds together',
    },
    freshness: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'How current and up-to-date the evidence is',
    },
    relevance: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'How much this argument matters to the conclusion',
    },
    impact: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      description: 'Real-world significance and stakes',
    },
  },
  // Resistance to counterarguments (for ReasonRank)
  counterargumentResistance: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  // Network position metrics (for ReasonRank)
  networkMetrics: {
    centrality: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
      description: 'How central this argument is in the debate network',
    },
    supportedByCount: {
      type: Number,
      default: 0,
      description: 'Number of other arguments supporting this one',
    },
    challengedByCount: {
      type: Number,
      default: 0,
      description: 'Number of counterarguments challenging this one',
    },
  },
  // Conditional truth information
  conditionalOn: [{
    condition: {
      type: String,
      description: 'The condition under which this argument is valid',
    },
    validityScore: {
      type: Number,
      min: 0,
      max: 100,
      description: 'How valid the argument is when this condition holds',
    },
  }],
  // Interest analysis (stakeholder information)
  stakeholderImpacts: [{
    stakeholder: {
      type: String,
      description: 'Who is affected by this argument being true/false',
    },
    impact: {
      type: String,
      enum: ['benefits', 'harmed', 'neutral'],
    },
    magnitude: {
      type: Number,
      min: -10,
      max: 10,
      description: 'How much they are affected (negative = harmed, positive = benefits)',
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Calculate overall score using all 6 component scores (from manifesto)
// Formula: Overall = (ES × LC × VC × LR × UD × AI) × 100
ArgumentSchema.methods.calculateOverallScore = function() {
  const {
    evidenceStrength,
    logicalCoherence,
    verificationCredibility,
    linkageRelevance,
    uniqueness,
    argumentImportance,
  } = this.scores;

  // Multiplicative formula - all dimensions must be strong for high score
  // This ensures weakness in any dimension significantly impacts final score
  const multipliedScore =
    evidenceStrength *
    logicalCoherence *
    verificationCredibility *
    linkageRelevance *
    uniqueness *
    argumentImportance;

  this.scores.overall = Math.round(multipliedScore * 100);
  return this.scores.overall;
};

// Calculate Dynamic Argument Health Metrics (from manifesto)
ArgumentSchema.methods.calculateHealthMetrics = async function() {
  // Populate evidence to calculate strength
  await this.populate('evidence');

  // 1. STRENGTH: Evidence network power
  // Based on quantity and quality of evidence
  if (this.evidence && this.evidence.length > 0) {
    const evidenceQuality = this.evidence.reduce((sum, e) => sum + (e.credibilityScore || 50), 0) / this.evidence.length;
    const evidenceQuantityBonus = Math.min(this.evidence.length * 5, 30); // Up to +30 for having multiple sources
    this.healthMetrics.strength = Math.min(Math.round(evidenceQuality * 0.7 + evidenceQuantityBonus), 100);
  } else {
    this.healthMetrics.strength = 25; // Low score for no evidence
  }

  // 2. INTEGRITY: Logic connection strength
  // Based on logical coherence and absence of fallacies
  this.healthMetrics.integrity = Math.round(this.scores.logicalCoherence * 100);

  // 3. FRESHNESS: How current the evidence is
  // Calculate based on creation date and evidence dates
  const monthsSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24 * 30);
  const freshnessDecay = Math.max(0, 100 - (monthsSinceCreation * 2)); // Decay 2 points per month
  this.healthMetrics.freshness = Math.round(freshnessDecay);

  // 4. RELEVANCE: How much this matters to the conclusion
  // Based on linkage relevance and importance
  this.healthMetrics.relevance = Math.round(
    (this.scores.linkageRelevance * 0.6 + this.scores.argumentImportance * 0.4) * 100
  );

  // 5. IMPACT: Real-world significance
  // Based on votes, views, and stakeholder impacts
  const voteRatio = this.votes.up / (this.votes.up + this.votes.down + 1);
  const stakeholderMagnitude = this.stakeholderImpacts.reduce((sum, s) => sum + Math.abs(s.magnitude), 0);
  this.healthMetrics.impact = Math.round(
    (voteRatio * 50) + Math.min(stakeholderMagnitude * 5, 50)
  );

  return this.healthMetrics;
};

// Calculate ReasonRank Score (from manifesto)
// Formula based on:
// - Direct Evidence Support (40%)
// - Resistance to Counterarguments (30%)
// - Logical Network Position (20%)
// - Expert Consensus (10%)
ArgumentSchema.methods.calculateReasonRankScore = async function() {
  // Ensure health metrics are calculated
  await this.calculateHealthMetrics();

  // 1. DIRECT EVIDENCE SUPPORT (40%)
  // Combines evidence strength and verification credibility
  const evidenceSupport = (
    this.healthMetrics.strength * 0.6 +
    this.scores.verificationCredibility * 100 * 0.4
  ) / 100;

  // 2. RESISTANCE TO COUNTERARGUMENTS (30%)
  // How well the argument withstands challenges
  await this.populate('subArguments');
  const supportingSubArgs = this.subArguments?.filter(sa => sa.type === 'supporting').length || 0;
  const opposingSubArgs = this.subArguments?.filter(sa => sa.type === 'opposing').length || 0;
  const totalSubArgs = supportingSubArgs + opposingSubArgs;

  let resistance = 0.5; // Default neutral
  if (totalSubArgs > 0) {
    resistance = supportingSubArgs / totalSubArgs;
    // Adjust based on quality of counterarguments addressed
    resistance = resistance * 0.7 + 0.3; // Scale to 0.3-1.0 range
  }
  this.counterargumentResistance = Math.round(resistance * 100);

  // 3. LOGICAL NETWORK POSITION (20%)
  // Centrality in debate structure and consistency with established facts
  const networkPosition = (
    this.networkMetrics.centrality * 0.5 +
    (this.networkMetrics.supportedByCount / (this.networkMetrics.supportedByCount + this.networkMetrics.challengedByCount + 1)) * 0.5
  );

  // 4. EXPERT CONSENSUS (10%)
  // Based on votes (as proxy for expert opinion) and author reputation
  const expertConsensus = this.votes.up / (this.votes.up + this.votes.down + 1);

  // REASONRANK FINAL SCORE
  this.reasonRankScore = Math.round(
    evidenceSupport * 0.40 * 100 +
    resistance * 0.30 * 100 +
    networkPosition * 0.20 * 100 +
    expertConsensus * 0.10 * 100
  );

  return this.reasonRankScore;
};

// Update argument lifecycle status based on challenges and evidence
ArgumentSchema.methods.updateLifecycleStatus = async function() {
  await this.populate('subArguments');

  const opposingSubArgs = this.subArguments?.filter(sa => sa.type === 'opposing') || [];
  const supportingSubArgs = this.subArguments?.filter(sa => sa.type === 'supporting') || [];

  // Calculate strength of challenges
  const avgOpposingScore = opposingSubArgs.length > 0
    ? opposingSubArgs.reduce((sum, arg) => sum + arg.scores.overall, 0) / opposingSubArgs.length
    : 0;

  const avgSupportingScore = supportingSubArgs.length > 0
    ? supportingSubArgs.reduce((sum, arg) => sum + arg.scores.overall, 0) / supportingSubArgs.length
    : 0;

  // Determine lifecycle status
  if (avgOpposingScore > 80 && avgSupportingScore < 30) {
    this.lifecycleStatus = 'refuted';
  } else if (avgOpposingScore > 60 && avgOpposingScore > avgSupportingScore + 20) {
    this.lifecycleStatus = 'weakened';
  } else if (this.healthMetrics.freshness < 30) {
    this.lifecycleStatus = 'outdated';
  } else if (this.conditionalOn && this.conditionalOn.length > 0) {
    this.lifecycleStatus = 'conditional';
  } else {
    this.lifecycleStatus = 'active';
  }

  return this.lifecycleStatus;
};

// Legacy method for backwards compatibility
ArgumentSchema.methods.updateReasonRankScore = function(score) {
  this.reasonRankScore = score;
  return this.save();
};

export default mongoose.model('Argument', ArgumentSchema);
