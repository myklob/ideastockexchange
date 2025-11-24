/**
 * Belief Export Service
 *
 * Generates comprehensive XML and JSON exports of belief data including:
 * - Belief statement and metadata
 * - Hierarchical classifications
 * - Arguments (supporting and opposing)
 * - Evidence with citations
 * - Linkage scores and relationships
 * - Sub-arguments and argument trees
 * - All ISE framework components
 */

import { create } from 'xmlbuilder2';
import Belief from '../models/Belief.js';
import Argument from '../models/Argument.js';
import Evidence from '../models/Evidence.js';
import Topic from '../models/Topic.js';
import {
  SENTIMENT_HIERARCHY,
  SPECIFICITY_HIERARCHY,
  STRENGTH_HIERARCHY,
  getLevelById,
} from '../config/hierarchyDefinitions.js';

/**
 * Export a single belief to JSON with complete structure
 */
export async function exportBeliefToJSON(beliefId) {
  const belief = await Belief.findById(beliefId)
    .populate('author', 'username email')
    .populate('topicId')
    .populate({
      path: 'supportingArguments',
      populate: [
        { path: 'author', select: 'username' },
        { path: 'evidence' },
        { path: 'supportedBy' },
        { path: 'challengedBy' },
      ],
    })
    .populate({
      path: 'opposingArguments',
      populate: [
        { path: 'author', select: 'username' },
        { path: 'evidence' },
        { path: 'supportedBy' },
        { path: 'challengedBy' },
      ],
    });

  if (!belief) {
    throw new Error('Belief not found');
  }

  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      framework: 'Idea Stock Exchange (ISE)',
      beliefId: belief._id,
    },
    belief: {
      id: belief._id,
      statement: belief.statement,
      description: belief.description,
      category: belief.category,
      tags: belief.tags,
      status: belief.status,
      author: {
        id: belief.author?._id,
        username: belief.author?.username,
      },
      created: belief.createdAt,
      updated: belief.updatedAt,
    },
    topic: belief.topicId ? {
      id: belief.topicId._id,
      name: belief.topicId.name,
      slug: belief.topicId.slug,
      description: belief.topicId.description,
    } : null,
    hierarchicalClassification: {
      sentiment: formatClassification(belief, 'sentiment', SENTIMENT_HIERARCHY),
      specificity: formatClassification(belief, 'specificity', SPECIFICITY_HIERARCHY),
      strength: formatClassification(belief, 'strength', STRENGTH_HIERARCHY),
      lastClassified: belief.hierarchicalClassification?.lastClassified,
    },
    numericScores: {
      conclusionScore: belief.conclusionScore,
      specificity: belief.dimensions?.specificity,
      sentimentPolarity: belief.dimensions?.sentimentPolarity,
    },
    scoreBreakdown: belief.getScoreLevel ? belief.getScoreLevel() : null,
    statistics: {
      views: belief.statistics?.views || 0,
      supportingCount: belief.statistics?.supportingCount || 0,
      opposingCount: belief.statistics?.opposingCount || 0,
      totalArguments: belief.statistics?.totalArguments || 0,
      trending: belief.trending,
    },
    arguments: {
      supporting: await formatArguments(belief.supportingArguments),
      opposing: await formatArguments(belief.opposingArguments),
    },
    relatedBeliefs: belief.relatedBeliefs?.map(rb => ({
      id: rb.beliefId,
      relationship: rb.relationship,
      linkageStrength: rb.linkageStrength,
    })) || [],
    similarBeliefs: belief.similarBeliefs?.map(sb => ({
      id: sb.beliefId,
      similarityScore: sb.similarityScore,
      merged: sb.mergedInto,
    })) || [],
    position3D: belief.get3DPosition ? belief.get3DPosition() : null,
  };

  return exportData;
}

/**
 * Export a single belief to XML
 */
