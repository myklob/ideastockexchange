/**
 * Strength Scoring Service
 *
 * Measures claim intensity (not truthfulness) on a 0-100 scale.
 *
 * Purpose:
 * - Distinguish "Trump is not very smart" (strength: 20) from "Trump is the dumbest president ever" (strength: 100)
 * - Help organize beliefs by claim intensity
 * - Provide transparency about how bold vs. hedged claims are
 *
 * Scoring Factors:
 * - Intensifiers: +10 each (very, extremely, incredibly, highly, utterly, completely, totally, absolutely, entirely, thoroughly)
 * - Hedges: -10 each (somewhat, kind of, sort of, perhaps, maybe, possibly, probably, might, could, seems, appears)
 * - Superlatives: +20 each (best, worst, greatest, dumbest, smartest, most, least, finest, ultimate, supreme, optimal)
 * - Absolutes: +15 each (always, never, all, none, every, nobody, everyone, everything, nothing, impossible, certain, definitely)
 *
 * Base score starts at 50 (neutral) and adjusts based on detected patterns.
 */

export class StrengthScoringService {
  constructor() {
    this.intensifierPatterns = [
      'very', 'extremely', 'incredibly', 'highly', 'utterly',
      'completely', 'totally', 'absolutely', 'entirely', 'thoroughly',
      'remarkably', 'exceptionally', 'profoundly', 'intensely', 'severely'
    ];

    this.hedgePatterns = [
      'somewhat', 'kind of', 'sort of', 'perhaps', 'maybe',
      'possibly', 'probably', 'might', 'could', 'seems',
      'appears', 'allegedly', 'supposedly', 'presumably', 'arguably',
      'relatively', 'fairly', 'rather', 'quite', 'moderately'
    ];

    this.superlativePatterns = [
      'best', 'worst', 'greatest', 'dumbest', 'smartest',
      'most', 'least', 'finest', 'ultimate', 'supreme',
      'optimal', 'maximal', 'minimal', 'foremost', 'paramount',
      'preeminent', 'unparalleled', 'unmatched', 'unrivaled', 'unsurpassed'
    ];

    this.absolutePatterns = [
      'always', 'never', 'all', 'none', 'every',
      'nobody', 'everyone', 'everything', 'nothing', 'impossible',
      'certain', 'definitely', 'undoubtedly', 'unquestionably', 'indisputably',
      'invariably', 'without exception', 'categorically', 'unconditionally', 'absolutely certain'
    ];
  }

  /**
   * Calculate strength score for a statement
   * @param {string} statement - The belief statement to analyze
   * @returns {object} - { score, analysis: { intensifiers, hedges, superlatives, absolutes } }
   */
  calculateStrength(statement) {
    if (!statement || typeof statement !== 'string') {
      return {
        score: 50,
        analysis: {
          intensifiers: [],
          hedges: [],
          superlatives: [],
          absolutes: [],
          calculatedScore: 50
        }
      };
    }

    const lowerStatement = statement.toLowerCase();
    let baseScore = 50; // Start neutral

    const analysis = {
      intensifiers: [],
      hedges: [],
      superlatives: [],
      absolutes: [],
      calculatedScore: 50
    };

    // Detect intensifiers (+10 each)
    this.intensifierPatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = statement.match(regex);
      if (matches) {
        analysis.intensifiers.push(...matches);
        baseScore += matches.length * 10;
      }
    });

    // Detect hedges (-10 each)
    this.hedgePatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/\s/g, '\\s')}\\b`, 'gi');
      const matches = statement.match(regex);
      if (matches) {
        analysis.hedges.push(...matches);
        baseScore -= matches.length * 10;
      }
    });

    // Detect superlatives (+20 each) - strongest claims
    this.superlativePatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = statement.match(regex);
      if (matches) {
        analysis.superlatives.push(...matches);
        baseScore += matches.length * 20;
      }
    });

    // Detect absolutes (+15 each) - categorical claims
    this.absolutePatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.replace(/\s/g, '\\s')}\\b`, 'gi');
      const matches = statement.match(regex);
      if (matches) {
        analysis.absolutes.push(...matches);
        baseScore += matches.length * 15;
      }
    });

    // Ensure score is in valid range [0, 100]
    const calculatedScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    analysis.calculatedScore = calculatedScore;

    return {
      score: calculatedScore,
      analysis
    };
  }

  /**
   * Batch calculate strength scores for multiple statements
   * @param {Array<string>} statements - Array of belief statements
   * @returns {Array<object>} - Array of { statement, score, analysis }
   */
  batchCalculate(statements) {
    return statements.map(statement => ({
      statement,
      ...this.calculateStrength(statement)
    }));
  }

  /**
   * Get human-readable interpretation of strength score
   * @param {number} score - Strength score (0-100)
   * @returns {object} - { level, description, color }
   */
  interpretStrength(score) {
    if (score >= 85) {
      return {
        level: 'Absolute',
        description: 'Categorical claim with superlatives and absolute language',
        color: 'red',
        examples: ['Trump is the dumbest president ever', 'This is always the best solution']
      };
    } else if (score >= 70) {
      return {
        level: 'Very Strong',
        description: 'Bold claim with strong intensifiers or absolutes',
        color: 'orange',
        examples: ['Trump is extremely stupid', 'This never works']
      };
    } else if (score >= 55) {
      return {
        level: 'Moderately Strong',
        description: 'Clear claim with some intensification',
        color: 'yellow',
        examples: ['Trump is very dumb', 'This is highly effective']
      };
    } else if (score >= 45) {
      return {
        level: 'Neutral',
        description: 'Straightforward claim without strong modifiers',
        color: 'gray',
        examples: ['Trump is unintelligent', 'This is effective']
      };
    } else if (score >= 30) {
      return {
        level: 'Moderately Hedged',
        description: 'Qualified claim with hedging language',
        color: 'blue',
        examples: ['Trump is somewhat dumb', 'This might be effective']
      };
    } else {
      return {
        level: 'Very Hedged',
        description: 'Heavily qualified claim with multiple hedges',
        color: 'purple',
        examples: ['Trump is perhaps not very smart', 'This could possibly work']
      };
    }
  }

  /**
   * Compare strength of two statements
   * @param {string} statement1 - First statement
   * @param {string} statement2 - Second statement
   * @returns {object} - Comparison result
   */
  compare(statement1, statement2) {
    const result1 = this.calculateStrength(statement1);
    const result2 = this.calculateStrength(statement2);

    return {
      statement1: {
        text: statement1,
        score: result1.score,
        interpretation: this.interpretStrength(result1.score)
      },
      statement2: {
        text: statement2,
        score: result2.score,
        interpretation: this.interpretStrength(result2.score)
      },
      difference: result1.score - result2.score,
      stronger: result1.score > result2.score ? 'statement1' :
                result1.score < result2.score ? 'statement2' : 'equal'
    };
  }
}

// Export singleton instance
export default new StrengthScoringService();
