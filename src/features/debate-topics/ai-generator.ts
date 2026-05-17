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
      "topArgument": "The strongest argument for this extreme position.",
      "beliefScore": "[-XX]"
    },
    {
      "positionScore": -50,
      "positionLabel": "Skeptical",
      "coreBelief": "A moderately negative belief.",
      "topArgument": "Key argument.",
      "beliefScore": "[-XX]"
    },
    {
      "positionScore": 0,
      "positionLabel": "Neutral/Nuanced",
      "coreBelief": "A balanced, nuanced position.",
      "topArgument": "Key nuancing argument.",
      "beliefScore": "[0]"
    },
    {
      "positionScore": 50,
      "positionLabel": "Supportive",
      "coreBelief": "A moderately positive belief.",
      "topArgument": "Key supporting argument.",
      "beliefScore": "[+XX]"
    },
    {
      "positionScore": 100,
      "positionLabel": "Strongly Support",
      "coreBelief": "The most strongly positive belief.",
      "topArgument": "The strongest pro argument.",
      "beliefScore": "[+XX]"
    }
  ],
  "claimMagnitudeLevels": [
    {
      "sortOrder": 0,
      "magnitudeLevel": "Weak (20%)",
      "magnitudePercent": 20,
      "sublabel": "Modest Assertion",
      "proExample": "A modest pro-${topicName} claim that acknowledges real flaws and leaves room for exceptions.",
      "antiExample": "A modest anti-${topicName} claim that acknowledges some advantages while noting specific inefficiencies.",
      "scopeDescription": "Narrow scope. Leaves room for exceptions and context-dependence."
    },
    {
      "sortOrder": 1,
      "magnitudeLevel": "Moderate (50%)",
      "magnitudePercent": 50,
      "sublabel": "Standard Assertion",
      "proExample": "${topicName}, when functioning well, produces significantly better outcomes than the available alternatives.",
      "antiExample": "${topicName} is significantly compromised by [specific flaw], producing reliably suboptimal outcomes.",
      "scopeDescription": "Clear claim without overstating. The level at which most serious academic arguments operate."
    },
    {
      "sortOrder": 2,
      "magnitudeLevel": "Strong (80%)",
      "magnitudePercent": 80,
      "sublabel": "Broad Assertion",
      "proExample": "${topicName} is the only approach that provides [key benefit], and any alternative is fundamentally unjust or ineffective.",
      "antiExample": "${topicName} is fundamentally broken and cannot produce good outcomes without changes so drastic it would cease to be recognizable.",
      "scopeDescription": "Wide scope, absolute framing. Leaves little room for alternatives or incremental improvement."
    },
    {
      "sortOrder": 3,
      "magnitudeLevel": "Extreme (100%)",
      "magnitudePercent": 100,
      "sublabel": "Maximal Assertion",
      "proExample": "${topicName} is the pinnacle of human achievement in this domain and any deviation from it, however small, must be resisted by any means necessary.",
      "antiExample": "${topicName} is a total fraud that has never served its intended beneficiaries and never will.",
      "scopeDescription": "Catastrophic framing with no limiting conditions. The hardest to defend and the easiest to dismiss without engaging the moderate arguments."
    }
  ],
  "escalationLevels": [
    {
      "level": 1,
      "levelLabel": "Preference",
      "description": "Passive lean — would support or oppose if convenient but won't prioritize over other concerns.",
      "example": "A typical casual participant in the ${topicName} debate.",
      "principles": "All other principles intact.",
      "proDescription": "Would support ${topicName} if convenient. Would not prioritize it over other concerns.",
      "antiDescription": "Mildly skeptical of ${topicName}. Would prefer alternatives in certain contexts. Would not act on this preference.",
      "proExample": "A typical casual supporter of ${topicName} — votes accordingly when it aligns with other priorities.",
      "antiExample": "A typical casual skeptic — expresses reservations in conversation but takes no active steps."
    },
    {
      "level": 2,
      "levelLabel": "Active Advocacy",
      "description": "Engaged participant — votes, donates, signs petitions, argues publicly.",
      "example": "Standard civic participation for or against ${topicName}.",
      "principles": "Works fully within legal and social norms.",
      "proDescription": "Votes, donates, signs petitions, argues publicly in favor of ${topicName}.",
      "antiDescription": "Votes, donates, lobbies, and argues publicly against ${topicName} or for alternatives.",
      "proExample": "Canvasses for candidates who support ${topicName}; writes op-eds; donates to advocacy organizations.",
      "antiExample": "Lobbies legislators; organizes community opposition; funds legal challenges."
    },
    {
      "level": 3,
      "levelLabel": "Principled Non-Compliance",
      "description": "Conscientious objector — refuses personal participation even at personal cost. Does not obstruct others.",
      "example": "Accepts personal cost rather than act against conscience on ${topicName}.",
      "principles": "Willing to sacrifice self. Will not obstruct others.",
      "proDescription": "Refuses personal participation in what they consider unjust opposition to ${topicName}, even at personal cost. Does not obstruct others.",
      "antiDescription": "Refuses to implement or participate in ${topicName} even when required. Does not obstruct others.",
      "proExample": "Resigns from a position rather than implement policies hostile to ${topicName}; accepts professional consequences.",
      "antiExample": "An official who resigns rather than implement ${topicName}-related policy they consider unjust."
    },
    {
      "level": 4,
      "levelLabel": "Civil Disobedience",
      "description": "Principled lawbreaking — openly breaks specific unjust laws. Accepts legal consequences.",
      "example": "MLK/Gandhi equivalent applied to the ${topicName} debate.",
      "principles": "Violates specific laws. Accepts the legal system's authority to respond.",
      "proDescription": "Openly breaks specific unjust laws considered obstacles to ${topicName}. Accepts legal consequences and uses prosecution as moral leverage.",
      "antiDescription": "Openly defies specific laws or mandates related to ${topicName}. Accepts legal consequences and uses prosecution as moral leverage.",
      "proExample": "Participates in civil disobedience to advance ${topicName} — sit-ins, blockades — while accepting arrest.",
      "antiExample": "Conscientious objectors who accepted imprisonment rather than comply with ${topicName}-related mandates."
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
    {"sortOrder": 0, "rungLabel": "Most General (Worldview)", "proChain": "...", "conChain": "..."},
    {"sortOrder": 1, "rungLabel": "Political/Ethical Philosophy", "proChain": "...", "conChain": "..."},
    {"sortOrder": 2, "rungLabel": "This Topic", "proChain": "...", "conChain": "..."},
    {"sortOrder": 3, "rungLabel": "Most Specific (Policy/Action)", "proChain": "...", "conChain": "..."}
  ],
  "coreValues": {
    "supportingAdvertised": ["1. Value name — brief description", "2. ...", "3. ..."],
    "supportingActual": ["1. Value name — what critics say", "2. ..."],
    "opposingAdvertised": ["1. Value name — brief description", "2. ...", "3. ..."],
    "opposingActual": ["1. Value name — what critics say", "2. ..."]
  },
  "commonGround": {
    "agreements": ["1. ...", "2. ...", "3. ...", "4. ..."],
    "compromises": ["1. ...", "2. ...", "3. ...", "4. ..."]
  },
  "evidenceItems": [
    {
      "side": "supporting",
      "title": "Author, 'Title' (Year)",
      "source": "Journal/Publisher",
      "finding": "Key finding in one sentence.",
      "qualityScore": 80,
      "qualityLabel": "Peer Reviewed"
    },
    {
      "side": "supporting",
      "title": "Author, 'Title' (Year)",
      "source": "Source",
      "finding": "Key finding.",
      "qualityScore": 85,
      "qualityLabel": "Longitudinal"
    },
    {
      "side": "weakening",
      "title": "Author, 'Title' (Year)",
      "source": "Journal",
      "finding": "Key finding.",
      "qualityScore": 85,
      "qualityLabel": "Peer Reviewed"
    },
    {
      "side": "weakening",
      "title": "Author, 'Title' (Year)",
      "source": "Source",
      "finding": "Key finding.",
      "qualityScore": 75,
      "qualityLabel": "Cross-national"
    }
  ],
  "objectiveCriteria": [
    {"name": "Best criterion", "description": "Why it's the best measure.", "criteriaScore": 90, "validity": "High", "reliability": "High", "linkage": "High", "importance": "High"},
    {"name": "Second criterion", "description": "...", "criteriaScore": 85, "validity": "High", "reliability": "High", "linkage": "High", "importance": "High"},
    {"name": "Third criterion", "description": "...", "criteriaScore": 75, "validity": "High", "reliability": "High", "linkage": "Med", "importance": "High"},
    {"name": "Weaker criterion", "description": "Why it's less reliable.", "criteriaScore": 45, "validity": "Low", "reliability": "High", "linkage": "Low", "importance": "Low"}
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
    {"relationType": "opposingView", "relatedTitle": "Critical perspective on ${topicName}", "relatedSlug": "critical-perspective"}
  ]
}

Fill in all "..." placeholders with substantive, accurate content for "${topicName}". Use real research, real book/study titles where possible. Return ONLY the JSON object, no other text.`;

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
