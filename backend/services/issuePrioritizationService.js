/**
 * Issue Prioritization Service
 *
 * Identifies, ranks, and prioritizes significant real-world issues
 * related to beliefs and topics. Considers:
 * - Severity of impact
 * - Scale (number of people affected)
 * - Urgency/time sensitivity
 * - Evidence quality
 * - Solvability
 * - Controversy level
 *
 * Provides structured reform proposals and solutions.
 */

/**
 * Issue Model Structure
 */
export const IssueSchema = {
  title: String,
  description: String,
  beliefId: String, // Related belief
  topicId: String, // Related topic
  category: String, // Type of issue
  severity: Number, // 0-100
  scale: Number, // 0-100 (based on number affected)
  urgency: Number, // 0-100
  evidenceQuality: Number, // 0-100
  solvability: Number, // 0-100
  controversyLevel: Number, // 0-100
  priorityScore: Number, // Calculated composite score
  status: String, // identified, analyzed, proposed_solution, in_progress, resolved
  affectedPopulation: {
    description: String,
    estimatedCount: Number,
    demographics: Array,
  },
  evidence: Array, // References to evidence documents
  solutions: Array, // Proposed solutions
  stakeholders: Array,
  created: Date,
  updated: Date,
};

/**
 * Calculate priority score for an issue
 */
export function calculatePriorityScore(issue) {
  const weights = {
    severity: 0.30,
    scale: 0.25,
    urgency: 0.20,
    evidenceQuality: 0.15,
    solvability: 0.10,
  };

  const score =
    (issue.severity || 0) * weights.severity +
    (issue.scale || 0) * weights.scale +
    (issue.urgency || 0) * weights.urgency +
    (issue.evidenceQuality || 0) * weights.evidenceQuality +
    (issue.solvability || 0) * weights.solvability;

  return Math.round(score);
}

/**
 * Categorize issues by type
 */
export const IssueCategories = {
  POLICY_FAILURE: 'policy_failure',
  MISINFORMATION: 'misinformation',
  SYSTEMIC_INEQUALITY: 'systemic_inequality',
  PUBLIC_HEALTH: 'public_health',
  ECONOMIC_HARM: 'economic_harm',
  ENVIRONMENTAL: 'environmental',
  HUMAN_RIGHTS: 'human_rights',
  CORRUPTION: 'corruption',
  SAFETY_RISK: 'safety_risk',
  MARKET_FAILURE: 'market_failure',
  REGULATORY_GAP: 'regulatory_gap',
  ETHICAL_VIOLATION: 'ethical_violation',
};

/**
 * Analyze a belief for potential issues
 */
