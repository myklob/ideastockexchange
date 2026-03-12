/**
 * Belief Generator
 * Automated belief generation from Wikipedia pages
 */

import {
  fetchWikipediaPage,
  extractInfobox,
  extractKeyFacts,
} from './wikipediaService.js';
import {
  classifyTopicType,
  getPrimaryTopicType,
} from './topicTypeClassifier.js';
import { BELIEF_TEMPLATES, ARGUMENT_TYPES } from './beliefTemplates.js';

/**
 * Generate beliefs from a Wikipedia page
 * @param {string} pageTitle - Wikipedia page title
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated beliefs and metadata
 */
export async function generateBeliefsFromWikipedia(pageTitle, options = {}) {
  const {
    maxBeliefs = 5,
    includeArguments = true,
    confidenceThreshold = 30,
  } = options;

  // Step 1: Fetch Wikipedia page
  console.log(`Fetching Wikipedia page: ${pageTitle}`);
  const pageData = await fetchWikipediaPage(pageTitle);

  // Step 2: Classify topic type
  console.log('Classifying topic type...');
  const topicTypes = classifyTopicType(pageData);
  const primaryType = topicTypes[0]?.type || 'other';

  console.log(`Primary topic type: ${primaryType} (${topicTypes[0]?.confidence.toFixed(1)}% confidence)`);

  // Step 3: Extract key information
  const infobox = extractInfobox(pageData.wikitext);
  const keyFacts = extractKeyFacts(pageData.extract, pageData.wikitext);

  // Step 4: Generate beliefs using templates
  console.log('Generating beliefs...');
  const beliefs = generateBeliefs(pageData, primaryType, infobox, keyFacts, maxBeliefs);

  // Step 5: Generate arguments for each belief
  if (includeArguments) {
    console.log('Generating arguments...');
    for (const belief of beliefs) {
      belief.arguments = generateArguments(belief, pageData, keyFacts);
    }
  }

  return {
    source: {
      title: pageData.title,
      url: pageData.url,
      extract: pageData.extract.slice(0, 500),
    },
    topicTypes,
    primaryType,
    beliefs,
    metadata: {
      generatedAt: new Date().toISOString(),
      beliefCount: beliefs.length,
      confidence: topicTypes[0]?.confidence || 0,
    },
  };
}

/**
 * Generate belief statements from Wikipedia data
 * @param {Object} pageData - Wikipedia page data
 * @param {string} topicType - Primary topic type
 * @param {Object} infobox - Infobox data
 * @param {Array} keyFacts - Key facts
 * @param {number} maxBeliefs - Maximum beliefs to generate
 * @returns {Array} Generated beliefs
 */
function generateBeliefs(pageData, topicType, infobox, keyFacts, maxBeliefs) {
  const beliefs = [];
  const templates = BELIEF_TEMPLATES[topicType];

  if (!templates) {
    console.warn(`No templates found for topic type: ${topicType}`);
    return beliefs;
  }

  // Extract placeholders from page data
  const placeholders = extractPlaceholders(pageData, infobox, topicType);

  // Generate beliefs from templates
  for (const template of templates.beliefTypes) {
    if (beliefs.length >= maxBeliefs) break;

    const belief = populateTemplate(template, placeholders, pageData);

    if (belief) {
      beliefs.push({
        statement: belief.statement,
        description: generateDescription(belief.statement, pageData.extract, keyFacts),
        category: template.category,
        polarity: template.polarity,
        argumentTypes: template.argumentTypes,
        template: template.pattern,
        confidence: calculateBeliefConfidence(belief.statement, keyFacts),
      });
    }
  }

  return beliefs;
}

/**
 * Extract placeholder values from Wikipedia data
 * @param {Object} pageData - Wikipedia page data
 * @param {Object} infobox - Infobox data
 * @param {string} topicType - Topic type
 * @returns {Object} Placeholder values
 */
