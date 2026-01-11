/**
 * Argument Classifier Service
 *
 * Classifies arguments by:
 * 1. Type: Truth (T), Importance (I), or Relevance (R)
 * 2. Evidence Tier: 1-4 (quality of supporting evidence)
 * 3. Valence: -100 to +100 (support vs. opposition)
 *
 * Based on docs/ARGUMENT_EXTRACTION_SPEC.md
 */

export class ArgumentClassifierService {
  constructor() {
    // Truth argument patterns - factual/empirical claims
    this.truthPatterns = [
      /studies? show/i,
      /research (shows|indicates|demonstrates)/i,
      /data (shows|indicates|demonstrates)/i,
      /evidence (shows|suggests|indicates)/i,
      /statistics (show|indicate)/i,
      /analysis (shows|reveals)/i,
      /according to/i,
      /measured/i,
      /observed/i,
      /empirical/i,
      /factual/i,
      /proven/i,
      /demonstrated/i,
      /x percent/i,
      /increased by/i,
      /decreased by/i,
      /correlation/i,
      /causes?/i,
      /results? in/i,
      /leads to/i
    ];

    // Importance argument patterns - value/significance claims
    this.importancePatterns = [
      /essential/i,
      /critical/i,
      /vital/i,
      /crucial/i,
      /important/i,
      /significant/i,
      /fundamental/i,
      /matters? because/i,
      /should/i,
      /ought to/i,
      /must/i,
      /necessary/i,
      /required/i,
      /valuable/i,
      /worthwhile/i,
      /justified/i,
      /moral/i,
      /ethical/i,
      /right to/i,
      /wrong to/i,
      /fair/i,
      /unfair/i,
      /just/i,
      /unjust/i
    ];

    // Relevance argument patterns - logical connection claims
    this.relevancePatterns = [
      /relevant/i,
      /irrelevant/i,
      /applies? to/i,
      /doesn't apply/i,
      /only (if|when)/i,
      /unless/i,
      /provided that/i,
      /in cases where/i,
      /limited to/i,
      /doesn't (mean|imply)/i,
      /connection/i,
      /related/i,
      /unrelated/i,
      /bears on/i,
      /pertains to/i,
      /applicable/i
    ];

    // Evidence tier 1 patterns (highest quality)
    this.tier1Patterns = [
      /meta-analysis/i,
      /systematic review/i,
      /peer-reviewed/i,
      /published in/i,
      /journal/i,
      /replicated/i,
      /multiple studies/i,
      /consensus/i
    ];

    // Evidence tier 2 patterns
    this.tier2Patterns = [
      /expert/i,
      /researcher/i,
      /professor/i,
      /institution/i,
      /government (data|report|study)/i,
      /world bank/i,
      /imf/i,
      /who/i,
      /cdc/i,
      /fda/i
    ];

    // Evidence tier 3 patterns
    this.tier3Patterns = [
      /survey/i,
      /poll/i,
      /investigation/i,
      /report/i,
      /journalism/i,
      /industry (report|analysis)/i,
      /analysis/i
    ];

    // Positive valence patterns (supports the belief)
    this.positiveValencePatterns = [
      /increases/i,
      /improves/i,
      /benefits/i,
      /helps/i,
      /reduces (costs?|harm|poverty)/i,
      /enhances/i,
      /strengthens/i,
      /supports/i,
      /confirms/i,
      /validates/i,
      /effective/i,
      /successful/i,
      /works/i,
      /positive (effect|impact)/i
    ];

    // Negative valence patterns (opposes the belief)
    this.negativeValencePatterns = [
      /decreases/i,
      /worsens/i,
      /harms/i,
      /hurts/i,
      /increases (costs?|harm)/i,
      /weakens/i,
      /undermines/i,
      /challenges/i,
      /contradicts/i,
      /refutes/i,
      /ineffective/i,
      /fails/i,
      /doesn't work/i,
      /negative (effect|impact)/i,
      /problematic/i
    ];
  }

  /**
   * Classify argument type (Truth, Importance, Relevance)
   * @param {object} argument - Argument to classify
   * @returns {object} - { type, confidence, scores }
   */
  classifyType(argument) {
    const text = this.getFullText(argument);

    // Count pattern matches for each type
    const scores = {
      truth: this.countPatternMatches(text, this.truthPatterns),
      importance: this.countPatternMatches(text, this.importancePatterns),
      relevance: this.countPatternMatches(text, this.relevancePatterns)
    };

    // Normalize scores
    const total = scores.truth + scores.importance + scores.relevance;

    if (total === 0) {
      // Default to truth if no patterns match
      return {
        type: 'truth',
        confidence: 0.3,
        scores: { truth: 0.3, importance: 0, relevance: 0 },
        reason: 'Default classification (no clear patterns)'
      };
    }

    const normalizedScores = {
      truth: scores.truth / total,
      importance: scores.importance / total,
      relevance: scores.relevance / total
    };

    // Determine primary type
    const primaryType = Object.keys(normalizedScores).reduce((a, b) =>
      normalizedScores[a] > normalizedScores[b] ? a : b
    );

    return {
      type: primaryType,
      confidence: normalizedScores[primaryType],
      scores: normalizedScores,
      reason: this.explainTypeClassification(primaryType, text)
    };
  }

