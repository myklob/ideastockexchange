// The belief→market half of the engagement loop: a belief page points at any
// open contract on its own score, so the reading loop and the returning loop
// close on the same page. Read-only over market tables; the firewall's
// one-way rule (prices never feed scores) is untouched — this file renders a
// link, not an input.

import { prisma } from '@/lib/prisma'

export interface BeliefMarketPointer {
  id: string
  contractType: string
  direction: string
  thresholdValue: number
  resolutionEpoch: string
  status: string
}

export async function openContractsForBelief(beliefId: number): Promise<BeliefMarketPointer[]> {
  return prisma.marketContract.findMany({
    where: { beliefId, status: { in: ['OPEN', 'FROZEN'] } },
    select: {
      id: true,
      contractType: true,
      direction: true,
      thresholdValue: true,
      resolutionEpoch: true,
      status: true,
    },
    orderBy: { resolutionEpoch: 'asc' },
  })
}
