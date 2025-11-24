/**
 * Sub-Argument Extraction Service
 *
 * Automatically identifies and extracts sub-arguments from argument text
 * including:
 * - Causal claims
 * - Evidence statements
 * - Assumptions and premises
 * - Supporting and opposing sub-arguments
 * - Linkage relationships
 *
 * Uses NLP techniques including:
 * - Sentence segmentation
 * - Discourse marker detection
 * - Claim identification
 * - Relationship extraction
 */

/**
 * Main extraction function - analyzes argument text and extracts sub-arguments
 */
export async function extractSubArguments(argumentText, argumentId, beliefId) {
  const sentences = segmentIntoSentences(argumentText);
  const subArguments = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const classification = classifySentence(sentence);

    if (classification.isClaim) {
      const subArg = {
        content: sentence,
        type: classification.type,
        role: classification.role,
        parentArgumentId: argumentId,
        beliefId: beliefId,
        discourseMarkers: classification.markers,
        confidence: classification.confidence,
        position: i,
        relationships: detectRelationships(sentence, sentences, i),
      };

      subArguments.push(subArg);
    }
  }

  return subArguments;
}

/**
 * Segment text into sentences
 */
function segmentIntoSentences(text) {
  // Basic sentence segmentation
  // Split on periods, exclamation marks, question marks
  // But preserve abbreviations
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments

  return sentences;
}

/**
 * Classify a sentence to determine if it's a claim and what type
 */
function classifySentence(sentence) {
  const lower = sentence.toLowerCase();

  const classification = {
    isClaim: false,
    type: 'unknown',
    role: 'unknown',
    markers: [],
    confidence: 0.5,
  };

  // Discourse markers indicating reasoning
  const reasoningMarkers = {
    premise: [
      'because', 'since', 'as', 'given that', 'due to', 'owing to',
      'on account of', 'for the reason that', 'in light of',
    ],
    evidence: [
      'according to', 'research shows', 'studies indicate', 'data reveals',
      'statistics show', 'evidence suggests', 'research finds',
      'experts say', 'scholars argue', 'analysis shows',
    ],
    consequence: [
      'therefore', 'thus', 'hence', 'consequently', 'as a result',
      'accordingly', 'for this reason', 'it follows that', 'which means',
    ],
    support: [
      'furthermore', 'moreover', 'additionally', 'in addition',
      'also', 'besides', 'what\'s more', 'not only', 'plus',
    ],
    contrast: [
      'however', 'but', 'yet', 'nevertheless', 'nonetheless',
      'although', 'though', 'even though', 'despite', 'in spite of',
      'on the other hand', 'conversely', 'whereas',
    ],
    example: [
      'for example', 'for instance', 'such as', 'like', 'including',
      'specifically', 'in particular', 'namely', 'e.g.', 'i.e.',
    ],
    assumption: [
      'assume', 'assuming', 'suppose', 'presume', 'if we accept',
      'granted that', 'taking for granted', 'premise',
    ],
    causal: [
      'causes', 'leads to', 'results in', 'brings about', 'produces',
      'creates', 'generates', 'contributes to', 'influences', 'affects',
    ],
  };

  // Check for discourse markers
  Object.entries(reasoningMarkers).forEach(([role, markers]) => {
    markers.forEach(marker => {
      if (lower.includes(marker)) {
        classification.markers.push({ marker, role });
        classification.role = role;
        classification.isClaim = true;
        classification.confidence += 0.1;
      }
    });
  });

  // Causal claims
  if (/(causes?|leads? to|results? in|brings? about|produces?|creates?)/i.test(lower)) {
    classification.type = 'causal';
    classification.isClaim = true;
    classification.confidence += 0.15;
  }

  // Evaluative claims (good/bad judgments)
  if (/(good|bad|better|worse|superior|inferior|effective|ineffective|beneficial|harmful)/i.test(lower)) {
    classification.type = 'evaluative';
    classification.isClaim = true;
    classification.confidence += 0.1;
  }

  // Factual claims with quantifiers
  if (/(\d+%|\d+ percent|majority|minority|most|few|many|several)/i.test(lower)) {
    classification.type = 'factual';
    classification.isClaim = true;
    classification.confidence += 0.1;
  }

  // Modal claims (possibility/necessity)
  if (/(must|should|ought to|need to|have to|required|necessary|essential)/i.test(lower)) {
    classification.type = 'normative';
    classification.isClaim = true;
    classification.confidence += 0.1;
  }

  // Questions are generally not claims (unless rhetorical)
  if (sentence.includes('?')) {
    classification.isClaim = false;
    classification.confidence = 0.2;
  }

  // Very short sentences are less likely to be substantial claims
  if (sentence.split(' ').length < 5) {
    classification.confidence *= 0.7;
  }

  // Sentences with citations are likely evidence
  if (/\([^)]*\d{4}[^)]*\)|[\[\d+\]]/.test(sentence)) {
    classification.type = 'evidence';
    classification.role = 'evidence';
    classification.isClaim = true;
    classification.confidence += 0.15;
  }

  classification.confidence = Math.min(1.0, classification.confidence);

  return classification;
}

