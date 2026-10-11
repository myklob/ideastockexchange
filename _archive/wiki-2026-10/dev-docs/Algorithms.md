# Algorithms

This page documents the core algorithms that power the Idea Stock Exchange, including complete code implementations and visual explanations.

---

## Overview

The ISE uses four main algorithmic systems:

| Algorithm | Purpose | Location |
|-----------|---------|----------|
| **ArgumentRank** | Rank arguments using PageRank-style analysis | `backend/server.js` |
| **Fallacy Detection** | Identify 10 types of logical fallacies | `backend/utils/fallacyDetector.js` |
| **Redundancy Detection** | Find duplicate arguments using 4 similarity metrics | `backend/utils/redundancyDetector.js` |
| **Evidence Verification** | Crowdsourced credibility scoring | `backend/models/Evidence.js` |

---

## ArgumentRank

**Concept:** Adapted from Google's PageRank algorithm to evaluate argument credibility based on interconnected support.

### How PageRank Works (Original)

```
PageRank ranks web pages by:
1. More links to a page = higher rank
2. Links from high-ranking pages = worth more
3. Iterative calculation until convergence
```

### How ArgumentRank Works

```
ArgumentRank ranks arguments by:
1. More supporting sub-arguments = higher rank
2. Support from strong arguments = worth more
3. Opposing arguments reduce rank
4. Iterative calculation with damping factor
```

### Visual Flow

```
       ┌─────────┐
       │  Arg A  │ ◄──────────┐
       │  (0.35) │            │
       └────┬────┘            │ supports
            │                 │
            │ opposes    ┌────┴────┐
            ▼            │  Arg D  │
       ┌─────────┐       │  (0.20) │
       │  Arg B  │       └─────────┘
       │  (0.15) │
       └────┬────┘
            │ supports
            ▼
       ┌─────────┐       ┌─────────┐
       │  Arg C  │ ◄─────│  Arg E  │
       │  (0.18) │       │  (0.12) │
       └─────────┘       └─────────┘
                supports
```

### Complete Implementation

```javascript
// backend/server.js

/**
 * ArgumentRank algorithm - adapted from PageRank
 * Evaluates the credibility of arguments based on interlinking support
 *
 * @param {number[][]} M - Adjacency matrix
 *                         Positive values = support
 *                         Negative values = opposition
 * @param {number} numIterations - Number of iterations (default 100)
 * @param {number} d - Damping factor (default 0.85)
 * @returns {number[]} - Array of scores for each argument
 */
function argumentrank(M, numIterations = 100, d = 0.85) {
  const N = M.length;

  // Step 1: Initialize scores evenly
  let v = Array(N).fill(1 / N);
  // Each argument starts with equal importance

  // Step 2: Create transition matrix with damping
  const M_hat = [];
  for (let i = 0; i < N; i++) {
    M_hat[i] = [];
    for (let j = 0; j < N; j++) {
      // d * original + random jump factor
      M_hat[i][j] = d * M[i][j] + (1 - d) / N;
    }
  }

  // Step 3: Iteratively update scores
  for (let iter = 0; iter < numIterations; iter++) {
    const v_new = Array(N).fill(0);

    // Matrix multiplication: v_new = M_hat * v
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        v_new[i] += M_hat[i][j] * v[j];
      }
    }

    // Prevent negative scores
    for (let i = 0; i < N; i++) {
      v_new[i] = Math.max(0, v_new[i]);
    }

    // Normalize to sum to 1
    const sum = v_new.reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      for (let i = 0; i < N; i++) {
        v_new[i] /= sum;
      }
    }

    v = v_new;
  }

  return v;
}
```

### Example Usage

```javascript
// Example argument linkage matrix
// Rows represent which arguments support/oppose which
const M = [
  [0, -0.5, 0, 0, 1],      // Arg 0: opposes 1, supports 4
  [0.5, 0, -0.5, 0, 0],    // Arg 1: supports 0, opposes 2
  [0.5, -0.5, 0, 0, 0],    // Arg 2: supports 0, opposes 1
  [0, 1, 0.5, 0, -1],      // Arg 3: supports 1&2, opposes 4
  [0, 0, 0.5, 1, 0],       // Arg 4: supports 2&3
];

const scores = argumentrank(M, 100, 0.85);
// Result: [0.25, 0.18, 0.22, 0.15, 0.20]
// Argument 0 has highest rank due to support structure
```

