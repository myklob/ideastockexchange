/**
 * Classification Controller
 *
 * Handles API endpoints for belief classification, hierarchy management,
 * and export functionality.
 */

import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import {
  classifyBelief,
  classifyBeliefs,
  getBeliefsByHierarchyLevel,
  getHierarchyDistribution,
  findBeliefSpectrum,
  suggestRelatedBeliefs,
} from '../services/beliefClassificationService.js';
import {
  exportBeliefToJSON,
  exportBeliefToXML,
  exportBeliefsToJSON,
  exportTopicToJSON,
  exportHierarchyDefinitions,
  generateISETemplate,
} from '../services/beliefExportService.js';
import {
  createSubArgumentObjects,
  batchExtractSubArguments,
  analyzeArgumentStructure,
} from '../services/subArgumentExtractionService.js';
import {
  identifyIssuesFromBelief,
  generateSolutionProposals,
  rankIssues,
} from '../services/issuePrioritizationService.js';
import {
  getAllHierarchies,
  getLevelById,
} from '../config/hierarchyDefinitions.js';

/**
 * @route   POST /api/classification/classify/:beliefId
 * @desc    Classify a belief into hierarchical categories
 * @access  Public
 */
export const classifyBeliefById = async (req, res) => {
  try {
    const belief = await Belief.findById(req.params.beliefId)
      .populate('supportingArguments')
      .populate('opposingArguments');

    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    // Perform classification
    const classification = await classifyBelief(belief);

    // Update belief with classifications
    belief.hierarchicalClassification.sentiment = {
      levelId: classification.sentiment.levelId,
      levelName: classification.sentiment.levelName,
      confidence: classification.sentiment.confidence,
      autoClassified: true,
    };

    belief.hierarchicalClassification.specificity = {
      levelId: classification.specificity.levelId,
      levelName: classification.specificity.levelName,
      confidence: classification.specificity.confidence,
      autoClassified: true,
    };

    belief.hierarchicalClassification.strength = {
      levelId: classification.strength.levelId,
      levelName: classification.strength.levelName,
      confidence: classification.strength.confidence,
      autoClassified: true,
    };

    belief.hierarchicalClassification.lastClassified = new Date();

    await belief.save();

    res.json({
      message: 'Belief classified successfully',
      classification: belief.hierarchicalClassification,
      analysis: {
        sentiment: classification.sentiment.analysis,
        specificity: classification.specificity.analysis,
        strength: classification.strength.analysis,
      },
    });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ message: 'Server error during classification', error: error.message });
  }
};

/**
 * @route   POST /api/classification/classify-batch
 * @desc    Classify multiple beliefs
 * @access  Public
 */
export const classifyMultipleBeliefs = async (req, res) => {
  try {
    const { beliefIds } = req.body;

    if (!beliefIds || !Array.isArray(beliefIds)) {
      return res.status(400).json({ message: 'beliefIds array is required' });
    }

    const beliefs = await Belief.find({ _id: { $in: beliefIds } })
      .populate('supportingArguments')
      .populate('opposingArguments');

    const results = await classifyBeliefs(beliefs);

    // Update all beliefs
    for (const result of results) {
      const belief = beliefs.find(b => b._id.toString() === result.beliefId.toString());
      if (belief) {
        belief.hierarchicalClassification.sentiment = {
          levelId: result.classification.sentiment.levelId,
          levelName: result.classification.sentiment.levelName,
          confidence: result.classification.sentiment.confidence,
          autoClassified: true,
        };
        belief.hierarchicalClassification.specificity = {
          levelId: result.classification.specificity.levelId,
          levelName: result.classification.specificity.levelName,
          confidence: result.classification.specificity.confidence,
          autoClassified: true,
        };
        belief.hierarchicalClassification.strength = {
          levelId: result.classification.strength.levelId,
          levelName: result.classification.strength.levelName,
          confidence: result.classification.strength.confidence,
          autoClassified: true,
        };
        belief.hierarchicalClassification.lastClassified = new Date();
        await belief.save();
      }
    }

    res.json({
      message: `${results.length} beliefs classified successfully`,
      results: results.map(r => ({
        beliefId: r.beliefId,
        sentiment: r.classification.sentiment.levelName,
        specificity: r.classification.specificity.levelName,
        strength: r.classification.strength.levelName,
      })),
    });
  } catch (error) {
    console.error('Batch classification error:', error);
    res.status(500).json({ message: 'Server error during batch classification', error: error.message });
  }
};

