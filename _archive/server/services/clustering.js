/**
 * ISE Semantic Clustering Service
 *
 * Reduces duplicate interest submissions by grouping semantically similar
 * raw brainstorm text into canonical Interest nodes.
 *
 * Strategy: token-overlap Jaccard similarity + keyword pre-processing.
 * In production this would be replaced by an embedding-based similarity
 * model (e.g. sentence-transformers), but this implementation runs without
 * external API dependencies.
 */

// ---------------------------------------------------------------------------
// STOP WORDS  (ignored when computing token overlap)
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'must','shall','not','no','we','they','it','this','that','these','those',
  'our','their','its','us','them','he','she','i','you','your','my','his',
  'her','if','as','so','up','out','about','into','than','then','when',
  'where','who','which','what','how','why','need','want','get','make',
  'just','also','both','all','any','some','more','most','other','than',
  'too','very','can','now','only','over','same','after','before',
]);

// ---------------------------------------------------------------------------
// TEXT NORMALIZATION
// ---------------------------------------------------------------------------

/**
 * Normalize a string to a set of meaningful tokens.
 * @param {string} text
 * @returns {Set<string>}
 */
function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t))
  );
}

// ---------------------------------------------------------------------------
// SIMILARITY METRICS
// ---------------------------------------------------------------------------

/**
 * Jaccard similarity between two token sets.
 * @param {Set} setA
 * @param {Set} setB
 * @returns {number} 0-1
 */
function jaccardSimilarity(setA, setB) {
  if (!setA.size && !setB.size) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Compute similarity score (0-100) between two interest texts.
 * Combines:
 *   - Jaccard token similarity (60% weight)
 *   - Exact phrase overlap bonus (up to 40 points)
 *
 * @param {string} textA
 * @param {string} textB
 * @returns {number} 0-100
 */
function similarityScore(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);

  // Phrase overlap bonus: bigrams
  const bigramsA = bigrams(textA.toLowerCase());
  const bigramsB = bigrams(textB.toLowerCase());
  const bigramOverlap = bigramsA.filter(b => bigramsB.includes(b)).length;
  const bigramBonus = Math.min(40, bigramOverlap * 8);

  const raw = jaccard * 60 + bigramBonus;
  return Math.min(100, Math.round(raw));
}

/**
 * Generate bigrams from a string.
 * @param {string} text
 * @returns {string[]}
 */
function bigrams(text) {
  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  return words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`);
}

// ---------------------------------------------------------------------------
// CLUSTERING
// ---------------------------------------------------------------------------

/**
 * Given a list of raw brainstorm submissions and a list of canonical interests,
 * find the best-matching canonical interest for each submission.
 *
 * @param {Array<{submissionId, rawText}>} submissions
 * @param {Array<{interestId, name, description, semanticClusters}>} canonicalInterests
 * @param {number} threshold - minimum similarity score to auto-cluster (default 45)
 * @returns {Array<{submissionId, rawText, clusteredTo, similarityScore, status}>}
 */
function clusterSubmissions(submissions, canonicalInterests, threshold = 45) {
  return submissions.map(sub => {
    let bestMatch = null;
    let bestScore = 0;

    for (const interest of canonicalInterests) {
      // Compare against canonical name
      const nameScore = similarityScore(sub.rawText, interest.name);
      // Compare against description
      const descScore = similarityScore(sub.rawText, interest.description) * 0.8;
      // Compare against each semantic cluster phrase
      const clusterScores = (interest.semanticClusters || []).map(c =>
        similarityScore(sub.rawText, c)
      );
      const clusterMax = clusterScores.length ? Math.max(...clusterScores) : 0;

      const score = Math.max(nameScore, descScore, clusterMax);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = interest.interestId;
      }
    }

    const clustered = bestScore >= threshold;
    return {
      submissionId:    sub.submissionId,
      rawText:         sub.rawText,
      clusteredTo:     clustered ? bestMatch : null,
      similarityScore: bestScore,
      status:          clustered ? 'clustered' : 'pending',
    };
  });
}

/**
 * Find near-duplicate submissions within a batch of raw text entries.
 * Used to de-duplicate the brainstorm queue before manual review.
 *
 * @param {Array<{submissionId, rawText}>} submissions
 * @param {number} dupThreshold - similarity above which two submissions are "duplicate"
 * @returns {Array<{primary, duplicates}>}
 */
function findDuplicates(submissions, dupThreshold = 70) {
  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < submissions.length; i++) {
    if (assigned.has(submissions[i].submissionId)) continue;
    const group = { primary: submissions[i].submissionId, duplicates: [] };

    for (let j = i + 1; j < submissions.length; j++) {
      if (assigned.has(submissions[j].submissionId)) continue;
      const score = similarityScore(submissions[i].rawText, submissions[j].rawText);
      if (score >= dupThreshold) {
        group.duplicates.push({ submissionId: submissions[j].submissionId, score });
        assigned.add(submissions[j].submissionId);
      }
    }

    groups.push(group);
    assigned.add(submissions[i].submissionId);
  }

  return groups.filter(g => g.duplicates.length > 0);
}

/**
 * Suggest a canonical name for a cluster of similar raw submissions.
 * Returns the longest non-duplicate token-rich phrase as the representative.
 *
 * @param {string[]} rawTexts
 * @returns {string}
 */
function suggestCanonicalName(rawTexts) {
  if (!rawTexts.length) return '';
  if (rawTexts.length === 1) return rawTexts[0];

  // Pick the submission with the most tokens (likely most descriptive)
  return rawTexts.reduce((best, current) => {
    const currentTokens = tokenize(current);
    const bestTokens = tokenize(best);
    return currentTokens.size > bestTokens.size ? current : best;
  });
}

module.exports = {
  similarityScore,
  clusterSubmissions,
  findDuplicates,
  suggestCanonicalName,
  tokenize,
  jaccardSimilarity,
};