  /**
   * Classify evidence tier (1-4)
   * @param {object} argument - Argument to classify
   * @param {object} source - Optional source metadata
   * @returns {object} - { tier, confidence, reason }
   */
  classifyEvidenceTier(argument, source = null) {
    const text = this.getFullText(argument);

    // Check for explicit evidence tier patterns
    if (this.matchesPatterns(text, this.tier1Patterns)) {
      return {
        tier: 1,
        confidence: 0.9,
        reason: 'Contains meta-analysis, systematic review, or peer-reviewed indicators'
      };
    }

    if (this.matchesPatterns(text, this.tier2Patterns)) {
      return {
        tier: 2,
        confidence: 0.8,
        reason: 'Contains expert analysis or institutional report indicators'
      };
    }

    if (this.matchesPatterns(text, this.tier3Patterns)) {
      return {
        tier: 3,
        confidence: 0.7,
        reason: 'Contains survey, poll, or journalistic investigation indicators'
      };
    }

    // Check source metadata if provided
    if (source) {
      const tierFromSource = this.classifySourceTier(source);
      if (tierFromSource) {
        return tierFromSource;
      }
    }

    // Default to tier 4 (anecdotal/opinion)
    return {
      tier: 4,
      confidence: 0.6,
      reason: 'No clear evidence quality indicators found (defaulting to anecdotal)'
    };
  }

  /**
   * Classify source tier based on metadata
   */
  classifySourceTier(source) {
    if (!source) return null;

    const domain = source.url ? new URL(source.url).hostname : '';
    const sourceText = `${domain} ${source.author || ''} ${source.title || ''}`.toLowerCase();

    // Tier 1: Academic sources
    if (sourceText.includes('.edu') ||
        sourceText.includes('scholar') ||
        sourceText.includes('pubmed') ||
        sourceText.includes('nature.com') ||
        sourceText.includes('science.org')) {
      return { tier: 1, confidence: 0.95, reason: 'Academic source domain' };
    }

    // Tier 2: Government/institutional
    if (sourceText.includes('.gov') ||
        sourceText.includes('worldbank') ||
        sourceText.includes('who.int') ||
        sourceText.includes('imf.org')) {
      return { tier: 2, confidence: 0.9, reason: 'Government or institutional source' };
    }

    // Tier 3: Reputable journalism
    if (sourceText.includes('nytimes') ||
        sourceText.includes('washingtonpost') ||
        sourceText.includes('reuters') ||
        sourceText.includes('apnews')) {
      return { tier: 3, confidence: 0.8, reason: 'Reputable journalism source' };
    }

    return null;
  }

  /**
   * Calculate valence score (-100 to +100)
   * @param {object} argument - Argument to score
   * @param {string} belief - The belief this argument relates to
   * @returns {object} - { valence, confidence, reason }
   */
  calculateValence(argument, belief) {
    const text = this.getFullText(argument);

    // Count positive and negative indicators
    const positiveCount = this.countPatternMatches(text, this.positiveValencePatterns);
    const negativeCount = this.countPatternMatches(text, this.negativeValencePatterns);

    // Also consider argument type (supporting vs opposing)
    let baseValence = 0;
    if (argument.type === 'supporting') {
      baseValence = 50;
    } else if (argument.type === 'opposing') {
      baseValence = -50;
    }

    // Adjust based on language patterns
    const languageAdjustment = (positiveCount - negativeCount) * 10;

    // Calculate final valence
    let valence = baseValence + languageAdjustment;

    // Clamp to -100 to +100
    valence = Math.max(-100, Math.min(100, valence));

    // Calculate confidence based on signal strength
    const signalStrength = positiveCount + negativeCount;
    const confidence = Math.min(0.5 + (signalStrength * 0.1), 0.95);

    return {
      valence,
      confidence,
      reason: this.explainValence(valence, positiveCount, negativeCount),
      indicators: {
        positive: positiveCount,
        negative: negativeCount
      }
    };
  }

  /**
   * Classify all aspects of an argument
   * @param {object} argument - Argument to classify
   * @param {object} options - Optional configuration
   * @returns {object} - Complete classification
   */
  classifyArgument(argument, options = {}) {
    const {
      belief = null,
      source = null
    } = options;

    // Classify type (T/I/R)
    const typeClassification = this.classifyType(argument);

    // Classify evidence tier
    const tierClassification = this.classifyEvidenceTier(argument, source);

    // Calculate valence
    const valenceResult = belief
      ? this.calculateValence(argument, belief)
      : { valence: 0, confidence: 0, reason: 'No belief provided' };

    // Classify each premise individually
    const classifiedPremises = argument.premises?.map(premise => ({
      ...premise,
      type: premise.type || this.classifyType({ content: premise.text }).type
    })) || [];

    return {
      ...argument,
      argumentType: typeClassification.type,
      typeConfidence: typeClassification.confidence,
      typeScores: typeClassification.scores,
      evidenceTier: tierClassification.tier,
      tierConfidence: tierClassification.confidence,
      valence: valenceResult.valence,
      valenceConfidence: valenceResult.confidence,
      premises: classifiedPremises,
      classification: {
        type: typeClassification,
        tier: tierClassification,
        valence: valenceResult
      },
      classifiedAt: new Date()
    };
  }

