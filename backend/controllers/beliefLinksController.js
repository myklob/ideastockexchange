import Belief from '../models/Belief.js';
import BeliefLink from '../models/BeliefLink.js';
import Argument from '../models/Argument.js';

/**
 * Get incoming links for a belief
 * Shows which beliefs support or oppose this belief
 *
 * @route GET /api/beliefs/:id/links/incoming
 * @access Public
 */
export const getIncomingLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = 50, sortBy = 'strength' } = req.query;

    // Verify belief exists
    const belief = await Belief.findById(id);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    // Build query options
    const options = {
      linkType: type, // 'SUPPORTS' or 'OPPOSES' (optional)
      limit: parseInt(limit),
    };

    // Get incoming links
    const links = await BeliefLink.getIncomingLinks(id, options);

    // Sort by requested criteria
    if (sortBy === 'strength') {
      links.sort((a, b) => b.linkStrength - a.linkStrength);
    } else if (sortBy === 'contribution') {
      links.sort((a, b) =>
        Math.abs(b.contribution?.totalContribution || 0) -
        Math.abs(a.contribution?.totalContribution || 0)
      );
    } else if (sortBy === 'recent') {
      links.sort((a, b) =>
        new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt)
      );
    }

    // Calculate statistics
    const stats = {
      total: links.length,
      supporting: links.filter(l => l.linkType === 'SUPPORTS').length,
      opposing: links.filter(l => l.linkType === 'OPPOSES').length,
      totalContribution: links.reduce((sum, l) => sum + (l.contribution?.totalContribution || 0), 0),
      averageStrength: links.length > 0
        ? links.reduce((sum, l) => sum + l.linkStrength, 0) / links.length
        : 0,
    };

    res.json({
      success: true,
      belief: {
        id: belief._id,
        statement: belief.statement,
      },
      links,
      stats,
    });
  } catch (error) {
    console.error('Error getting incoming links:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving incoming links',
      error: error.message,
    });
  }
};

/**
 * Get outgoing links for a belief
 * Shows which beliefs this belief supports or opposes
 *
 * @route GET /api/beliefs/:id/links/outgoing
 * @access Public
 */
export const getOutgoingLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = 50, sortBy = 'strength' } = req.query;

    // Verify belief exists
    const belief = await Belief.findById(id);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    // Build query options
    const options = {
      linkType: type, // 'SUPPORTS' or 'OPPOSES' (optional)
      limit: parseInt(limit),
    };

    // Get outgoing links
    const links = await BeliefLink.getOutgoingLinks(id, options);

    // Sort by requested criteria
    if (sortBy === 'strength') {
      links.sort((a, b) => b.linkStrength - a.linkStrength);
    } else if (sortBy === 'contribution') {
      links.sort((a, b) =>
        Math.abs(b.contribution?.totalContribution || 0) -
        Math.abs(a.contribution?.totalContribution || 0)
      );
    } else if (sortBy === 'recent') {
      links.sort((a, b) =>
        new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt)
      );
    }

    // Calculate statistics
    const stats = {
      total: links.length,
      supporting: links.filter(l => l.linkType === 'SUPPORTS').length,
      opposing: links.filter(l => l.linkType === 'OPPOSES').length,
      totalContribution: links.reduce((sum, l) => sum + (l.contribution?.totalContribution || 0), 0),
      averageStrength: links.length > 0
        ? links.reduce((sum, l) => sum + l.linkStrength, 0) / links.length
        : 0,
    };

    res.json({
      success: true,
      belief: {
        id: belief._id,
        statement: belief.statement,
      },
      links,
      stats,
    });
  } catch (error) {
    console.error('Error getting outgoing links:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving outgoing links',
      error: error.message,
    });
  }
};

/**
 * Get full bidirectional link graph for a belief
 * Shows both incoming and outgoing links
 *
 * @route GET /api/beliefs/:id/links/graph
 * @access Public
 */
export const getLinkGraph = async (req, res) => {
  try {
    const { id } = req.params;
    const { depth = 1 } = req.query;

    // Verify belief exists
    const belief = await Belief.findById(id);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    // Get link graph
    const graph = await BeliefLink.getLinkGraph(id, parseInt(depth));

    // Add belief info
    graph.belief = {
      id: belief._id,
      statement: belief.statement,
      conclusionScore: belief.conclusionScore,
      linkStatistics: belief.getLinkSummary(),
    };

    res.json({
      success: true,
      graph,
    });
  } catch (error) {
    console.error('Error getting link graph:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving link graph',
      error: error.message,
    });
  }
};