export async function exportBeliefToXML(beliefId) {
  const jsonData = await exportBeliefToJSON(beliefId);

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('beliefExport')
    .ele('metadata')
    .ele('exportDate').txt(jsonData.metadata.exportDate).up()
    .ele('exportVersion').txt(jsonData.metadata.exportVersion).up()
    .ele('framework').txt(jsonData.metadata.framework).up()
    .ele('beliefId').txt(jsonData.metadata.beliefId.toString()).up()
    .up();

  // Belief section
  const beliefEle = root.ele('belief')
    .att('id', jsonData.belief.id.toString());
  beliefEle.ele('statement').txt(jsonData.belief.statement);
  if (jsonData.belief.description) {
    beliefEle.ele('description').txt(jsonData.belief.description);
  }
  beliefEle.ele('category').txt(jsonData.belief.category);
  beliefEle.ele('status').txt(jsonData.belief.status);

  const tagsEle = beliefEle.ele('tags');
  jsonData.belief.tags?.forEach(tag => {
    tagsEle.ele('tag').txt(tag);
  });

  beliefEle.ele('author')
    .ele('id').txt(jsonData.belief.author.id?.toString() || '').up()
    .ele('username').txt(jsonData.belief.author.username || '');

  beliefEle.ele('created').txt(jsonData.belief.created).up()
    .ele('updated').txt(jsonData.belief.updated);

  // Topic section
  if (jsonData.topic) {
    root.ele('topic')
      .att('id', jsonData.topic.id.toString())
      .ele('name').txt(jsonData.topic.name).up()
      .ele('slug').txt(jsonData.topic.slug).up()
      .ele('description').txt(jsonData.topic.description || '');
  }

  // Hierarchical Classification
  const hierarchyEle = root.ele('hierarchicalClassification');

  ['sentiment', 'specificity', 'strength'].forEach(spectrum => {
    const classification = jsonData.hierarchicalClassification[spectrum];
    if (classification) {
      const spectrumEle = hierarchyEle.ele(spectrum);
      spectrumEle.ele('levelId').txt(classification.levelId);
      spectrumEle.ele('levelName').txt(classification.levelName);
      spectrumEle.ele('score').txt(classification.score?.toString() || '');
      spectrumEle.ele('confidence').txt(classification.confidence?.toString() || '');
      spectrumEle.ele('description').txt(classification.description || '');

      if (classification.keywords?.length > 0) {
        const keywordsEle = spectrumEle.ele('keywords');
        classification.keywords.forEach(kw => {
          keywordsEle.ele('keyword').txt(kw);
        });
      }
    }
  });

  // Scores
  const scoresEle = root.ele('scores');
  scoresEle.ele('conclusionScore').txt(jsonData.numericScores.conclusionScore.toString());
  scoresEle.ele('specificity').txt(jsonData.numericScores.specificity?.toString() || '');
  scoresEle.ele('sentimentPolarity').txt(jsonData.numericScores.sentimentPolarity?.toString() || '');

  // Statistics
  const statsEle = root.ele('statistics');
  statsEle.ele('views').txt(jsonData.statistics.views.toString());
  statsEle.ele('supportingCount').txt(jsonData.statistics.supportingCount.toString());
  statsEle.ele('opposingCount').txt(jsonData.statistics.opposingCount.toString());
  statsEle.ele('totalArguments').txt(jsonData.statistics.totalArguments.toString());
  statsEle.ele('trending').txt(jsonData.statistics.trending.toString());

  // Arguments
  const argsEle = root.ele('arguments');

  const supportingEle = argsEle.ele('supporting');
  jsonData.arguments.supporting.forEach(arg => {
    addArgumentToXML(supportingEle, arg);
  });

  const opposingEle = argsEle.ele('opposing');
  jsonData.arguments.opposing.forEach(arg => {
    addArgumentToXML(opposingEle, arg);
  });

  // Related Beliefs
  if (jsonData.relatedBeliefs.length > 0) {
    const relatedEle = root.ele('relatedBeliefs');
    jsonData.relatedBeliefs.forEach(rb => {
      relatedEle.ele('relatedBelief')
        .att('id', rb.id.toString())
        .att('relationship', rb.relationship)
        .att('linkageStrength', rb.linkageStrength.toString());
    });
  }

  return root.end({ prettyPrint: true });
}

/**
 * Helper function to format classification data
 */
function formatClassification(belief, spectrum, hierarchy) {
  const classification = belief.hierarchicalClassification?.[spectrum];
  if (!classification || !classification.levelId) return null;

  const level = getLevelById(hierarchy, classification.levelId);
  if (!level) return null;

  return {
    levelId: classification.levelId,
    levelName: classification.levelName || level.name,
    score: spectrum === 'sentiment'
      ? belief.dimensions?.sentimentPolarity
      : spectrum === 'specificity'
        ? belief.dimensions?.specificity
        : belief.conclusionScore,
    confidence: classification.confidence,
    autoClassified: classification.autoClassified,
    description: level.description,
    keywords: level.keywords,
    examples: level.examples,
    scoreRange: level.scoreRange,
  };
}

