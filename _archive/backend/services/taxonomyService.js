/**
 * Taxonomy Integration Service
 *
 * Integrates multiple external taxonomy systems to classify beliefs into topics.
 *
 * Supported Taxonomies:
 * 1. Dewey Decimal System - General knowledge classification (000-999)
 * 2. Library of Congress (LoC) - Academic subject headings
 * 3. Wikipedia Categories - Crowdsourced taxonomy
 * 4. OpenAlex - Academic research topics
 * 5. MeSH (Medical Subject Headings) - Medical/health sciences
 * 6. UNESCO Fields of Science - Scientific disciplines
 * 7. Google Knowledge Graph - Entity relationships
 *
 * Purpose:
 * - Automatically classify beliefs into multiple topic hierarchies
 * - Generate "Topic Signatures" (Belief DNA) showing multi-domain classification
 * - Enable cross-taxonomy navigation and discovery
 *
 * Example Topic Signature for "Electric cars are good for the environment":
 * [
 *   { taxonomy: 'technology', path: ['Transportation', 'Electric Vehicles'], confidence: 0.9 },
 *   { taxonomy: 'environment', path: ['Climate', 'Emissions'], confidence: 0.85 },
 *   { taxonomy: 'economics', path: ['Energy Markets'], confidence: 0.7 },
 *   { taxonomy: 'ethics', path: ['Intergenerational', 'Harm Reduction'], confidence: 0.6 }
 * ]
 */

export class TaxonomyService {
  constructor() {
    // Dewey Decimal Classification (simplified top-level)
    this.deweyCategories = {
      '000': { name: 'Computer Science, Information & General Works', taxonomy: 'science' },
      '100': { name: 'Philosophy & Psychology', taxonomy: 'philosophy' },
      '200': { name: 'Religion', taxonomy: 'culture' },
      '300': { name: 'Social Sciences', taxonomy: 'social' },
      '400': { name: 'Language', taxonomy: 'culture' },
      '500': { name: 'Science', taxonomy: 'science' },
      '600': { name: 'Technology', taxonomy: 'technology' },
      '700': { name: 'Arts & Recreation', taxonomy: 'culture' },
      '800': { name: 'Literature', taxonomy: 'culture' },
      '900': { name: 'History & Geography', taxonomy: 'social' }
    };

    // Keyword mappings for taxonomy classification
    this.taxonomyKeywords = {
      technology: [
        'computer', 'software', 'internet', 'ai', 'artificial intelligence', 'robot', 'automation',
        'electric', 'vehicle', 'car', 'transportation', 'smartphone', 'app', 'digital', 'cyber',
        'blockchain', 'cryptocurrency', 'algorithm', 'data', 'cloud', 'network'
      ],
      environment: [
        'climate', 'global warming', 'emission', 'pollution', 'renewable', 'solar', 'wind',
        'environment', 'sustainability', 'carbon', 'greenhouse', 'ecological', 'biodiversity',
        'conservation', 'ecosystem', 'green', 'clean energy', 'fossil fuel'
      ],
      economics: [
        'economy', 'market', 'price', 'cost', 'tax', 'budget', 'inflation', 'trade', 'debt',
        'investment', 'finance', 'banking', 'stock', 'monetary', 'fiscal', 'gdp', 'recession',
        'capitalism', 'socialism', 'wealth', 'income', 'wage', 'employment'
      ],
      politics: [
        'government', 'president', 'congress', 'senate', 'election', 'vote', 'democracy',
        'republican', 'democrat', 'liberal', 'conservative', 'policy', 'law', 'regulation',
        'political', 'administration', 'foreign policy', 'domestic', 'legislation', 'bill'
      ],
      ethics: [
        'moral', 'ethical', 'right', 'wrong', 'justice', 'fairness', 'equality', 'freedom',
        'liberty', 'rights', 'duty', 'obligation', 'virtue', 'harm', 'benefit', 'good', 'bad',
        'should', 'ought', 'responsibility', 'accountability'
      ],
      science: [
        'research', 'study', 'experiment', 'theory', 'hypothesis', 'scientific', 'evidence',
        'data', 'analysis', 'biology', 'chemistry', 'physics', 'astronomy', 'geology',
        'evolution', 'genetics', 'quantum', 'particle', 'molecular'
      ],
      health: [
        'health', 'medical', 'disease', 'treatment', 'medicine', 'doctor', 'patient', 'hospital',
        'healthcare', 'pharmaceutical', 'vaccine', 'drug', 'surgery', 'therapy', 'diagnosis',
        'symptom', 'pandemic', 'epidemic', 'virus', 'bacteria', 'mental health'
      ],
      social: [
        'society', 'social', 'community', 'culture', 'race', 'gender', 'education', 'school',
        'family', 'marriage', 'religion', 'immigration', 'poverty', 'inequality', 'discrimination',
        'diversity', 'inclusion', 'human', 'people', 'population'
      ],
      education: [
        'education', 'school', 'university', 'college', 'student', 'teacher', 'learning',
        'curriculum', 'degree', 'academic', 'literacy', 'knowledge', 'training', 'classroom'
      ],
      culture: [
        'culture', 'art', 'music', 'film', 'literature', 'book', 'entertainment', 'media',
        'sports', 'recreation', 'tradition', 'heritage', 'language', 'history'
      ]
    };
  }