/**
 * Get link summary (quick stats)
 *
 * @route GET /api/beliefs/:id/links/summary
 * @access Public
 */
export const getLinkSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify belief exists
    const belief = await Belief.findById(id);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    // Get summary from belief model
    const summary = belief.getLinkSummary();

    res.json({
      success: true,
      belief: {
        id: belief._id,
        statement: belief.statement,
      },
      summary,
    });
  } catch (error) {
    console.error('Error getting link summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving link summary',
      error: error.message,
    });
  }
};

/**
 * Update link statistics for a belief
 * Recalculates all link metrics
 *
 * @route POST /api/beliefs/:id/links/update-statistics
 * @access Protected (Admin)
 */
export const updateLinkStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify belief exists
    const belief = await Belief.findById(id);
    if (!belief) {
      return res.status(404).json({
        success: false,
        message: 'Belief not found',
      });
    }

    // Update statistics
    await belief.updateLinkStatistics();
    await belief.save();

    res.json({
      success: true,
      message: 'Link statistics updated successfully',
      linkStatistics: belief.linkStatistics,
    });
  } catch (error) {
    console.error('Error updating link statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating link statistics',
      error: error.message,
    });
  }
};

/**
 * Get top influential beliefs
 * Beliefs that have the highest influence scores (contribute most to others)
 *
 * @route GET /api/beliefs/links/top-influential
 * @access Public
 */
export const getTopInfluentialBeliefs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const beliefs = await Belief.find({ status: 'active' })
      .sort({ 'linkStatistics.networkPosition.influenceScore': -1 })
      .limit(parseInt(limit))
      .select('statement conclusionScore linkStatistics');

    res.json({
      success: true,
      beliefs,
    });
  } catch (error) {
    console.error('Error getting top influential beliefs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving top influential beliefs',
      error: error.message,
    });
  }
};

/**
 * Get most central beliefs
 * Beliefs with highest centrality (most connected in the network)
 *
 * @route GET /api/beliefs/links/most-central
 * @access Public
 */
export const getMostCentralBeliefs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const beliefs = await Belief.find({ status: 'active' })
      .sort({ 'linkStatistics.networkPosition.centrality': -1 })
      .limit(parseInt(limit))
      .select('statement conclusionScore linkStatistics');

    res.json({
      success: true,
      beliefs,
    });
  } catch (error) {
    console.error('Error getting most central beliefs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving most central beliefs',
      error: error.message,
    });
  }
};

/**
 * Get network statistics
 * Overall statistics about the belief link network
 *
 * @route GET /api/beliefs/links/network-stats
 * @access Public
 */
export const getNetworkStatistics = async (req, res) => {
  try {
    const totalBeliefs = await Belief.countDocuments({ status: 'active' });
    const totalLinks = await BeliefLink.countDocuments({ 'metadata.isActive': true });

    const supportingLinks = await BeliefLink.countDocuments({
      'metadata.isActive': true,
      linkType: 'SUPPORTS',
    });

    const opposingLinks = await BeliefLink.countDocuments({
      'metadata.isActive': true,
      linkType: 'OPPOSES',
    });

    // Average connectivity
    const avgLinksPerBelief = totalBeliefs > 0 ? totalLinks / totalBeliefs : 0;

    // Get most connected belief
    const mostConnected = await Belief.findOne({ status: 'active' })
      .sort({
        'linkStatistics.incoming.total': -1,
        'linkStatistics.outgoing.total': -1,
      })
      .select('statement linkStatistics');

    res.json({
      success: true,
      stats: {
        totalBeliefs,
        totalLinks,
        supportingLinks,
        opposingLinks,
        avgLinksPerBelief: avgLinksPerBelief.toFixed(2),
        mostConnected: mostConnected ? {
          statement: mostConnected.statement,
          totalLinks:
            mostConnected.linkStatistics.incoming.total +
            mostConnected.linkStatistics.outgoing.total,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error getting network statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving network statistics',
      error: error.message,
    });
  }
};