/**
 * Helper function to format arguments
 */
async function formatArguments(arguments) {
  if (!arguments || arguments.length === 0) return [];

  return arguments.map(arg => ({
    id: arg._id,
    content: arg.content,
    type: arg.type,
    author: {
      id: arg.author?._id,
      username: arg.author?.username,
    },
    scores: {
      overall: arg.scores?.overall,
      logical: arg.scores?.logical,
      linkage: arg.scores?.linkage,
      importance: arg.scores?.importance,
      evidenceStrength: arg.scores?.evidenceStrength,
      reasonRankScore: arg.reasonRankScore,
    },
    healthMetrics: arg.healthMetrics ? {
      strength: arg.healthMetrics.strength,
      integrity: arg.healthMetrics.integrity,
      freshness: arg.healthMetrics.freshness,
      relevance: arg.healthMetrics.relevance,
      impact: arg.healthMetrics.impact,
    } : null,
    lifecycleStatus: arg.lifecycleStatus,
    evidence: arg.evidence?.map(ev => formatEvidence(ev)) || [],
    supportedBy: arg.supportedBy?.map(sa => ({
      id: sa._id,
      content: sa.content?.substring(0, 100),
    })) || [],
    challengedBy: arg.challengedBy?.map(ca => ({
      id: ca._id,
      content: ca.content?.substring(0, 100),
    })) || [],
    votes: {
      upvotes: arg.votes?.upvotes || 0,
      downvotes: arg.votes?.downvotes || 0,
    },
    created: arg.createdAt,
    updated: arg.updatedAt,
  }));
}

/**
 * Helper function to format evidence
 */
function formatEvidence(evidence) {
  return {
    id: evidence._id,
    title: evidence.title,
    description: evidence.description,
    type: evidence.type,
    source: {
      url: evidence.source?.url,
      author: evidence.source?.author,
      publication: evidence.source?.publication,
      date: evidence.source?.date,
      isbn: evidence.source?.isbn,
      doi: evidence.source?.doi,
    },
    verificationStatus: evidence.verificationStatus,
    credibilityScore: evidence.credibilityScore,
    verifications: evidence.verifications?.length || 0,
  };
}

/**
 * Helper function to add argument to XML
 */
function addArgumentToXML(parentEle, arg) {
  const argEle = parentEle.ele('argument')
    .att('id', arg.id.toString());

  argEle.ele('content').txt(arg.content);
  argEle.ele('type').txt(arg.type);

  argEle.ele('author')
    .ele('id').txt(arg.author.id?.toString() || '').up()
    .ele('username').txt(arg.author.username || '');

  // Scores
  const scoresEle = argEle.ele('scores');
  Object.entries(arg.scores).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      scoresEle.ele(key).txt(value.toString());
    }
  });

  // Health metrics
  if (arg.healthMetrics) {
    const healthEle = argEle.ele('healthMetrics');
    Object.entries(arg.healthMetrics).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        healthEle.ele(key).txt(value.toString());
      }
    });
  }

  argEle.ele('lifecycleStatus').txt(arg.lifecycleStatus);

  // Evidence
  if (arg.evidence && arg.evidence.length > 0) {
    const evidenceEle = argEle.ele('evidence');
    arg.evidence.forEach(ev => {
      const evEle = evidenceEle.ele('item')
        .att('id', ev.id.toString());
      evEle.ele('title').txt(ev.title);
      evEle.ele('type').txt(ev.type);
      evEle.ele('verificationStatus').txt(ev.verificationStatus);
      evEle.ele('credibilityScore').txt(ev.credibilityScore.toString());

      if (ev.source?.url) {
        evEle.ele('source')
          .ele('url').txt(ev.source.url).up()
          .ele('author').txt(ev.source.author || '').up()
          .ele('publication').txt(ev.source.publication || '');
      }
    });
  }

  argEle.ele('created').txt(arg.created);
  argEle.ele('updated').txt(arg.updated);
}

/**
 * Export multiple beliefs to JSON
 */
export async function exportBeliefsToJSON(beliefIds) {
  const exports = [];
  for (const id of beliefIds) {
    try {
      const data = await exportBeliefToJSON(id);
      exports.push(data);
    } catch (error) {
      console.error(`Error exporting belief ${id}:`, error);
    }
  }
  return exports;
}

