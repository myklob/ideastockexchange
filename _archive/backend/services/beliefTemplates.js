/**
 * Belief Templates for Automated Generation
 * Defines belief and argument templates for each topic type
 */

/**
 * Belief templates organized by topic type
 * Each template has:
 * - pattern: Template string with {placeholders}
 * - category: ISE belief category
 * - argumentTypes: Types of arguments to generate
 */
export const BELIEF_TEMPLATES = {
  people: {
    beliefTypes: [
      {
        pattern: '{name} was an ethical leader',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['moral_behavior', 'impact_on_society', 'ethical_decisions'],
      },
      {
        pattern: '{name} was an unethical leader',
        category: 'philosophy',
        polarity: 'negative',
        argumentTypes: ['moral_behavior', 'harm_caused', 'corruption'],
      },
      {
        pattern: '{name} was competent at {role}',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['professional_competence', 'achievements', 'effectiveness'],
      },
      {
        pattern: '{name} was more effective than {comparison}',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['comparative_analysis', 'outcomes', 'impact'],
      },
      {
        pattern: '{name} positively influenced history',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['historical_impact', 'legacy', 'contributions'],
      },
      {
        pattern: '{name} negatively influenced history',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['historical_impact', 'harm_caused', 'negative_legacy'],
      },
      {
        pattern: "{name}'s work should be more widely known",
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['contribution_to_field', 'underappreciation', 'significance'],
      },
      {
        pattern: '{name} caused {outcome}',
        category: 'other',
        polarity: 'neutral',
        argumentTypes: ['causal_evidence', 'historical_analysis', 'alternative_explanations'],
      },
    ],
  },

  historical_events: {
    beliefTypes: [
      {
        pattern: '{event} was justified',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['moral_justification', 'context', 'outcomes'],
      },
      {
        pattern: '{event} was unjustified',
        category: 'philosophy',
        polarity: 'negative',
        argumentTypes: ['moral_criticism', 'harm_caused', 'alternatives'],
      },
      {
        pattern: '{event} was effective in achieving its goals',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['outcomes', 'goal_achievement', 'effectiveness'],
      },
      {
        pattern: '{event} caused {outcome}',
        category: 'other',
        polarity: 'neutral',
        argumentTypes: ['causal_evidence', 'alternative_explanations', 'historical_analysis'],
      },
      {
        pattern: '{event} could have been prevented',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['preventability', 'warning_signs', 'missed_opportunities'],
      },
      {
        pattern: '{event} was {party}\'s fault',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['responsibility_analysis', 'evidence_of_fault', 'alternative_explanations'],
      },
      {
        pattern: '{event} improved the world',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['positive_outcomes', 'long_term_effects', 'beneficiaries'],
      },
      {
        pattern: '{event} worsened the world',
        category: 'philosophy',
        polarity: 'negative',
        argumentTypes: ['negative_outcomes', 'harm_caused', 'victims'],
      },
    ],
  },

  tragedies_disasters: {
    beliefTypes: [
      {
        pattern: '{disaster} was preventable',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['evidence_of_negligence', 'warning_signs', 'preventive_measures'],
      },
      {
        pattern: '{disaster} was the fault of {party}',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['responsibility_evidence', 'negligence', 'systemic_causes'],
      },
      {
        pattern: '{disaster} was worsened by policy decisions',
        category: 'politics',
        polarity: 'negative',
        argumentTypes: ['policy_analysis', 'decision_outcomes', 'alternative_policies'],
      },
      {
        pattern: 'Victims of {disaster} deserve restitution',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['ethical_responsibility', 'harm_severity', 'justice'],
      },
      {
        pattern: 'Lessons from {disaster} must be implemented',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['risk_reduction', 'future_prevention', 'systemic_improvements'],
      },
    ],
  },

  animals_species: {
    beliefTypes: [
      {
        pattern: '{species} needs more protected territory',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['habitat_loss', 'conservation_needs', 'ecological_impact'],
      },
      {
        pattern: '{species} is essential for ecosystem balance',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['ecological_role', 'biodiversity', 'environmental_impact'],
      },
      {
        pattern: '{species} threatens human safety',
        category: 'other',
        polarity: 'negative',
        argumentTypes: ['threat_analysis', 'incident_evidence', 'risk_assessment'],
      },
      {
        pattern: '{species} should be protected',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['conservation_value', 'ethical_considerations', 'ecological_importance'],
      },
      {
        pattern: '{species} is invasive and harmful',
        category: 'science',
        polarity: 'negative',
        argumentTypes: ['invasive_impact', 'ecosystem_damage', 'native_species_harm'],
      },
      {
        pattern: '{species} has economic value',
        category: 'economics',
        polarity: 'positive',
        argumentTypes: ['economic_benefits', 'industry_contribution', 'market_value'],
      },
    ],
  },

  technology_products: {
    beliefTypes: [
      {
        pattern: '{technology} is effective for solving {problem}',
        category: 'technology',
        polarity: 'positive',
        argumentTypes: ['performance_metrics', 'effectiveness', 'use_cases'],
      },
      {
        pattern: '{technology} is cost-effective',
        category: 'economics',
        polarity: 'positive',
        argumentTypes: ['cost_analysis', 'economic_efficiency', 'roi'],
      },
      {
        pattern: '{technology} is expensive and impractical',
        category: 'economics',
        polarity: 'negative',
        argumentTypes: ['cost_analysis', 'accessibility', 'practical_limitations'],
      },
      {
        pattern: '{technology} is better than {alternative}',
        category: 'technology',
        polarity: 'positive',
        argumentTypes: ['comparative_analysis', 'performance', 'advantages'],
      },
      {
        pattern: '{technology} is harmful to society',
        category: 'social',
        polarity: 'negative',
        argumentTypes: ['social_impact', 'negative_externalities', 'ethical_concerns'],
      },
      {
        pattern: '{technology} is the future of {industry}',
        category: 'technology',
        polarity: 'positive',
        argumentTypes: ['innovation', 'market_trends', 'adoption_rate'],
      },
      {
        pattern: '{technology} is environmentally sustainable',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['environmental_impact', 'sustainability_metrics', 'lifecycle_analysis'],
      },
    ],
  },

  artworks: {
    beliefTypes: [
      {
        pattern: '{artwork} supports {ideology}',
        category: 'philosophy',
        polarity: 'neutral',
        argumentTypes: ['symbolism', 'thematic_analysis', 'author_intent'],
      },
      {
        pattern: '{artwork} contains harmful messaging',
        category: 'social',
        polarity: 'negative',
        argumentTypes: ['content_analysis', 'social_impact', 'ethical_concerns'],
      },
      {
        pattern: '{artwork} is better than other works in {genre}',
        category: 'other',
        polarity: 'positive',
        argumentTypes: ['comparative_quality', 'artistic_merit', 'influence'],
      },
      {
        pattern: '{artwork} is culturally important',
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['cultural_impact', 'historical_significance', 'influence'],
      },
      {
        pattern: '{artwork} is aesthetically beautiful',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['aesthetic_theory', 'artistic_technique', 'subjective_experience'],
      },
      {
        pattern: '{artwork} significantly influenced society',
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['social_impact', 'cultural_change', 'legacy'],
      },
    ],
  },

  ideologies_theories: {
    beliefTypes: [
      {
        pattern: '{ideology} produces better outcomes than {alternative}',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['comparative_outcomes', 'empirical_evidence', 'historical_examples'],
      },
      {
        pattern: '{ideology} aligns with {values}',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['value_alignment', 'moral_arguments', 'philosophical_consistency'],
      },
      {
        pattern: '{ideology} harms vulnerable groups',
        category: 'social',
        polarity: 'negative',
        argumentTypes: ['harm_evidence', 'impact_on_groups', 'ethical_critique'],
      },
      {
        pattern: '{ideology} explains {phenomenon}',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['explanatory_power', 'empirical_evidence', 'predictive_accuracy'],
      },
      {
        pattern: '{ideology} should be adopted',
        category: 'politics',
        polarity: 'positive',
        argumentTypes: ['benefits', 'feasibility', 'moral_case'],
      },
      {
        pattern: '{ideology} should not be adopted',
        category: 'politics',
        polarity: 'negative',
        argumentTypes: ['risks', 'negative_outcomes', 'ethical_concerns'],
      },
    ],
  },

  geographical_locations: {
    beliefTypes: [
      {
        pattern: '{location} is a good place to live',
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['quality_of_life', 'economic_opportunity', 'safety'],
      },
      {
        pattern: '{location} is economically strong',
        category: 'economics',
        polarity: 'positive',
        argumentTypes: ['economic_indicators', 'growth', 'industry_strength'],
      },
      {
        pattern: '{location} should adopt policy {policy}',
        category: 'politics',
        polarity: 'neutral',
        argumentTypes: ['policy_benefits', 'feasibility', 'local_needs'],
      },
      {
        pattern: '{location} is environmentally threatened',
        category: 'science',
        polarity: 'negative',
        argumentTypes: ['environmental_risks', 'climate_impact', 'conservation_needs'],
      },
      {
        pattern: '{location} is culturally significant',
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['cultural_heritage', 'historical_importance', 'global_influence'],
      },
    ],
  },

  companies_organizations: {
    beliefTypes: [
      {
        pattern: '{company} acts ethically',
        category: 'philosophy',
        polarity: 'positive',
        argumentTypes: ['ethical_practices', 'corporate_responsibility', 'transparency'],
      },
      {
        pattern: '{company} acts unethically',
        category: 'philosophy',
        polarity: 'negative',
        argumentTypes: ['ethical_violations', 'harm_caused', 'deception'],
      },
      {
        pattern: '{company} harms society',
        category: 'social',
        polarity: 'negative',
        argumentTypes: ['social_impact', 'negative_externalities', 'exploitation'],
      },
      {
        pattern: '{company} benefits society',
        category: 'social',
        polarity: 'positive',
        argumentTypes: ['social_impact', 'innovation', 'job_creation'],
      },
      {
        pattern: '{company} is innovative',
        category: 'technology',
        polarity: 'positive',
        argumentTypes: ['innovation_track_record', 'r&d_investment', 'market_leadership'],
      },
      {
        pattern: '{company} should be regulated more',
        category: 'politics',
        polarity: 'negative',
        argumentTypes: ['market_power', 'harm_evidence', 'regulatory_gaps'],
      },
    ],
  },

  scientific_concepts: {
    beliefTypes: [
      {
        pattern: '{concept} is scientifically valid',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['experimental_evidence', 'scientific_consensus', 'predictive_power'],
      },
      {
        pattern: '{concept} threatens humanity',
        category: 'science',
        polarity: 'negative',
        argumentTypes: ['risk_analysis', 'potential_harm', 'mitigation_needs'],
      },
      {
        pattern: '{concept} offers solutions to {problem}',
        category: 'science',
        polarity: 'positive',
        argumentTypes: ['practical_applications', 'effectiveness', 'feasibility'],
      },
      {
        pattern: '{concept} is misunderstood by the public',
        category: 'social',
        polarity: 'neutral',
        argumentTypes: ['public_perception', 'scientific_reality', 'communication_gaps'],
      },
      {
        pattern: '{concept} supports policy {policy}',
        category: 'politics',
        polarity: 'neutral',
        argumentTypes: ['scientific_basis', 'policy_implications', 'evidence'],
      },
    ],
  },
};

