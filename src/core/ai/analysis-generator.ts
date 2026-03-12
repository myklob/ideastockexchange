/**
 * Distributed AI Framework - Argument Analysis Generator
 * Generates comprehensive issue analyses with recursive argument trees
 */

import { AIClient } from './ai-client';
import {
  IssueAnalysis,
  Argument,
  SubArgument,
  EvidenceItem,
  ObjectiveCriteria,
  ValueConflict,
  CompromiseSolution,
  MediaResource,
  LegalItem,
  Bias,
  FrameworkConfig,
} from './types';

export class AnalysisGenerator {
  private aiClient: AIClient;
  private config: FrameworkConfig;

  constructor(aiClient: AIClient, config: FrameworkConfig) {
    this.aiClient = aiClient;
    this.config = config;
  }

  /**
   * Generate a complete issue analysis for a thesis/belief
   */
  async generateFullAnalysis(thesis: string): Promise<IssueAnalysis> {
    const analysisId = this.generateId();

    console.log(`[AnalysisGenerator] Starting full analysis for: "${thesis.substring(0, 50)}..."`);

    // Generate all sections in parallel where possible
    const [
      topicInfo,
      reasonsToAgree,
      reasonsToDisagree,
      evidence,
      criteria,
      values,
      assumptions,
      costBenefit,
      solutions,
      obstacles,
      interests,
      media,
      legal,
      beliefMapping,
      biases,
      importantFacts,
    ] = await Promise.all([
      this.generateTopicInfo(thesis),
      this.generateReasonsToAgree(thesis),
      this.generateReasonsToDisagree(thesis),
      this.generateEvidence(thesis),
      this.generateObjectiveCriteria(thesis),
      this.generateValueConflict(thesis),
      this.generateAssumptions(thesis),
      this.generateCostBenefit(thesis),
      this.generateCompromiseSolutions(thesis),
      this.generateObstacles(thesis),
      this.generateInterests(thesis),
      this.generateMediaResources(thesis),
      this.generateLegalFramework(thesis),
      this.generateBeliefMapping(thesis),
      this.generateBiases(thesis),
      this.generateImportantFacts(thesis),
    ]);

    // Calculate final score
    const proTotal = reasonsToAgree.reduce((sum, arg) => sum + (arg.score.strengthening || 0), 0);
    const conTotal = reasonsToDisagree.reduce((sum, arg) => sum + (arg.score.weakening || 0), 0);
    const evidenceProTotal = evidence.supporting.reduce((sum, e) => sum + e.contribution, 0);
    const evidenceConTotal = evidence.weakening.reduce((sum, e) => sum + Math.abs(e.contribution), 0);

    const finalScore = (proTotal - Math.abs(conTotal) + evidenceProTotal - evidenceConTotal) / 10;

    const analysis: IssueAnalysis = {
      id: analysisId,
      title: thesis,
      shortTitle: topicInfo.shortTitle,
      topic: topicInfo.topic,
      topicHierarchy: topicInfo.hierarchy,
      topicId: topicInfo.topicId,
      beliefPositivity: topicInfo.positivity,
      beliefPositivityLabel: topicInfo.positivityLabel,

      reasonsToAgree,
      reasonsToDisagree,

      supportingEvidence: evidence.supporting,
      weakeningEvidence: evidence.weakening,

      objectiveCriteria: criteria,

      valueConflict: values,
      acceptAssumptions: assumptions.accept,
      rejectAssumptions: assumptions.reject,

      benefits: costBenefit.benefits,
      costs: costBenefit.costs,

      compromiseSolutions: solutions,
      obstacles: obstacles.items,
      blindSpots: obstacles.blindSpots,

      supporterInterests: interests.supporters,
      opponentInterests: interests.opponents,
      sharedInterests: interests.shared,
      conflictingInterests: interests.conflicting,

      mediaResources: media,

      supportingLaws: legal.supporting,
      contradictingLaws: legal.contradicting,

      generalBeliefs: beliefMapping.general,
      specificBeliefs: beliefMapping.specific,

      extremeVersions: beliefMapping.extreme,
      moderateVersions: beliefMapping.moderate,

      biases,

      importantFacts: importantFacts.facts,
      unintendedConsequences: importantFacts.consequences,

      finalScore: Math.round(finalScore * 10) / 10,
      scoreInterpretation: this.interpretScore(finalScore),

      createdAt: new Date(),
      updatedAt: new Date(),
      generatedBy: this.config.ai.model,
      linkedPages: [],
    };

    console.log(`[AnalysisGenerator] Completed analysis with score: ${analysis.finalScore}`);

    return analysis;
  }