### Damping Factor Explained

```
d = 0.85 means:
- 85% of score comes from argument relationships
- 15% comes from "random jump" (prevents dead ends)

Higher d (0.95): More sensitive to link structure
Lower d (0.70): More uniform distribution
```

---

## Fallacy Detection

**Concept:** Automatically identifies logical fallacies in argument text using pattern matching and keyword analysis.

### Detected Fallacies

| Fallacy | Severity | Description |
|---------|----------|-------------|
| Ad Hominem | High | Attacking the person instead of argument |
| Straw Man | High | Misrepresenting opponent's position |
| Circular Reasoning | High | Conclusion assumed in premise |
| False Dichotomy | Medium | Only presenting two options when more exist |
| Appeal to Authority | Medium | Citing authority inappropriately |
| Slippery Slope | Medium | Claiming extreme consequences without evidence |
| Hasty Generalization | Medium | Drawing broad conclusions from few examples |
| Red Herring | Medium | Introducing irrelevant information |
| Appeal to Emotion | Medium | Using emotion instead of logic |
| Tu Quoque | Medium | Deflecting by pointing out hypocrisy |

### Detection Architecture

```
Input Text
    │
    ▼
┌─────────────────┐
│  Normalize Text │
│  (lowercase)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Pattern│ │Keyword │
│ Matching│ │ Scan  │
└────┬───┘ └───┬────┘
     │         │
     └────┬────┘
          │
          ▼
   ┌──────────────┐
   │  Calculate   │
   │  Confidence  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Deduct     │
   │   LC Score   │
   └──────────────┘
```

### Core Implementation

```javascript
// backend/utils/fallacyDetector.js

export const fallacyDefinitions = {
  AD_HOMINEM: {
    name: 'Ad Hominem',
    description: 'Attacking the person rather than addressing their argument',
    severity: 'high',
    patterns: [
      /you('re|\s+are)\s+(stupid|dumb|ignorant|biased|lying)/i,
      /only\s+an?\s+(idiot|fool|moron)/i,
      /what\s+do\s+you\s+know/i,
      /coming\s+from\s+(you|someone\s+like\s+you)/i,
      /typical\s+(liberal|conservative)/i
    ],
    keywords: ['you are', 'idiot', 'stupid', 'liar', 'dishonest']
  },

  STRAW_MAN: {
    name: 'Straw Man',
    description: 'Misrepresenting opponent\'s position',
    severity: 'high',
    patterns: [
      /so\s+you('re|\s+are)\s+saying/i,
      /what\s+you('re|\s+are)\s+(really|actually)\s+saying/i,
      /in\s+other\s+words,?\s+you\s+(believe|think|want)/i
    ],
    keywords: ['so you\'re saying', 'what you\'re really saying']
  },

  // ... 8 more fallacy types
};

export function detectFallacies(text) {
  const detectedFallacies = [];
  const textLower = text.toLowerCase();

  // Check each fallacy type
  for (const [key, fallacy] of Object.entries(fallacyDefinitions)) {
    let patternMatches = 0;
    let keywordMatches = 0;
    const matches = [];

    // Check regex patterns (heavy weight)
    for (const pattern of fallacy.patterns) {
      const match = text.match(pattern);
      if (match) {
        patternMatches++;
        matches.push({
          type: 'pattern',
          text: match[0],
          index: match.index
        });
      }
    }

    // Check keywords (light weight)
    for (const keyword of fallacy.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }

    // Calculate confidence
    // Patterns: 0.3 each, Keywords: 0.1 each
    const confidence = Math.min(
      (patternMatches * 0.3) + (keywordMatches * 0.1),
      1.0
    );

    // Flag if pattern match OR 3+ keyword matches
    if (patternMatches > 0 || keywordMatches >= 3) {
      detectedFallacies.push({
        type: key,
        name: fallacy.name,
        description: fallacy.description,
        severity: fallacy.severity,
        confidence: Math.round(confidence * 100),
        matches: matches.slice(0, 3)
      });
    }
  }

  // Calculate Logical Coherence score
  let logicalCoherenceScore = 1.0;

  for (const fallacy of detectedFallacies) {
    const severityMultiplier = {
      high: 0.15,
      medium: 0.10,
      low: 0.05
    };

    const deduction = severityMultiplier[fallacy.severity] *
                      (fallacy.confidence / 100);
    logicalCoherenceScore -= deduction;
  }

  logicalCoherenceScore = Math.max(0, logicalCoherenceScore);

  return {
    hasFallacies: detectedFallacies.length > 0,
    fallacies: detectedFallacies.sort((a, b) => b.confidence - a.confidence),
    logicalCoherenceScore: Math.round(logicalCoherenceScore * 100) / 100,
    warnings: generateWarnings(detectedFallacies),
    summary: {
      total: detectedFallacies.length,
      high: detectedFallacies.filter(f => f.severity === 'high').length,
      medium: detectedFallacies.filter(f => f.severity === 'medium').length
    }
  };
}
```

