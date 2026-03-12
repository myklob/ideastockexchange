/**
 * Redundancy Detection Module
 *
 * Detects similar and redundant arguments using text similarity algorithms
 * to reduce clutter and improve debate quality.
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize text for comparison
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Calculate TF (Term Frequency)
 * @param {string} term - The term to count
 * @param {Array<string>} terms - All terms in document
 * @returns {number} Term frequency
 */
function termFrequency(term, terms) {
  const count = terms.filter(t => t === term).length;
  return count / terms.length;
}

/**
 * Calculate IDF (Inverse Document Frequency)
 * @param {string} term - The term
 * @param {Array<Array<string>>} documents - All documents (arrays of terms)
 * @returns {number} Inverse document frequency
 */
function inverseDocumentFrequency(term, documents) {
  const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
  if (docsWithTerm === 0) return 0;
  return Math.log(documents.length / docsWithTerm);
}

/**
 * Create TF-IDF vector for a document
 * @param {Array<string>} terms - Document terms
 * @param {Array<Array<string>>} allDocuments - All documents
 * @param {Array<string>} vocabulary - Unique terms across all documents
 * @returns {Array<number>} TF-IDF vector
 */
function createTFIDFVector(terms, allDocuments, vocabulary) {
  return vocabulary.map(word => {
    const tf = termFrequency(word, terms);
    const idf = inverseDocumentFrequency(word, allDocuments);
    return tf * idf;
  });
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vec1 - First vector
 * @param {Array<number>} vec2 - Second vector
 * @returns {number} Cosine similarity (0-1)
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate Jaccard similarity between two sets
 * @param {Set} set1 - First set
 * @param {Set} set2 - Second set
 * @returns {number} Jaccard similarity (0-1)
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Extract n-grams from text
 * @param {string} text - Input text
 * @param {number} n - N-gram size
 * @returns {Array<string>} Array of n-grams
 */
function getNGrams(text, n = 2) {
  const words = normalizeText(text).split(' ');
  const ngrams = [];

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Calculate comprehensive similarity score between two texts
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @param {Array<Array<string>>} allDocuments - All documents for TF-IDF
 * @returns {Object} Similarity metrics
 */
export function calculateSimilarity(text1, text2, allDocuments = null) {
  // Normalize texts
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  // Early exit for identical texts
  if (norm1 === norm2) {
    return {
      overall: 1.0,
      exact: true,
      levenshtein: 1.0,
      jaccard: 1.0,
      tfidf: 1.0,
      ngram: 1.0
    };
  }

  // Calculate Levenshtein similarity (normalized by max length)
  const maxLen = Math.max(norm1.length, norm2.length);
  const levDistance = levenshteinDistance(norm1, norm2);
  const levenshteinSim = 1 - (levDistance / maxLen);

  // Calculate Jaccard similarity (word-level)
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  const jaccardSim = jaccardSimilarity(words1, words2);

  // Calculate N-gram similarity (bigrams)
  const bigrams1 = getNGrams(text1, 2);
  const bigrams2 = getNGrams(text2, 2);
  const ngramSim = jaccardSimilarity(
    new Set(bigrams1),
    new Set(bigrams2)
  );

  // Calculate TF-IDF similarity if documents provided
  let tfidfSim = 0;
  if (allDocuments && allDocuments.length > 1) {
    const terms1 = norm1.split(' ');
    const terms2 = norm2.split(' ');

    // Build vocabulary
    const vocabulary = [...new Set([...terms1, ...terms2])];

    // Create TF-IDF vectors
    const vec1 = createTFIDFVector(terms1, allDocuments, vocabulary);
    const vec2 = createTFIDFVector(terms2, allDocuments, vocabulary);

    tfidfSim = cosineSimilarity(vec1, vec2);
  } else {
    // Fallback to Jaccard if no corpus
    tfidfSim = jaccardSim;
  }

  // Calculate overall similarity (weighted average)
  const overall = (
    levenshteinSim * 0.2 +
    jaccardSim * 0.3 +
    tfidfSim * 0.3 +
    ngramSim * 0.2
  );

  return {
    overall: Math.round(overall * 100) / 100,
    exact: false,
    levenshtein: Math.round(levenshteinSim * 100) / 100,
    jaccard: Math.round(jaccardSim * 100) / 100,
    tfidf: Math.round(tfidfSim * 100) / 100,
    ngram: Math.round(ngramSim * 100) / 100
  };
}

/**
 * Find redundant arguments in a collection
 * @param {Array} arguments - Array of argument objects
 * @param {number} threshold - Similarity threshold (0-1), default 0.85
 * @returns {Array} Groups of similar arguments
 */
export function findRedundantArguments(arguments, threshold = 0.85) {
  if (!arguments || arguments.length < 2) {
    return [];
  }

  // Prepare documents for TF-IDF
  const allDocuments = arguments.map(arg =>
    normalizeText(arg.content).split(' ')
  );

  // Calculate pairwise similarities
  const similarities = [];
  for (let i = 0; i < arguments.length; i++) {
    for (let j = i + 1; j < arguments.length; j++) {
      const similarity = calculateSimilarity(
        arguments[i].content,
        arguments[j].content,
        allDocuments
      );

      if (similarity.overall >= threshold) {
        similarities.push({
          argument1: {
            id: arguments[i]._id || arguments[i].id,
            content: arguments[i].content,
            score: arguments[i].scores?.overall || 0,
            votes: arguments[i].votes || { up: 0, down: 0 }
          },
          argument2: {
            id: arguments[j]._id || arguments[j].id,
            content: arguments[j].content,
            score: arguments[j].scores?.overall || 0,
            votes: arguments[j].votes || { up: 0, down: 0 }
          },
          similarity: similarity.overall,
          metrics: similarity
        });
      }
    }
  }

  // Group similar arguments using Union-Find
  const groups = clusterSimilarArguments(similarities, arguments);

  return groups.map(group => {
    // Sort by score and votes to find representative
    const sorted = group.sort((a, b) => {
      const scoreA = a.scores?.overall || 0;
      const scoreB = b.scores?.overall || 0;
      const votesA = (a.votes?.up || 0) - (a.votes?.down || 0);
      const votesB = (b.votes?.up || 0) - (b.votes?.down || 0);

      return (scoreB + votesB * 0.1) - (scoreA + votesA * 0.1);
    });

    return {
      representative: sorted[0],
      similar: sorted.slice(1),
      count: group.length,
      avgSimilarity: group.length > 1
        ? similarities
            .filter(s =>
              group.some(g => g._id === s.argument1.id || g._id === s.argument2.id)
            )
            .reduce((sum, s) => sum + s.similarity, 0) / (group.length - 1)
        : 1.0
    };
  }).filter(group => group.count > 1); // Only return groups with multiple arguments
}

/**
 * Cluster similar arguments into groups
 * @param {Array} similarities - Pairwise similarities
 * @param {Array} arguments - All arguments
 * @returns {Array} Clustered groups
 */
function clusterSimilarArguments(similarities, arguments) {
  // Build adjacency map
  const adjacency = new Map();
  const visited = new Set();

  // Initialize adjacency map
  arguments.forEach(arg => {
    const id = arg._id || arg.id;
    adjacency.set(id, new Set());
  });

  // Add edges
  similarities.forEach(sim => {
    adjacency.get(sim.argument1.id).add(sim.argument2.id);
    adjacency.get(sim.argument2.id).add(sim.argument1.id);
  });

  // DFS to find connected components
  const groups = [];

  function dfs(id, group) {
    if (visited.has(id)) return;
    visited.add(id);

    const arg = arguments.find(a => (a._id || a.id) === id);
    if (arg) group.push(arg);

    const neighbors = adjacency.get(id) || new Set();
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        dfs(neighborId, group);
      }
    });
  }

  arguments.forEach(arg => {
    const id = arg._id || arg.id;
    if (!visited.has(id)) {
      const group = [];
      dfs(id, group);
      if (group.length > 0) {
        groups.push(group);
      }
    }
  });

  return groups;
}

