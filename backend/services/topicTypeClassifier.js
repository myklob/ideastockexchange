/**
 * Topic Type Classifier
 * Classifies Wikipedia pages into semantic topic types for belief generation
 */

/**
 * Topic type definitions with category patterns and content keywords
 */
const TOPIC_TYPES = {
  PEOPLE: {
    name: 'people',
    categoryPatterns: [
      /people/i,
      /births/i,
      /deaths/i,
      /politicians/i,
      /scientists/i,
      /artists/i,
      /activists/i,
      /businesspeople/i,
      /athletes/i,
      /musicians/i,
      /actors/i,
      /writers/i,
      /philosophers/i,
      /presidents/i,
      /prime ministers/i,
      /leaders/i,
    ],
    contentKeywords: ['born', 'died', 'career', 'biography', 'life', 'became', 'served as'],
    infoboxTypes: ['person', 'officeholder', 'scientist', 'artist', 'athlete'],
  },

  HISTORICAL_EVENTS: {
    name: 'historical_events',
    categoryPatterns: [
      /wars/i,
      /battles/i,
      /revolutions/i,
      /conflicts/i,
      /\d{4} in/i, // Year-based categories
      /historical events/i,
      /discoveries/i,
      /reforms/i,
      /movements/i,
    ],
    contentKeywords: ['occurred', 'began', 'ended', 'resulted in', 'led to', 'caused', 'took place'],
    infoboxTypes: ['military conflict', 'event'],
  },

  TRAGEDIES_DISASTERS: {
    name: 'tragedies_disasters',
    categoryPatterns: [
      /disasters/i,
      /pandemics/i,
      /earthquakes/i,
      /genocides/i,
      /accidents/i,
      /catastrophes/i,
      /tragedies/i,
      /crises/i,
      /famines/i,
    ],
    contentKeywords: ['disaster', 'killed', 'deaths', 'casualties', 'tragedy', 'devastating', 'destroyed'],
    infoboxTypes: ['disaster'],
  },

  ANIMALS_SPECIES: {
    name: 'animals_species',
    categoryPatterns: [
      /animals/i,
      /mammals/i,
      /birds/i,
      /fish/i,
      /reptiles/i,
      /species/i,
      /fauna/i,
      /wildlife/i,
      /plants/i,
      /flora/i,
      /trees/i,
    ],
    contentKeywords: ['species', 'habitat', 'diet', 'predator', 'conservation', 'endangered', 'population'],
    infoboxTypes: ['species', 'animal', 'plant'],
  },

  TECHNOLOGY_PRODUCTS: {
    name: 'technology_products',
    categoryPatterns: [
      /technology/i,
      /inventions/i,
      /products/i,
      /devices/i,
      /software/i,
      /hardware/i,
      /computing/i,
      /electronics/i,
      /telecommunications/i,
      /vehicles/i,
    ],
    contentKeywords: ['developed', 'invented', 'technology', 'features', 'specifications', 'performance', 'innovation'],
    infoboxTypes: ['software', 'hardware', 'vehicle', 'product'],
  },

  ARTWORKS: {
    name: 'artworks',
    categoryPatterns: [
      /novels/i,
      /films/i,
      /books/i,
      /music/i,
      /albums/i,
      /songs/i,
      /paintings/i,
      /sculptures/i,
      /plays/i,
      /operas/i,
      /art/i,
      /works/i,
    ],
    contentKeywords: ['written', 'composed', 'painted', 'directed', 'published', 'released', 'premiered', 'created'],
    infoboxTypes: ['book', 'film', 'album', 'song', 'artwork'],
  },

  IDEOLOGIES_THEORIES: {
    name: 'ideologies_theories',
    categoryPatterns: [
      /ideologies/i,
      /political theories/i,
      /economic theories/i,
      /philosophies/i,
      /belief systems/i,
      /worldviews/i,
      /doctrines/i,
      /movements/i,
      /schools of thought/i,
    ],
    contentKeywords: ['theory', 'ideology', 'believes', 'advocates', 'principles', 'concept', 'philosophy'],
    infoboxTypes: ['ideology', 'philosophy'],
  },

  GEOGRAPHICAL_LOCATIONS: {
    name: 'geographical_locations',
    categoryPatterns: [
      /countries/i,
      /cities/i,
      /regions/i,
      /geography/i,
      /states/i,
      /provinces/i,
      /municipalities/i,
      /rivers/i,
      /mountains/i,
      /populated places/i,
    ],
    contentKeywords: ['located', 'population', 'area', 'capital', 'region', 'situated', 'geography'],
    infoboxTypes: ['country', 'settlement', 'region', 'river', 'mountain'],
  },

  COMPANIES_ORGANIZATIONS: {
    name: 'companies_organizations',
    categoryPatterns: [
      /companies/i,
      /corporations/i,
      /organizations/i,
      /businesses/i,
      /enterprises/i,
      /firms/i,
      /agencies/i,
      /institutions/i,
      /non-profits/i,
    ],
    contentKeywords: ['founded', 'headquarters', 'operates', 'industry', 'services', 'products', 'organization'],
    infoboxTypes: ['company', 'organization', 'government agency'],
  },

  SCIENTIFIC_CONCEPTS: {
    name: 'scientific_concepts',
    categoryPatterns: [
      /scientific theories/i,
      /physics/i,
      /chemistry/i,
      /biology/i,
      /concepts/i,
      /phenomena/i,
      /principles/i,
      /laws of/i,
    ],
    contentKeywords: ['theory', 'discovered', 'explains', 'phenomenon', 'scientific', 'research', 'evidence'],
    infoboxTypes: ['theory'],
  },
};

