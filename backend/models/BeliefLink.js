const mongoose = require('mongoose');

/**
 * BeliefLink Model
 *
 * Tracks explicit connections between beliefs through arguments.
 * This enables "What Links Here" functionality by showing:
 * - Which beliefs support/oppose this belief (incoming links)
 * - Which beliefs this belief supports/opposes (outgoing links)
 *
 * Each link represents an argument from one belief being used as a
 * reason to agree/disagree with another belief.
 */
const beliefLinkSchema = new mongoose.Schema({
  // Source belief (the one providing the argument/reason)
  fromBeliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    index: true
  },

  // Target belief (the one being supported or opposed)
  toBeliefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Belief',
    required: true,
    index: true
  },

  // The argument that creates this link
  argumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
    required: true,
    index: true
  },

  // Type of link
  linkType: {
    type: String,
    enum: ['SUPPORTS', 'OPPOSES'],
    required: true
  },

  // Strength of this link (computed from argument quality)
  // This represents how much the fromBelief contributes to the toBelief
  linkStrength: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Detailed contribution breakdown
  contribution: {
    // Raw argument score contribution
    argumentScore: {
      type: Number,
      default: 0
    },

    // ReasonRank contribution (from fromBelief's ReasonRank * link weight)
    reasonRankContribution: {
      type: Number,
      default: 0
    },

    // Vote-based contribution
    voteContribution: {
      type: Number,
      default: 0
    },

    // Aspect rating contribution
    aspectContribution: {
      type: Number,
      default: 0
    },

    // Total weighted contribution to target belief
    totalContribution: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  metadata: {
    // When this link was created
    createdAt: {
      type: Date,
      default: Date.now
    },

    // When link strength was last updated
    lastUpdated: {
      type: Date,
      default: Date.now
    },

    // User who created the argument that created this link
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Whether this link is currently active
    // (becomes inactive if argument is deleted or marked as refuted)
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
beliefLinkSchema.index({ fromBeliefId: 1, toBeliefId: 1 });
beliefLinkSchema.index({ toBeliefId: 1, linkStrength: -1 }); // For incoming links sorted by strength
beliefLinkSchema.index({ fromBeliefId: 1, linkStrength: -1 }); // For outgoing links sorted by strength
beliefLinkSchema.index({ argumentId: 1 }, { unique: true }); // One link per argument

// Methods

/**
 * Calculate link strength based on argument quality
 * Uses the hybrid scoring formula
 */
beliefLinkSchema.methods.calculateLinkStrength = async function() {
  const Argument = mongoose.model('Argument');
  const Belief = mongoose.model('Belief');

  const argument = await Argument.findById(this.argumentId);
  if (!argument) {
    this.linkStrength = 0;
    this.metadata.isActive = false;
    return 0;
  }

  const fromBelief = await Belief.findById(this.fromBeliefId);

  // Base weight: +1 for supporting, -1 for opposing
  const baseWeight = this.linkType === 'SUPPORTS' ? 1 : -1;

  // Component 1: Argument quality (overall score)
  const argumentQuality = argument.scores?.overall || 0;

  // Component 2: Vote strength (Wilson score approximation)
  const upVotes = argument.votes?.up || 0;
  const downVotes = argument.votes?.down || 0;
  const totalVotes = upVotes + downVotes;
  const voteScore = totalVotes > 0
    ? ((upVotes - downVotes) / totalVotes + 1) * 50 // Normalize to 0-100
    : 50; // Neutral if no votes

  // Component 3: Aspect ratings (calculated separately if available)
  const aspectScore = this.calculateAspectScore(argument);

  // Component 4: ReasonRank of source belief
  const reasonRank = fromBelief?.reasonRankScore || 50;

  // Hybrid formula (configurable weights)
  const weights = {
    reasonRank: 0.50,
    votes: 0.35,
    aspects: 0.15
  };

  const weightedScore =
    (reasonRank * weights.reasonRank) +
    (voteScore * weights.votes) +
    (aspectScore * weights.aspects);

  // Final link strength (adjusted by argument quality)
  this.linkStrength = (weightedScore * argumentQuality) / 100;

  // Store contribution breakdown
  this.contribution = {
    argumentScore: argumentQuality,
    reasonRankContribution: reasonRank * weights.reasonRank,
    voteContribution: voteScore * weights.votes,
    aspectContribution: aspectScore * weights.aspects,
    totalContribution: this.linkStrength * baseWeight // Can be negative for opposing
  };

  this.metadata.lastUpdated = new Date();

  return this.linkStrength;
};

/**
 * Calculate aspect rating score for an argument
 */
beliefLinkSchema.methods.calculateAspectScore = function(argument) {
  if (!argument.aspectRatings || argument.aspectRatings.ratings.length === 0) {
    return 50; // Neutral if no aspect ratings
  }

  const aspects = ['clarity', 'truth', 'usefulness', 'evidence', 'logic'];
  let totalScore = 0;
  let ratedAspects = 0;

  aspects.forEach(aspect => {
    const ratings = argument.aspectRatings[aspect];
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      totalScore += avgRating;
      ratedAspects++;
    }
  });

  if (ratedAspects === 0) return 50;

  // Convert from 1-5 scale to 0-100 scale
  const avgScore = totalScore / ratedAspects;
  return ((avgScore - 1) / 4) * 100; // 1->0, 3->50, 5->100
};

// Static methods

/**
 * Get all incoming links for a belief (beliefs that support/oppose this one)
 */
beliefLinkSchema.statics.getIncomingLinks = async function(beliefId, options = {}) {
  const query = {
    toBeliefId: beliefId,
    'metadata.isActive': true
  };

  if (options.linkType) {
    query.linkType = options.linkType;
  }

  const links = await this.find(query)
    .populate('fromBeliefId', 'statement conclusionScore')
    .populate('argumentId', 'content scores votes')
    .sort({ linkStrength: -1 })
    .limit(options.limit || 100);

  return links;
};

/**
 * Get all outgoing links for a belief (beliefs this one supports/opposes)
 */
beliefLinkSchema.statics.getOutgoingLinks = async function(beliefId, options = {}) {
  const query = {
    fromBeliefId: beliefId,
    'metadata.isActive': true
  };

  if (options.linkType) {
    query.linkType = options.linkType;
  }

  const links = await this.find(query)
    .populate('toBeliefId', 'statement conclusionScore')
    .populate('argumentId', 'content scores votes')
    .sort({ linkStrength: -1 })
    .limit(options.limit || 100);

  return links;
};

/**
 * Get bidirectional link graph for a belief
 */
beliefLinkSchema.statics.getLinkGraph = async function(beliefId, depth = 1) {
  const visited = new Set();
  const graph = {
    center: beliefId,
    incoming: [],
    outgoing: [],
    stats: {
      totalIncoming: 0,
      totalOutgoing: 0,
      strongestIncoming: null,
      strongestOutgoing: null,
      totalIncomingContribution: 0,
      totalOutgoingContribution: 0
    }
  };

  // Get incoming links
  const incoming = await this.getIncomingLinks(beliefId);
  graph.incoming = incoming;
  graph.stats.totalIncoming = incoming.length;

  if (incoming.length > 0) {
    graph.stats.strongestIncoming = incoming[0]; // Already sorted by strength
    graph.stats.totalIncomingContribution = incoming.reduce(
      (sum, link) => sum + (link.contribution?.totalContribution || 0),
      0
    );
  }

  // Get outgoing links
  const outgoing = await this.getOutgoingLinks(beliefId);
  graph.outgoing = outgoing;
  graph.stats.totalOutgoing = outgoing.length;

  if (outgoing.length > 0) {
    graph.stats.strongestOutgoing = outgoing[0];
    graph.stats.totalOutgoingContribution = outgoing.reduce(
      (sum, link) => sum + (link.contribution?.totalContribution || 0),
      0
    );
  }

  return graph;
};

/**
 * Create or update a belief link from an argument
 */
beliefLinkSchema.statics.createFromArgument = async function(argument) {
  const Belief = mongoose.model('Belief');

  // Find which belief this argument references
  // This requires parsing the argument content or having explicit belief references
  // For now, we'll use the beliefId from the argument as the target
  const toBelief = await Belief.findById(argument.beliefId);
  if (!toBelief) return null;

  // Check if this argument references another belief
  // This would need to be extracted from the argument content or metadata
  // For now, we'll look for belief references in the relatedBeliefs
  // This is a placeholder - you may need to implement belief extraction logic

  const linkType = argument.type === 'supporting' ? 'SUPPORTS' : 'OPPOSES';

  // Check if link already exists
  let link = await this.findOne({ argumentId: argument._id });

  if (link) {
    // Update existing link
    await link.calculateLinkStrength();
    await link.save();
  } else {
    // For now, we can't create links without knowing the fromBeliefId
    // This will be populated by the migration script
    return null;
  }

  return link;
};

/**
 * Update all links for a belief when its score changes
 */
beliefLinkSchema.statics.updateLinksForBelief = async function(beliefId) {
  // Update all outgoing links (this belief's contribution to others)
  const outgoingLinks = await this.find({ fromBeliefId: beliefId });

  for (const link of outgoingLinks) {
    await link.calculateLinkStrength();
    await link.save();
  }

  return outgoingLinks.length;
};

module.exports = mongoose.model('BeliefLink', beliefLinkSchema);
