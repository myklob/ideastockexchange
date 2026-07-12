/**
 * AI-powered Debate Topic Page Generator
 * Generates all structured sections for a Wikipedia-for-debates topic page.
 * Uses the configured AI provider (Anthropic/OpenAI/Ollama) via environment variables.
 */

import { createAIClientFromEnv } from '@/core/ai/ai-client';
import type { DebateTopic } from '@/core/types/debate-topic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function safeParseJson<T>(text: string, fallback: T): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON from the string
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

const SYSTEM_PROMPT = `You are an expert debate analyst building pages for the Idea Stock Exchange — a Wikipedia-for-debates platform. You produce comprehensive, balanced, well-researched structured JSON data for debate topic pages. Your output must always be valid JSON with no prose outside the JSON object.`;

async function callAI(prompt: string, maxTokens = 4000): Promise<string> {
  const client = createAIClientFromEnv();
  const response = await client.complete({
    systemPrompt: SYSTEM_PROMPT,
    prompt,
    maxTokens,
    responseFormat: 'json',
  });
  return response.content;
}

export async function generateDebateTopicData(
  topicName: string,
  categoryPath?: string[]
): Promise<DebateTopic> {
  const slug = slugify(topicName);
  const catPath = categoryPath ?? [];

  const prompt = `Generate a complete debate topic page for: "${topicName}"

Return a single valid JSON object matching this exact structure (all fields required):

{
  "slug": "${slug}",
  "title": "${topicName}",
  "categoryPath": ${JSON.stringify(catPath.length ? catPath : ['Society & Culture'])},
  "external": {
    "wikipediaUrl": "https://en.wikipedia.org/wiki/...",
    "deweyDecimal": "Use the accurate Dewey Decimal number and category for ${topicName}.",
    "locSubjectHeading": "Subject Heading (Call Number range)",
    "locUrl": "https://id.loc.gov/authorities/subjects/...",
    "stanfordUrl": "https://plato.stanford.edu/entries/.../"
  },
  "definition": "A precise, neutral 2-3 sentence definition of ${topicName}.",
  "scope": "What this page covers and what is handled on sub-pages.",
  "assumptionKeyInsight": "One sentence capturing the deepest disagreement underlying the debate.",
  "importanceScore": 75,
  "evidenceDepth": "High",
  "controversyRating": 80,
  "positions": [
    {
      "positionScore": -100,
      "positionLabel": "Strongly Oppose",
      "coreBelief": "The most extreme negative belief about ${topicName}.",
      "topArgument": "Atomic argument label driving the score (a standalone claim).",
      "beliefScore": "[-XX]",
      "evidenceIndex": 0
    },
    {
      "positionScore": -50,
      "positionLabel": "Skeptical",
      "coreBelief": "A moderately negative belief.",
      "topArgument": "Atomic argument label.",
      "beliefScore": "[-XX]",
      "evidenceIndex": 1
    },
    {
      "positionScore": 0,
      "positionLabel": "Mixed / Conditional",
      "coreBelief": "A balanced, conditional position.",
      "topArgument": "Atomic argument label.",
      "beliefScore": "[0]",
      "evidenceIndex": 2
    },
    {
      "positionScore": 50,
      "positionLabel": "Supportive",
      "coreBelief": "A moderately positive belief.",
      "topArgument": "Atomic argument label.",
      "beliefScore": "[+XX]",
      "evidenceIndex": 3
    },
    {
      "positionScore": 100,
      "positionLabel": "Strongly Support",
      "coreBelief": "The most strongly positive belief.",
      "topArgument": "Atomic argument label.",
      "beliefScore": "[+XX]",
      "evidenceIndex": 0
    }
  ],
  "claimMagnitudeLevels": [
    {
      "sortOrder": 0,
      "magnitudeLevel": "Weak (20%)",
      "magnitudePercent": 20,
      "sublabel": "Hedged",
      "proExample": "A hedged pro-${topicName} claim that acknowledges real flaws and leaves room for exceptions.",
      "antiExample": "A hedged anti-${topicName} claim that acknowledges some advantages while noting specific inefficiencies.",
      "scopeDescription": "Narrow. Acknowledges exceptions."
    },
    {
      "sortOrder": 1,
      "magnitudeLevel": "Moderate (50%)",
      "magnitudePercent": 50,
      "sublabel": "Standard",
      "proExample": "${topicName}, when functioning well, produces significantly better outcomes than the available alternatives.",
      "antiExample": "${topicName} is significantly compromised by [specific flaw], producing reliably suboptimal outcomes.",
      "scopeDescription": "Definite but bounded. Most defensible level."
    },
    {
      "sortOrder": 2,
      "magnitudeLevel": "Strong (80%)",
      "magnitudePercent": 80,
      "sublabel": "Categorical",
      "proExample": "${topicName} is fundamentally the right approach, and the alternatives reliably fail.",
      "antiExample": "${topicName} is fundamentally the wrong approach and fails wherever it is tried.",
      "scopeDescription": "Wide. Little room for exceptions."
    },
    {
      "sortOrder": 3,
      "magnitudeLevel": "Extreme (100%)",
      "magnitudePercent": 100,
      "sublabel": "Maximal",
      "proExample": "${topicName} is the only acceptable option, everywhere, always, and any deviation must be resisted.",
      "antiExample": "${topicName} is a total fraud that has never served its intended beneficiaries and never will.",
      "scopeDescription": "Catastrophic framing, no limits. Easy to dismiss."
    }
  ],
  "escalationLevels": [
    {
      "level": 1,
      "levelLabel": "Preference",
      "description": "Would vote for it if convenient. Won't reorder priorities to advance it.",
      "example": "Most voters on most issues most of the time.",
      "principles": "All other principles intact."
    },
    {
      "level": 2,
      "levelLabel": "Active Advocacy",
      "description": "Votes, donates, signs petitions, argues publicly.",
      "example": "Standard civic participation for or against ${topicName}.",
      "principles": "Operates fully within legal and social norms."
    },
    {
      "level": 3,
      "levelLabel": "Principled Non-Compliance",
      "description": "Refuses personal participation in what they see as unjust, at cost to themselves. Does not obstruct others.",
      "example": "A Thomas More pattern applied to the ${topicName} debate — resignation or refusal at personal cost.",
      "principles": "Sacrifices self. Will not act against others."
    },
    {
      "level": 4,
      "levelLabel": "Civil Disobedience",
      "description": "Openly breaks specific laws judged unjust. Accepts legal consequences. Uses trial as moral leverage.",
      "example": "An MLK/Gandhi equivalent applied to the ${topicName} debate.",
      "principles": "Violates specific laws. Accepts the legal system's authority to punish."
    },
    {
      "level": 5,
      "levelLabel": "Resistance",
      "description": "Breaks laws and rejects the legitimacy of the resulting punishment. Distinguishes legality from justice.",
      "example": "A historical resistance parallel relevant to ${topicName}.",
      "principles": "Rejects specific laws as illegitimate. Avoids harm to uninvolved parties."
    },
    {
      "level": 6,
      "levelLabel": "Any Means Necessary",
      "description": "Willing to harm others, violate any norm, or destroy any institution to advance the cause.",
      "example": "Documented extremism connected to the ${topicName} debate, if any exists; otherwise a generic description.",
      "principles": "No other principle outranks this belief."
    }
  ],
  "assumptions": [
    {
      "positionRange": "-100 to -50",
      "positionLabel": "Strongly Oppose",
      "assumptions": ["[Worldview]: ...", "[Political philosophy]: ...", "[Causal]: ...", "[Topic-specific]: ...", "[Most specific]: ..."]
    },
    {
      "positionRange": "-50 to -20",
      "positionLabel": "Skeptical",
      "assumptions": ["[Worldview]: ...", "[Values]: ...", "[Causal]: ...", "[Topic-specific]: ..."]
    },
    {
      "positionRange": "-20 to +20",
      "positionLabel": "Nuanced/Mixed",
      "assumptions": ["[Acknowledges complexity]: ...", "[Both sides have valid points]: ...", "[Context matters]: ...", "[Implementation determines outcome]: ..."]
    },
    {
      "positionRange": "+20 to +50",
      "positionLabel": "Supportive",
      "assumptions": ["[Worldview]: ...", "[Values]: ...", "[Causal]: ...", "[Topic-specific]: ..."]
    },
    {
      "positionRange": "+50 to +100",
      "positionLabel": "Strongly Support",
      "assumptions": ["[Worldview]: ...", "[Political philosophy]: ...", "[Causal]: ...", "[Topic-specific]: ...", "[Most specific]: ..."]
    }
  ],
  "abstractionRungs": [
    {"sortOrder": 0, "rungLabel": "Worldview", "proChain": "Broad belief about human nature or society that supports this topic", "conChain": "Broad belief about human nature or society that opposes this topic"},
    {"sortOrder": 1, "rungLabel": "Political principle", "proChain": "Mid-level principle that supports this topic", "conChain": "Mid-level principle that opposes this topic"},
    {"sortOrder": 2, "rungLabel": "Position on this topic", "proChain": "The pro position on ${topicName}, with its direction range, e.g. (+50% to +100%)", "conChain": "The anti position on ${topicName}, with its direction range, e.g. (-50% to -100%)"},
    {"sortOrder": 3, "rungLabel": "Specific policy", "proChain": "A concrete pro policy or action", "conChain": "A concrete anti policy or action"}
  ],
  "coreValues": {
    "supportingAdvertised": ["1. Value name — brief description", "2. ...", "3. ..."],
    "supportingActual": ["1. Value name — what critics say", "2. ..."],
    "opposingAdvertised": ["1. Value name — brief description", "2. ...", "3. ..."],
    "opposingActual": ["1. Value name — what critics say", "2. ..."]
  },
  "commonGround": {
    "agreements": ["1. shared interest both sides want", "2. ...", "3. ..."],
    "valueConflicts": ["1. genuine value tradeoff no negotiation resolves", "2. ...", "3. ..."],
    "compromises": ["1. winnable change that flips a category's net", "2. ...", "3. ..."]
  },
  "evidenceItems": [
    {
      "side": "supporting",
      "title": "Author, 'Title' (Year)",
      "source": "Journal/Publisher",
      "finding": "Key finding in one sentence.",
      "qualityScore": 95,
      "qualityLabel": "Peer Reviewed",
      "tier": "T1",
      "argument": "The standalone argument this evidence supports.",
      "linkage": 0.9,
      "standing": "VERIFIED"
    },
    {
      "side": "supporting",
      "title": "Institution report (Year)",
      "source": "Institution",
      "finding": "Key finding.",
      "qualityScore": 85,
      "qualityLabel": "Institutional",
      "tier": "T2",
      "argument": "The standalone argument this evidence supports.",
      "linkage": 0.7,
      "standing": "UNVERIFIED"
    },
    {
      "side": "weakening",
      "title": "Author, 'Title' (Year)",
      "source": "Journal",
      "finding": "Key finding.",
      "qualityScore": 80,
      "qualityLabel": "Peer Reviewed",
      "tier": "T1",
      "argument": "The standalone argument this evidence weakens.",
      "linkage": 0.85,
      "standing": "VERIFIED"
    },
    {
      "side": "weakening",
      "title": "Secondary source (Year)",
      "source": "Source",
      "finding": "Key finding.",
      "qualityScore": 45,
      "qualityLabel": "Secondary",
      "tier": "T3",
      "argument": "The standalone argument this evidence weakens.",
      "linkage": 0.55,
      "standing": "DISPUTED"
    }
  ],
  "mediaResources": [
    {"title": "Book/Article Title — Author", "medium": "Book", "biasOrTone": "Academic/Advocacy", "positivity": 70, "magnitude": 60, "escalation": 2, "keyInsight": "..."},
    {"title": "Title — Author", "medium": "Book", "biasOrTone": "Historical/Critical", "positivity": 0, "magnitude": 50, "escalation": 2, "keyInsight": "..."},
    {"title": "Title — Author", "medium": "Academic", "biasOrTone": "Empirical", "positivity": -40, "magnitude": 55, "escalation": 1, "keyInsight": "..."}
  ],
  "relatedTopics": [
    {"relationType": "parent", "relatedTitle": "Parent category", "relatedSlug": "parent-slug"},
    {"relationType": "child", "relatedTitle": "Sub-issue 1", "relatedSlug": "sub-issue-1"},
    {"relationType": "child", "relatedTitle": "Sub-issue 2", "relatedSlug": "sub-issue-2"},
    {"relationType": "sibling", "relatedTitle": "Related concept", "relatedSlug": "related-concept"},
    {"relationType": "sibling", "relatedTitle": "Another adjacent topic", "relatedSlug": "adjacent-topic"}
  ]
}

Fill in all "..." placeholders with substantive, accurate content for "${topicName}". Use real research, real book/study titles where possible. Each position's "evidenceIndex" is a 0-based index into "evidenceItems" pointing at the ledger row that best backs that position's top sub-argument; omit it where no row fits. Evidence "tier" is T1 peer-reviewed, T2 reputable institution, T3 secondary, T4 anecdotal; "linkage" (0.0-1.0) is how directly the evidence bears on its argument; "standing" is UNVERIFIED, VERIFIED, DISPUTED, or FALSIFIED — claims start UNVERIFIED and earn standing, so only mark VERIFIED where the source is well-established. Keep every beliefScore bracketed ("[+XX]", "[-XX]", "[0]") — scores are computed by the engine, never hand-entered. Return ONLY the JSON object, no other text.`;

  const raw = await callAI(prompt, 7000);
  const parsed = safeParseJson<Partial<DebateTopic>>(raw, {});

  // Ensure required fields have defaults
  return {
    slug: parsed.slug ?? slug,
    title: parsed.title ?? topicName,
    categoryPath: parsed.categoryPath ?? catPath,
    external: parsed.external ?? {},
    definition: parsed.definition ?? `A debate about ${topicName}.`,
    scope: parsed.scope ?? `This page covers the debate about ${topicName}.`,
    assumptionKeyInsight: parsed.assumptionKeyInsight,
    importanceScore: parsed.importanceScore ?? 0,
    evidenceDepth: parsed.evidenceDepth ?? 'Med',
    controversyRating: parsed.controversyRating ?? 0,
    positions: parsed.positions ?? [],
    claimMagnitudeLevels: parsed.claimMagnitudeLevels ?? [],
    escalationLevels: parsed.escalationLevels ?? [],
    assumptions: parsed.assumptions ?? [],
    abstractionRungs: parsed.abstractionRungs ?? [],
    coreValues: parsed.coreValues,
    commonGround: parsed.commonGround,
    evidenceItems: parsed.evidenceItems ?? [],
    objectiveCriteria: parsed.objectiveCriteria ?? [],
    mediaResources: parsed.mediaResources ?? [],
    relatedTopics: parsed.relatedTopics ?? [],
  };
}
