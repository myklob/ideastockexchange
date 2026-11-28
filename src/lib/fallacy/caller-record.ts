// Database derivation of a user's caller record. Side balance uses which
// side of its parent debate each accused argument sat on — an observable
// proxy for the essay's own-position/opposing-position split: a tribal
// caller flags one side of every debate they enter, and that skew is visible
// here without asking anyone to declare an ideology.

import { prisma } from '@/lib/prisma'
import { callerCredibility, type CallerRecord } from './calibration'

export async function callerRecordFor(userId: string): Promise<CallerRecord> {
  const claims = await prisma.fallacyClaim.findMany({
    where: { submittedById: userId },
    select: { status: true, argument: { select: { side: true } } },
  })

  const record: CallerRecord = {
    upheld: 0,
    rejected: 0,
    flaggedAgreeSide: 0,
    flaggedDisagreeSide: 0,
  }
  for (const claim of claims) {
    if (claim.status === 'confirmed') record.upheld++
    else if (claim.status === 'rejected') record.rejected++
    if (claim.argument.side === 'agree') record.flaggedAgreeSide++
    else record.flaggedDisagreeSide++
  }
  return record
}

export async function callerCredibilityFor(userId: string): Promise<number> {
  return callerCredibility(await callerRecordFor(userId))
}