  /**
   * Generate topic information and classification
   */
  private async generateTopicInfo(thesis: string): Promise<{
    shortTitle: string;
    topic: string;
    hierarchy: string;
    topicId: string;
    positivity: number;
    positivityLabel: string;
  }> {
    const prompt = `Analyze this thesis and provide topic classification in JSON format:

Thesis: "${thesis}"

Provide a JSON response with:
{
  "shortTitle": "Brief version of the thesis (under 100 chars)",
  "topic": "Main topic area (e.g., Healthcare, Immigration, Economics)",
  "hierarchy": "Topic hierarchy path (e.g., Governance > Immigration Enforcement)",
  "topicId": "Dewey decimal or classification number",
  "positivity": "Number from -100 to +100 indicating belief stance (-100=extremely critical, 0=neutral, +100=extremely supportive)",
  "positivityLabel": "Label like 'Critical/Reformist' or 'Supportive/Defensive'"
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at topic classification and taxonomy. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        shortTitle: thesis.substring(0, 100),
        topic: 'General',
        hierarchy: 'Topics > General',
        topicId: '000',
        positivity: 0,
        positivityLabel: 'Neutral',
      };
    }
  }

  /**
   * Generate reasons to agree with the thesis
   */
  private async generateReasonsToAgree(thesis: string): Promise<Argument[]> {
    const prompt = `Generate the top 5-7 strongest arguments supporting this thesis:

Thesis: "${thesis}"

For each argument, provide:
1. A bold title (2-4 words)
2. A compelling description (1-2 sentences)
3. A truth score (0-100) based on evidence strength
4. A linkage score (0-100%) for how directly it supports the thesis

Respond with JSON array:
[
  {
    "title": "Budget Insanity",
    "content": "The full argument description...",
    "truthScore": 85,
    "linkageScore": 90
  }
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert debate analyst. Generate strong, evidence-based arguments. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      const args = JSON.parse(response.content);
      return args.map((arg: { title: string; content: string; truthScore: number; linkageScore: number }, index: number) => ({
        id: `pro-${index + 1}`,
        title: arg.title,
        content: arg.content,
        position: 'pro' as const,
        score: {
          truthScore: arg.truthScore,
          linkageScore: arg.linkageScore,
          strengthening: Math.round((arg.truthScore * arg.linkageScore) / 100),
        },
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate counter-arguments (reasons to disagree)
   */
  private async generateReasonsToDisagree(thesis: string): Promise<Argument[]> {
    const prompt = `Generate the top 5 strongest counter-arguments against this thesis, then analyze why each fails:

Thesis: "${thesis}"

For each counter-argument:
1. State the counter-argument title and description
2. List sub-arguments that SUPPORT this counter-argument (what's true about it)
3. List sub-arguments that DESTROY this counter-argument (why it fails)
4. Provide a verdict explaining why this counter-argument ultimately fails
5. Assign scores

Respond with JSON array:
[
  {
    "title": "Scale Justifies Budget",
    "content": "There are 10+ million unauthorized immigrants...",
    "truthScore": 35,
    "linkageScore": 60,
    "supportingSubArgs": ["It's a lot of people", "Detention is expensive"],
    "destroyingSubArgs": ["70% have no criminal record", "E-Verify costs a fraction"],
    "verdict": "The 'scale' argument assumes raids are the only option. They're not."
  }
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at steel-manning and then dismantling counter-arguments. Be fair but thorough. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      const args = JSON.parse(response.content);
      return args.map((arg: {
        title: string;
        content: string;
        truthScore: number;
        linkageScore: number;
        supportingSubArgs: string[];
        destroyingSubArgs: string[];
        verdict: string;
      }, index: number) => ({
        id: `con-${index + 1}`,
        title: arg.title,
        content: arg.content,
        position: 'con' as const,
        score: {
          truthScore: arg.truthScore,
          linkageScore: arg.linkageScore,
          weakening: -Math.round((arg.truthScore * arg.linkageScore) / 100),
        },
        subArguments: [
          ...arg.supportingSubArgs.map((s: string, i: number) => ({
            id: `con-${index + 1}-sup-${i + 1}`,
            content: s,
            position: 'supporting' as const,
          })),
          ...arg.destroyingSubArgs.map((s: string, i: number) => ({
            id: `con-${index + 1}-des-${i + 1}`,
            content: s,
            position: 'destroying' as const,
          })),
        ],
        verdict: arg.verdict,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate evidence supporting and weakening the thesis
   */
  private async generateEvidence(thesis: string): Promise<{
    supporting: EvidenceItem[];
    weakening: EvidenceItem[];
  }> {
    const prompt = `Identify the best evidence for and against this thesis:

Thesis: "${thesis}"

Evidence types:
- T1: Official Record/Peer-reviewed research
- T2: Institutional Analysis (think tanks, government reports)
- T3: Quality Journalism
- T4: Anecdote/Personal testimony

For each evidence item provide:
- Title (bold name)
- Description
- Evidence score (0-100 for quality)
- Linkage score (0-100% for relevance)
- Type (T1-T4)
- Critique (why this evidence might be limited)

Respond with JSON:
{
  "supporting": [
    {
      "title": "The 73% Stat",
      "description": "Cato Institute analysis found...",
      "score": 98,
      "linkageScore": 100,
      "type": "T1",
      "typeName": "Institutional Analysis",
      "critique": "Based on available detention data only"
    }
  ],
  "weakening": [...]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at identifying and evaluating evidence quality. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      const evidence = JSON.parse(response.content);
      return {
        supporting: evidence.supporting.map((e: {
          title: string;
          description: string;
          score: number;
          linkageScore: number;
          type: string;
          typeName: string;
          critique: string;
        }, i: number) => ({
          id: `evi-sup-${i + 1}`,
          title: e.title,
          description: e.description,
          score: e.score,
          linkageScore: e.linkageScore,
          type: e.type,
          typeName: e.typeName,
          position: 'supporting' as const,
          contribution: Math.round((e.score * e.linkageScore) / 100),
          critique: e.critique,
        })),
        weakening: evidence.weakening.map((e: {
          title: string;
          description: string;
          score: number;
          linkageScore: number;
          type: string;
          typeName: string;
          critique: string;
        }, i: number) => ({
          id: `evi-weak-${i + 1}`,
          title: e.title,
          description: e.description,
          score: e.score,
          linkageScore: e.linkageScore,
          type: e.type,
          typeName: e.typeName,
          position: 'weakening' as const,
          contribution: -Math.round((e.score * e.linkageScore) / 100),
          critique: e.critique,
        })),
      };
    } catch {
      return { supporting: [], weakening: [] };
    }
  }

  /**
   * Generate objective criteria for measuring belief strength
   */
  private async generateObjectiveCriteria(thesis: string): Promise<ObjectiveCriteria[]> {
    const prompt = `Identify objective criteria that could measure the validity of this thesis:

Thesis: "${thesis}"

Criteria should be:
- Measurable and quantifiable
- Independent of political stance
- Based on data that could be collected

Provide JSON array:
[
  {
    "description": "Cost per deportation vs. Cost per E-Verify resolution",
    "independenceScore": 90,
    "linkageScore": 95,
    "criteriaType": "Efficiency"
  }
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at identifying objective, measurable criteria. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      const criteria = JSON.parse(response.content);
      return criteria.map((c: {
        description: string;
        independenceScore: number;
        linkageScore: number;
        criteriaType: string;
      }, i: number) => ({
        id: `crit-${i + 1}`,
        description: c.description,
        independenceScore: c.independenceScore,
        linkageScore: c.linkageScore,
        criteriaType: c.criteriaType,
        totalScore: Math.round((c.independenceScore * c.linkageScore) / 100),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate value conflict analysis
   */
  private async generateValueConflict(thesis: string): Promise<ValueConflict> {
    const prompt = `Analyze the value conflict underlying this thesis:

Thesis: "${thesis}"

For each side (supporting and opposing the thesis), identify:
1. Advertised values (what they SAY they care about)
2. Actual values (what critics say they REALLY care about)
3. Fears driving their position
4. Core desires

Respond with JSON:
{
  "supportingSide": {
    "advertised": ["Transparency", "Fiscal responsibility"],
    "actual": ["Fear of state-sponsored intimidation"],
    "fears": "A federalized Secret Police being used to bypass the Constitution",
    "desire": "Law and order, sovereignty"
  },
  "opposingSide": {
    "advertised": ["Rule of Law", "National Sovereignty"],
    "actual": ["Desire to use federal force to override local opposition"],
    "fears": "Loss of control over borders",
    "desire": "Strong enforcement"
  }
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at analyzing values and motivations. Be fair to both sides. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        supportingSide: { advertised: [], actual: [], fears: '', desire: '' },
        opposingSide: { advertised: [], actual: [], fears: '', desire: '' },
      };
    }
  }

  /**
   * Generate foundational assumptions
   */
  private async generateAssumptions(thesis: string): Promise<{ accept: string[]; reject: string[] }> {
    const prompt = `Identify the foundational assumptions underlying this thesis:

Thesis: "${thesis}"

What must someone believe to ACCEPT this thesis?
What must someone believe to REJECT this thesis?

Respond with JSON:
{
  "accept": ["Civil liberties apply to all persons on US soil", "The 10th Amendment limits federal power"],
  "reject": ["Unauthorized presence constitutes invasion justifying emergency powers"]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at identifying foundational assumptions. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { accept: [], reject: [] };
    }
  }

  /**
   * Generate cost-benefit analysis
   */
  private async generateCostBenefit(thesis: string): Promise<{
    benefits: { description: string; category: string }[];
    costs: { description: string; category: string }[];
  }> {
    const prompt = `Analyze the costs and benefits of the position in this thesis:

Thesis: "${thesis}"

Respond with JSON:
{
  "benefits": [
    {"description": "Fiscal Recovery: Reallocating billions to more effective programs", "category": "Economic"},
    {"description": "Community Trust: Increased cooperation between police and immigrants", "category": "Social"}
  ],
  "costs": [
    {"description": "Enforcement Gap: Temporary reduction in removal capacity", "category": "Security"},
    {"description": "Deterrence Loss: Perception of softer border", "category": "Political"}
  ]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at cost-benefit analysis. Be objective. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { benefits: [], costs: [] };
    }
  }

  /**
   * Generate compromise solutions
   */
  private async generateCompromiseSolutions(thesis: string): Promise<CompromiseSolution[]> {
    const prompt = `Propose practical compromise solutions that address core concerns from both sides:

Thesis: "${thesis}"

Respond with JSON array:
[
  {
    "title": "The Visibility Act",
    "description": "Ban masks during civil enforcement. If you can't show your face, you can't carry a badge."
  }
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at finding common ground and practical solutions. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      const solutions = JSON.parse(response.content);
      return solutions.map((s: { title: string; description: string }, i: number) => ({
        id: `sol-${i + 1}`,
        title: s.title,
        description: s.description,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate obstacles and blind spots
   */
  private async generateObstacles(thesis: string): Promise<{
    items: { description: string; affectsSide: 'supporters' | 'opponents' | 'both' }[];
    blindSpots: { supporters: string[]; opponents: string[] };
  }> {
    const prompt = `Identify obstacles to resolution and blind spots on each side:

Thesis: "${thesis}"

Respond with JSON:
{
  "items": [
    {"description": "Each side getting emotional about norm violations", "affectsSide": "both"},
    {"description": "Money gained by demonizing the other side", "affectsSide": "both"}
  ],
  "blindSpots": {
    "supporters": ["Underestimating deterrence needs"],
    "opponents": ["Minimizing civil liberties damage"]
  }
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at identifying cognitive obstacles and blind spots. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { items: [], blindSpots: { supporters: [], opponents: [] } };
    }
  }

  /**
   * Generate interests and motivations analysis
   */
  private async generateInterests(thesis: string): Promise<{
    supporters: { stakeholder: string; interests: string[]; side: 'supporters' }[];
    opponents: { stakeholder: string; interests: string[]; side: 'opponents' }[];
    shared: string[];
    conflicting: string[];
  }> {
    const prompt = `Analyze stakeholder interests related to this thesis:

Thesis: "${thesis}"

Respond with JSON:
{
  "supporters": [
    {"stakeholder": "Civil liberties organizations", "interests": ["Protect due process", "Limit police powers"]}
  ],
  "opponents": [
    {"stakeholder": "Immigration restrictionists", "interests": ["Stronger enforcement", "Border security"]}
  ],
  "shared": ["Removing genuinely dangerous criminals", "Having accountable law enforcement"],
  "conflicting": ["Scale of interior enforcement", "Budget priorities"]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at stakeholder analysis. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      const interests = JSON.parse(response.content);
      return {
        supporters: interests.supporters.map((s: { stakeholder: string; interests: string[] }) => ({
          ...s,
          side: 'supporters' as const,
        })),
        opponents: interests.opponents.map((s: { stakeholder: string; interests: string[] }) => ({
          ...s,
          side: 'opponents' as const,
        })),
        shared: interests.shared,
        conflicting: interests.conflicting,
      };
    } catch {
      return { supporters: [], opponents: [], shared: [], conflicting: [] };
    }
  }

  /**
   * Generate media resources
   */
  private async generateMediaResources(thesis: string): Promise<MediaResource[]> {
    const prompt = `Suggest relevant media resources (books, articles, podcasts, documentaries) for both sides:

Thesis: "${thesis}"

Respond with JSON array:
[
  {"type": "book", "title": "Example Book Title", "description": "What it covers", "position": "supporting"},
  {"type": "article", "title": "Article Title", "description": "Analysis of...", "position": "opposing"}
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at curating educational resources. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  /**
   * Generate legal framework analysis
   */
  private async generateLegalFramework(thesis: string): Promise<{
    supporting: LegalItem[];
    contradicting: LegalItem[];
  }> {
    const prompt = `Identify relevant laws and legal principles:

Thesis: "${thesis}"

Respond with JSON:
{
  "supporting": [
    {"description": "First Amendment right to record police in public"}
  ],
  "contradicting": [
    {"description": "Immigration and Nationality Act (enforcement authority)"}
  ]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are a legal expert. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      const legal = JSON.parse(response.content);
      return {
        supporting: legal.supporting.map((l: { description: string }) => ({
          ...l,
          position: 'supporting' as const,
        })),
        contradicting: legal.contradicting.map((l: { description: string }) => ({
          ...l,
          position: 'contradicting' as const,
        })),
      };
    } catch {
      return { supporting: [], contradicting: [] };
    }
  }

  /**
   * Generate belief mapping (general to specific)
   */
  private async generateBeliefMapping(thesis: string): Promise<{
    general: { level: 'general'; supportBeliefs: string[]; opposeBeliefs: string[] };
    specific: { level: 'specific'; supportBeliefs: string[]; opposeBeliefs: string[] };
    extreme: string[];
    moderate: string[];
  }> {
    const prompt = `Map this thesis to more general and more specific beliefs:

Thesis: "${thesis}"

Respond with JSON:
{
  "general": {
    "supportBeliefs": ["Government should be efficient and proportional"],
    "opposeBeliefs": ["Nations must enforce laws to maintain sovereignty"]
  },
  "specific": {
    "supportBeliefs": ["Agency X should be replaced with smaller agency"],
    "opposeBeliefs": ["Agency X needs more funding, not less"]
  },
  "extreme": ["Agency is evil and should be abolished (-100%)", "Agency is illegally targeting minorities"],
  "moderate": ["Agency needs reform but serves necessary function (0%)", "Agency tactics should be more transparent (+20%)"]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert at belief taxonomy. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      const mapping = JSON.parse(response.content);
      return {
        general: { level: 'general' as const, ...mapping.general },
        specific: { level: 'specific' as const, ...mapping.specific },
        extreme: mapping.extreme,
        moderate: mapping.moderate,
      };
    } catch {
      return {
        general: { level: 'general' as const, supportBeliefs: [], opposeBeliefs: [] },
        specific: { level: 'specific' as const, supportBeliefs: [], opposeBeliefs: [] },
        extreme: [],
        moderate: [],
      };
    }
  }

  /**
   * Generate cognitive biases affecting each side
   */
  private async generateBiases(thesis: string): Promise<Bias[]> {
    const prompt = `Identify cognitive biases affecting each side of this debate:

Thesis: "${thesis}"

Respond with JSON array:
[
  {"name": "Availability heuristic", "description": "Media coverage creates perception bias", "affectsSide": "supporters"},
  {"name": "Status quo bias", "description": "Resistance to changing established systems", "affectsSide": "opponents"}
]`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert in cognitive psychology and bias. Respond only with valid JSON array.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  /**
   * Generate important facts and unintended consequences
   */
  private async generateImportantFacts(thesis: string): Promise<{
    facts: string[];
    consequences: string[];
  }> {
    const prompt = `Identify the most important facts supporting this thesis and potential unintended consequences:

Thesis: "${thesis}"

Respond with JSON:
{
  "facts": ["Key data point 1", "Key data point 2", "Key data point 3"],
  "consequences": ["Potential unintended consequence 1", "Potential unintended consequence 2"]
}`;

    const response = await this.aiClient.complete({
      prompt,
      systemPrompt: 'You are an expert analyst. Focus on verifiable facts. Respond only with valid JSON.',
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { facts: [], consequences: [] };
    }
  }

  /**
   * Interpret the final score
   */
  private interpretScore(score: number): string {
    if (score >= 50) return 'Strongly Valid';
    if (score >= 25) return 'Tending Valid';
    if (score >= 0) return 'Slightly Valid';
    if (score >= -25) return 'Slightly Invalid';
    if (score >= -50) return 'Tending Invalid';
    return 'Strongly Invalid';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ise-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Expand an argument into its own full analysis page
   */
  async expandArgument(argument: Argument, parentThesis: string, depth: number = 0): Promise<IssueAnalysis | null> {
    if (depth >= this.config.analysis.maxDepth) {
      return null;
    }

    // Only expand arguments with scores above threshold
    const score = argument.score.strengthening || Math.abs(argument.score.weakening || 0);
    if (score < this.config.analysis.minScoreForExpansion) {
      return null;
    }

    // Create a thesis from the argument
    const thesis = `${argument.title}: ${argument.content}`;

    console.log(`[AnalysisGenerator] Expanding argument at depth ${depth}: "${argument.title}"`);

    return this.generateFullAnalysis(thesis);
  }
}
