/**
 * Argument Extraction Service
 *
 * Extracts arguments from natural language text by identifying:
 * - Conclusion indicators (therefore, thus, hence, so)
 * - Premise indicators (because, since, given that)
 * - Multi-sentence argument structures
 *
 * Based on docs/ARGUMENT_EXTRACTION_SPEC.md
 */

export class ArgumentExtractionService {
  constructor() {
    // Conclusion indicators - signal a conclusion is being stated
    this.conclusionIndicators = [
      'therefore', 'thus', 'hence', 'so', 'consequently',
      'as a result', 'accordingly', 'for this reason',
      'this means', 'this shows that', 'this proves',
      'we can conclude', 'it follows that', 'my point is',
      'this demonstrates', 'this suggests', 'this indicates'
    ];

    // Premise indicators - signal supporting evidence
    this.premiseIndicators = [
      'because', 'since', 'given that', 'due to', 'as',
      'for', 'as a result of', 'for the reason that',
      'considering that', 'seeing that', 'in light of',
      'owing to', 'on account of', 'in view of'
    ];

    // Strengthener patterns - add credibility
    this.strengthenerPatterns = [
      /studies? (show|confirm|demonstrate|prove|indicate)/i,
      /research (shows|confirms|demonstrates|proves|indicates)/i,
      /evidence (shows|confirms|demonstrates|proves|indicates)/i,
      /data (shows|confirms|demonstrates|proves|indicates)/i,
      /experts? (agree|confirm|state|believe)/i,
      /meta-analysis/i,
      /peer-reviewed/i,
      /multiple studies/i,
      /independent (studies|research)/i,
      /consensus/i,
      /well-established/i,
      /proven/i,
      /confirmed by/i,
      /supported by/i
    ];

    // Weakener patterns - add caveats
    this.weakenerPatterns = [
      /however/i,
      /but/i,
      /although/i,
      /despite/i,
      /nevertheless/i,
      /on the other hand/i,
      /in contrast/i,
      /conversely/i,
      /that said/i,
      /except/i,
      /unless/i,
      /only (if|when)/i,
      /limited to/i,
      /smaller (in|among)/i,
      /may not apply/i,
      /some studies find/i,
      /mixed evidence/i,
      /unclear/i,
      /debated/i
    ];
  }

  /**
   * Extract arguments from natural language text
   * @param {string} text - Input text to analyze
   * @param {object} options - Optional configuration
   * @returns {Array<object>} - Array of extracted arguments
   */
  extractArguments(text, options = {}) {
    const {
      minConfidence = 0.3,
      includeLowConfidence = false
    } = options;

    if (!text || typeof text !== 'string') {
      return [];
    }

    // Split into sentences
    const sentences = this.splitIntoSentences(text);

    // Find argument structures
    const rawArguments = [];

    // Pattern 1: Single-sentence arguments with explicit indicators
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      // Check for "Conclusion BECAUSE Premise" pattern
      const becauseArgs = this.extractBecausePattern(sentence);
      rawArguments.push(...becauseArgs);

      // Check for "Premise THEREFORE Conclusion" pattern
      const thereforeArgs = this.extractThereforePattern(sentence);
      rawArguments.push(...thereforeArgs);
    }

    // Pattern 2: Multi-sentence arguments
    for (let i = 0; i < sentences.length - 1; i++) {
      const multiSentenceArgs = this.extractMultiSentencePattern(sentences, i);
      rawArguments.push(...multiSentenceArgs);
    }

    // Pattern 3: Implicit arguments (no explicit indicators)
    const implicitArgs = this.extractImplicitArguments(sentences);
    rawArguments.push(...implicitArgs);

    // Deduplicate and score confidence
    const uniqueArguments = this.deduplicateArguments(rawArguments);

    // Filter by confidence threshold
    const filteredArguments = includeLowConfidence
      ? uniqueArguments
      : uniqueArguments.filter(arg => arg.confidence >= minConfidence);

