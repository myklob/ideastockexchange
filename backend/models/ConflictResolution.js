import mongoose from 'mongoose';

/**
 * ConflictResolution Model
 *
 * Tracks conflicts between parties (users who agree vs disagree on beliefs/arguments)
 * and provides automated resolution workflows based on conflict resolution theory.
 *
 * Based on conflict resolution models:
 * - Dual Concern Model (Thomas-Kilmann)
 * - Interest-Based Relational (IBR) approach
 * - Circle of Conflict (Moore)
 * - De-escalation strategies
 */

const conflictResolutionSchema = new mongoose.Schema({
  // Core Conflict Information
  beliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    index: true
  },

  // Conflicting Arguments
  supportingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  opposingArguments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],

  // Parties Involved
  supporters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    argumentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument'
    }],
    interests: [String], // What they care about
    position: String, // Their stated position
    underlyingNeeds: [String] // IBR: underlying needs vs positions
  }],

  opponents: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    argumentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Argument'
    }],
    interests: [String],
    position: String,
    underlyingNeeds: [String]
  }],

  // Conflict Classification (Circle of Conflict - Moore)
  conflictSources: [{
    type: String,
    enum: [
      'data', // Information, interpretation, incompleteness
      'relationship', // Personal dynamics, miscommunication, misbehaviors
      'value', // Incompatible beliefs, principles, priorities
      'structure', // Organization failures, power imbalances, resource constraints
      'interests' // Needs, desires, incentives, procedures
    ]
  }],

  // Conflict Intensity Metrics
  intensity: {
    scoreGap: { type: Number, default: 0 }, // Difference between supporting/opposing scores
    participantCount: { type: Number, default: 0 },
    argumentCount: { type: Number, default: 0 },
    emotionalLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'extreme'],
      default: 'medium'
    },
    escalationLevel: {
      type: Number, // Based on Glasl's 9-stage escalation model
      min: 1,
      max: 9,
      default: 1
    }
  },

  // Conflict Status
  status: {
    type: String,
    enum: [
      'detected', // Automatically detected
      'acknowledged', // Parties aware
      'in_mediation', // Active resolution process
      'de_escalating', // Cooling down period
      'negotiating', // Parties negotiating
      'resolved', // Conflict resolved
      'stalemate', // No progress possible
      'escalated' // Requires higher intervention
    ],
    default: 'detected'
  },

  // Resolution Template Being Used
  resolutionTemplate: {
    type: String,
    enum: [
      'avoidance', // Withdrawing, postponing
      'accommodating', // One side yields
      'competitive', // Forcing, win-lose
      'compromising', // Both give up something
      'collaborating', // Win-win solution
      'ibr', // Interest-Based Relational
      'mediation', // Third-party facilitated
      'arbitration', // Third-party decides
      'nvc' // Nonviolent Communication
    ]
  },

  // Automated Resolution Workflow
  workflow: {
    currentStep: {
      type: Number,
      default: 1
    },
    totalSteps: {
      type: Number,
      default: 5
    },
    steps: [{
      stepNumber: Number,
      name: String,
      description: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        default: 'pending'
      },
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      outcome: String
    }]
  },

  // De-escalation Measures (Applied automatically)
  deescalation: {
    coolingOffPeriod: {
      enabled: { type: Boolean, default: false },
      startedAt: Date,
      endsAt: Date,
      durationHours: { type: Number, default: 24 }
    },
    requiresModeration: { type: Boolean, default: false },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    restrictions: [{
      type: String,
      enum: ['no_new_arguments', 'no_voting', 'moderated_posting', 'read_only']
    }]
  },

  // Interest-Based Relational (IBR) Data
  ibrData: {
    // Separate people from problem
    problemStatement: String, // Objective problem description
    emotionalIssues: [String], // Separate emotional concerns

    // Focus on interests, not positions
    commonInterests: [String], // Shared goals
    conflictingInterests: [String], // Different goals

    // Options for mutual gain
    proposedSolutions: [{
      description: String,
      proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      supportedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      opposedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      score: { type: Number, default: 0 },
      meetsInterestsOf: [String] // Which party's interests
    }],

    // Objective criteria
    objectiveCriteria: [{
      criterion: String, // e.g., "peer-reviewed studies"
      agreedUpon: { type: Boolean, default: false },
      appliedTo: String // Which solution(s)
    }]
  },

  // Compromise Data
  compromiseData: {
    originalDemands: [{
      party: {
        type: String,
        enum: ['supporters', 'opponents']
      },
      demand: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    concessions: [{
      party: {
        type: String,
        enum: ['supporters', 'opponents']
      },
      concession: String,
      acceptedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    middleGround: String // The compromise solution
  },

  // Collaboration Data (Win-Win)
  collaborationData: {
    brainstormedSolutions: [{
      solution: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      benefitsSupporters: String,
      benefitsOpponents: String,
      votesFor: { type: Number, default: 0 },
      votesAgainst: { type: Number, default: 0 }
    }],
    selectedSolution: {
      type: mongoose.Schema.Types.ObjectId
    },
    implementationPlan: String
  },

  // Communication Log (Regulated communication)
  communications: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    message: String,
    communicationType: {
      type: String,
      enum: ['i_message', 'active_listening', 'nvc', 'normal']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    emotionalTone: {
      type: String,
      enum: ['calm', 'frustrated', 'angry', 'constructive', 'defensive']
    }
  }],

  // Resolution Outcome
  resolution: {
    achieved: { type: Boolean, default: false },
    resolutionType: {
      type: String,
      enum: [
        'consensus', // Everyone agrees
        'compromise', // Both sides gave up something
        'win_win', // Collaborative solution
        'mediated', // Third-party helped
        'natural_convergence', // Scores naturally converged
        'one_side_withdrew', // One side gave up
        'majority_rule', // Voting decided
        'unresolved' // Still in conflict
      ]
    },
    resolvedAt: Date,
    finalAgreement: String,
    participantSatisfaction: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      satisfactionLevel: {
        type: Number,
        min: 1,
        max: 10
      },
      feedback: String
    }],
    believabilityAfterResolution: Number, // Final conclusion score
    scoreChange: Number // How much score changed during resolution
  },

  // Metrics for Learning
  metrics: {
    timeToResolution: Number, // hours
    messagesExchanged: Number,
    solutionsProposed: Number,
    partiesInvolved: Number,
    evidenceAdded: Number,
    consensusReached: Boolean
  },

  // Automated Actions Taken
  automatedActions: [{
    action: String,
    triggeredBy: String,
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    result: String
  }],

  // Manual Interventions
  interventions: [{
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['moderator', 'mediator', 'arbitrator', 'admin']
    },
    action: String,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]

}, {
  timestamps: true
});

