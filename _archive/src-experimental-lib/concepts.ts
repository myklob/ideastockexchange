/**
 * Concept pages - wiki-style linked descriptions for each ISE concept.
 * Each concept corresponds to a link in the belief template.
 * URLs map to: http://myclob.pbworks.com/w/page/<id>/<name>
 */

export interface Concept {
  slug: string;
  title: string;
  description: string;
  sections: { heading: string; content: string }[];
  relatedConcepts: string[]; // slugs
}

export const concepts: Record<string, Concept> = {
  reasons: {
    slug: "reasons",
    title: "Argument Trees",
    description:
      "Reasons are the logical structures (arguments) that support or oppose a belief. They are the fundamental building blocks of the belief graph.",
    sections: [
      {
        heading: "How Reasons Work",
        content:
          "Each reason is itself a belief that can have its own sub-reasons, creating recursive argument trees. Reasons are categorized as either supporting (pro) or opposing (con) a given conclusion. The quality of reasons—not just quantity—matters through scoring multipliers for truth, linkage, and importance.",
      },
      {
        heading: "Recursive Structure",
        content:
          "A reason to agree with Belief A might be Belief B. Belief B then has its own page with its own reasons to agree and disagree. This creates a tree structure where the strength of sub-arguments compounds upward. A strong argument supported by strong sub-arguments scores higher than one supported by weak sub-arguments.",
      },
      {
        heading: "Scoring",
        content:
          "Each reason's impact on the parent belief is calculated as: Impact = ArgumentScore × LinkageScore. The ArgumentScore is recursively computed from the reason's own sub-arguments and evidence. The LinkageScore measures whether the reason, IF TRUE, would actually support the conclusion.",
      },
    ],
    relatedConcepts: ["truth", "linkage-scores", "importance-score", "scoring", "reasonrank"],
  },

  truth: {
    slug: "truth",
    title: "Truth",
    description:
      "Truth scoring measures whether an argument or claim is factually accurate and logically valid. It is distinct from relevance—an argument can be TRUE but IRRELEVANT to the conclusion.",
    sections: [
      {
        heading: "Logical Validity (LV)",
        content:
          "Is the argument free from logical fallacies? An argument that commits a logical fallacy (ad hominem, straw man, false dilemma, etc.) receives a reduced LV score regardless of whether its conclusion happens to be correct.",
      },
      {
        heading: "Verification Level (V)",
        content:
          "Has the claim been empirically validated? Claims backed by peer-reviewed studies, replicated experiments, and official data score highest. Claims based on anecdote, intuition, or opinion score lowest.",
      },
      {
        heading: "Truth vs. Relevance",
        content:
          "'The grass is green' may have a high truth score, but if used to support a carbon tax, it would have a LOW linkage score. Truth alone does not make an argument valuable—it must also be relevant. This is why the scoring formula multiplies truth by linkage.",
      },
    ],
    relatedConcepts: ["evidence", "scoring", "linkage-scores", "bias"],
  },

  "linkage-scores": {
    slug: "linkage-scores",
    title: "Linkage Scores",
    description:
      "Linkage Scores (Evidence-to-Conclusion Linkage Scores, ECLS) measure whether an argument, IF TRUE, would actually support or weaken the conclusion. This prevents non-sequiturs from inflating scores.",
    sections: [
      {
        heading: "Formula",
        content:
          "ECLS(A, B) = SUM(strength of reasons to agree with linkage) / SUM(total strength of all linkage arguments). If there are strong reasons to believe argument A supports conclusion B, the linkage score is high. If the connection is weak or disputed, the linkage score is low.",
      },
      {
        heading: "How It Works",
        content:
          "Each linkage between an argument and a conclusion can itself be debated. Users can post reasons why the linkage is strong or weak. For example: 'Global warming is real' linked to 'We should implement a carbon tax'—users can argue about whether this linkage is strong (carbon tax directly addresses warming) or weak (other solutions might be better).",
      },
      {
        heading: "Why It Matters",
        content:
          "Without linkage scoring, someone could post thousands of true-but-irrelevant statements as 'reasons to agree' and artificially inflate a belief's score. Linkage scoring ensures only relevant arguments contribute meaningfully to the conclusion score.",
      },
    ],
    relatedConcepts: ["reasons", "truth", "scoring", "evidence"],
  },

  "importance-score": {
    slug: "importance-score",
    title: "Importance Score",
    description:
      "The Importance Score measures how much an argument matters relative to others, weighted by cost-benefit analysis. Not all valid, relevant arguments carry equal weight.",
    sections: [
      {
        heading: "Determination Method",
        content:
          "Cost-Benefit Analysis (CBA) is the primary method for determining importance. Arguments with greater real-world impact receive higher importance scores. A life-safety argument should weigh more than a minor administrative cost argument, even if both are equally true and relevant.",
      },
      {
        heading: "Role in Scoring",
        content:
          "Importance is the 'I' component in the master formula: CS = SUM((RtA - RtD) × (SE - WE) × LV × V × L × U × I). It prevents trivial arguments from having the same weight as arguments about matters of great consequence.",
      },
    ],
    relatedConcepts: ["scoring", "cost-benefit-analysis", "reasons"],
  },

  scoring: {
    slug: "scoring",
    title: "Scoring System",
    description:
      "The comprehensive framework that combines all individual score components into a final Conclusion Score. This is the mathematical backbone of the Idea Stock Exchange.",
    sections: [
      {
        heading: "Master Formula",
        content:
          "CS = SUM((RtA - RtD) × (SE - WE) × LV × V × L × U × I)\n\nWhere:\n• CS = Conclusion Score\n• RtA = Reasons to Agree\n• RtD = Reasons to Disagree\n• SE = Supporting Evidence\n• WE = Weakening Evidence\n• LV = Logically Valid\n• V = Verification Level\n• L = Link Score\n• U = Unique Score\n• I = Importance Score",
      },
      {
        heading: "Score Types",
        content:
          "• Conclusion Score (CS): Aggregate score for a belief\n• Reason Score (RS): Score for individual arguments\n• Evidence Score (ES): Score for empirical backing\n• Linkage Score (L): Relevance to conclusion\n• Unique Score (U): Prevents double-counting\n• Importance Score (I): Cost-benefit weight",
      },
      {
        heading: "Philosophy",
        content:
          "The platform represents 'the collective soul of the internet—our current best approximation of the strength of arguments.' Users can adjust parameters and see how recommendations change. All calculations are transparent and debatable.",
      },
    ],
    relatedConcepts: [
      "truth",
      "linkage-scores",
      "importance-score",
      "evidence",
      "reasonrank",
      "argument-scores-from-sub-arguments",
    ],
  },

  evidence: {
    slug: "evidence",
    title: "Evidence",
    description:
      "Evidence is the empirical data, citations, or observations that substantiate arguments. The ISE defines a strict hierarchy of evidence quality.",
    sections: [
      {
        heading: "Evidence Types",
        content:
          "• T1 (Peer-reviewed/Official): Meta-analyses, RCTs, peer-reviewed studies, official government data\n• T2 (Expert/Institutional): Expert testimony, institutional reports, professional standards\n• T3 (Journalism/Surveys): News articles, survey data, investigative journalism\n• T4 (Opinion/Anecdote): Personal experience, opinion pieces, anecdotal evidence",
      },
      {
        heading: "Evidence Verification Score (EVS)",
        content:
          "EVS = ESIW × ERQ × ECRS × ERP\n\nWhere:\n• ESIW = Evidence Source Independence Weighting\n• ERQ = Evidence Replication Quantity\n• ECRS = Evidence-to-Conclusion Relevance Score\n• ERP = Evidence Replication Percentage",
      },
      {
        heading: "Guiding Principle",
        content:
          "Following David Hume: 'We must proportion our beliefs to the evidence.' Higher-quality evidence from the hierarchy receives greater weight. A single meta-analysis of 50 studies carries more weight than 50 individual anecdotes.",
      },
    ],
    relatedConcepts: ["truth", "scoring", "linkage-scores", "objective-criteria"],
  },

  "objective-criteria": {
    slug: "objective-criteria",
    title: "Objective Criteria Scores",
    description:
      "Drawn from Fisher & Ury's 'Getting to Yes,' Objective Criteria establish standards independent of either party's will for evaluating arguments.",
    sections: [
      {
        heading: "Principles",
        content:
          "• Criteria must be independent of the parties' positions\n• Standards should be legitimate and practical\n• Each issue should be framed as a joint search for objective criteria\n• Examples: market value, scientific judgment, professional standards, efficiency, precedent",
      },
      {
        heading: "Scoring",
        content:
          "Each criterion is scored for:\n• Independence Score: How free from bias is this standard?\n• Linkage Score: How relevant is this criterion to the belief being evaluated?\n• Total Score = Independence × Linkage",
      },
    ],
    relatedConcepts: ["scoring", "evidence", "truth"],
  },

  "argument-scores-from-sub-arguments": {
    slug: "argument-scores-from-sub-arguments",
    title: "Argument Scores from Sub-Arguments",
    description:
      "Arguments form hierarchical trees. A top-level argument's score is calculated recursively from the scores of its sub-arguments, creating compounding strength.",
    sections: [
      {
        heading: "Recursive Mechanism",
        content:
          "Each argument can have sub-arguments (reasons to agree/disagree with it). Sub-arguments themselves can have further sub-arguments. The strength flows upward through the tree—a strong argument supported by strong sub-arguments scores higher than one supported by weak sub-arguments.",
      },
      {
        heading: "PageRank Analogy",
        content:
          "Just as web pages gain authority through links from other authoritative pages, arguments gain strength from being supported by other strong arguments. This is the foundation of the ReasonRank algorithm.",
      },
    ],
    relatedConcepts: ["reasonrank", "reasons", "scoring"],
  },

  reasonrank: {
    slug: "reasonrank",
    title: "ReasonRank",
    description:
      "The ISE's adaptation of Google's PageRank algorithm for ranking arguments and beliefs. Instead of ranking web pages by link authority, it ranks reasons based on the number and relative strength of pro/con reasons.",
    sections: [
      {
        heading: "How It Works",
        content:
          "Just as Google ranks pages based on the number of links and the strength of those links, ReasonRank ranks reasons based on the number and relative strength of pro/con reasons, factoring in sub-arguments recursively.",
      },
      {
        heading: "Core Formula",
        content:
          "Conclusion Score = SUM(Pro Arguments × Linkage) - SUM(Con Arguments × Linkage)\n\nEach argument's score is itself computed recursively from its own sub-arguments, creating a deep evaluation tree.",
      },
      {
        heading: "Purpose",
        content:
          "ReasonRank ensures that well-supported, deeply-reasoned arguments outrank superficial ones, creating a meritocratic 'stock market' for ideas where the best arguments rise to the top.",
      },
    ],
    relatedConcepts: ["argument-scores-from-sub-arguments", "scoring", "reasons", "linkage-scores"],
  },

  "american-values": {
    slug: "american-values",
    title: "Core Values Conflict",
    description:
      "The values framework identifies the core normative priorities that underlie political and social beliefs. Values are the root motivations that drive positions.",
    sections: [
      {
        heading: "Values Hierarchy",
        content:
          "Values sit at the top of the belief hierarchy: Values → Beliefs → Arguments → Evidence. When two people disagree, the system traces their disagreement to identify whether the root cause is different values, different factual beliefs, or different assumptions.",
      },
      {
        heading: "Advertised vs. Actual Values",
        content:
          "The template distinguishes between what supporters/opponents CLAIM motivates them (advertised values) and what ACTUALLY motivates them (actual values). This transparency helps identify hidden agendas and enables more honest dialogue.",
      },
      {
        heading: "Value Tensions",
        content:
          "Different values can be in tension (e.g., freedom vs. security, equality vs. efficiency). Beliefs derive from these value priorities. Understanding which values conflict helps explain why reasonable people can disagree.",
      },
    ],
    relatedConcepts: ["interests", "assumptions", "automate-conflict-resolution", "bias"],
  },

  interests: {
    slug: "interests",
    title: "Interests & Motivations",
    description:
      "Based on Fisher & Ury's 'Getting to Yes': interests are the underlying motivations and desired outcomes that drive people to hold positions. Positions are rigid; interests can often be satisfied in multiple ways.",
    sections: [
      {
        heading: "Positions vs. Interests",
        content:
          "'Your position is something you have decided upon. Your interests are what caused you to so decide.' —Fisher & Ury. The system focuses on interests rather than positions because this opens the door to creative solutions.",
      },
      {
        heading: "Shared Interests",
        content:
          "Even fierce opponents often share underlying interests. Both supporters and opponents of a carbon tax may share the interest of 'affordable energy.' Identifying shared interests is the first step toward compromise.",
      },
    ],
    relatedConcepts: ["compromise", "automate-conflict-resolution", "american-values", "obstacles-to-resolution"],
  },

  assumptions: {
    slug: "assumptions",
    title: "Foundational Assumptions",
    description:
      "Assumptions are the implicit premises required for an argument to hold. The ISE makes hidden assumptions explicit so they can be examined, challenged, and scored.",
    sections: [
      {
        heading: "Dependency Tracking",
        content:
          "Arguments REQUIRE assumptions. The system tracks which beliefs depend on which assumptions with dependency strength levels: CRITICAL, STRONG, MODERATE, WEAK.",
      },
      {
        heading: "Cascading Effects",
        content:
          "When an assumption is challenged or disproven, all dependent beliefs are automatically surfaced for review. This keeps the entire belief graph intellectually honest—you can't ignore a cracked foundation.",
      },
    ],
    relatedConcepts: ["reasons", "truth", "scoring"],
  },

  "cost-benefit-analysis": {
    slug: "cost-benefit-analysis",
    title: "Cost-Benefit Analysis",
    description:
      "Automated Cost-Benefit Analysis (CBA) objectively weighs the practical consequences of policies and beliefs. It is the primary mechanism for determining Importance Scores.",
    sections: [
      {
        heading: "Framework",
        content:
          "For each belief, the CBA evaluates:\n• Improvements created and problems created\n• Who gains and who loses\n• Positive and negative externalities\n• Likelihood of each outcome",
      },
      {
        heading: "Dynamic Updates",
        content:
          "As new evidence becomes available, the cost-benefit analysis is updated dynamically. Solutions are ranked by their net benefit to affected stakeholders, ensuring recommendations reflect the latest information.",
      },
    ],
    relatedConcepts: ["importance-score", "scoring", "interests"],
  },

  compromise: {
    slug: "compromise",
    title: "Best Compromise Solutions",
    description:
      "Drawing from 'Getting to Yes': rather than splitting the difference between positions, the system seeks solutions that satisfy underlying interests of all parties.",
    sections: [
      {
        heading: "Inventing Options for Mutual Gain",
        content:
          "The system identifies shared underlying interests beneath disagreements and uses comparative scoring to find solutions that address both sides' core concerns. Creative solutions emerge from understanding interests rather than defending positions.",
      },
      {
        heading: "Evaluation",
        content:
          "Compromise solutions are evaluated based on:\n1. How well they address both sides' core interests\n2. What creative solutions haven't been tried\n3. What partial implementations could test ideas",
      },
    ],
    relatedConcepts: ["interests", "automate-conflict-resolution", "obstacles-to-resolution"],
  },

  "obstacles-to-resolution": {
    slug: "obstacles-to-resolution",
    title: "Obstacles to Resolution",
    description:
      "Identifies the barriers that prevent disputes from being resolved, even when solutions exist.",
    sections: [
      {
        heading: "Common Obstacles",
        content:
          "• Cognitive biases preventing rational evaluation\n• Emotional investment in positions rather than interests\n• Information asymmetry between parties\n• Value conflicts that are genuinely irreconcilable\n• Propaganda and misinformation\n• Personal attacks obscuring substantive issues\n• Logical fallacies masquerading as valid arguments\n• Redundancy creating false weight",
      },
      {
        heading: "How the ISE Addresses Obstacles",
        content:
          "The system uses: bias detection through cognitive bias flags, NLP-based filtering of personal attacks, fallacy detection, equivalency scoring to prevent redundancy, and transparent scoring to counter information asymmetry.",
      },
    ],
    relatedConcepts: ["bias", "compromise", "automate-conflict-resolution"],
  },

  bias: {
    slug: "bias",
    title: "Cognitive Biases",
    description:
      "The Bias framework identifies, categorizes, and addresses cognitive biases that distort reasoning and prevent honest evaluation of arguments.",
    sections: [
      {
        heading: "Tracked Bias Types",
        content:
          "• Confirmation Bias: Seeking information that confirms existing beliefs\n• Anchoring: Over-relying on first piece of information\n• Availability Heuristic: Judging likelihood by ease of recall\n• Dunning-Kruger: Overestimating competence in areas of low knowledge\n• Sunk Cost: Continuing based on past investment rather than future value\n• In-Group Bias: Favoring members of one's own group\n• Backfire Effect: Strengthening beliefs when presented with contrary evidence\n• Motivated Reasoning: Reasoning toward a desired conclusion",
      },
      {
        heading: "Detection Methods",
        content:
          "• Logical consistency tracking: Does a user accept arguments that support their position while rejecting identical reasoning supporting opposing views?\n• Peer-identified bias flags\n• Self-reported bias acknowledgment\n• System-automated detection based on voting patterns",
      },
    ],
    relatedConcepts: ["truth", "obstacles-to-resolution", "scoring"],
  },

  media: {
    slug: "media",
    title: "Media Resources",
    description:
      "Curated media resources—books, articles, podcasts, movies, and songs—organized by whether they support or oppose each belief.",
    sections: [
      {
        heading: "Resource Categories",
        content:
          "• Books: In-depth analyses and arguments\n• Articles: Shorter-form journalism and opinion\n• Podcasts: Audio discussions and debates\n• Movies/Documentaries: Visual storytelling and evidence\n• Songs: Cultural expressions of values and beliefs",
      },
      {
        heading: "Purpose",
        content:
          "Media resources provide additional context and perspective beyond formal arguments and evidence. They help users understand the cultural and intellectual landscape around each belief.",
      },
    ],
    relatedConcepts: ["evidence", "reasons"],
  },

  "legal-framework": {
    slug: "legal-framework",
    title: "Legal Framework",
    description:
      "Laws and legal precedents at local, state, federal, and international levels that support or contradict each belief.",
    sections: [
      {
        heading: "Jurisdictional Levels",
        content:
          "• Local/Municipal: City ordinances and local regulations\n• State/Provincial: State-level legislation\n• Federal/National: National laws and constitutional provisions\n• International: Treaties, conventions, and international law",
      },
      {
        heading: "Purpose",
        content:
          "Legal frameworks provide objective institutional context for beliefs. A belief supported by existing law has a different practical status than one requiring new legislation. Legal precedent is one form of objective criteria.",
      },
    ],
    relatedConcepts: ["objective-criteria", "evidence"],
  },

  "belief-sorting": {
    slug: "belief-sorting",
    title: "General to Specific Belief Mapping",
    description:
      "Beliefs are organized along a specificity spectrum, from broad general principles (upstream) to narrow specific claims (downstream).",
    sections: [
      {
        heading: "Upstream (More General)",
        content:
          "Broader principles that, if true, would support or oppose this belief. For example, 'Government intervention is sometimes necessary' is upstream of 'We should implement a carbon tax.'",
      },
      {
        heading: "Downstream (More Specific)",
        content:
          "More specific claims that depend on this belief being true or false. For example, 'Carbon tax revenue should fund renewable energy research' is downstream of 'A carbon tax is effective.'",
      },
      {
        heading: "Navigation",
        content:
          "This mapping allows users to navigate between related beliefs at different levels of specificity, understanding how general principles connect to specific policy proposals.",
      },
    ],
    relatedConcepts: ["combine-similar-beliefs", "reasons", "one-page-per-topic"],
  },

  "combine-similar-beliefs": {
    slug: "combine-similar-beliefs",
    title: "Similar Beliefs",
    description:
      "The system identifies and relates semantically similar beliefs to prevent double-counting and show the spectrum of positions on each topic.",
    sections: [
      {
        heading: "Extreme vs. Moderate Versions",
        content:
          "Each belief may have more extreme and more moderate versions. For example, 'Ban all fossil fuels immediately' is a more extreme version of 'Implement a gradual carbon tax.' Understanding this spectrum helps users find the most defensible version of a position.",
      },
      {
        heading: "Unique Score (U)",
        content:
          "The Unique Score prevents the same argument from being counted multiple times under different phrasings. Without this, a side could artificially inflate its score by rephrasing the same point many times. Equivalent beliefs receive a single combined score.",
      },
    ],
    relatedConcepts: ["belief-sorting", "scoring", "one-page-per-topic"],
  },

  "automate-conflict-resolution": {
    slug: "automate-conflict-resolution",
    title: "Conflict Resolution Framework",
    description:
      "The overarching framework for systematically resolving disagreements, based on the Harvard Negotiation Project's 'Getting to Yes' methodology.",
    sections: [
      {
        heading: "Step 1: Separate People from Problems",
        content:
          "NLP preprocessing filters discourse to focus on substantive issues. Sentiment analysis detects emotionally-charged content. Anonymous identifiers depersonalize arguments so they are evaluated on merit rather than source.",
      },
      {
        heading: "Step 2: Focus on Interests Over Positions",
        content:
          "Argument analysis extracts implicit values. Stakeholder surveys request explicit interest articulation. Comparative scoring reveals that both sides often share similar underlying interests.",
      },
      {
        heading: "Step 3: Insist on Objective Criteria",
        content:
          "Arguments are evaluated against external, verifiable standards. The evidence hierarchy is applied. Scientific studies are weighted above anecdotes. Objective criteria ensure the evaluation is not merely a popularity contest.",
      },
      {
        heading: "Step 4: Invent Options for Mutual Gain",
        content:
          "Collective intelligence evaluates proposed solutions. ReasonRank ranks argument quality by merit. The system suggests compromise solutions when interests analysis reveals common ground.",
      },
    ],
    relatedConcepts: [
      "interests",
      "compromise",
      "obstacles-to-resolution",
      "american-values",
      "objective-criteria",
      "bias",
    ],
  },

  "one-page-per-topic": {
    slug: "one-page-per-topic",
    title: "One Page Per Topic",
    description:
      "A structural organizing principle where each distinct topic or belief gets exactly one canonical page, preventing fragmentation.",
    sections: [
      {
        heading: "Rules",
        content:
          "• One page per topic/belief (not per person or per argument)\n• All pro and con arguments appear on the same page\n• Evidence is linked from the relevant argument sections\n• Sub-arguments get their own pages, linked hierarchically\n• Prevents the same debate from scattering across multiple locations",
      },
      {
        heading: "Why It Matters",
        content:
          "If arguments for the same belief were spread across 50 different pages, no single score could capture the state of the debate. By centralizing everything on one canonical page, the Conclusion Score reflects the totality of known arguments and evidence.",
      },
    ],
    relatedConcepts: ["belief-sorting", "combine-similar-beliefs", "reasons"],
  },

  "positivity-continuum": {
    slug: "positivity-continuum",
    title: "Positivity Continuum",
    description:
      "Beliefs are grouped and sorted along a positivity continuum—a spectrum from strongly negative (-100%) to strongly positive (+100%).",
    sections: [
      {
        heading: "Agreement Scale",
        content:
          "• +100: Existential Commitment\n• +75 to +99: Passionately Agree\n• +50 to +74: Strongly Agree\n• +25 to +49: Somewhat Agree\n• -24 to +24: Neutral / Unsure\n• -49 to -25: Somewhat Disagree\n• -74 to -50: Strongly Disagree\n• -99 to -75: Passionately Disagree\n• -100: Existential Rejection",
      },
      {
        heading: "Three Dimensions",
        content:
          "Beliefs map across three dimensions simultaneously:\n1. General to Specific (broad principles to narrow proposals)\n2. Weak to Strong (poorly supported to well-evidenced)\n3. Negative to Positive (strongly against to strongly in favor)",
      },
    ],
    relatedConcepts: ["belief-sorting", "scoring"],
  },

  books: {
    slug: "books",
    title: "Books",
    description: "In-depth analyses and arguments in book form that support or oppose beliefs in the system.",
    sections: [],
    relatedConcepts: ["media", "evidence"],
  },

  podcasts: {
    slug: "podcasts",
    title: "Podcasts",
    description: "Audio discussions and debates covering beliefs and arguments in the system.",
    sections: [],
    relatedConcepts: ["media", "evidence"],
  },

  movies: {
    slug: "movies",
    title: "Movies & Documentaries",
    description: "Visual storytelling and evidence presentations related to beliefs in the system.",
    sections: [],
    relatedConcepts: ["media", "evidence"],
  },

  "songs-that-agree": {
    slug: "songs-that-agree",
    title: "Songs",
    description: "Cultural expressions through music that relate to beliefs and values in the system.",
    sections: [],
    relatedConcepts: ["media", "american-values"],
  },

  "contact-me": {
    slug: "contact-me",
    title: "Contact & Contribute",
    description:
      "The Idea Stock Exchange is a collaborative project. Contributions of arguments, evidence, and analysis are welcome.",
    sections: [
      {
        heading: "How to Contribute",
        content:
          "Visit the GitHub repository to understand the scoring algorithms, contribute to development, or adapt this system for your own use. Start by exploring how argument scores are calculated from sub-arguments, how truth and evidence quality are measured, how linkage scores weight relevance, and how ReasonRank sorts by quality.",
      },
    ],
    relatedConcepts: ["scoring", "reasonrank"],
  },
};

export function getConceptBySlug(slug: string): Concept | undefined {
  return concepts[slug];
}

export function getAllConcepts(): Concept[] {
  return Object.values(concepts);
}