export async function identifyIssuesFromBelief(belief, arguments) {
  const issues = [];

  // Extract negative consequences mentioned in arguments
  const negativeArguments = arguments.filter(arg => arg.type === 'opposing');

  for (const arg of negativeArguments) {
    const extractedIssues = extractIssuesFromText(arg.content, belief);
    issues.push(...extractedIssues);
  }

  // Analyze sentiment and strength for red flags
  if (
    belief.hierarchicalClassification?.sentiment?.levelId === 'extremely_negative' ||
    belief.hierarchicalClassification?.sentiment?.levelId === 'strongly_negative'
  ) {
    // Highly negative beliefs often indicate problems
    issues.push({
      title: `Negative assessment: ${belief.statement}`,
      description: `This belief expresses strong negative sentiment, suggesting significant problems`,
      beliefId: belief._id,
      topicId: belief.topicId,
      category: determineCategory(belief.statement),
      severity: estimateSeverity(belief),
      scale: 50, // Default, needs further analysis
      urgency: 50,
      evidenceQuality: belief.conclusionScore || 50,
      solvability: 50,
      controversyLevel: calculateControversy(belief),
      detected: 'sentiment_analysis',
    });
  }

  // Check for specific harm indicators
  const harmIndicators = [
    { pattern: /\b(death|deaths|die|dying|killed|fatal)\b/gi, severity: 95, category: IssueCategories.PUBLIC_HEALTH },
    { pattern: /\b(injur(y|ies|ed)|harm(ed)?|hurt|damage)\b/gi, severity: 80, category: IssueCategories.SAFETY_RISK },
    { pattern: /\b(discriminat(e|ion|ory)|bias(ed)?|prejudice|inequality|inequitable)\b/gi, severity: 75, category: IssueCategories.SYSTEMIC_INEQUALITY },
    { pattern: /\b(corrupt(ion)?|fraud(ulent)?|bribe|bribery)\b/gi, severity: 85, category: IssueCategories.CORRUPTION },
    { pattern: /\b(pollut(e|ion|ing)|toxic|contamina(te|tion)|environmental damage)\b/gi, severity: 80, category: IssueCategories.ENVIRONMENTAL },
    { pattern: /\b(poverty|impoverish|economic crisis|financial ruin)\b/gi, severity: 75, category: IssueCategories.ECONOMIC_HARM },
    { pattern: /\b(rights violation|abuse|torture|oppression)\b/gi, severity: 90, category: IssueCategories.HUMAN_RIGHTS },
    { pattern: /\b(misinformation|disinformation|false claim|lie|lying|deceptive)\b/gi, severity: 65, category: IssueCategories.MISINFORMATION },
  ];

  const text = `${belief.statement} ${belief.description || ''}`.toLowerCase();

  harmIndicators.forEach(indicator => {
    if (indicator.pattern.test(text)) {
      const matches = text.match(indicator.pattern);
      issues.push({
        title: `Harm detected: ${indicator.category.replace(/_/g, ' ')}`,
        description: `This belief mentions "${matches[0]}" indicating potential ${indicator.category.replace(/_/g, ' ')}`,
        beliefId: belief._id,
        topicId: belief.topicId,
        category: indicator.category,
        severity: indicator.severity,
        scale: estimateScale(belief, indicator.category),
        urgency: estimateUrgency(indicator.category),
        evidenceQuality: belief.conclusionScore || 50,
        solvability: 50,
        controversyLevel: calculateControversy(belief),
        detected: 'keyword_analysis',
        keywords: matches,
      });
    }
  });

  return issues;
}

/**
 * Extract issues from argument text using NLP
 */
function extractIssuesFromText(text, belief) {
  const issues = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Pattern: "X causes/leads to Y" where Y is negative
  const causalPattern = /([^,]+)\s+(causes?|leads? to|results? in)\s+([^,\.!?]+)/gi;
  let match;

  while ((match = causalPattern.exec(text)) !== null) {
    const cause = match[1].trim();
    const effect = match[3].trim();

    // Check if effect is negative
    const negativeWords = /(harm|damage|death|injury|loss|failure|problem|issue|crisis|disaster)/i;
    if (negativeWords.test(effect)) {
      issues.push({
        title: `Causal issue: ${cause} → ${effect}`,
        description: text,
        beliefId: belief._id,
        topicId: belief.topicId,
        category: determineCategory(effect),
        severity: estimateSeverityFromText(effect),
        scale: 50,
        urgency: 50,
        evidenceQuality: 50,
        solvability: 50,
        controversyLevel: 50,
        detected: 'causal_extraction',
        cause: cause,
        effect: effect,
      });
    }
  }

  return issues;
}

/**
 * Determine issue category from text
 */
function determineCategory(text) {
  const lower = text.toLowerCase();

  const categoryKeywords = {
    [IssueCategories.PUBLIC_HEALTH]: ['health', 'disease', 'illness', 'medical', 'healthcare', 'death', 'mortality'],
    [IssueCategories.ECONOMIC_HARM]: ['economic', 'financial', 'money', 'cost', 'poverty', 'unemployment'],
    [IssueCategories.ENVIRONMENTAL]: ['environment', 'pollution', 'climate', 'ecosystem', 'toxic', 'contamination'],
    [IssueCategories.HUMAN_RIGHTS]: ['rights', 'freedom', 'liberty', 'abuse', 'torture', 'oppression'],
    [IssueCategories.CORRUPTION]: ['corruption', 'fraud', 'bribe', 'embezzlement', 'kickback'],
    [IssueCategories.SAFETY_RISK]: ['safety', 'danger', 'risk', 'hazard', 'injury', 'accident'],
    [IssueCategories.SYSTEMIC_INEQUALITY]: ['inequality', 'discrimination', 'bias', 'prejudice', 'unfair'],
    [IssueCategories.MISINFORMATION]: ['false', 'misinformation', 'lie', 'deceptive', 'misleading'],
    [IssueCategories.POLICY_FAILURE]: ['policy', 'law', 'regulation', 'legislation', 'government'],
  };

  let bestCategory = IssueCategories.POLICY_FAILURE;
  let maxMatches = 0;

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  });

  return bestCategory;
}