/**
 * Argument type definitions
 * Maps argument types to description templates
 */
export const ARGUMENT_TYPES = {
  // People
  moral_behavior: 'Evidence of moral or immoral behavior',
  impact_on_society: 'How this person affected society',
  ethical_decisions: 'Analysis of ethical decision-making',
  professional_competence: 'Evidence of competence in their role',
  achievements: 'Notable achievements and accomplishments',
  effectiveness: 'How effective they were at their goals',
  comparative_analysis: 'Comparison with peers or alternatives',
  outcomes: 'Results and consequences of actions',
  impact: 'Overall impact and influence',
  historical_impact: 'Long-term historical significance',
  legacy: 'Lasting legacy and influence',
  contributions: 'Contributions to their field or society',
  harm_caused: 'Evidence of harm or negative impact',
  corruption: 'Evidence of corrupt behavior',
  negative_legacy: 'Negative aspects of historical legacy',
  contribution_to_field: 'Contributions to their professional field',
  underappreciation: 'Evidence of being undervalued',
  significance: 'Why this matters',
  causal_evidence: 'Evidence of causation',
  alternative_explanations: 'Alternative causal explanations',

  // Historical Events
  moral_justification: 'Moral arguments for justification',
  context: 'Historical context and circumstances',
  moral_criticism: 'Moral arguments against',
  alternatives: 'Alternative courses of action',
  goal_achievement: 'Whether goals were achieved',
  historical_analysis: 'Historical analysis and interpretation',
  preventability: 'Whether this could have been prevented',
  warning_signs: 'Warning signs that were ignored',
  missed_opportunities: 'Opportunities for prevention',
  responsibility_analysis: 'Analysis of responsibility',
  evidence_of_fault: 'Evidence of fault or blame',
  positive_outcomes: 'Positive results and benefits',
  long_term_effects: 'Long-term consequences',
  beneficiaries: 'Who benefited',
  negative_outcomes: 'Negative results and harms',
  victims: 'Who was harmed',

  // Tragedies/Disasters
  evidence_of_negligence: 'Evidence of negligent behavior',
  preventive_measures: 'Measures that could have prevented this',
  responsibility_evidence: 'Evidence of responsibility',
  negligence: 'Negligent actions or inaction',
  systemic_causes: 'Systemic factors that contributed',
  policy_analysis: 'Analysis of relevant policies',
  decision_outcomes: 'Outcomes of policy decisions',
  alternative_policies: 'Alternative policy approaches',
  ethical_responsibility: 'Ethical arguments for responsibility',
  harm_severity: 'Severity of harm caused',
  justice: 'Justice and fairness considerations',
  risk_reduction: 'How to reduce future risk',
  future_prevention: 'Preventing future occurrences',
  systemic_improvements: 'System-level improvements needed',

  // Animals/Species
  habitat_loss: 'Evidence of habitat loss',
  conservation_needs: 'Conservation requirements',
  ecological_impact: 'Impact on ecosystems',
  ecological_role: 'Role in ecosystem functioning',
  biodiversity: 'Biodiversity importance',
  environmental_impact: 'Environmental effects',
  threat_analysis: 'Analysis of threats posed',
  incident_evidence: 'Evidence from incidents',
  risk_assessment: 'Risk assessment',
  conservation_value: 'Value for conservation',
  ethical_considerations: 'Ethical considerations',
  ecological_importance: 'Ecological significance',
  invasive_impact: 'Impact as invasive species',
  ecosystem_damage: 'Damage to ecosystems',
  native_species_harm: 'Harm to native species',
  economic_benefits: 'Economic benefits provided',
  industry_contribution: 'Contribution to industries',
  market_value: 'Market and economic value',

  // Technology/Products
  performance_metrics: 'Performance data and metrics',
  use_cases: 'Practical use cases',
  cost_analysis: 'Cost and economic analysis',
  economic_efficiency: 'Economic efficiency',
  roi: 'Return on investment',
  accessibility: 'Accessibility and affordability',
  practical_limitations: 'Practical limitations',
  performance: 'Performance characteristics',
  advantages: 'Advantages and benefits',
  social_impact: 'Impact on society',
  negative_externalities: 'Negative side effects',
  ethical_concerns: 'Ethical concerns and issues',
  innovation: 'Innovation and novelty',
  market_trends: 'Market trends and adoption',
  adoption_rate: 'Rate of adoption',
  sustainability_metrics: 'Sustainability measurements',
  lifecycle_analysis: 'Lifecycle environmental analysis',

  // Artworks
  symbolism: 'Symbolic elements and meaning',
  thematic_analysis: 'Analysis of themes',
  author_intent: 'Author or creator intent',
  content_analysis: 'Analysis of content',
  comparative_quality: 'Comparison with other works',
  artistic_merit: 'Artistic quality and merit',
  influence: 'Influence on other works',
  cultural_impact: 'Impact on culture',
  historical_significance: 'Historical importance',
  aesthetic_theory: 'Aesthetic theoretical analysis',
  artistic_technique: 'Technical artistic quality',
  subjective_experience: 'Subjective experience',
  cultural_change: 'How it changed culture',

  // Ideologies/Theories
  comparative_outcomes: 'Comparison of outcomes',
  empirical_evidence: 'Empirical evidence and data',
  historical_examples: 'Historical examples',
  value_alignment: 'Alignment with values',
  moral_arguments: 'Moral and ethical arguments',
  philosophical_consistency: 'Philosophical consistency',
  harm_evidence: 'Evidence of harm',
  impact_on_groups: 'Impact on specific groups',
  ethical_critique: 'Ethical criticisms',
  explanatory_power: 'Ability to explain phenomena',
  predictive_accuracy: 'Predictive accuracy',
  benefits: 'Benefits of adoption',
  feasibility: 'Feasibility of implementation',
  moral_case: 'Moral case for or against',
  risks: 'Risks and dangers',

  // Geographical Locations
  quality_of_life: 'Quality of life indicators',
  economic_opportunity: 'Economic opportunities',
  safety: 'Safety and security',
  economic_indicators: 'Economic data and indicators',
  growth: 'Economic growth',
  industry_strength: 'Strength of industries',
  policy_benefits: 'Benefits of policy',
  local_needs: 'Local needs and conditions',
  environmental_risks: 'Environmental risks',
  climate_impact: 'Climate change impacts',
  conservation_needs: 'Conservation needs',
  cultural_heritage: 'Cultural heritage value',
  historical_importance: 'Historical importance',
  global_influence: 'Global influence',

  // Companies/Organizations
  ethical_practices: 'Ethical business practices',
  corporate_responsibility: 'Corporate social responsibility',
  transparency: 'Transparency and openness',
  ethical_violations: 'Ethical violations',
  deception: 'Deceptive practices',
  exploitation: 'Exploitation of workers/customers',
  job_creation: 'Job creation and employment',
  innovation_track_record: 'History of innovation',
  'r&d_investment': 'Research and development investment',
  market_leadership: 'Market leadership position',
  market_power: 'Market power and dominance',
  regulatory_gaps: 'Gaps in regulation',

  // Scientific Concepts
  experimental_evidence: 'Experimental evidence',
  scientific_consensus: 'Scientific consensus',
  predictive_power: 'Predictive power',
  risk_analysis: 'Risk analysis',
  potential_harm: 'Potential harmful effects',
  mitigation_needs: 'Need for mitigation',
  practical_applications: 'Practical applications',
  public_perception: 'Public understanding',
  scientific_reality: 'Scientific reality',
  communication_gaps: 'Communication gaps',
  scientific_basis: 'Scientific basis',
  policy_implications: 'Policy implications',
  evidence: 'Supporting evidence',
};

export default {
  BELIEF_TEMPLATES,
  ARGUMENT_TYPES,
};