### Example Detection

```javascript
const text = "You're just saying that because you're biased. " +
             "Only an idiot would believe climate change is real.";

const result = detectFallacies(text);

// Output:
{
  hasFallacies: true,
  fallacies: [
    {
      type: 'AD_HOMINEM',
      name: 'Ad Hominem',
      severity: 'high',
      confidence: 60,
      matches: [
        { type: 'pattern', text: "you're biased", index: 32 },
        { type: 'pattern', text: "Only an idiot", index: 58 }
      ]
    }
  ],
  logicalCoherenceScore: 0.91,  // 1.0 - (0.15 × 0.60) = 0.91
  warnings: ['High confidence Ad Hominem detected - consider revising'],
  summary: { total: 1, high: 1, medium: 0 }
}
```

---

## Redundancy Detection

**Concept:** Identifies similar arguments to reduce clutter and improve debate quality using multiple text similarity algorithms.

### Similarity Algorithms

```
┌─────────────────────────────────────────────────────┐
│                SIMILARITY SCORE                      │
│                                                     │
│  Overall = (Lev × 0.2) + (Jac × 0.3) +            │
│            (TFIDF × 0.3) + (NGram × 0.2)           │
└─────────────────────────────────────────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
   Levenshtein  Jaccard    TF-IDF      N-gram
    Distance   Similarity  Cosine     Analysis
      20%        30%        30%         20%
```

### 1. Levenshtein Distance

Measures minimum edits (insertions, deletions, substitutions) to transform one string into another.

```javascript
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
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

// Normalized similarity (0-1)
const similarity = 1 - (distance / maxLength);
```

**Example:**
```
"climate change is real" → "climate change is fact"
Distance: 4 (real→fact)
Similarity: 1 - (4/22) = 0.82
```

### 2. Jaccard Similarity

Measures overlap of word sets.

```javascript
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
```

**Example:**
```
Text 1: "climate change causes extreme weather"
Text 2: "extreme weather from climate change"

Set 1: {climate, change, causes, extreme, weather}
Set 2: {extreme, weather, from, climate, change}

Intersection: {climate, change, extreme, weather} = 4
Union: {climate, change, causes, extreme, weather, from} = 6

Jaccard: 4/6 = 0.67
```

### 3. TF-IDF Cosine Similarity

Measures document similarity based on term importance.

```javascript
// Term Frequency
function termFrequency(term, terms) {
  const count = terms.filter(t => t === term).length;
  return count / terms.length;
}

// Inverse Document Frequency
function inverseDocumentFrequency(term, documents) {
  const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
  return Math.log(documents.length / docsWithTerm);
}

// TF-IDF Vector
function createTFIDFVector(terms, allDocuments, vocabulary) {
  return vocabulary.map(word => {
    const tf = termFrequency(word, terms);
    const idf = inverseDocumentFrequency(word, allDocuments);
    return tf * idf;
  });
}

// Cosine Similarity
function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}
```

### 4. N-gram Analysis

Compares sequences of consecutive words.

```javascript
function getNGrams(text, n = 2) {
  const words = normalizeText(text).split(' ');
  const ngrams = [];

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

// Example:
// "climate change is real"
// Bigrams: ["climate change", "change is", "is real"]
```

### Complete Uniqueness Calculation