/**
 * Estimate severity from belief properties
 */
function estimateSeverity(belief) {
  let severity = 50;

  // Very negative sentiment suggests high severity
  if (belief.dimensions?.sentimentPolarity < -60) {
    severity += 20;
  } else if (belief.dimensions?.sentimentPolarity < -30) {
    severity += 10;
  }

  // Strong claims suggest high severity
  if (belief.conclusionScore > 70) {
    severity += 10;
  }

  // Many opposing arguments suggest serious issues
  if (belief.statistics?.opposingCount > 10) {
    severity += 15;
  }

  return Math.min(100, severity);
}

/**
 * Estimate severity from text content
 */
function estimateSeverityFromText(text) {
  let severity = 50;

  const highSeverityWords = ['death', 'fatal', 'catastrophic', 'devastating', 'crisis', 'emergency'];
  const moderateSeverityWords = ['harm', 'damage', 'injury', 'problem', 'issue', 'concern'];

  const lower = text.toLowerCase();

  highSeverityWords.forEach(word => {
    if (lower.includes(word)) severity += 15;
  });

  moderateSeverityWords.forEach(word => {
    if (lower.includes(word)) severity += 5;
  });

  return Math.min(100, severity);
}

/**
 * Estimate scale (number of people affected)
 */
function estimateScale(belief, category) {
  let scale = 50;

  // Check for scale indicators in text
  const text = `${belief.statement} ${belief.description || ''}`.toLowerCase();

  const scaleIndicators = [
    { pattern: /\b(millions?|widespread|global|nationwide|epidemic|pandemic)\b/gi, score: 90 },
    { pattern: /\b(thousands?|many|numerous|common|frequent)\b/gi, score: 70 },
    { pattern: /\b(hundreds?|some|several)\b/gi, score: 50 },
    { pattern: /\b(few|rare|isolated|individual)\b/gi, score: 30 },
  ];

  scaleIndicators.forEach(indicator => {
    if (indicator.pattern.test(text)) {
      scale = Math.max(scale, indicator.score);
    }
  });

  // Category-based adjustments
  if (category === IssueCategories.PUBLIC_HEALTH || category === IssueCategories.ENVIRONMENTAL) {
    scale += 10; // These often affect many people
  }

  return Math.min(100, scale);
}

/**
 * Estimate urgency based on category and content
 */
function estimateUrgency(category) {
  const urgencyMap = {
    [IssueCategories.PUBLIC_HEALTH]: 80,
    [IssueCategories.SAFETY_RISK]: 75,
    [IssueCategories.HUMAN_RIGHTS]: 70,
    [IssueCategories.ENVIRONMENTAL]: 65,
    [IssueCategories.CORRUPTION]: 60,
    [IssueCategories.ECONOMIC_HARM]: 55,
    [IssueCategories.SYSTEMIC_INEQUALITY]: 60,
    [IssueCategories.MISINFORMATION]: 55,
    [IssueCategories.POLICY_FAILURE]: 50,
  };

  return urgencyMap[category] || 50;
}

/**
 * Calculate controversy level
 */
function calculateControversy(belief) {
  let controversy = 50;

  // Balanced arguments suggest controversy
  const supporting = belief.statistics?.supportingCount || 0;
  const opposing = belief.statistics?.opposingCount || 0;

  if (supporting > 0 && opposing > 0) {
    const balance = Math.abs(supporting - opposing) / (supporting + opposing);
    controversy = 50 + (50 * (1 - balance)); // More balanced = more controversial
  }

  // High view count suggests controversy
  if (belief.statistics?.views > 1000) {
    controversy += 10;
  }

  return Math.min(100, controversy);
}

/**
 * Generate solution proposals for an issue
 */
