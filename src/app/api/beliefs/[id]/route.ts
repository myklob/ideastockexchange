import { NextResponse } from 'next/server'
import { fetchBeliefById, computeBeliefScores } from '@/features/belief-analysis/data/fetch-belief'
import { toSpectrumCoordinates } from '@/features/belief-analysis/spectrum-coordinates'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const beliefId = parseInt(id, 10)

  if (isNaN(beliefId)) {
    return NextResponse.json({ error: 'Invalid belief ID' }, { status: 400 })
  }

  const belief = await fetchBeliefById(beliefId)

  if (!belief) {
    return NextResponse.json({ error: 'Belief not found' }, { status: 404 })
  }

  const scores = computeBeliefScores(belief)

  // Spec shape per /One Page Per Belief: Technical Specification §1.
  // Returned alongside the existing `belief` payload so existing consumers don't break.
  const upstreamBeliefs = belief.upstreamMappings.map(m => String(m.parentBelief.id))
  const downstreamBeliefs = belief.downstreamMappings.map(m => String(m.childBelief.id))
  const linkedEvidence = belief.evidence.map(ev => ({
    evidence_id: String(ev.id),
    metadata: {
      url: ev.sourceUrl ?? null,
      tier: ev.evidenceType,
    },
  }))

  return NextResponse.json({
    belief,
    scores,
    spec: {
      belief_id: String(belief.id),
      canonical_text: belief.statement,
      spectrum_coordinates: toSpectrumCoordinates({
        positivity: belief.positivity,
        specificity: belief.specificity,
        claimStrength: belief.claimStrength,
      }),
      parent_topic_id: belief.category ?? null,
      linked_evidence: linkedEvidence,
      upstream_beliefs: upstreamBeliefs,
      downstream_beliefs: downstreamBeliefs,
    },
  })
}