```javascript
export function calculateUniqueness(argument, allArguments) {
  if (allArguments.length <= 1) return 1.0; // Completely unique

  let maxSimilarity = 0;

  for (const other of allArguments) {
    if (argument.id === other.id) continue; // Skip self

    const similarity = calculateSimilarity(
      argument.content,
      other.content,
      allArguments.map(a => a.content.split(' '))
    );

    maxSimilarity = Math.max(maxSimilarity, similarity.overall);
  }

  // Uniqueness is inverse of max similarity
  return 1 - maxSimilarity;
}

export function findRedundantArguments(arguments, threshold = 0.85) {
  const similarities = [];

  // Pairwise comparison
  for (let i = 0; i < arguments.length; i++) {
    for (let j = i + 1; j < arguments.length; j++) {
      const similarity = calculateSimilarity(
        arguments[i].content,
        arguments[j].content
      );

      if (similarity.overall >= threshold) {
        similarities.push({
          argument1: arguments[i],
          argument2: arguments[j],
          similarity: similarity.overall
        });
      }
    }
  }

  // Cluster similar arguments using Union-Find
  return clusterSimilarArguments(similarities, arguments);
}
```

### Merge Suggestions

```javascript
export function suggestMerges(redundantGroups) {
  return redundantGroups.map(group => ({
    action: 'merge',
    representative: group.representative, // Highest scored
    toMerge: group.similar,
    reason: `${group.count} similar arguments with ${group.avgSimilarity}% similarity`,
    benefits: [
      'Reduces clutter and redundancy',
      'Consolidates votes and evidence',
      'Improves debate clarity'
    ]
  }));
}
```

---

## Evidence Verification

**Concept:** Crowdsourced credibility scoring where multiple users validate evidence.

### Scoring Formula

```javascript
// backend/models/Evidence.js

EvidenceSchema.methods.calculateCredibilityScore = function() {
  if (this.verifiedBy.length === 0) {
    this.credibilityScore = 50; // Neutral default
    return this.credibilityScore;
  }

  const verifiedCount = this.verifiedBy.filter(v =>
    v.status === 'verified'
  ).length;

  const disputedCount = this.verifiedBy.filter(v =>
    v.status === 'disputed'
  ).length;

  // Simple additive formula
  const score = 50 + (verifiedCount * 10) - (disputedCount * 10);

  // Clamp to 0-100
  this.credibilityScore = Math.max(0, Math.min(100, score));

  // Auto-update status thresholds
  if (verifiedCount >= 3) {
    this.verificationStatus = 'verified';
  } else if (disputedCount >= 3) {
    this.verificationStatus = 'disputed';
  }

  return this.credibilityScore;
};
```

### Visual Example

```
Evidence: "MIT study on climate change (2023)"

Initial Score: 50

User Actions:
├─ User A verifies ✓  → 50 + 10 = 60
├─ User B verifies ✓  → 60 + 10 = 70
├─ User C disputes ✗  → 70 - 10 = 60
├─ User D verifies ✓  → 60 + 10 = 70
└─ User E verifies ✓  → 70 + 10 = 80

Final Score: 80/100
Status: "verified" (4 verifications > 3 threshold)

Visual:
Unverified ─────────────────── Verified
    0           50          80    100
                           ▲
                        Current
```

---

## API Endpoints

All algorithms are accessible via REST API:

```javascript
// Fallacy Detection
POST /api/analysis/fallacies
Body: { text: "argument text" }
Returns: { fallacies, logicalCoherenceScore, warnings }

// Redundancy Detection
POST /api/analysis/redundancy
Body: { beliefId, threshold: 0.85 }
Returns: { redundantGroups, mergeSuggestions }

// Uniqueness Score
POST /api/analysis/uniqueness
Body: { argumentId }
Returns: { uniqueness, totalArguments }

// Full Analysis
POST /api/analysis/belief/:id/full-analysis
Returns: { fallacyAnalysis, redundancyAnalysis, recommendations }

// ArgumentRank
POST /api/argumentrank
Body: { matrix, iterations: 100, dampingFactor: 0.85 }
Returns: { scores }
```

---

## Performance Considerations

| Algorithm | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| ArgumentRank | O(N² × iterations) | O(N²) |
| Fallacy Detection | O(P × text_length) | O(P) |
| Levenshtein | O(m × n) | O(m × n) |
| Jaccard | O(m + n) | O(m + n) |
| TF-IDF | O(D × V) | O(D × V) |

Where:
- N = number of arguments
- P = number of patterns
- m, n = string lengths
- D = number of documents
- V = vocabulary size

---

## Next Steps

- See [API Reference](API-Reference) for complete endpoint documentation
- Learn about [Scoring System](Scoring-System) that uses these algorithms
- Explore [Frontend Components](Frontend-Components) for visualization

---

**Note:** These algorithms are continuously being improved. Check the source code for the latest implementations.