/**
 * Detect relationships between sentences
 */
function detectRelationships(sentence, allSentences, position) {
  const relationships = [];
  const lower = sentence.toLowerCase();

  // Check if this sentence supports previous sentence
  if (position > 0) {
    const previousSentence = allSentences[position - 1].toLowerCase();

    // Support indicators
    if (/(furthermore|moreover|additionally|also|in addition)/i.test(lower)) {
      relationships.push({
        type: 'supports',
        targetPosition: position - 1,
        strength: 0.8,
      });
    }

    // Evidence for previous claim
    if (/(according to|research shows|studies indicate|data reveals)/i.test(lower)) {
      relationships.push({
        type: 'evidenceFor',
        targetPosition: position - 1,
        strength: 0.9,
      });
    }

    // Contrast with previous
    if (/(however|but|yet|nevertheless|on the other hand)/i.test(lower)) {
      relationships.push({
        type: 'contrasts',
        targetPosition: position - 1,
        strength: 0.8,
      });
    }

    // Consequence of previous
    if (/(therefore|thus|hence|consequently|as a result)/i.test(lower)) {
      relationships.push({
        type: 'consequenceOf',
        targetPosition: position - 1,
        strength: 0.85,
      });
    }
  }

  // Check if next sentence elaborates on this one
  if (position < allSentences.length - 1) {
    const nextSentence = allSentences[position + 1].toLowerCase();

    if (/(for example|for instance|such as|specifically)/i.test(nextSentence)) {
      relationships.push({
        type: 'hasExample',
        targetPosition: position + 1,
        strength: 0.7,
      });
    }
  }

  return relationships;
}

/**
 * Extract assumptions from argument text
 */
export function extractAssumptions(argumentText) {
  const assumptions = [];
  const lower = argumentText.toLowerCase();

  // Explicit assumption markers
  const assumptionPatterns = [
    /assuming (that )?([^.!?]+)/gi,
    /if we assume ([^.!?]+)/gi,
    /presumes (that )?([^.!?]+)/gi,
    /takes for granted (that )?([^.!?]+)/gi,
    /based on the assumption (that )?([^.!?]+)/gi,
  ];

  assumptionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(argumentText)) !== null) {
      assumptions.push({
        text: match[0],
        explicit: true,
        confidence: 0.8,
      });
    }
  });

  // Implicit assumptions (conditional statements)
  const conditionalPattern = /if ([^,]+), (then )?([^.!?]+)/gi;
  let match;
  while ((match = conditionalPattern.exec(argumentText)) !== null) {
    assumptions.push({
      text: `Assumes that: ${match[1]}`,
      explicit: false,
      confidence: 0.6,
      type: 'conditional',
    });
  }

  return assumptions;
}

/**
 * Extract causal claims from text
 */
export function extractCausalClaims(argumentText) {
  const causalClaims = [];

  // Causal patterns
  const causalPatterns = [
    /([^.!?]+)\s+(causes?|leads? to|results? in|brings? about|produces?|creates?)\s+([^.!?]+)/gi,
    /([^.!?]+)\s+is (?:a |the )?(?:cause|reason) (?:of|for)\s+([^.!?]+)/gi,
    /([^.!?]+)\s+because (?:of )?\s+([^.!?]+)/gi,
    /due to ([^,]+),\s*([^.!?]+)/gi,
  ];

  causalPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(argumentText)) !== null) {
      causalClaims.push({
        cause: match[1]?.trim(),
        effect: match[2]?.trim() || match[3]?.trim(),
        fullText: match[0],
        confidence: 0.7,
      });
    }
  });

  return causalClaims;
}

/**
 * Extract evidence citations from text
 */
export function extractCitations(argumentText) {
  const citations = [];

  // Citation patterns
  const citationPatterns = [
    // (Author, Year)
    /\(([A-Z][a-z]+(?:\s+(?:et al\.|& [A-Z][a-z]+))?),?\s+(\d{4})\)/g,
    // [1], [2], etc.
    /\[(\d+)\]/g,
    // According to Author (Year)
    /according to ([A-Z][a-z]+(?:\s+et al\.)?)\s*\((\d{4})\)/gi,
    // Author (Year) states/claims/argues
    /([A-Z][a-z]+(?:\s+et al\.)?)\s*\((\d{4})\)\s+(states?|claims?|argues?|finds?|shows?)/gi,
  ];

  citationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(argumentText)) !== null) {
      citations.push({
        text: match[0],
        author: match[1]?.trim(),
        year: match[2]?.trim(),
        type: pattern === citationPatterns[1] ? 'numeric' : 'author-year',
      });
    }
  });

  return citations;
}