/**
 * Export topic with all beliefs to JSON
 */
export async function exportTopicToJSON(topicId) {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    throw new Error('Topic not found');
  }

  const beliefs = await Belief.find({
    topicId: topicId,
    status: 'active',
  }).select('_id');

  const beliefIds = beliefs.map(b => b._id);
  const beliefExports = await exportBeliefsToJSON(beliefIds);

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      framework: 'Idea Stock Exchange (ISE)',
      exportType: 'topic',
    },
    topic: {
      id: topic._id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      category: topic.category,
      statistics: topic.statistics,
    },
    beliefCount: beliefExports.length,
    beliefs: beliefExports,
  };
}

/**
 * Export hierarchy definition to JSON
 */
export function exportHierarchyDefinitions() {
  return {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      description: 'Belief Classification Hierarchy Definitions for ISE',
    },
    hierarchies: {
      sentiment: SENTIMENT_HIERARCHY,
      specificity: SPECIFICITY_HIERARCHY,
      strength: STRENGTH_HIERARCHY,
    },
  };
}

/**
 * Generate ISE Belief Analysis Template data
 */
export async function generateISETemplate(beliefId) {
  const jsonData = await exportBeliefToJSON(beliefId);

  return {
    ...jsonData,
    iseTemplate: {
      // Core Components
      statement: jsonData.belief.statement,
      description: jsonData.belief.description,
      classifications: jsonData.hierarchicalClassification,

      // Arguments
      reasonsToAgree: jsonData.arguments.supporting,
      reasonsToDisagree: jsonData.arguments.opposing,

      // Linkage and Relationships
      linkageScores: {
        relatedBeliefs: jsonData.relatedBeliefs,
        similarBeliefs: jsonData.similarBeliefs,
      },

      // Evidence Tiers
      evidenceTiers: categorizeEvidenceByTier(jsonData.arguments),

      // Objective Criteria (placeholder for manual input)
      objectiveCriteria: [],

      // Cost-Benefit Analysis (placeholder)
      costBenefitAnalysis: {
        benefits: [],
        costs: [],
        tradeoffs: [],
      },

      // Value Conflicts (placeholder)
      valueConflicts: [],

      // Shared/Conflicting Interests (placeholder)
      interests: {
        shared: [],
        conflicting: [],
      },

      // Cognitive Biases (to be detected)
      cognitiveBiases: [],

      // Media Resources
      mediaResources: extractMediaResources(jsonData.arguments),

      // Metadata
      conclusionScore: jsonData.numericScores.conclusionScore,
      scoreBreakdown: jsonData.scoreBreakdown,
      statistics: jsonData.statistics,
    },
  };
}

/**
 * Helper to categorize evidence by tier
 */
function categorizeEvidenceByTier(arguments) {
  const tiers = {
    tier1_peerReviewed: [],
    tier2_expertOpinion: [],
    tier3_media: [],
    tier4_anecdotal: [],
  };

  const allEvidence = [
    ...arguments.supporting.flatMap(arg => arg.evidence || []),
    ...arguments.opposing.flatMap(arg => arg.evidence || []),
  ];

  allEvidence.forEach(ev => {
    if (ev.type === 'study' && ev.verificationStatus === 'verified') {
      tiers.tier1_peerReviewed.push(ev);
    } else if (ev.type === 'expert-opinion') {
      tiers.tier2_expertOpinion.push(ev);
    } else if (ev.type === 'article') {
      tiers.tier3_media.push(ev);
    } else {
      tiers.tier4_anecdotal.push(ev);
    }
  });

  return tiers;
}

/**
 * Helper to extract media resources
 */
function extractMediaResources(arguments) {
  const resources = [];

  const allEvidence = [
    ...arguments.supporting.flatMap(arg => arg.evidence || []),
    ...arguments.opposing.flatMap(arg => arg.evidence || []),
  ];

  allEvidence.forEach(ev => {
    if (['video', 'image', 'article'].includes(ev.type) && ev.source?.url) {
      resources.push({
        type: ev.type,
        title: ev.title,
        url: ev.source.url,
        author: ev.source.author,
        publication: ev.source.publication,
      });
    }
  });

  return resources;
}

export default {
  exportBeliefToJSON,
  exportBeliefToXML,
  exportBeliefsToJSON,
  exportTopicToJSON,
  exportHierarchyDefinitions,
  generateISETemplate,
};