function extractPlaceholders(pageData, infobox, topicType) {
  const placeholders = {
    name: pageData.title,
    event: pageData.title,
    disaster: pageData.title,
    species: pageData.title,
    technology: pageData.title,
    artwork: pageData.title,
    ideology: pageData.title,
    location: pageData.title,
    company: pageData.title,
    concept: pageData.title,
  };

  // Extract role for people
  if (topicType === 'people') {
    placeholders.role = infobox.occupation || infobox.office || infobox.known_for || 'their role';
    placeholders.comparison = 'their contemporaries';
  }

  // Extract outcome for events
  if (topicType === 'historical_events') {
    placeholders.outcome = infobox.result || 'significant changes';
    placeholders.party = extractResponsibleParty(pageData.extract);
  }

  // Extract problem for technology
  if (topicType === 'technology_products') {
    placeholders.problem = extractProblemSolved(pageData.extract);
    placeholders.alternative = 'alternatives';
    placeholders.industry = infobox.industry || 'the industry';
  }

  // Extract genre for artworks
  if (topicType === 'artworks') {
    placeholders.genre = infobox.genre || 'its genre';
    placeholders.ideology = extractIdeology(pageData.extract);
  }

  // Extract alternative for ideologies
  if (topicType === 'ideologies_theories') {
    placeholders.alternative = 'alternative approaches';
    placeholders.values = extractValues(pageData.extract);
    placeholders.phenomenon = 'social phenomena';
  }

  // Extract policy for locations
  if (topicType === 'geographical_locations') {
    placeholders.policy = 'progressive policies';
  }

  // Extract disaster details
  if (topicType === 'tragedies_disasters') {
    placeholders.party = extractResponsibleParty(pageData.extract);
  }

  return placeholders;
}

/**
 * Populate a belief template with placeholder values
 * @param {Object} template - Belief template
 * @param {Object} placeholders - Placeholder values
 * @param {Object} pageData - Wikipedia page data
 * @returns {Object|null} Populated belief
 */
function populateTemplate(template, placeholders, pageData) {
  let statement = template.pattern;

  // Replace all placeholders
  const placeholderRegex = /\{(\w+)\}/g;
  const matches = [...statement.matchAll(placeholderRegex)];

  for (const match of matches) {
    const key = match[1];
    const value = placeholders[key];

    if (!value || value.includes('their role') || value.includes('alternatives')) {
      // Skip templates with unresolved placeholders
      return null;
    }

    statement = statement.replace(match[0], value);
  }

  return { statement };
}

/**
 * Generate description for a belief
 * @param {string} statement - Belief statement
 * @param {string} extract - Wikipedia extract
 * @param {Array} keyFacts - Key facts
 * @returns {string} Description
 */
function generateDescription(statement, extract, keyFacts) {
  // Use first 2-3 sentences from extract or relevant key facts
  const sentences = extract.match(/[^.!?]+[.!?]+/g) || [];
  const relevantSentences = sentences.slice(0, 3);

  return relevantSentences.join(' ').trim().slice(0, 500);
}

/**
 * Calculate confidence score for a belief
 * @param {string} statement - Belief statement
 * @param {Array} keyFacts - Key facts from Wikipedia
 * @returns {number} Confidence score (0-100)
 */
function calculateBeliefConfidence(statement, keyFacts) {
  // Simple heuristic: check if key terms appear in facts
  const statementLower = statement.toLowerCase();
  const words = statementLower.split(/\s+/).filter(w => w.length > 4);

  let matchCount = 0;
  for (const fact of keyFacts) {
    const factLower = fact.toLowerCase();
    for (const word of words) {
      if (factLower.includes(word)) {
        matchCount++;
      }
    }
  }

  const confidence = Math.min(100, 40 + (matchCount * 5));
  return confidence;
}

/**
 * Generate arguments for a belief
 * @param {Object} belief - Belief object
 * @param {Object} pageData - Wikipedia page data
 * @param {Array} keyFacts - Key facts
 * @returns {Object} Generated arguments
 */