export function generateSolutionProposals(issue) {
  const solutions = [];

  // Category-specific solution templates
  const solutionTemplates = {
    [IssueCategories.POLICY_FAILURE]: [
      { type: 'legislative', description: 'Propose new legislation to address the policy gap' },
      { type: 'regulatory', description: 'Implement regulatory oversight and enforcement' },
      { type: 'reform', description: 'Reform existing policies to correct failures' },
    ],
    [IssueCategories.MISINFORMATION]: [
      { type: 'education', description: 'Develop public education campaign with accurate information' },
      { type: 'fact_checking', description: 'Establish independent fact-checking mechanisms' },
      { type: 'platform_policy', description: 'Implement platform policies to reduce spread' },
    ],
    [IssueCategories.SYSTEMIC_INEQUALITY]: [
      { type: 'policy_change', description: 'Implement anti-discrimination policies' },
      { type: 'resource_allocation', description: 'Reallocate resources to address disparities' },
      { type: 'representation', description: 'Increase representation of affected groups in decision-making' },
    ],
    [IssueCategories.PUBLIC_HEALTH]: [
      { type: 'intervention', description: 'Implement public health intervention programs' },
      { type: 'access', description: 'Improve access to healthcare and treatment' },
      { type: 'prevention', description: 'Develop prevention and education initiatives' },
    ],
    [IssueCategories.CORRUPTION]: [
      { type: 'transparency', description: 'Increase transparency and public reporting requirements' },
      { type: 'enforcement', description: 'Strengthen enforcement and penalties' },
      { type: 'oversight', description: 'Establish independent oversight bodies' },
    ],
  };

  const templates = solutionTemplates[issue.category] || [
    { type: 'general', description: 'Conduct further research to identify solutions' },
  ];

  templates.forEach((template, index) => {
    solutions.push({
      id: `${issue.category}_${template.type}_${index}`,
      title: template.description,
      type: template.type,
      description: `Address ${issue.title} through ${template.type} approach`,
      feasibility: estimateFeasibility(issue, template.type),
      expectedImpact: estimateImpact(issue),
      timeframe: estimateTimeframe(template.type),
      requiredResources: estimateResources(issue, template.type),
      stakeholders: identifyStakeholders(issue),
      status: 'proposed',
    });
  });

  return solutions;
}

/**
 * Helper functions for solution generation
 */
function estimateFeasibility(issue, solutionType) {
  let feasibility = issue.solvability || 50;

  // Legislative solutions are often harder
  if (solutionType === 'legislative') feasibility -= 10;

  // Education is usually feasible
  if (solutionType === 'education') feasibility += 10;

  return Math.max(0, Math.min(100, feasibility));
}

function estimateImpact(issue) {
  return Math.round((issue.severity * 0.4 + issue.scale * 0.6));
}

function estimateTimeframe(solutionType) {
  const timeframes = {
    education: 'short-term (6-12 months)',
    intervention: 'medium-term (1-2 years)',
    legislative: 'long-term (2-5 years)',
    regulatory: 'medium-term (1-3 years)',
    reform: 'long-term (3-5 years)',
  };

  return timeframes[solutionType] || 'medium-term (1-2 years)';
}

function estimateResources(issue, solutionType) {
  const scale = issue.scale || 50;

  if (scale > 80) return 'significant resources required (>$10M)';
  if (scale > 60) return 'moderate resources required ($1M-$10M)';
  if (scale > 40) return 'modest resources required ($100K-$1M)';
  return 'minimal resources required (<$100K)';
}

function identifyStakeholders(issue) {
  const stakeholders = ['affected population', 'policy makers', 'researchers'];

  if (issue.category === IssueCategories.PUBLIC_HEALTH) {
    stakeholders.push('healthcare providers', 'public health agencies');
  }
  if (issue.category === IssueCategories.ECONOMIC_HARM) {
    stakeholders.push('business leaders', 'economists', 'labor unions');
  }
  if (issue.category === IssueCategories.ENVIRONMENTAL) {
    stakeholders.push('environmental agencies', 'scientists', 'industry representatives');
  }

  return stakeholders;
}

/**
 * Rank issues by priority
 */
export function rankIssues(issues) {
  return issues
    .map(issue => ({
      ...issue,
      priorityScore: calculatePriorityScore(issue),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get top priority issues for a topic
 */
export async function getTopIssuesForTopic(topicId, limit = 10) {
  // This would query a database in practice
  // For now, return structure
  return {
    topicId,
    analysisDate: new Date(),
    topIssues: [], // Would be populated from database
    totalIssuesIdentified: 0,
    averageSeverity: 0,
    averageControversy: 0,
  };
}

export default {
  calculatePriorityScore,
  identifyIssuesFromBelief,
  generateSolutionProposals,
  rankIssues,
  getTopIssuesForTopic,
  IssueCategories,
};