/**
 * Analyze argument structure
 */
export function analyzeArgumentStructure(argumentText) {
  const sentences = segmentIntoSentences(argumentText);
  const structure = {
    premises: [],
    conclusions: [],
    evidence: [],
    assumptions: [],
    examples: [],
    counterarguments: [],
  };

  sentences.forEach((sentence, index) => {
    const classification = classifySentence(sentence);

    if (classification.role === 'premise') {
      structure.premises.push({ sentence, position: index });
    } else if (classification.role === 'consequence') {
      structure.conclusions.push({ sentence, position: index });
    } else if (classification.role === 'evidence') {
      structure.evidence.push({ sentence, position: index });
    } else if (classification.role === 'assumption') {
      structure.assumptions.push({ sentence, position: index });
    } else if (classification.role === 'example') {
      structure.examples.push({ sentence, position: index });
    } else if (classification.role === 'contrast') {
      structure.counterarguments.push({ sentence, position: index });
    }
  });

  return structure;
}

/**
 * Create sub-argument objects ready for database insertion
 */
export async function createSubArgumentObjects(argumentId, beliefId, authorId, argumentText) {
  const subArgs = await extractSubArguments(argumentText, argumentId, beliefId);
  const assumptions = extractAssumptions(argumentText);
  const causalClaims = extractCausalClaims(argumentText);
  const citations = extractCitations(argumentText);

  const objects = [];

  // Convert extracted sub-arguments to database objects
  subArgs.forEach((subArg, index) => {
    if (subArg.confidence > 0.6) {
      // Only create high-confidence sub-arguments
      objects.push({
        content: subArg.content,
        type: subArg.type === 'causal' ? 'supporting' : 'supporting', // Default to supporting, can be refined
        beliefId: beliefId,
        author: authorId,
        parentArgument: argumentId,
        metadata: {
          extractedAutomatically: true,
          extractionConfidence: subArg.confidence,
          discourseMarkers: subArg.discourseMarkers,
          role: subArg.role,
          position: subArg.position,
        },
        scores: {
          logical: 50, // Default, will be calculated later
          linkage: 70, // Sub-arguments typically have high linkage to parent
          importance: 50,
        },
      });
    }
  });

  // Add assumptions as sub-arguments
  assumptions.forEach(assumption => {
    if (assumption.confidence > 0.6) {
      objects.push({
        content: assumption.text,
        type: 'supporting',
        beliefId: beliefId,
        author: authorId,
        parentArgument: argumentId,
        metadata: {
          extractedAutomatically: true,
          extractionConfidence: assumption.confidence,
          role: 'assumption',
          explicit: assumption.explicit,
        },
        scores: {
          logical: 45, // Assumptions are foundational but may be questionable
          linkage: 80,
          importance: 60,
        },
      });
    }
  });

  // Add causal claims as sub-arguments
  causalClaims.forEach(claim => {
    if (claim.confidence > 0.6) {
      objects.push({
        content: claim.fullText,
        type: 'supporting',
        beliefId: beliefId,
        author: authorId,
        parentArgument: argumentId,
        metadata: {
          extractedAutomatically: true,
          extractionConfidence: claim.confidence,
          role: 'causal',
          cause: claim.cause,
          effect: claim.effect,
        },
        scores: {
          logical: 55,
          linkage: 75,
          importance: 70, // Causal claims are important
        },
      });
    }
  });

  return {
    subArguments: objects,
    citations: citations,
    structure: analyzeArgumentStructure(argumentText),
  };
}

/**
 * Batch extract sub-arguments from multiple arguments
 */
export async function batchExtractSubArguments(arguments, beliefId) {
  const results = [];

  for (const arg of arguments) {
    try {
      const extracted = await createSubArgumentObjects(
        arg._id,
        beliefId,
        arg.author,
        arg.content
      );
      results.push({
        argumentId: arg._id,
        extracted,
      });
    } catch (error) {
      console.error(`Error extracting sub-arguments from ${arg._id}:`, error);
    }
  }

  return results;
}

export default {
  extractSubArguments,
  extractAssumptions,
  extractCausalClaims,
  extractCitations,
  analyzeArgumentStructure,
  createSubArgumentObjects,
  batchExtractSubArguments,
};