// Indexes for performance
conflictResolutionSchema.index({ beliefId: 1, status: 1 });
conflictResolutionSchema.index({ status: 1, 'intensity.escalationLevel': 1 });
conflictResolutionSchema.index({ createdAt: -1 });

// Instance Methods

/**
 * Detect conflict intensity and set appropriate escalation level
 * Based on Glasl's 9-stage model
 */
conflictResolutionSchema.methods.assessEscalationLevel = function() {
  const scoreGap = this.intensity.scoreGap;
  const argCount = this.intensity.argumentCount;
  const participantCount = this.intensity.participantCount;

  // Level 1-3: Win-Win (hardening, debate)
  if (scoreGap < 20 && argCount < 10) {
    this.intensity.escalationLevel = 1;
    this.resolutionTemplate = 'collaborating';
  }
  // Level 3-5: Win-Lose (coalitions, face-saving)
  else if (scoreGap < 40 && argCount < 20) {
    this.intensity.escalationLevel = 4;
    this.resolutionTemplate = 'compromising';
  }
  // Level 5-7: Lose-Lose (threatening, limited strikes)
  else if (scoreGap < 60 || participantCount > 10) {
    this.intensity.escalationLevel = 6;
    this.resolutionTemplate = 'mediation';
    this.deescalation.requiresModeration = true;
  }
  // Level 7-9: Mutual destruction
  else {
    this.intensity.escalationLevel = 8;
    this.resolutionTemplate = 'arbitration';
    this.deescalation.requiresModeration = true;
    this.deescalation.coolingOffPeriod.enabled = true;
  }

  return this.intensity.escalationLevel;
};

/**
 * Initialize appropriate workflow based on resolution template
 */
