import User from '../models/User.js';
import Belief from '../models/Belief.js';
import mongoose from 'mongoose';

// Update matching profile
export const updateMatchingProfile = async (req, res) => {
  try {
    const {
      enabled,
      bio,
      age,
      location,
      interests,
      lookingFor,
      dealBreakerBeliefs,
      importantBeliefs,
      showInMatching,
      allowMessages
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update matching profile fields
    if (enabled !== undefined) user.matchingProfile.enabled = enabled;
    if (bio !== undefined) user.matchingProfile.bio = bio;
    if (age !== undefined) user.matchingProfile.age = age;
    if (location !== undefined) user.matchingProfile.location = location;
    if (interests !== undefined) user.matchingProfile.interests = interests;
    if (lookingFor !== undefined) user.matchingProfile.lookingFor = lookingFor;
    if (dealBreakerBeliefs !== undefined) user.matchingProfile.dealBreakerBeliefs = dealBreakerBeliefs;
    if (importantBeliefs !== undefined) user.matchingProfile.importantBeliefs = importantBeliefs;
    if (showInMatching !== undefined) user.matchingProfile.showInMatching = showInMatching;
    if (allowMessages !== undefined) user.matchingProfile.allowMessages = allowMessages;

    await user.save();

    res.json({
      success: true,
      data: user.matchingProfile,
      message: 'Matching profile updated successfully'
    });
  } catch (error) {
    console.error('Update matching profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get matching profile
export const getMatchingProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.id;

    const user = await User.findById(targetUserId)
      .populate('matchingProfile.dealBreakerBeliefs', 'statement conclusionScore')
      .populate('matchingProfile.importantBeliefs.belief', 'statement conclusionScore');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Only show full profile if user is viewing their own or profile is public
    if (targetUserId !== req.user.id && !user.matchingProfile.showInMatching) {
      return res.status(403).json({
        success: false,
        error: 'This profile is private'
      });
    }

    res.json({
      success: true,
      data: {
        username: user.username,
        reputation: user.reputation,
        matchingProfile: user.matchingProfile
      }
    });
  } catch (error) {
    console.error('Get matching profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Calculate compatibility between two users based on beliefs
export const calculateCompatibility = async (userId1, userId2) => {
  try {
    const user1 = await User.findById(userId1).populate('createdBeliefs votedArguments.argumentId');
    const user2 = await User.findById(userId2).populate('createdBeliefs votedArguments.argumentId');

    if (!user1 || !user2) {
      throw new Error('Users not found');
    }

    // Get all beliefs both users have voted on
    const user1Votes = new Map();
    user1.votedArguments.forEach(va => {
      if (va.argumentId && va.argumentId.beliefId) {
        user1Votes.set(va.argumentId.beliefId.toString(), va.vote);
      }
    });

    const user2Votes = new Map();
    user2.votedArguments.forEach(va => {
      if (va.argumentId && va.argumentId.beliefId) {
        user2Votes.set(va.argumentId.beliefId.toString(), va.vote);
      }
    });

    // Find common beliefs they've both voted on
    const commonBeliefs = [];
    for (const [beliefId, user1Vote] of user1Votes) {
      if (user2Votes.has(beliefId)) {
        commonBeliefs.push({
          beliefId,
          user1Vote,
          user2Vote: user2Votes.get(beliefId),
          agree: user1Vote === user2Votes.get(beliefId)
        });
      }
    }

    if (commonBeliefs.length === 0) {
      return {
        score: 50, // Neutral if no common beliefs
        agreement: 0,
        disagreement: 0,
        total: 0,
        details: 'No common beliefs to compare'
      };
    }

    // Calculate agreement percentage
    const agreements = commonBeliefs.filter(b => b.agree).length;
    const score = (agreements / commonBeliefs.length) * 100;

    // Check deal-breakers
    let dealBreakerViolations = [];
    if (user1.matchingProfile.dealBreakerBeliefs?.length > 0) {
      for (const beliefId of user1.matchingProfile.dealBreakerBeliefs) {
        const belief = commonBeliefs.find(b => b.beliefId === beliefId.toString());
        if (belief && !belief.agree) {
          dealBreakerViolations.push(beliefId);
        }
      }
    }

    // Weight important beliefs
    let weightedScore = score;
    if (user1.matchingProfile.importantBeliefs?.length > 0) {
      let totalWeight = 0;
      let weightedAgreement = 0;

      user1.matchingProfile.importantBeliefs.forEach(ib => {
        const belief = commonBeliefs.find(b => b.beliefId === ib.belief.toString());
        if (belief) {
          totalWeight += ib.importance;
          if (belief.agree) {
            weightedAgreement += ib.importance;
          }
        }
      });

      if (totalWeight > 0) {
        weightedScore = ((weightedAgreement / totalWeight) * 70) + (score * 0.3);
      }
    }

    return {
      score: Math.round(weightedScore),
      agreement: agreements,
      disagreement: commonBeliefs.length - agreements,
      total: commonBeliefs.length,
      dealBreakerViolations: dealBreakerViolations.length,
      hasDealBreakers: dealBreakerViolations.length > 0,
      commonBeliefs: commonBeliefs.length
    };
  } catch (error) {
    console.error('Calculate compatibility error:', error);
    throw error;
  }
};

// Find matches
export const findMatches = async (req, res) => {
  try {
    const {
      lookingFor = null,
      minAge = 18,
      maxAge = 120,
      location = null,
      minCompatibility = 60,
      limit = 50
    } = req.query;

    const query = {
      _id: { $ne: req.user.id }, // Exclude self
      'matchingProfile.enabled': true,
      'matchingProfile.showInMatching': true
    };

    if (lookingFor) {
      query['matchingProfile.lookingFor'] = lookingFor;
    }

    if (minAge || maxAge) {
      query['matchingProfile.age'] = {};
      if (minAge) query['matchingProfile.age'].$gte = parseInt(minAge);
      if (maxAge) query['matchingProfile.age'].$lte = parseInt(maxAge);
    }

    if (location) {
      query['matchingProfile.location.city'] = new RegExp(location, 'i');
    }

    const potentialMatches = await User.find(query)
      .limit(parseInt(limit) * 2) // Get more to filter by compatibility
      .select('username reputation matchingProfile');

    // Calculate compatibility for each
    const matchesWithScores = await Promise.all(
      potentialMatches.map(async (match) => {
        const compatibility = await calculateCompatibility(req.user.id, match._id);
        return {
          user: {
            id: match._id,
            username: match.username,
            reputation: match.reputation,
            bio: match.matchingProfile.bio,
            age: match.matchingProfile.age,
            location: match.matchingProfile.location,
            interests: match.matchingProfile.interests,
            lookingFor: match.matchingProfile.lookingFor
          },
          compatibility
        };
      })
    );

    // Filter by minimum compatibility and sort
    const filteredMatches = matchesWithScores
      .filter(m => m.compatibility.score >= parseInt(minCompatibility) && !m.compatibility.hasDealBreakers)
      .sort((a, b) => b.compatibility.score - a.compatibility.score)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        matches: filteredMatches,
        total: filteredMatches.length
      }
    });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get compatibility with specific user
export const getCompatibilityWith = async (req, res) => {
  try {
    const { userId } = req.params;

    const compatibility = await calculateCompatibility(req.user.id, userId);

    res.json({
      success: true,
      data: compatibility
    });
  } catch (error) {
    console.error('Get compatibility error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add belief as deal-breaker
export const addDealBreaker = async (req, res) => {
  try {
    const { beliefId } = req.body;

    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user.matchingProfile.dealBreakerBeliefs) {
      user.matchingProfile.dealBreakerBeliefs = [];
    }

    if (!user.matchingProfile.dealBreakerBeliefs.includes(beliefId)) {
      user.matchingProfile.dealBreakerBeliefs.push(beliefId);
      await user.save();
    }

    res.json({
      success: true,
      data: user.matchingProfile.dealBreakerBeliefs,
      message: 'Deal-breaker belief added'
    });
  } catch (error) {
    console.error('Add deal-breaker error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add important belief
export const addImportantBelief = async (req, res) => {
  try {
    const { beliefId, importance } = req.body;

    if (importance < 1 || importance > 10) {
      return res.status(400).json({
        success: false,
        error: 'Importance must be between 1 and 10'
      });
    }

    const belief = await Belief.findById(beliefId);
    if (!belief) {
      return res.status(404).json({
        success: false,
        error: 'Belief not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user.matchingProfile.importantBeliefs) {
      user.matchingProfile.importantBeliefs = [];
    }

    // Remove existing if present
    user.matchingProfile.importantBeliefs = user.matchingProfile.importantBeliefs.filter(
      ib => ib.belief.toString() !== beliefId
    );

    user.matchingProfile.importantBeliefs.push({ belief: beliefId, importance });
    await user.save();

    res.json({
      success: true,
      data: user.matchingProfile.importantBeliefs,
      message: 'Important belief added'
    });
  } catch (error) {
    console.error('Add important belief error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
