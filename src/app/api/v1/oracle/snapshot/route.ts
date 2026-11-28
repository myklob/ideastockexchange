import { prisma } from '@/lib/prisma'
import { marketJson } from '@/lib/markets/api'
import { signAttestation } from '@/lib/markets/oracle'
import { isValidEpochLabel } from '@/lib/markets/epoch'

/**
 * GET /api/v1/oracle/snapshot?belief_id={id}&epoch={YYYY-MM}
 *
 * The one-way export: a cryptographically signed attestation of an immutable
 * EpochSnapshot, so external conditional-token markets (or any consumer) can
 * settle against ISE argument evaluation entirely on their side.
 *
 * The integration rule applies with full force here: we stream signed
 * records OUT. No external price, volume, or order book ever pipes back in.
 * `keySource: "ephemeral-dev"` means no ORACLE_PRIVATE_KEY_PEM is configured
 * and the signature must not be treated as a stable oracle identity.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const beliefIdRaw = sp.get('belief_id')
  const epoch = sp.get('epoch')

  const beliefId = beliefIdRaw ? parseInt(beliefIdRaw, 10) : NaN
  if (!Number.isFinite(beliefId)) {
    return marketJson({ error: 'belief_id (integer) is required.' }, { status: 422 })
  }
  if (!epoch || !isValidEpochLabel(epoch)) {
    return marketJson({ error: 'epoch ("YYYY-MM") is required.' }, { status: 422 })
  }

  const snapshot = await prisma.epochSnapshot.findUnique({
    where: { beliefId_epoch: { beliefId, epoch } },
    include: { belief: { select: { slug: true } } },
  })
  if (!snapshot) {
    return marketJson(
      { error: `No snapshot for belief ${beliefId} at epoch ${epoch}. Snapshots exist only for completed epochs.` },
      { status: 404 },
    )
  }

  const attestation = signAttestation({
    snapshotId: snapshot.id,
    beliefId: snapshot.beliefId,
    beliefSlug: snapshot.belief.slug,
    epoch: snapshot.epoch,
    truthScore: snapshot.truthScore,
    algorithmVersion: snapshot.algorithmVersion,
    createdAt: snapshot.createdAt.toISOString(),
  })

  return marketJson({ attestation })
}