/**
 * @route   GET /api/classification/hierarchies
 * @desc    Get all hierarchy definitions
 * @access  Public
 */
export const getHierarchies = async (req, res) => {
  try {
    const hierarchies = exportHierarchyDefinitions();
    res.json(hierarchies);
  } catch (error) {
    console.error('Error fetching hierarchies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @route   GET /api/classification/spectrum/:spectrum/:levelId
 * @desc    Get beliefs at a specific hierarchy level
 * @access  Public
 */
export const getBeliefsByLevel = async (req, res) => {
  try {
    const { spectrum, levelId } = req.params;

    if (!['sentiment', 'specificity', 'strength'].includes(spectrum)) {
      return res.status(400).json({ message: 'Invalid spectrum. Must be sentiment, specificity, or strength' });
    }

    const beliefs = await getBeliefsByHierarchyLevel(Belief, spectrum, levelId);

    res.json({
      spectrum,
      levelId,
      count: beliefs.length,
      beliefs,
    });
  } catch (error) {
    console.error('Error fetching beliefs by level:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @route   GET /api/classification/distribution/:topicId/:spectrum
 * @desc    Get hierarchy distribution for a topic
 * @access  Public
 */
export const getDistribution = async (req, res) => {
  try {
    const { topicId, spectrum } = req.params;

    if (!['sentiment', 'specificity', 'strength'].includes(spectrum)) {
      return res.status(400).json({ message: 'Invalid spectrum' });
    }

    const distribution = await getHierarchyDistribution(Belief, topicId, spectrum);

    res.json({
      topicId,
      spectrum,
      distribution,
    });
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @route   GET /api/classification/spectrum/:topicId/:spectrum
 * @desc    Get beliefs across a spectrum for comparison
 * @access  Public
 */
export const getBeliefSpectrum = async (req, res) => {
  try {
    const { topicId, spectrum } = req.params;

    if (!['sentiment', 'specificity', 'strength'].includes(spectrum)) {
      return res.status(400).json({ message: 'Invalid spectrum' });
    }

    const grouped = await findBeliefSpectrum(Belief, topicId, spectrum);

    res.json({
      topicId,
      spectrum,
      grouped,
    });
  } catch (error) {
    console.error('Error fetching spectrum:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @route   GET /api/classification/related/:beliefId
 * @desc    Get related beliefs based on hierarchical proximity
 * @access  Public
 */
export const getRelatedBeliefs = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const related = await suggestRelatedBeliefs(Belief, beliefId);

    res.json({
      beliefId,
      count: related.length,
      related,
    });
  } catch (error) {
    console.error('Error fetching related beliefs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @route   GET /api/classification/export/:beliefId
 * @desc    Export belief to JSON
 * @access  Public
 */
export const exportBeliefJSON = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const data = await exportBeliefToJSON(beliefId);

    res.json(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error during export', error: error.message });
  }
};

/**
 * @route   GET /api/classification/export/:beliefId/xml
 * @desc    Export belief to XML
 * @access  Public
 */
export const exportBeliefXMLEndpoint = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const xml = await exportBeliefToXML(beliefId);

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('XML export error:', error);
    res.status(500).json({ message: 'Server error during XML export', error: error.message });
  }
};

/**
 * @route   GET /api/classification/export/:beliefId/ise-template
 * @desc    Export belief with full ISE template
 * @access  Public
 */
export const exportISETemplate = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const template = await generateISETemplate(beliefId);

    res.json(template);
  } catch (error) {
    console.error('ISE template export error:', error);
    res.status(500).json({ message: 'Server error during ISE template generation', error: error.message });
  }
};

/**
 * @route   POST /api/classification/export/topic/:topicId
 * @desc    Export entire topic with all beliefs
 * @access  Public
 */
export const exportTopicData = async (req, res) => {
  try {
    const { topicId } = req.params;
    const data = await exportTopicToJSON(topicId);

    res.json(data);
  } catch (error) {
    console.error('Topic export error:', error);
    res.status(500).json({ message: 'Server error during topic export', error: error.message });
  }
};

/**
 * @route   POST /api/classification/extract-subarguments/:argumentId
 * @desc    Extract sub-arguments from an argument
 * @access  Private
 */
export const extractSubArguments = async (req, res) => {
  try {
    const { argumentId } = req.params;

    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(404).json({ message: 'Argument not found' });
    }

    const extracted = await createSubArgumentObjects(
      argument._id,
      argument.beliefId,
      argument.author,
      argument.content
    );

    res.json({
      message: 'Sub-arguments extracted successfully',
      count: extracted.subArguments.length,
      subArguments: extracted.subArguments,
      citations: extracted.citations,
      structure: extracted.structure,
    });
  } catch (error) {
    console.error('Sub-argument extraction error:', error);
    res.status(500).json({ message: 'Server error during extraction', error: error.message });
  }
};

/**
 * @route   POST /api/classification/analyze-structure/:argumentId
 * @desc    Analyze the structure of an argument
 * @access  Public
 */
export const analyzeStructure = async (req, res) => {
  try {
    const { argumentId } = req.params;

    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(404).json({ message: 'Argument not found' });
    }

    const structure = analyzeArgumentStructure(argument.content);

    res.json({
      argumentId,
      structure,
    });
  } catch (error) {
    console.error('Structure analysis error:', error);
    res.status(500).json({ message: 'Server error during analysis', error: error.message });
  }
};

/**
 * @route   POST /api/classification/identify-issues/:beliefId
 * @desc    Identify and prioritize issues related to a belief
 * @access  Public
 */
export const identifyIssues = async (req, res) => {
  try {
    const { beliefId } = req.params;

    const belief = await Belief.findById(beliefId)
      .populate('supportingArguments')
      .populate('opposingArguments');

    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    const allArguments = [
      ...(belief.supportingArguments || []),
      ...(belief.opposingArguments || []),
    ];

    const issues = await identifyIssuesFromBelief(belief, allArguments);
    const rankedIssues = rankIssues(issues);

    // Generate solutions for top issues
    const topIssuesWithSolutions = rankedIssues.slice(0, 5).map(issue => ({
      ...issue,
      solutions: generateSolutionProposals(issue),
    }));

    res.json({
      beliefId,
      totalIssuesIdentified: rankedIssues.length,
      topIssues: topIssuesWithSolutions,
      allIssues: rankedIssues,
    });
  } catch (error) {
    console.error('Issue identification error:', error);
    res.status(500).json({ message: 'Server error during issue identification', error: error.message });
  }
};

/**
 * @route   GET /api/classification/belief/:beliefId/summary
 * @desc    Get comprehensive classification summary for a belief
 * @access  Public
 */
export const getBeliefClassificationSummary = async (req, res) => {
  try {
    const { beliefId } = req.params;

    const belief = await Belief.findById(beliefId)
      .populate('author', 'username')
      .populate('topicId', 'name slug');

    if (!belief) {
      return res.status(404).json({ message: 'Belief not found' });
    }

    const summary = belief.getClassificationSummary
      ? belief.getClassificationSummary()
      : belief.hierarchicalClassification;

    res.json({
      beliefId,
      statement: belief.statement,
      topic: belief.topicId,
      classification: summary,
    });
  } catch (error) {
    console.error('Error fetching classification summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default {
  classifyBeliefById,
  classifyMultipleBeliefs,
  getHierarchies,
  getBeliefsByLevel,
  getDistribution,
  getBeliefSpectrum,
  getRelatedBeliefs,
  exportBeliefJSON,
  exportBeliefXMLEndpoint,
  exportISETemplate,
  exportTopicData,
  extractSubArguments,
  analyzeStructure,
  identifyIssues,
  getBeliefClassificationSummary,
};
