// Database helpers for DebateTopic — serialize/deserialize JSON fields

import { prisma } from '@/lib/prisma';
import type {
  DebateTopic,
  DebateTopicExternal,
  DebatePosition,
  DebateEscalation,
  DebateAssumption,
  DebateAbstractionRung,
  DebateCoreValues,
  DebateCommonGround,
  DebateEvidence,
  DebateObjectiveCriteria,
  DebateMediaResource,
  DebateRelatedTopic,
} from '@/core/types/debate-topic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopicFromDb(row: any): DebateTopic {
  const external: DebateTopicExternal = {
    wikipediaUrl: row.wikipediaUrl ?? undefined,
    deweyDecimal: row.deweyDecimal ?? undefined,
    locSubjectHeading: row.locSubjectHeading ?? undefined,
    locUrl: row.locUrl ?? undefined,
    stanfordUrl: row.stanfordUrl ?? undefined,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positions: DebatePosition[] = (row.positions ?? []).map((p: any): DebatePosition => ({
    id: p.id,
    positionScore: p.positionScore,
    positionLabel: p.positionLabel,
    coreBelief: p.coreBelief,
    topArgument: p.topArgument,
    beliefScore: p.beliefScore,
    mediaUrl: p.mediaUrl ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const escalationLevels: DebateEscalation[] = (row.escalationLevels ?? []).map((e: any): DebateEscalation => ({
    id: e.id,
    level: e.level,
    levelLabel: e.levelLabel,
    description: e.description,
    example: e.example,
    principles: e.principles,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assumptions: DebateAssumption[] = (row.assumptions ?? []).map((a: any): DebateAssumption => ({
    id: a.id,
    positionRange: a.positionRange,
    positionLabel: a.positionLabel,
    assumptions: parseJson<string[]>(a.assumptions, []),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const abstractionRungs: DebateAbstractionRung[] = (row.abstractionRungs ?? []).map((r: any): DebateAbstractionRung => ({
    id: r.id,
    sortOrder: r.sortOrder,
    rungLabel: r.rungLabel,
    proChain: r.proChain,
    conChain: r.conChain,
  }));

  let coreValues: DebateCoreValues | undefined;
  if (row.coreValues) {
    const cv = row.coreValues;
    coreValues = {
      supportingAdvertised: parseJson<string[]>(cv.supportingAdvertised, []),
      supportingActual: parseJson<string[]>(cv.supportingActual, []),
      opposingAdvertised: parseJson<string[]>(cv.opposingAdvertised, []),
      opposingActual: parseJson<string[]>(cv.opposingActual, []),
    };
  }

  let commonGround: DebateCommonGround | undefined;
  if (row.commonGround) {
    const cg = row.commonGround;
    commonGround = {
      agreements: parseJson<string[]>(cg.agreements, []),
      compromises: parseJson<string[]>(cg.compromises, []),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evidenceItems: DebateEvidence[] = (row.evidenceItems ?? []).map((e: any): DebateEvidence => ({
    id: e.id,
    side: e.side,
    title: e.title,
    source: e.source,
    finding: e.finding,
    qualityScore: e.qualityScore,
    qualityLabel: e.qualityLabel,
    url: e.url ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectiveCriteria: DebateObjectiveCriteria[] = (row.objectiveCriteria ?? []).map((c: any): DebateObjectiveCriteria => ({
    id: c.id,
    name: c.name,
    description: c.description,
    criteriaScore: c.criteriaScore,
    validity: c.validity,
    reliability: c.reliability,
    linkage: c.linkage,
    importance: c.importance,
    url: c.url ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mediaResources: DebateMediaResource[] = (row.mediaResources ?? []).map((m: any): DebateMediaResource => ({
    id: m.id,
    title: m.title,
    medium: m.medium,
    biasOrTone: m.biasOrTone,
    positivity: m.positivity,
    magnitude: m.magnitude,
    escalation: m.escalation,
    keyInsight: m.keyInsight,
    url: m.url ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedTopics: DebateRelatedTopic[] = (row.relatedTopics ?? []).map((r: any): DebateRelatedTopic => ({
    id: r.id,
    relationType: r.relationType,
    relatedTitle: r.relatedTitle,
    relatedSlug: r.relatedSlug ?? undefined,
    relatedUrl: r.relatedUrl ?? undefined,
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categoryPath: parseJson<string[]>(row.categoryPath, []),
    external,
    definition: row.definition,
    scope: row.scope,
    assumptionKeyInsight: row.assumptionKeyInsight ?? undefined,
    positions: positions.sort((a, b) => a.positionScore - b.positionScore),
    escalationLevels: escalationLevels.sort((a, b) => a.level - b.level),
    assumptions,
    abstractionRungs: abstractionRungs.sort((a, b) => a.sortOrder - b.sortOrder),
    coreValues,
    commonGround,
    evidenceItems,
    objectiveCriteria: objectiveCriteria.sort((a, b) => b.criteriaScore - a.criteriaScore),
    mediaResources,
    relatedTopics,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const FULL_INCLUDE = {
  positions: true,
  escalationLevels: true,
  assumptions: true,
  abstractionRungs: true,
  coreValues: true,
  commonGround: true,
  evidenceItems: true,
  objectiveCriteria: true,
  mediaResources: true,
  relatedTopics: true,
} as const;

export async function getDebateTopic(slug: string): Promise<DebateTopic | null> {
  const row = await db.debateTopic.findUnique({
    where: { slug },
    include: FULL_INCLUDE,
  });
  if (!row) return null;
  return mapTopicFromDb(row);
}

export async function listDebateTopics(): Promise<
  Array<{ id: number; slug: string; title: string; categoryPath: string[]; createdAt: Date }>
> {
  const rows = await db.debateTopic.findMany({
    select: { id: true, slug: true, title: true, categoryPath: true, createdAt: true },
    orderBy: { title: 'asc' },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    categoryPath: parseJson<string[]>(r.categoryPath, []),
    createdAt: r.createdAt,
  }));
}

export async function createDebateTopic(data: DebateTopic): Promise<DebateTopic> {
  const created = await db.debateTopic.create({
    data: {
      slug: data.slug,
      title: data.title,
      categoryPath: JSON.stringify(data.categoryPath),
      wikipediaUrl: data.external.wikipediaUrl ?? null,
      deweyDecimal: data.external.deweyDecimal ?? null,
      locSubjectHeading: data.external.locSubjectHeading ?? null,
      locUrl: data.external.locUrl ?? null,
      stanfordUrl: data.external.stanfordUrl ?? null,
      definition: data.definition,
      scope: data.scope,
      assumptionKeyInsight: data.assumptionKeyInsight ?? null,
      positions: {
        create: data.positions.map((p) => ({
          positionScore: p.positionScore,
          positionLabel: p.positionLabel,
          coreBelief: p.coreBelief,
          topArgument: p.topArgument,
          beliefScore: p.beliefScore,
          mediaUrl: p.mediaUrl ?? null,
        })),
      },
      escalationLevels: {
        create: data.escalationLevels.map((e) => ({
          level: e.level,
          levelLabel: e.levelLabel,
          description: e.description,
          example: e.example,
          principles: e.principles,
        })),
      },
      assumptions: {
        create: data.assumptions.map((a) => ({
          positionRange: a.positionRange,
          positionLabel: a.positionLabel,
          assumptions: JSON.stringify(a.assumptions),
        })),
      },
      abstractionRungs: {
        create: data.abstractionRungs.map((r) => ({
          sortOrder: r.sortOrder,
          rungLabel: r.rungLabel,
          proChain: r.proChain,
          conChain: r.conChain,
        })),
      },
      ...(data.coreValues
        ? {
            coreValues: {
              create: {
                supportingAdvertised: JSON.stringify(data.coreValues.supportingAdvertised),
                supportingActual: JSON.stringify(data.coreValues.supportingActual),
                opposingAdvertised: JSON.stringify(data.coreValues.opposingAdvertised),
                opposingActual: JSON.stringify(data.coreValues.opposingActual),
              },
            },
          }
        : {}),
      ...(data.commonGround
        ? {
            commonGround: {
              create: {
                agreements: JSON.stringify(data.commonGround.agreements),
                compromises: JSON.stringify(data.commonGround.compromises),
              },
            },
          }
        : {}),
      evidenceItems: {
        create: data.evidenceItems.map((e) => ({
          side: e.side,
          title: e.title,
          source: e.source,
          finding: e.finding,
          qualityScore: e.qualityScore,
          qualityLabel: e.qualityLabel,
          url: e.url ?? null,
        })),
      },
      objectiveCriteria: {
        create: data.objectiveCriteria.map((c) => ({
          name: c.name,
          description: c.description,
          criteriaScore: c.criteriaScore,
          validity: c.validity,
          reliability: c.reliability,
          linkage: c.linkage,
          importance: c.importance,
          url: c.url ?? null,
        })),
      },
      mediaResources: {
        create: data.mediaResources.map((m) => ({
          title: m.title,
          medium: m.medium,
          biasOrTone: m.biasOrTone,
          positivity: m.positivity,
          magnitude: m.magnitude,
          escalation: m.escalation,
          keyInsight: m.keyInsight,
          url: m.url ?? null,
        })),
      },
      relatedTopics: {
        create: data.relatedTopics.map((r) => ({
          relationType: r.relationType,
          relatedTitle: r.relatedTitle,
          relatedSlug: r.relatedSlug ?? null,
          relatedUrl: r.relatedUrl ?? null,
        })),
      },
    },
  });

  const full = await db.debateTopic.findUnique({
    where: { slug: created.slug },
    include: FULL_INCLUDE,
  });

  return mapTopicFromDb(full);
}
