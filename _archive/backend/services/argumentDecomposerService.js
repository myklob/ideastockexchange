/**
 * Argument Decomposer Service
 *
 * Decomposes arguments into formal logic notation:
 * - P1 ∧ P2 ∧ P3 → C (Premises AND together IMPLY Conclusion)
 * - Adds subscripts: L (Linkage), S (Strengthener), W (Weakener)
 * - Adds type markers: T (Truth), I (Importance), R (Relevance)
 *
 * Example: P1ₗᵀ ∧ P2ₛᵀ ∧ P3wᴿ → C
 *
 * Based on docs/ARGUMENT_EXTRACTION_SPEC.md
 */

export class ArgumentDecomposerService {
  constructor() {
    // Unicode subscripts for roles
    this.roleSubscripts = {
      linkage: 'ₗ',
      strengthener: 'ₛ',
      weakener: 'w'
    };

    // Unicode superscripts for types
    this.typeSubscripts = {
      truth: 'ᵀ',
      importance: 'ᴵ',
      relevance: 'ᴿ'
    };

    // Logical operators
    this.operators = {
      and: '∧',
      or: '∨',
      implies: '→',
      not: '¬',
      biconditional: '↔'
    };
  }

  /**
   * Decompose an argument into formal logic notation
   * @param {object} argument - Argument with conclusion and premises
   * @param {object} options - Optional configuration
   * @returns {object} - Decomposed argument with formal notation
   */
  decompose(argument, options = {}) {
    const {
      includeTypes = true,
      includeRoles = true,
      validateLogic = true
    } = options;

    if (!argument || !argument.conclusion || !argument.premises) {
      throw new Error('Argument must have conclusion and premises');
    }

    // Ensure premises are ordered
    const orderedPremises = this.orderPremises(argument.premises);

    // Build formal notation
    const notation = this.buildFormalNotation(
      orderedPremises,
      argument.conclusion,
      includeTypes,
      includeRoles
    );

    // Analyze logical structure
    const structure = this.analyzeLogicalStructure(orderedPremises, argument.conclusion);

    // Validate if requested
    const validation = validateLogic
      ? this.validateLogic(orderedPremises, argument.conclusion)
      : { valid: true, issues: [] };

    return {
      ...argument,
      premises: orderedPremises,
      formalNotation: notation,
      logicalStructure: structure,
      validation,
      decomposedAt: new Date()
    };
  }

  /**
   * Build formal logic notation string
   * Example: P1ₗᵀ ∧ P2ₛᵀ → C
   */
  buildFormalNotation(premises, conclusion, includeTypes, includeRoles) {
    // Build premise notation
    const premiseNotations = premises.map((premise, index) => {
      let notation = `P${index + 1}`;

      // Add role subscript
      if (includeRoles && premise.role) {
        notation += this.roleSubscripts[premise.role] || '';
      }

      // Add type superscript
      if (includeTypes && premise.type) {
        notation += this.typeSubscripts[premise.type] || '';
      }

      return notation;
    });

    // Join premises with AND operator
    const premisePart = premiseNotations.join(` ${this.operators.and} `);

    // Build full notation: P1 ∧ P2 → C
    return `${premisePart} ${this.operators.implies} C`;
  }