  /**
   * Helper: Get full text from argument
   */
  getFullText(argument) {
    let text = argument.content || '';

    if (argument.conclusion) {
      text += ' ' + argument.conclusion;
    }

    if (argument.premises) {
      text += ' ' + argument.premises.map(p => p.text).join(' ');
    }

    return text;
  }

  /**
   * Helper: Count pattern matches in text
   */
  countPatternMatches(text, patterns) {
    return patterns.reduce((count, pattern) => {
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);
  }

  /**
   * Helper: Check if text matches any patterns
   */
  matchesPatterns(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Explain type classification
   */
  explainTypeClassification(type, text) {
    const explanations = {
      truth: 'Contains factual, empirical, or data-driven language',
      importance: 'Contains value judgments, normative claims, or moral language',
      relevance: 'Discusses logical connections, applicability, or scope limitations'
    };

    return explanations[type] || 'Unknown classification';
  }

  /**
   * Explain valence score
   */
  explainValence(valence, positiveCount, negativeCount) {
    if (valence > 70) {
      return `Strongly supports (${positiveCount} positive indicators, ${negativeCount} negative)`;
    } else if (valence > 30) {
      return `Moderately supports (${positiveCount} positive indicators, ${negativeCount} negative)`;
    } else if (valence > -30) {
      return `Neutral or balanced (${positiveCount} positive indicators, ${negativeCount} negative)`;
    } else if (valence > -70) {
      return `Moderately opposes (${positiveCount} positive indicators, ${negativeCount} negative)`;
    } else {
      return `Strongly opposes (${positiveCount} positive indicators, ${negativeCount} negative)`;
    }
  }

  /**
   * Batch classify multiple arguments
   */
  batchClassify(args, options = {}) {
    return args.map(arg => {
      try {
        return this.classifyArgument(arg, options);
      } catch (error) {
        return {
          ...arg,
          error: error.message,
          classified: false
        };
      }
    });
  }

  /**
   * Get classification statistics
   */
  getClassificationStats(classifiedArguments) {
    const typeCounts = { truth: 0, importance: 0, relevance: 0 };
    const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalValence = 0;

    classifiedArguments.forEach(arg => {
      if (arg.argumentType) {
        typeCounts[arg.argumentType]++;
      }
      if (arg.evidenceTier) {
        tierCounts[arg.evidenceTier]++;
      }
      if (arg.valence !== undefined) {
        totalValence += arg.valence;
      }
    });

    return {
      total: classifiedArguments.length,
      types: typeCounts,
      tiers: tierCounts,
      averageValence: totalValence / classifiedArguments.length || 0,
      averageTypeConfidence: classifiedArguments.reduce((sum, a) =>
        sum + (a.typeConfidence || 0), 0
      ) / classifiedArguments.length || 0
    };
  }

  /**
   * Suggest improvements to argument classification
   */
  suggestImprovements(argument) {
    const suggestions = [];

    // Low confidence type classification
    if (argument.typeConfidence < 0.5) {
      suggestions.push({
        type: 'type_clarity',
        message: 'Add clearer factual claims, value statements, or relevance indicators',
        priority: 'high'
      });
    }

    // Low evidence tier
    if (argument.evidenceTier >= 3) {
      suggestions.push({
        type: 'evidence_quality',
        message: 'Add citations to peer-reviewed studies or expert sources',
        priority: 'high'
      });
    }

    // Neutral valence with supporting type
    if (argument.type === 'supporting' && Math.abs(argument.valence) < 30) {
      suggestions.push({
        type: 'valence_clarity',
        message: 'Make the supporting relationship more explicit',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Compare two arguments' classifications
   */
  compareClassifications(arg1, arg2) {
    return {
      sameType: arg1.argumentType === arg2.argumentType,
      tierDifference: Math.abs((arg1.evidenceTier || 0) - (arg2.evidenceTier || 0)),
      valenceDifference: Math.abs((arg1.valence || 0) - (arg2.valence || 0)),
      oppositeSides: ((arg1.valence || 0) > 0 && (arg2.valence || 0) < 0) ||
                      ((arg1.valence || 0) < 0 && (arg2.valence || 0) > 0),
      strongerEvidence: (arg1.evidenceTier || 4) < (arg2.evidenceTier || 4) ? 'arg1' :
                        (arg1.evidenceTier || 4) > (arg2.evidenceTier || 4) ? 'arg2' : 'equal'
    };
  }
}

// Export singleton instance
export default new ArgumentClassifierService();