conflictResolutionSchema.methods.initializeWorkflow = function() {
  const workflows = {
    ibr: [
      { stepNumber: 1, name: 'Separate People from Problem', description: 'Identify the objective problem without personal attacks' },
      { stepNumber: 2, name: 'Identify Interests', description: 'List underlying interests of both parties, not just positions' },
      { stepNumber: 3, name: 'Generate Options', description: 'Brainstorm solutions for mutual gain' },
      { stepNumber: 4, name: 'Apply Objective Criteria', description: 'Evaluate options using agreed-upon objective standards' },
      { stepNumber: 5, name: 'Reach Agreement', description: 'Select solution that meets both parties\' interests' }
    ],
    compromising: [
      { stepNumber: 1, name: 'List Demands', description: 'Each party lists their demands with priorities' },
      { stepNumber: 2, name: 'Identify Tradeable Items', description: 'Find what each party can concede' },
      { stepNumber: 3, name: 'Propose Concessions', description: 'Each party offers to give up lower-priority items' },
      { stepNumber: 4, name: 'Find Middle Ground', description: 'Negotiate a balanced compromise' },
      { stepNumber: 5, name: 'Formalize Agreement', description: 'Document the compromise' }
    ],
    collaborating: [
      { stepNumber: 1, name: 'De-escalate', description: 'Cool down period, reduce tension' },
      { stepNumber: 2, name: 'Understand All Perspectives', description: 'Each party explains their full viewpoint' },
      { stepNumber: 3, name: 'Find Common Ground', description: 'Identify shared values and goals' },
      { stepNumber: 4, name: 'Co-Create Solutions', description: 'Work together to design win-win solutions' },
      { stepNumber: 5, name: 'Implement Together', description: 'Collaboratively implement the solution' }
    ],
    mediation: [
      { stepNumber: 1, name: 'Assign Mediator', description: 'Neutral third party facilitates discussion' },
      { stepNumber: 2, name: 'Set Ground Rules', description: 'Establish respectful communication norms' },
      { stepNumber: 3, name: 'Facilitated Dialogue', description: 'Mediator guides structured conversation' },
      { stepNumber: 4, name: 'Explore Solutions', description: 'Mediator helps parties find common ground' },
      { stepNumber: 5, name: 'Mediated Agreement', description: 'Reach consensus with mediator support' }
    ],
    nvc: [
      { stepNumber: 1, name: 'Observations', description: 'State facts without judgment' },
      { stepNumber: 2, name: 'Feelings', description: 'Express emotions without blame' },
      { stepNumber: 3, name: 'Needs', description: 'Identify underlying needs' },
      { stepNumber: 4, name: 'Requests', description: 'Make clear, actionable requests' },
      { stepNumber: 5, name: 'Empathetic Response', description: 'Other party reflects understanding' }
    ]
  };

  const template = this.resolutionTemplate || 'collaborating';
  this.workflow.steps = workflows[template] || workflows.collaborating;
  this.workflow.totalSteps = this.workflow.steps.length;
  this.workflow.currentStep = 1;

  // Mark first step as in progress
  if (this.workflow.steps.length > 0) {
    this.workflow.steps[0].status = 'in_progress';
  }
};

/**
 * Move to next step in workflow
 */
conflictResolutionSchema.methods.advanceWorkflow = function(userId, outcome) {
  const currentStepIndex = this.workflow.currentStep - 1;

  if (currentStepIndex < this.workflow.steps.length) {
    // Complete current step
    this.workflow.steps[currentStepIndex].status = 'completed';
    this.workflow.steps[currentStepIndex].completedAt = new Date();
    this.workflow.steps[currentStepIndex].completedBy = userId;
    this.workflow.steps[currentStepIndex].outcome = outcome;

    // Move to next step
    this.workflow.currentStep++;

    if (this.workflow.currentStep <= this.workflow.totalSteps) {
      this.workflow.steps[this.workflow.currentStep - 1].status = 'in_progress';
    } else {
      // Workflow completed
      this.status = 'resolved';
      this.resolution.achieved = true;
      this.resolution.resolvedAt = new Date();
    }
  }

  return this.workflow.currentStep;
};

/**
 * Add automated action log
 */
conflictResolutionSchema.methods.logAutomatedAction = function(action, triggeredBy, result) {
  this.automatedActions.push({
    action,
    triggeredBy,
    result,
    triggeredAt: new Date()
  });
};

/**
 * Initiate cooling-off period
 */
