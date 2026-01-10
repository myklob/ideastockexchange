/**
 * Belief Generator Controller
 * API endpoints for automated belief generation from Wikipedia
 */

import {
  generateBeliefsFromWikipedia,
  generateBeliefsFromBatch,
} from '../services/beliefGenerator.js';
import { searchWikipedia, getRandomArticles } from '../services/wikipediaService.js';
import { classifyTopicType } from '../services/topicTypeClassifier.js';
import Belief from '../models/Belief.js';
import Topic from '../models/Topic.js';
import Argument from '../models/Argument.js';

/**
 * @desc    Generate beliefs from a Wikipedia page (preview only)
 * @route   POST /api/belief-generator/generate
 * @access  Public
 */
export const generateBeliefs = async (req, res) => {
  try {
    const { pageTitle, maxBeliefs = 5, includeArguments = true } = req.body;

    if (!pageTitle) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a Wikipedia page title',
      });
    }

    const result = await generateBeliefsFromWikipedia(pageTitle, {
      maxBeliefs: parseInt(maxBeliefs),
      includeArguments,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating beliefs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Generate and save beliefs from Wikipedia to database
 * @route   POST /api/belief-generator/generate-and-save
 * @access  Private
 */
export const generateAndSaveBeliefs = async (req, res) => {
  try {
    const { pageTitle, maxBeliefs = 5, autoCreateTopic = true } = req.body;

    if (!pageTitle) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a Wikipedia page title',
      });
    }

    // Generate beliefs
    const result = await generateBeliefsFromWikipedia(pageTitle, {
      maxBeliefs: parseInt(maxBeliefs),
      includeArguments: true,
    });

    // Create or find topic
    let topic = null;
    if (autoCreateTopic) {
      topic = await Topic.findOne({ name: result.source.title });

      if (!topic) {
        topic = await Topic.create({
          name: result.source.title,
          description: result.source.extract,
          category: mapTopicTypeToCategory(result.primaryType),
          createdBy: req.user.id,
        });
      }
    }

    // Save beliefs to database
    const savedBeliefs = [];

    for (const beliefData of result.beliefs) {
      // Check if belief already exists
      const existingBelief = await Belief.findOne({
        statement: beliefData.statement,
      });

      if (existingBelief) {
        console.log(`Belief already exists: ${beliefData.statement}`);
        savedBeliefs.push(existingBelief);
        continue;
      }

      // Create new belief
      const belief = await Belief.create({
        statement: beliefData.statement,
        description: beliefData.description,
        category: beliefData.category,
        author: req.user.id,
        topicId: topic?._id,
      });

      // Create arguments if available
      if (beliefData.arguments) {
        const supportingArgIds = [];
        const opposingArgIds = [];

        // Create supporting arguments
        for (const argData of beliefData.arguments.supporting || []) {
          const argument = await Argument.create({
            content: argData.content,
            type: 'supporting',
            beliefId: belief._id,
            author: req.user.id,
          });
          supportingArgIds.push(argument._id);
        }

        // Create opposing arguments
        for (const argData of beliefData.arguments.opposing || []) {
          const argument = await Argument.create({
            content: argData.content,
            type: 'opposing',
            beliefId: belief._id,
            author: req.user.id,
          });
          opposingArgIds.push(argument._id);
        }

        // Update belief with arguments
        belief.supportingArguments = supportingArgIds;
        belief.opposingArguments = opposingArgIds;
        await belief.updateStatistics();
        await belief.calculateConclusionScore();
        await belief.updateDimensions();
        await belief.save();
      }

      savedBeliefs.push(belief);
    }

    // Update topic statistics if topic was created
    if (topic) {
      await topic.updateStatistics();
    }

    res.json({
      success: true,
      data: {
        topic,
        beliefs: savedBeliefs,
        generationMetadata: result.metadata,
      },
      message: `Successfully generated and saved ${savedBeliefs.length} beliefs`,
    });
  } catch (error) {
    console.error('Error generating and saving beliefs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Generate beliefs from multiple Wikipedia pages
 * @route   POST /api/belief-generator/batch-generate
 * @access  Public
 */
export const batchGenerate = async (req, res) => {
  try {
    const { pageTitles, maxBeliefs = 3 } = req.body;

    if (!pageTitles || !Array.isArray(pageTitles)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of Wikipedia page titles',
      });
    }

    if (pageTitles.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 pages per batch request',
      });
    }

    const results = await generateBeliefsFromBatch(pageTitles, {
      maxBeliefs: parseInt(maxBeliefs),
      includeArguments: true,
    });

    res.json({
      success: true,
      data: results,
      summary: {
        totalPages: pageTitles.length,
        successfulPages: results.filter(r => !r.error).length,
        totalBeliefs: results.reduce((sum, r) => sum + (r.beliefs?.length || 0), 0),
      },
    });
  } catch (error) {
    console.error('Error in batch generation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Search Wikipedia for topics
 * @route   GET /api/belief-generator/search
 * @access  Public
 */
export const searchWikipediaTopics = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query',
      });
    }

    const results = await searchWikipedia(query, parseInt(limit));

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get random Wikipedia articles for belief generation
 * @route   GET /api/belief-generator/random
 * @access  Public
 */
export const getRandomTopics = async (req, res) => {
  try {
    const { count = 5 } = req.query;

    const titles = await getRandomArticles(parseInt(count));

    res.json({
      success: true,
      data: titles,
    });
  } catch (error) {
    console.error('Error getting random articles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Classify a Wikipedia page topic type
 * @route   POST /api/belief-generator/classify
 * @access  Public
 */
export const classifyTopic = async (req, res) => {
  try {
    const { pageTitle } = req.body;

    if (!pageTitle) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a Wikipedia page title',
      });
    }

    const { fetchWikipediaPage } = await import('../services/wikipediaService.js');
    const pageData = await fetchWikipediaPage(pageTitle);
    const classification = classifyTopicType(pageData);

    res.json({
      success: true,
      data: {
        title: pageData.title,
        topicTypes: classification,
        primaryType: classification[0]?.type || 'other',
      },
    });
  } catch (error) {
    console.error('Error classifying topic:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Map topic type to ISE category
 * @param {string} topicType - Topic type from classifier
 * @returns {string} ISE category
 */
function mapTopicTypeToCategory(topicType) {
  const mapping = {
    people: 'other',
    historical_events: 'other',
    tragedies_disasters: 'other',
    animals_species: 'science',
    technology_products: 'technology',
    artworks: 'other',
    ideologies_theories: 'philosophy',
    geographical_locations: 'other',
    companies_organizations: 'economics',
    scientific_concepts: 'science',
  };

  return mapping[topicType] || 'other';
}

export default {
  generateBeliefs,
  generateAndSaveBeliefs,
  batchGenerate,
  searchWikipediaTopics,
  getRandomTopics,
  classifyTopic,
};
