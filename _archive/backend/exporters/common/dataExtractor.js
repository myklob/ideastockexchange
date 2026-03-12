import Belief from '../../models/Belief.js';
import Argument from '../../models/Argument.js';
import Evidence from '../../models/Evidence.js';
import Law from '../../models/Law.js';
import Assumption from '../../models/Assumption.js';

/**
 * Data Extractor Service
 * Extracts all data from MongoDB for export to Excel/Access
 */
class DataExtractor {
  /**
   * Extract complete belief data with all related entities
   * @param {String} beliefId - MongoDB ObjectId of the belief
   * @returns {Object} Complete belief data structure
   */
  async extractBeliefData(beliefId) {
    try {
      // Fetch belief with all populations
      const belief = await Belief.findById(beliefId)
        .populate('author', 'username email')
        .populate('supportingArguments')
        .populate('opposingArguments')
        .populate('supportingLaws')
        .populate('opposingLaws')
        .populate('contributors')
        .populate('topicId')
        .lean();

      if (!belief) {
        throw new Error(`Belief ${beliefId} not found`);
      }

      // Extract arguments with their evidence and sub-arguments
      const arguments = await this.extractArguments(beliefId);

      // Extract evidence
      const evidence = await this.extractEvidence(arguments);

      // Extract laws
      const laws = await this.extractLaws(beliefId);

      // Extract assumptions
      const assumptions = await this.extractAssumptions(beliefId);

      return {
        belief,
        arguments,
        evidence,
        laws,
        assumptions,
        metadata: {
          exportedAt: new Date(),
          exportedBy: 'ISE Export System',
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Error extracting belief data:', error);
      throw error;
    }
  }

  /**
   * Extract all arguments for a belief
   * @param {String} beliefId
   * @returns {Array} Array of argument objects
   */
  async extractArguments(beliefId) {
    try {
      const arguments = await Argument.find({ beliefId })
        .populate('author', 'username')
        .populate('evidence')
        .populate('subArguments')
        .populate('parentArgument')
        .lean();

      return arguments.map(arg => ({
        _id: arg._id.toString(),
        content: arg.content,
        type: arg.type,
        beliefId: arg.beliefId.toString(),
        author: arg.author?.username || 'Unknown',
        scores: arg.scores,
        reasonRankScore: arg.reasonRankScore || 0,
        lifecycleStatus: arg.lifecycleStatus || 'active',
        healthMetrics: arg.healthMetrics || {},
        votes: arg.votes || { up: 0, down: 0 },
        evidenceIds: arg.evidence?.map(e => e._id.toString()) || [],
        subArgumentIds: arg.subArguments?.map(sa => sa._id.toString()) || [],
        parentArgumentId: arg.parentArgument?._id.toString() || null,
        createdAt: arg.createdAt,
        updatedAt: arg.updatedAt
      }));
    } catch (error) {
      console.error('Error extracting arguments:', error);
      throw error;
    }
  }

  /**
   * Extract evidence from arguments
   * @param {Array} arguments
   * @returns {Array} Array of unique evidence objects
   */
  async extractEvidence(arguments) {
    try {
      // Collect unique evidence IDs from all arguments
      const evidenceIds = new Set();
      arguments.forEach(arg => {
        arg.evidenceIds.forEach(id => evidenceIds.add(id));
      });

      if (evidenceIds.size === 0) {
        return [];
      }

      const evidence = await Evidence.find({
        _id: { $in: Array.from(evidenceIds) }
      })
        .populate('submittedBy', 'username')
        .lean();

      return evidence.map(ev => ({
        _id: ev._id.toString(),
        title: ev.title,
        description: ev.description || '',
        type: ev.type,
        source: ev.source || {},
        credibilityScore: ev.credibilityScore || 50,
        verificationStatus: ev.verificationStatus || 'unverified',
        tags: ev.tags || [],
        metadata: ev.metadata || {},
        submittedBy: ev.submittedBy?.username || 'Unknown',
        createdAt: ev.createdAt,
        updatedAt: ev.updatedAt
      }));
    } catch (error) {
      console.error('Error extracting evidence:', error);
      throw error;
    }
  }

  /**
   * Extract laws related to a belief
   * @param {String} beliefId
   * @returns {Array} Array of law objects
   */
  async extractLaws(beliefId) {
    try {
      const laws = await Law.find({
        'relatedBeliefs.beliefId': beliefId
      })
        .populate('submittedBy', 'username')
        .lean();

      return laws.map(law => {
        // Find the relationship to this specific belief
        const relationship = law.relatedBeliefs.find(
          rb => rb.beliefId.toString() === beliefId.toString()
        );

        return {
          _id: law._id.toString(),
          title: law.title,
          officialName: law.officialName || '',
          description: law.description,
          jurisdiction: law.jurisdiction,
          status: law.status,
          enactedDate: law.enactedDate,
          effectiveDate: law.effectiveDate,
          category: law.category || 'other',
          relationship: relationship?.relationship || 'neutral',
          relationshipStrength: relationship?.strength || 50,
          relationshipNotes: relationship?.notes || '',
          scores: law.scores || {},
          enforcement: law.enforcement || {},
          penalties: law.penalties || {},
          submittedBy: law.submittedBy?.username || 'Unknown',
          createdAt: law.createdAt,
          updatedAt: law.updatedAt
        };
      });
    } catch (error) {
      console.error('Error extracting laws:', error);
      throw error;
    }
  }

  /**
   * Extract assumptions for a belief
   * @param {String} beliefId
   * @returns {Array} Array of assumption objects
   */
  async extractAssumptions(beliefId) {
    try {
      const assumptions = await Assumption.find({ beliefId })
        .populate('author', 'username')
        .populate('dependentArguments.argumentId')
        .populate('linkedBeliefs.beliefId', 'statement')
        .lean();

      return assumptions.map(assumption => ({
        _id: assumption._id.toString(),
        statement: assumption.statement,
        description: assumption.description || '',
        beliefId: assumption.beliefId.toString(),
        author: assumption.author?.username || 'Unknown',
        dependentArguments: assumption.dependentArguments || [],
        aggregateScore: assumption.aggregateScore || 0,
        mustAccept: assumption.mustAccept || false,
        mustReject: assumption.mustReject || false,
        criticalityReason: assumption.criticalityReason || '',
        linkedBeliefs: assumption.linkedBeliefs || [],
        votes: assumption.votes || 0,
        upvotes: assumption.upvotes || 0,
        downvotes: assumption.downvotes || 0,
        status: assumption.status || 'proposed',
        tags: assumption.tags || [],
        createdAt: assumption.createdAt,
        updatedAt: assumption.updatedAt
      }));
    } catch (error) {
      console.error('Error extracting assumptions:', error);
      throw error;
    }
  }

  /**
   * Extract multiple beliefs for bulk export
   * @param {Array} beliefIds - Array of belief IDs
   * @returns {Array} Array of belief data objects
   */
  async extractMultipleBeliefs(beliefIds) {
    const results = [];
    for (const beliefId of beliefIds) {
      try {
        const data = await this.extractBeliefData(beliefId);
        results.push(data);
      } catch (error) {
        console.error(`Error extracting belief ${beliefId}:`, error);
        // Continue with other beliefs even if one fails
      }
    }
    return results;
  }

  /**
   * Extract all active beliefs for a topic
   * @param {String} topicId
   * @returns {Array} Array of belief data objects
   */
  async extractBeliefsByTopic(topicId) {
    try {
      const beliefs = await Belief.find({
        topicId,
        status: 'active'
      }).select('_id').lean();

      const beliefIds = beliefs.map(b => b._id.toString());
      return await this.extractMultipleBeliefs(beliefIds);
    } catch (error) {
      console.error('Error extracting beliefs by topic:', error);
      throw error;
    }
  }

  /**
   * Extract all active beliefs (for full database export)
   * @param {Object} options - Query options (limit, category, etc.)
   * @returns {Array} Array of belief data objects
   */
  async extractAllBeliefs(options = {}) {
    try {
      const {
        limit = 100,
        category = null,
        status = 'active'
      } = options;

      const query = { status };
      if (category) {
        query.category = category;
      }

      const beliefs = await Belief.find(query)
        .limit(limit)
        .select('_id')
        .lean();

      const beliefIds = beliefs.map(b => b._id.toString());
      return await this.extractMultipleBeliefs(beliefIds);
    } catch (error) {
      console.error('Error extracting all beliefs:', error);
      throw error;
    }
  }
}

export default new DataExtractor();