conflictResolutionSchema.methods.startCoolingOff = function(hours = 24) {
  this.deescalation.coolingOffPeriod.enabled = true;
  this.deescalation.coolingOffPeriod.startedAt = new Date();
  this.deescalation.coolingOffPeriod.endsAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.deescalation.coolingOffPeriod.durationHours = hours;
  this.deescalation.restrictions.push('no_new_arguments');
  this.status = 'de_escalating';

  this.logAutomatedAction(
    'Cooling-off period initiated',
    'Escalation level threshold',
    `${hours}-hour pause on new arguments`
  );
};

/**
 * Check if cooling-off period is over
 */
conflictResolutionSchema.methods.isCoolingOffOver = function() {
  if (!this.deescalation.coolingOffPeriod.enabled) return true;
  return new Date() > this.deescalation.coolingOffPeriod.endsAt;
};

/**
 * Get suggested next action based on current state
 */
conflictResolutionSchema.methods.getSuggestedAction = function() {
  // Check if in cooling off
  if (this.deescalation.coolingOffPeriod.enabled && !this.isCoolingOffOver()) {
    return {
      action: 'wait',
      message: `Cooling-off period in effect until ${this.deescalation.coolingOffPeriod.endsAt.toLocaleString()}`,
      canProceed: false
    };
  }

  // Get current workflow step
  if (this.workflow.currentStep <= this.workflow.totalSteps) {
    const currentStep = this.workflow.steps[this.workflow.currentStep - 1];
    return {
      action: currentStep.name,
      message: currentStep.description,
      canProceed: true,
      stepNumber: this.workflow.currentStep,
      totalSteps: this.workflow.totalSteps
    };
  }

  return {
    action: 'review',
    message: 'Workflow completed. Review resolution outcome.',
    canProceed: true
  };
};

// Static Methods

/**
 * Detect conflicts for a belief
 */
conflictResolutionSchema.statics.detectConflict = async function(beliefId) {
  const Belief = mongoose.model('Belief');
  const Argument = mongoose.model('Argument');

  const belief = await Belief.findById(beliefId)
    .populate('supportingArguments')
    .populate('opposingArguments');

  if (!belief) throw new Error('Belief not found');

  // Calculate metrics
  const supportingArgs = belief.supportingArguments || [];
  const opposingArgs = belief.opposingArguments || [];

  const supportingScore = supportingArgs.reduce((sum, arg) => sum + (arg.scores?.overall || 0), 0);
  const opposingScore = opposingArgs.reduce((sum, arg) => sum + (arg.scores?.overall || 0), 0);
  const scoreGap = Math.abs(supportingScore - opposingScore);

  // Conflict exists if there are significant arguments on both sides
  const hasConflict = supportingArgs.length > 0 &&
                     opposingArgs.length > 0 &&
                     scoreGap < 100; // Not decisive

  if (!hasConflict) return null;

  // Check if conflict already exists
  let conflict = await this.findOne({
    beliefId,
    status: { $nin: ['resolved', 'stalemate'] }
  });

  if (!conflict) {
    // Create new conflict
    conflict = new this({
      beliefId,
      supportingArguments: belief.supportingArguments.map(a => a._id),
      opposingArguments: belief.opposingArguments.map(a => a._id),
      intensity: {
        scoreGap,
        argumentCount: supportingArgs.length + opposingArgs.length,
        participantCount: new Set([
          ...supportingArgs.map(a => a.author?.toString()),
          ...opposingArgs.map(a => a.author?.toString())
        ].filter(Boolean)).size
      }
    });

    // Assess escalation and set template
    conflict.assessEscalationLevel();
    conflict.initializeWorkflow();

    await conflict.save();
  }

  return conflict;
};

/**
 * Get active conflicts
 */
conflictResolutionSchema.statics.getActiveConflicts = function(options = {}) {
  const query = { status: { $nin: ['resolved', 'stalemate'] } };

  if (options.beliefId) query.beliefId = options.beliefId;
  if (options.minEscalation) query['intensity.escalationLevel'] = { $gte: options.minEscalation };

  return this.find(query)
    .populate('beliefId')
    .populate('supporters.userId', 'username')
    .populate('opponents.userId', 'username')
    .sort({ 'intensity.escalationLevel': -1, createdAt: -1 })
    .limit(options.limit || 50);
};

const ConflictResolution = mongoose.model('ConflictResolution', conflictResolutionSchema);

export default ConflictResolution;