    // Add metadata
    return filteredArguments.map(arg => ({
      ...arg,
      extractedFrom: text,
      extractionMethod: 'pattern-based',
      extractedAt: new Date()
    }));
  }

  /**
   * Extract "Conclusion BECAUSE Premise" pattern
   * Example: "Cities should allow housing BECAUSE zoning increases rents"
   */
  extractBecausePattern(sentence) {
    const extractedArgs = [];

    for (const indicator of this.premiseIndicators) {
      const pattern = new RegExp(`(.+?)\\s+${indicator}\\s+(.+)`, 'i');
      const match = sentence.match(pattern);

      if (match) {
        const conclusion = this.cleanText(match[1]);
        const premise = this.cleanText(match[2]);

        if (conclusion.length > 5 && premise.length > 5) {
          extractedArgs.push({
            conclusion,
            premises: [{
              text: premise,
              role: 'linkage',
              order: 1
            }],
            pattern: 'because',
            indicator,
            confidence: 0.8,
            sourceText: sentence
          });
        }
      }
    }

    return extractedArgs;
  }

  /**
   * Extract "Premise THEREFORE Conclusion" pattern
   * Example: "Zoning increases rents. THEREFORE, cities should allow housing"
   */
  extractThereforePattern(sentence) {
    const extractedArgs = [];

    for (const indicator of this.conclusionIndicators) {
      const pattern = new RegExp(`(.+?)\\s+${indicator}[,\\s]+(.+)`, 'i');
      const match = sentence.match(pattern);

      if (match) {
        const premise = this.cleanText(match[1]);
        const conclusion = this.cleanText(match[2]);

        if (conclusion.length > 5 && premise.length > 5) {
          extractedArgs.push({
            conclusion,
            premises: [{
              text: premise,
              role: 'linkage',
              order: 1
            }],
            pattern: 'therefore',
            indicator,
            confidence: 0.85,
            sourceText: sentence
          });
        }
      }
    }

    return extractedArgs;
  }

  /**
   * Extract multi-sentence argument patterns
   * Example: "Heatwaves tripled. Linked to emissions. THEREFORE stricter targets."
   */
  extractMultiSentencePattern(sentences, startIndex) {
    const extractedArgs = [];
    const maxLookAhead = 3; // Look up to 3 sentences ahead

    for (let offset = 1; offset <= maxLookAhead && startIndex + offset < sentences.length; offset++) {
      const currentSentence = sentences[startIndex];
      const nextSentence = sentences[startIndex + offset];

      // Check if next sentence has a conclusion indicator
      const hasConclusionIndicator = this.conclusionIndicators.some(indicator =>
        new RegExp(`\\b${indicator}\\b`, 'i').test(nextSentence)
      );

      if (hasConclusionIndicator) {
        // Extract conclusion from sentence with indicator
        const conclusionMatch = this.extractConclusionFromIndicatorSentence(nextSentence);

        if (conclusionMatch) {
          const premises = [];

          // Gather all sentences before conclusion as premises
          for (let j = startIndex; j < startIndex + offset; j++) {
            const premiseText = this.cleanText(sentences[j]);
            if (premiseText.length > 5) {
              premises.push({
                text: premiseText,
                role: 'linkage',
                order: j - startIndex + 1
              });
            }
          }

          if (premises.length > 0) {
            extractedArgs.push({
              conclusion: conclusionMatch,
              premises,
              pattern: 'multi-sentence',
              confidence: 0.7 - (offset * 0.1), // Lower confidence for longer spans
              sourceText: sentences.slice(startIndex, startIndex + offset + 1).join(' ')
            });
          }
        }
      }
    }

    return extractedArgs;
  }

  /**
   * Extract conclusion from sentence containing indicator
   */
  extractConclusionFromIndicatorSentence(sentence) {
    for (const indicator of this.conclusionIndicators) {
      const pattern = new RegExp(`${indicator}[,\\s]+(.+)`, 'i');
      const match = sentence.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract implicit arguments (no explicit indicators)
   * Uses heuristics like claim-evidence patterns
   */
  extractImplicitArguments(sentences) {
    const extractedArgs = [];

    // Look for strengthener patterns that might indicate argument structure
    for (let i = 0; i < sentences.length - 1; i++) {
      const currentSentence = sentences[i];
      const nextSentence = sentences[i + 1];

      // Check if next sentence contains strengthening evidence
      const hasStrengthener = this.strengthenerPatterns.some(pattern =>
        pattern.test(nextSentence)
      );

      if (hasStrengthener) {
        const conclusion = this.cleanText(currentSentence);
        const evidence = this.cleanText(nextSentence);

        if (conclusion.length > 10 && evidence.length > 10) {
          extractedArgs.push({
            conclusion,
            premises: [
              {
                text: conclusion, // Implicit premise same as conclusion
                role: 'linkage',
                order: 1
              },
              {
                text: evidence,
                role: 'strengthener',
                order: 2
              }
            ],
            pattern: 'implicit-strengthener',
            confidence: 0.5,
            sourceText: `${currentSentence} ${nextSentence}`
          });
        }
      }
    }

    return extractedArgs;
  }

  /**
   * Identify strengtheners in text
   */
  identifyStrengtheners(text) {
    const strengtheners = [];

    for (const pattern of this.strengthenerPatterns) {
      const match = text.match(pattern);
      if (match) {
        strengtheners.push({
          text: match[0],
          pattern: pattern.source,
          weight: 5 // Default strengthening weight
        });
      }
    }

    return strengtheners;
  }

  /**
   * Identify weakeners in text
   */
  identifyWeakeners(text) {
    const weakeners = [];

    for (const pattern of this.weakenerPatterns) {
      const match = text.match(pattern);
      if (match) {
        weakeners.push({
          text: match[0],
          pattern: pattern.source,
          weight: 5 // Default weakening weight
        });
      }
    }

    return weakeners;
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting (can be enhanced with NLP library)
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences;
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[,\s]+|[,\s]+$/g, '');
  }

  /**
   * Remove duplicate arguments
   */
  deduplicateArguments(args) {
    const seen = new Set();
    const unique = [];

    for (const arg of args) {
      const key = `${arg.conclusion}|${arg.premises.map(p => p.text).join('|')}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(arg);
      }
    }

    return unique;
  }

  /**
   * Batch extract arguments from multiple texts
   */
  batchExtract(texts, options = {}) {
    return texts.map(text => ({
      text,
      arguments: this.extractArguments(text, options)
    }));
  }

  /**
   * Get extraction statistics
   */
  getExtractionStats(args) {
    return {
      total: args.length,
      patterns: {
        because: args.filter(a => a.pattern === 'because').length,
        therefore: args.filter(a => a.pattern === 'therefore').length,
        multiSentence: args.filter(a => a.pattern === 'multi-sentence').length,
        implicit: args.filter(a => a.pattern === 'implicit-strengthener').length
      },
      averageConfidence: args.reduce((sum, a) => sum + a.confidence, 0) / args.length || 0,
      averagePremises: args.reduce((sum, a) => sum + a.premises.length, 0) / args.length || 0
    };
  }

  /**
   * Validate extracted argument quality
   */
  validateArgument(argument) {
    const issues = [];

    // Check conclusion exists and has reasonable length
    if (!argument.conclusion || argument.conclusion.length < 5) {
      issues.push('Conclusion is too short or missing');
    }

    // Check premises exist
    if (!argument.premises || argument.premises.length === 0) {
      issues.push('No premises found');
    }

    // Check each premise has text
    if (argument.premises) {
      argument.premises.forEach((premise, i) => {
        if (!premise.text || premise.text.length < 5) {
          issues.push(`Premise ${i + 1} is too short or missing`);
        }
      });
    }

    // Check confidence is reasonable
    if (argument.confidence < 0.3) {
      issues.push('Low confidence extraction');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export default new ArgumentExtractionService();
