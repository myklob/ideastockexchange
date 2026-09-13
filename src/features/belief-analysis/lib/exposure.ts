/**
 * Retraction exposure — database adapter.
 *
 * Feeds the pure engine (src/core/scoring/evidence-exposure.ts) from evidence
 * rows, and carries the display extras it has no business knowing about: the
 * belief each row sits under and its description.
 *
 * The per-belief readout is computed in the component from the rows the page
 * already has, so only the corpus-wide roll-up needs a query of its own.
 */

import { prisma } from '@/lib/prisma'
import {
  computeBeliefEvidenceExposure,
  type BeliefEvidenceExposure,
  type EvidenceExposureRow,
} from '@/core/scoring/evidence-exposure'

export interface CorpusExposureRow extends EvidenceExposureRow {
  description: string
  evidenceType: string
  belief: { id: number; slug: string; statement: string }
}

export interface CorpusExposureReadout
  extends Omit<BeliefEvidenceExposure, 'rows'> {
  rows: CorpusExposureRow[]
  /** Beliefs that have at least one evidence row. */
  beliefsWithEvidence: number
}

/**
 * Every evidence row in the corpus, ranked by the points that rest on its
 * unestablished standing. One query; the ranking and the totals are the same
 * engine the belief page uses, so the queue and the page cannot disagree.
 */
export async function fetchCorpusExposure(): Promise<CorpusExposureReadout> {
  const evidence = await prisma.evidence.findMany({
    select: {
      id: true,
      side: true,
      description: true,
      evidenceType: true,
      impactScore: true,
      verificationStatus: true,
      tierClaim: true,
      tierVerified: true,
      belief: { select: { id: true, slug: true, statement: true } },
    },
  })

  const beliefOf = new Map<number, { id: number; slug: string; statement: string }>()
  const meta = new Map<number, { description: string; evidenceType: string }>()
  for (const row of evidence) {
    beliefOf.set(row.id, row.belief)
    meta.set(row.id, { description: row.description, evidenceType: row.evidenceType })
  }

  const exposure = computeBeliefEvidenceExposure(evidence)
  const beliefsWithEvidence = new Set(evidence.map(row => row.belief.id)).size

  return {
    ...exposure,
    beliefsWithEvidence,
    rows: exposure.rows.map(row => {
      const id = Number(row.id)
      const extra = meta.get(id)
      return {
        ...row,
        description: extra?.description ?? '',
        evidenceType: extra?.evidenceType ?? 'T?',
        belief: beliefOf.get(id) ?? { id: 0, slug: '', statement: '' },
      }
    }),
  }
}