  /**
   * Order premises by their order field or default ordering
   */
  orderPremises(premises) {
    return premises
      .map((premise, index) => ({
        ...premise,
        order: premise.order !== undefined ? premise.order : index + 1
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Analyze the logical structure of the argument
   */
  analyzeLogicalStructure(premises, conclusion) {
    // Count roles
    const roleCounts = {
      linkage: 0,
      strengthener: 0,
      weakener: 0
    };

    premises.forEach(premise => {
      if (premise.role) {
        roleCounts[premise.role] = (roleCounts[premise.role] || 0) + 1;
      }
    });

    // Determine primary structure type
    let structureType = 'simple';
    if (premises.length > 3) {
      structureType = 'complex';
    } else if (premises.length > 1) {
      structureType = 'compound';
    }

    // Check for chains (premises that depend on each other)
    const hasChain = premises.some(p => p.dependsOn);

    // Identify argument pattern
    const pattern = this.identifyArgumentPattern(premises, roleCounts);

    return {
      type: structureType,
      premiseCount: premises.length,
      roleCounts,
      hasChain,
      pattern,
      complexity: this.calculateComplexity(premises)
    };
  }

  /**
   * Identify common argument patterns
   */
  identifyArgumentPattern(premises, roleCounts) {
    // Pure linkage argument (all premises directly support conclusion)
    if (roleCounts.linkage === premises.length) {
      return 'pure-linkage';
    }

    // Strengthened argument (linkage + strengtheners)
    if (roleCounts.linkage > 0 && roleCounts.strengthener > 0 && roleCounts.weakener === 0) {
      return 'strengthened';
    }

    // Qualified argument (linkage + weakeners)
    if (roleCounts.linkage > 0 && roleCounts.weakener > 0) {
      return 'qualified';
    }

    // Balanced argument (has all types)
    if (roleCounts.linkage > 0 && roleCounts.strengthener > 0 && roleCounts.weakener > 0) {
      return 'balanced';
    }

    // Evidence-based (mostly strengtheners)
    if (roleCounts.strengthener > roleCounts.linkage) {
      return 'evidence-based';
    }

    return 'mixed';
  }

  /**
   * Calculate argument complexity score (0-100)
   */
  calculateComplexity(premises) {
    let complexity = 0;

    // Base complexity from number of premises
    complexity += Math.min(premises.length * 15, 50);

    // Add complexity for chains/dependencies
    const dependencyCount = premises.filter(p => p.dependsOn).length;
    complexity += dependencyCount * 10;

    // Add complexity for mixed roles
    const uniqueRoles = new Set(premises.map(p => p.role).filter(r => r));
    complexity += (uniqueRoles.size - 1) * 10;

    return Math.min(complexity, 100);
  }

  /**
   * Validate logical structure
   */
  validateLogic(premises, conclusion) {
    const issues = [];

    // Check for at least one linkage premise
    const hasLinkage = premises.some(p => p.role === 'linkage');
    if (!hasLinkage) {
      issues.push({
        type: 'warning',
        message: 'No linkage premise found - argument may not connect to conclusion'
      });
    }

    // Check for contradicting premises
    const contradictions = this.findContradictions(premises);
    if (contradictions.length > 0) {
      issues.push({
        type: 'error',
        message: 'Contradicting premises detected',
        details: contradictions
      });
    }

    // Check for circular reasoning
    const hasCircular = this.checkCircularReasoning(premises, conclusion);
    if (hasCircular) {
      issues.push({
        type: 'error',
        message: 'Circular reasoning detected - premise and conclusion are too similar'
      });
    }

    // Check premise relevance
    premises.forEach((premise, index) => {
      if (premise.text.length < 5) {
        issues.push({
          type: 'warning',
          message: `Premise ${index + 1} is too short to be meaningful`
        });
      }
    });

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }

  /**
   * Find contradicting premises
   */
  findContradictions(premises) {
    const contradictions = [];

    // Simple negation detection
    const negationWords = ['not', 'no', "n't", 'never', 'without'];

    for (let i = 0; i < premises.length; i++) {
      for (let j = i + 1; j < premises.length; j++) {
        const p1 = premises[i].text.toLowerCase();
        const p2 = premises[j].text.toLowerCase();

        // Check if one has negation and they share similar words
        const p1HasNegation = negationWords.some(word => p1.includes(word));
        const p2HasNegation = negationWords.some(word => p2.includes(word));

        if (p1HasNegation !== p2HasNegation) {
          // Check for word overlap
          const p1Words = new Set(p1.split(/\s+/));
          const p2Words = new Set(p2.split(/\s+/));
          const overlap = [...p1Words].filter(word => p2Words.has(word)).length;

          if (overlap > 3) {
            contradictions.push({
              premise1: i + 1,
              premise2: j + 1,
              reason: 'Possible negation contradiction'
            });
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Check for circular reasoning
   */
  checkCircularReasoning(premises, conclusion) {
    const conclusionWords = new Set(
      conclusion.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
    );

    // Check if any premise is too similar to conclusion
    return premises.some(premise => {
      const premiseWords = new Set(
        premise.text.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3)
      );

      const overlap = [...conclusionWords].filter(word => premiseWords.has(word));
      const similarity = overlap.length / Math.max(conclusionWords.size, premiseWords.size);

      return similarity > 0.7; // More than 70% word overlap
    });
  }

  /**
   * Add premise dependencies (for chained arguments)
   * Example: P1 → P2 → C
   */
  addDependency(argument, premiseIndex, dependsOnIndex) {
    if (!argument.premises[premiseIndex]) {
      throw new Error(`Premise ${premiseIndex} does not exist`);
    }

    if (!argument.premises[dependsOnIndex]) {
      throw new Error(`Premise ${dependsOnIndex} does not exist`);
    }

    // Check for circular dependencies
    if (this.wouldCreateCycle(argument.premises, premiseIndex, dependsOnIndex)) {
      throw new Error('This dependency would create a circular chain');
    }

    argument.premises[premiseIndex].dependsOn = dependsOnIndex;

    return argument;
  }

  /**
   * Check if adding a dependency would create a cycle
   */
  wouldCreateCycle(premises, from, to) {
    const visited = new Set();
    let current = to;

    while (current !== undefined) {
      if (visited.has(current)) {
        return true; // Cycle detected
      }

      visited.add(current);

      if (current === from) {
        return true; // Would create cycle
      }

      current = premises[current]?.dependsOn;
    }

    return false;
  }

  /**
   * Convert argument to different notation formats
   */
  convertNotation(argument, format) {
    switch (format) {
      case 'symbolic':
        return this.buildFormalNotation(argument.premises, argument.conclusion, true, true);

      case 'plain':
        return this.buildPlainNotation(argument.premises, argument.conclusion);

      case 'tree':
        return this.buildTreeNotation(argument.premises, argument.conclusion);

      case 'latex':
        return this.buildLatexNotation(argument.premises, argument.conclusion);

      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Build plain text notation
   */
  buildPlainNotation(premises, conclusion) {
    const premiseLines = premises.map((p, i) =>
      `P${i + 1} [${p.role}${p.type ? `, ${p.type}` : ''}]: ${p.text}`
    );

    return [
      'Premises:',
      ...premiseLines,
      '',
      `Conclusion: ${conclusion}`
    ].join('\n');
  }

  /**
   * Build tree notation for visualization
   */
  buildTreeNotation(premises, conclusion) {
    const tree = {
      type: 'argument',
      conclusion: {
        text: conclusion,
        type: 'conclusion'
      },
      premises: premises.map((p, i) => ({
        id: `P${i + 1}`,
        text: p.text,
        role: p.role,
        type: p.type,
        order: p.order,
        dependsOn: p.dependsOn !== undefined ? `P${p.dependsOn + 1}` : null
      }))
    };

    return tree;
  }

  /**
   * Build LaTeX notation for academic papers
   */
  buildLatexNotation(premises, conclusion) {
    const premiseNotations = premises.map((p, i) => {
      let notation = `P_{${i + 1}}`;

      if (p.role) {
        notation += `^{${p.role[0].toUpperCase()}}`;
      }

      return notation;
    });

    const premisePart = premiseNotations.join(' \\land ');

    return `${premisePart} \\rightarrow C`;
  }

  /**
   * Batch decompose multiple arguments
   */
  batchDecompose(args, options = {}) {
    return args.map(arg => {
      try {
        return this.decompose(arg, options);
      } catch (error) {
        return {
          ...arg,
          error: error.message,
          decomposed: false
        };
      }
    });
  }

  /**
   * Get decomposition statistics
   */
  getDecompositionStats(decomposedArguments) {
    const valid = decomposedArguments.filter(a => a.validation?.valid);
    const patterns = {};

    decomposedArguments.forEach(arg => {
      const pattern = arg.logicalStructure?.pattern || 'unknown';
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return {
      total: decomposedArguments.length,
      valid: valid.length,
      invalid: decomposedArguments.length - valid.length,
      averageComplexity: decomposedArguments.reduce((sum, a) =>
        sum + (a.logicalStructure?.complexity || 0), 0
      ) / decomposedArguments.length || 0,
      patterns
    };
  }
}

// Export singleton instance
export default new ArgumentDecomposerService();