/**
 * Calculate uniqueness score for an argument
 * @param {Object} argument - The argument to analyze
 * @param {Array} allArguments - All arguments in the same belief
 * @returns {number} Uniqueness score (0-1)
 */
export function calculateUniqueness(argument, allArguments) {
  if (!allArguments || allArguments.length <= 1) {
    return 1.0; // Completely unique if it's the only argument
  }

  // Prepare documents
  const allDocuments = allArguments.map(arg =>
    normalizeText(arg.content).split(' ')
  );

  // Find highest similarity to any other argument
  let maxSimilarity = 0;

  for (const other of allArguments) {
    if ((argument._id || argument.id) === (other._id || other.id)) {
      continue; // Skip self
    }

    const similarity = calculateSimilarity(
      argument.content,
      other.content,
      allDocuments
    );

    maxSimilarity = Math.max(maxSimilarity, similarity.overall);
  }

  // Uniqueness is inverse of similarity
  const uniqueness = 1 - maxSimilarity;

  return Math.round(uniqueness * 100) / 100;
}

/**
 * Suggest merging similar arguments
 * @param {Array} redundantGroups - Groups from findRedundantArguments
 * @returns {Array} Merge suggestions
 */
export function suggestMerges(redundantGroups) {
  return redundantGroups.map(group => ({
    action: 'merge',
    representative: group.representative,
    toMerge: group.similar,
    reason: `${group.count} similar arguments detected with ${Math.round(group.avgSimilarity * 100)}% similarity`,
    benefits: [
      'Reduces clutter and redundancy',
      'Consolidates votes and evidence',
      'Improves debate clarity'
    ],
    keepingBest: {
      score: group.representative.scores?.overall || 0,
      votes: group.representative.votes,
      content: group.representative.content.substring(0, 100) + '...'
    }
  }));
}

export default {
  calculateSimilarity,
  findRedundantArguments,
  calculateUniqueness,
  suggestMerges
};