function generateArguments(belief, pageData, keyFacts) {
  const supportingArgs = [];
  const opposingArgs = [];

  // Generate 2-4 arguments for each type
  const argCount = Math.min(belief.argumentTypes.length, 4);

  for (let i = 0; i < argCount; i++) {
    const argType = belief.argumentTypes[i];
    const argDescription = ARGUMENT_TYPES[argType] || argType;

    // Find relevant facts for this argument type
    const relevantFacts = findRelevantFacts(keyFacts, argType, belief.statement);

    if (relevantFacts.length > 0) {
      // Alternate between supporting and opposing
      const isSupporting = i % 2 === 0 || belief.polarity === 'positive';

      const argument = {
        content: relevantFacts[0],
        type: isSupporting ? 'supporting' : 'opposing',
        argumentType: argType,
        description: argDescription,
        confidence: 60 + (i * 5),
      };

      if (isSupporting) {
        supportingArgs.push(argument);
      } else {
        opposingArgs.push(argument);
      }
    }
  }

  return {
    supporting: supportingArgs,
    opposing: opposingArgs,
  };
}

/**
 * Find facts relevant to an argument type
 * @param {Array} facts - Key facts
 * @param {string} argType - Argument type
 * @param {string} statement - Belief statement
 * @returns {Array} Relevant facts
 */
function findRelevantFacts(facts, argType, statement) {
  // Keywords for different argument types
  const keywords = {
    moral_behavior: ['ethical', 'moral', 'character', 'integrity', 'honesty'],
    impact_on_society: ['impact', 'influence', 'society', 'change', 'affect'],
    effectiveness: ['effective', 'successful', 'achieved', 'accomplished'],
    harm_caused: ['harm', 'damage', 'hurt', 'negative', 'detrimental'],
    outcomes: ['result', 'outcome', 'consequence', 'effect', 'led to'],
    evidence: ['evidence', 'data', 'research', 'study', 'shows'],
    // Add more as needed
  };

  const typeKeywords = keywords[argType] || argType.split('_');
  const relevantFacts = [];

  for (const fact of facts) {
    const factLower = fact.toLowerCase();

    for (const keyword of typeKeywords) {
      if (factLower.includes(keyword.toLowerCase())) {
        relevantFacts.push(fact);
        break;
      }
    }
  }

  return relevantFacts.length > 0 ? relevantFacts : facts.slice(0, 2);
}

/**
 * Extract responsible party from text
 * @param {string} text - Text to analyze
 * @returns {string} Responsible party
 */
function extractResponsibleParty(text) {
  // Simple extraction of proper nouns
  const matches = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g) || [];
  return matches[0] || 'various parties';
}

/**
 * Extract problem solved by technology
 * @param {string} text - Text to analyze
 * @returns {string} Problem description
 */
function extractProblemSolved(text) {
  const problemPatterns = [
    /designed to (\w+)/i,
    /used for (\w+)/i,
    /solves? (\w+)/i,
    /addresses? (\w+)/i,
  ];

  for (const pattern of problemPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return 'various problems';
}

/**
 * Extract ideology from artwork description
 * @param {string} text - Text to analyze
 * @returns {string} Ideology
 */
function extractIdeology(text) {
  const ideologies = ['capitalism', 'socialism', 'feminism', 'democracy', 'liberalism', 'conservatism'];

  for (const ideology of ideologies) {
    if (text.toLowerCase().includes(ideology)) {
      return ideology;
    }
  }

  return 'certain political ideas';
}

/**
 * Extract values from ideology description
 * @param {string} text - Text to analyze
 * @returns {string} Values
 */
function extractValues(text) {
  const values = ['freedom', 'equality', 'justice', 'liberty', 'fairness', 'security'];

  for (const value of values) {
    if (text.toLowerCase().includes(value)) {
      return value;
    }
  }

  return 'core values';
}

/**
 * Generate multiple beliefs from a batch of Wikipedia pages
 * @param {Array<string>} pageTitles - Array of Wikipedia page titles
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} Generated beliefs from all pages
 */
export async function generateBeliefsFromBatch(pageTitles, options = {}) {
  const results = [];

  for (const title of pageTitles) {
    try {
      console.log(`\nProcessing: ${title}`);
      const result = await generateBeliefsFromWikipedia(title, options);
      results.push(result);

      // Add delay to respect Wikipedia API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${title}:`, error.message);
      results.push({
        source: { title },
        error: error.message,
        beliefs: [],
      });
    }
  }

  return results;
}

export default {
  generateBeliefsFromWikipedia,
  generateBeliefsFromBatch,
};