/**
 * Classify a Wikipedia page into one or more topic types
 * @param {Object} pageData - Wikipedia page data from fetchWikipediaPage
 * @returns {Array<Object>} Classified topic types with confidence scores
 */
export function classifyTopicType(pageData) {
  const { categories = [], extract = '', wikitext = '', title = '' } = pageData;

  const scores = {};

  // Initialize scores for all types
  for (const [key, type] of Object.entries(TOPIC_TYPES)) {
    scores[type.name] = 0;
  }

  // Score based on categories (highest weight: 40%)
  for (const category of categories) {
    for (const [key, type] of Object.entries(TOPIC_TYPES)) {
      for (const pattern of type.categoryPatterns) {
        if (pattern.test(category)) {
          scores[type.name] += 4;
        }
      }
    }
  }

  // Score based on content keywords (weight: 30%)
  const contentLower = (extract + ' ' + title).toLowerCase();

  for (const [key, type] of Object.entries(TOPIC_TYPES)) {
    for (const keyword of type.contentKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        scores[type.name] += 3;
      }
    }
  }

  // Score based on infobox type (weight: 30%)
  const infoboxMatch = wikitext.match(/\{\{Infobox\s+([^|\n}]+)/i);
  if (infoboxMatch) {
    const infoboxType = infoboxMatch[1].trim().toLowerCase();

    for (const [key, type] of Object.entries(TOPIC_TYPES)) {
      for (const validType of type.infoboxTypes) {
        if (infoboxType.includes(validType.toLowerCase())) {
          scores[type.name] += 3;
        }
      }
    }
  }

  // Convert scores to confidence percentages
  const maxScore = Math.max(...Object.values(scores));

  const results = Object.entries(scores)
    .map(([typeName, score]) => ({
      type: typeName,
      confidence: maxScore > 0 ? (score / maxScore) * 100 : 0,
      score,
    }))
    .filter(result => result.confidence > 20) // Only return types with >20% confidence
    .sort((a, b) => b.confidence - a.confidence);

  return results.length > 0 ? results : [{ type: 'other', confidence: 100, score: 1 }];
}

/**
 * Get the primary (highest confidence) topic type
 * @param {Object} pageData - Wikipedia page data
 * @returns {string} Primary topic type
 */
export function getPrimaryTopicType(pageData) {
  const results = classifyTopicType(pageData);
  return results[0]?.type || 'other';
}

/**
 * Get all topic types above a confidence threshold
 * @param {Object} pageData - Wikipedia page data
 * @param {number} threshold - Minimum confidence (0-100)
 * @returns {Array<string>} Topic type names
 */
export function getTopicTypes(pageData, threshold = 50) {
  const results = classifyTopicType(pageData);
  return results.filter(r => r.confidence >= threshold).map(r => r.type);
}

export default {
  classifyTopicType,
  getPrimaryTopicType,
  getTopicTypes,
  TOPIC_TYPES,
};
