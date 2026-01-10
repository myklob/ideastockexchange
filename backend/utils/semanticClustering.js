/**
 * Semantic Clustering Utility
 *
 * Detects similar belief statements for the "One Page Per Belief" framework.
 * Groups semantically similar statements together to prevent duplication.
 *
 * Uses a combination of:
 * - Jaccard similarity (word overlap)
 * - Cosine similarity (TF-IDF vectors)
 * - Edit distance (Levenshtein)
 */

/**
 * Calculate Jaccard similarity between two strings
 * Measures word overlap between two statements
 */
function jaccardSimilarity(str1, str2) {
  const words1 = new Set(tokenize(str1));
  const words2 = new Set(tokenize(str2));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Tokenize and normalize a string
 * Removes punctuation, converts to lowercase, removes stop words
 */
function tokenize(str) {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with'
  ]);

  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate Levenshtein edit distance between two strings
 * Lower distance = more similar
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[len1][len2];
}

/**
 * Calculate normalized edit distance (0-1 scale)
 */
function normalizedEditDistance(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLen);
}

/**
 * Calculate TF-IDF cosine similarity
 * More sophisticated than simple word overlap
 */
function cosineSimilarity(str1, str2, corpus = null) {
  const tokens1 = tokenize(str1);
  const tokens2 = tokenize(str2);

  // Build vocabulary
  const vocab = new Set([...tokens1, ...tokens2]);

  // Calculate term frequencies
  const tf1 = {};
  const tf2 = {};

  tokens1.forEach(token => {
    tf1[token] = (tf1[token] || 0) + 1;
  });

  tokens2.forEach(token => {
    tf2[token] = (tf2[token] || 0) + 1;
  });

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  vocab.forEach(term => {
    const val1 = tf1[term] || 0;
    const val2 = tf2[term] || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Detect if two statements are opposite/negations of each other
 */
function areOpposites(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Check for negation patterns
  const negationPatterns = [
    [/\bis\s/, /\bis\s+not\s/],
    [/\bis\s+not\s/, /\bis\s/],
    [/\bshould\s/, /\bshould\s+not\s/],
    [/\bshould\s+not\s/, /\bshould\s/],
    [/\bcan\s/, /\bcannot\s/],
    [/\bcannot\s/, /\bcan\s/],
    [/\bwill\s/, /\bwill\s+not\s/],
    [/\bwill\s+not\s/, /\bwill\s/],
  ];

  // Remove negations and check if strings are similar
  const removeNegations = (str) => str
    .replace(/\bnot\s+/g, '')
    .replace(/\bn't\b/g, '')
    .replace(/\bun/g, '')
    .replace(/\bin/g, '');

  const s1Clean = removeNegations(s1);
  const s2Clean = removeNegations(s2);

  const similarity = cosineSimilarity(s1Clean, s2Clean);

  // If very similar after removing negations, they might be opposites
  return similarity > 0.8;
}

/**
 * Calculate overall semantic similarity between two belief statements
 * Combines multiple similarity metrics
 *
 * @param {string} statement1 - First belief statement
 * @param {string} statement2 - Second belief statement
 * @returns {number} Similarity score (0-1), where 1 is identical
 */
export function calculateSimilarity(statement1, statement2) {
  // Quick exact match check
  if (statement1.toLowerCase() === statement2.toLowerCase()) {
    return 1.0;
  }

  // Calculate multiple similarity metrics
  const jaccard = jaccardSimilarity(statement1, statement2);
  const cosine = cosineSimilarity(statement1, statement2);
  const editDist = normalizedEditDistance(statement1, statement2);

  // Weighted combination
  // Jaccard: 30% - good for word overlap
  // Cosine: 50% - best for semantic similarity
  // Edit distance: 20% - catches typos and minor variations
  const overallSimilarity = (jaccard * 0.3) + (cosine * 0.5) + (editDist * 0.2);

  return overallSimilarity;
}

/**
 * Find similar beliefs in a collection
 *
 * @param {string} statement - The belief statement to compare
 * @param {Array} beliefs - Array of belief objects with 'statement' field
 * @param {number} threshold - Minimum similarity score (0-1) to be considered similar
 * @returns {Array} Array of {belief, similarityScore, isOpposite} objects
 */
export function findSimilarBeliefs(statement, beliefs, threshold = 0.7) {
  const similar = [];

  beliefs.forEach(belief => {
    const similarity = calculateSimilarity(statement, belief.statement);
    const isOpposite = areOpposites(statement, belief.statement);

    if (similarity >= threshold) {
      similar.push({
        belief,
        similarityScore: similarity,
        isOpposite,
        relationship: isOpposite ? 'opposes' : 'similar',
      });
    }
  });

  // Sort by similarity (highest first)
  similar.sort((a, b) => b.similarityScore - a.similarityScore);

  return similar;
}

/**
 * Detect if a statement is a duplicate of any existing beliefs
 * Higher threshold than findSimilarBeliefs
 *
 * @param {string} statement - The belief statement to check
 * @param {Array} beliefs - Array of existing beliefs
 * @param {number} threshold - Minimum similarity to be considered duplicate (default 0.85)
 * @returns {Object|null} The duplicate belief if found, null otherwise
 */
export function detectDuplicate(statement, beliefs, threshold = 0.85) {
  const similar = findSimilarBeliefs(statement, beliefs, threshold);

  if (similar.length > 0 && !similar[0].isOpposite) {
    return {
      isDuplicate: true,
      existingBelief: similar[0].belief,
      similarityScore: similar[0].similarityScore,
    };
  }

  return {
    isDuplicate: false,
    existingBelief: null,
    similarityScore: 0,
  };
}

/**
 * Cluster beliefs into groups based on semantic similarity
 * Uses hierarchical clustering
 *
 * @param {Array} beliefs - Array of belief objects
 * @param {number} threshold - Similarity threshold for clustering (default 0.75)
 * @returns {Array} Array of clusters, each containing similar beliefs
 */
export function clusterBeliefs(beliefs, threshold = 0.75) {
  if (beliefs.length === 0) return [];

  // Initialize each belief as its own cluster
  const clusters = beliefs.map(belief => ({
    mainBelief: belief,
    similarBeliefs: [],
    averageSimilarity: 1.0,
  }));

  // Compare each pair and merge similar ones
  const merged = new Set();

  for (let i = 0; i < beliefs.length; i++) {
    if (merged.has(i)) continue;

    for (let j = i + 1; j < beliefs.length; j++) {
      if (merged.has(j)) continue;

      const similarity = calculateSimilarity(
        beliefs[i].statement,
        beliefs[j].statement
      );

      if (similarity >= threshold) {
        // Add to cluster
        clusters[i].similarBeliefs.push({
          belief: beliefs[j],
          similarityScore: similarity,
        });
        merged.add(j);
      }
    }
  }

  // Filter out merged clusters and return
  return clusters
    .filter((_, index) => !merged.has(index))
    .map(cluster => ({
      ...cluster,
      totalBeliefs: 1 + cluster.similarBeliefs.length,
    }));
}

/**
 * Suggest the best main statement from a group of similar beliefs
 * Chooses based on clarity, length, and specificity
 *
 * @param {Array} beliefs - Array of similar belief objects
 * @returns {Object} The belief that should be the main one
 */
export function suggestMainStatement(beliefs) {
  if (beliefs.length === 0) return null;
  if (beliefs.length === 1) return beliefs[0];

  // Score each belief
  const scored = beliefs.map(belief => {
    let score = 0;

    // Prefer moderate length (not too short, not too long)
    const idealLength = 60;
    const lengthDiff = Math.abs(belief.statement.length - idealLength);
    score += Math.max(0, 50 - lengthDiff);

    // Prefer statements with more arguments/evidence
    score += (belief.statistics?.totalArguments || 0) * 5;

    // Prefer higher view count (more established)
    score += (belief.statistics?.views || 0) * 0.1;

    // Prefer active status
    if (belief.status === 'active') score += 10;

    // Prefer statements without questions
    if (!belief.statement.includes('?')) score += 5;

    return {
      belief,
      score,
    };
  });

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  return scored[0].belief;
}

export default {
  calculateSimilarity,
  findSimilarBeliefs,
  detectDuplicate,
  clusterBeliefs,
  suggestMainStatement,
};