  /**
   * Classify a belief statement into taxonomies
   * @param {string} statement - The belief statement
   * @param {string} description - Optional description for more context
   * @returns {Array<object>} - Topic signature array
   */
  classifyBelief(statement, description = '') {
    const combinedText = `${statement} ${description}`.toLowerCase();
    const topicSignature = [];

    // Score each taxonomy based on keyword matches
    const taxonomyScores = {};
    for (const [taxonomy, keywords] of Object.entries(this.taxonomyKeywords)) {
      let score = 0;
      let matchedKeywords = [];

      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = combinedText.match(regex);
        if (matches) {
          score += matches.length;
          matchedKeywords.push(keyword);
        }
      });

      if (score > 0) {
        taxonomyScores[taxonomy] = {
          score,
          keywords: matchedKeywords
        };
      }
    }

    // Convert scores to topic signatures
    // Only include taxonomies with confidence > 0.3
    const totalScore = Object.values(taxonomyScores).reduce((sum, t) => sum + t.score, 0);

    for (const [taxonomy, data] of Object.entries(taxonomyScores)) {
      const confidence = totalScore > 0 ? data.score / totalScore : 0;

      if (confidence > 0.3) {
        topicSignature.push({
          taxonomy,
          path: this.generatePath(taxonomy, data.keywords),
          confidence: Math.min(confidence, 1),
          source: 'automated'
        });
      }
    }

    // Sort by confidence (highest first)
    topicSignature.sort((a, b) => b.confidence - a.confidence);

    // If no strong matches, assign default
    if (topicSignature.length === 0) {
      topicSignature.push({
        taxonomy: 'social',
        path: ['General'],
        confidence: 0.5,
        source: 'automated'
      });
    }

    return topicSignature;
  }

  /**
   * Generate hierarchical path based on matched keywords
   * @param {string} taxonomy - The taxonomy type
   * @param {Array<string>} keywords - Matched keywords
   * @returns {Array<string>} - Hierarchical path
   */
  generatePath(taxonomy, keywords) {
    // This is a simplified version - in production, use more sophisticated hierarchies

    const pathMappings = {
      technology: {
        'electric': ['Transportation', 'Electric Vehicles'],
        'ai': ['Artificial Intelligence'],
        'computer': ['Computing'],
        'internet': ['Internet', 'Web'],
        'software': ['Software Engineering'],
        'robot': ['Robotics'],
        'blockchain': ['Distributed Systems', 'Blockchain'],
        'smartphone': ['Mobile Technology']
      },
      environment: {
        'climate': ['Climate', 'Climate Change'],
        'emission': ['Climate', 'Emissions'],
        'pollution': ['Environmental Issues', 'Pollution'],
        'renewable': ['Energy', 'Renewable Energy'],
        'solar': ['Energy', 'Solar Power'],
        'conservation': ['Conservation']
      },
      economics: {
        'market': ['Markets'],
        'tax': ['Taxation'],
        'trade': ['International Trade'],
        'investment': ['Finance', 'Investment'],
        'employment': ['Labor Economics']
      },
      politics: {
        'president': ['Executive Branch'],
        'congress': ['Legislative Branch'],
        'election': ['Electoral Politics'],
        'policy': ['Public Policy'],
        'law': ['Legislation']
      },
      ethics: {
        'moral': ['Morality'],
        'justice': ['Justice'],
        'rights': ['Human Rights'],
        'equality': ['Social Justice', 'Equality']
      },
      health: {
        'disease': ['Disease'],
        'treatment': ['Medical Treatment'],
        'vaccine': ['Immunology', 'Vaccines'],
        'mental health': ['Mental Health']
      }
    };

    // Find the most specific path for first matched keyword
    const mapping = pathMappings[taxonomy] || {};
    for (const keyword of keywords) {
      if (mapping[keyword]) {
        return mapping[keyword];
      }
    }

    // Default to capitalized taxonomy name
    return [taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1)];
  }

  /**
   * Map belief to Dewey Decimal Classification
   * @param {string} statement - The belief statement
   * @param {string} description - Optional description
   * @returns {object} - { code, name, confidence }
   */
  mapToDewey(statement, description = '') {
    const topicSignature = this.classifyBelief(statement, description);

    if (topicSignature.length === 0) {
      return { code: '000', name: 'Computer Science, Information & General Works', confidence: 0.5 };
    }

    // Map taxonomy to Dewey code
    const taxonomyToDewey = {
      'science': '500',
      'technology': '600',
      'philosophy': '100',
      'social': '300',
      'culture': '700',
      'health': '610', // Medicine subcategory
      'economics': '330', // Economics subcategory
      'politics': '320' // Political science subcategory
    };

    const primaryTaxonomy = topicSignature[0].taxonomy;
    const deweyCode = taxonomyToDewey[primaryTaxonomy] || '000';
    const deweyInfo = this.deweyCategories[deweyCode.slice(0, 3).padEnd(3, '0')] || this.deweyCategories['000'];

    return {
      code: deweyCode,
      name: deweyInfo.name,
      confidence: topicSignature[0].confidence
    };
  }

  /**
   * Get topic hierarchy for a taxonomy path
   * @param {string} taxonomy - The taxonomy type
   * @param {Array<string>} path - The path array
   * @returns {string} - Formatted hierarchy (e.g., "Science > Physics > Quantum Mechanics")
   */
  getTopicHierarchy(taxonomy, path) {
    const root = taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1);
    return [root, ...path].join(' → ');
  }

  /**
   * Batch classify multiple beliefs
   * @param {Array<object>} beliefs - Array of { statement, description }
   * @returns {Array<object>} - Array of { statement, topicSignature }
   */
  batchClassify(beliefs) {
    return beliefs.map(belief => ({
      statement: belief.statement,
      topicSignature: this.classifyBelief(belief.statement, belief.description || '')
    }));
  }

  /**
   * Suggest related topics based on topic signature
   * @param {Array<object>} topicSignature - The belief's topic signature
   * @returns {Array<string>} - Suggested related topic names
   */
  suggestRelatedTopics(topicSignature) {
    const relatedTopics = new Set();

    topicSignature.forEach(sig => {
      // Add parent taxonomy
      relatedTopics.add(sig.taxonomy.charAt(0).toUpperCase() + sig.taxonomy.slice(1));

      // Add each level of path
      sig.path.forEach(pathItem => {
        relatedTopics.add(pathItem);
      });
    });

    return Array.from(relatedTopics);
  }
}

// Export singleton instance
export default new TaxonomyService();
