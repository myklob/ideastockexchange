import type { ArgumentWithBelief, EvidenceItem, ObjectiveCriteriaItem } from '../types'

/**
 * What a belief page needs right now, read off its own tables. The template's "What This Page Needs
 * Right Now" section and the invitation block's ask both come from here, so the page never invites a
 * contribution to a slot that is already full.
 */
export interface PageGap {
  /** The gap, stated as the shape of the contribution wanted, not a topic label. */
  gap: string
  /** The table and column it goes in. */
  where: string
  /** Who is best placed to fill it. */
  who: string
}

const impact = (a: ArgumentWithBelief) => Math.abs(a.impactScore ?? 0)

function strongest(args: ArgumentWithBelief[], side: string): ArgumentWithBelief | null {
  const rows = args.filter(a => a.side === side)
  if (!rows.length) return null
  return rows.reduce((best, a) => (impact(a) > impact(best) ? a : best), rows[0])
}

const label = (a: ArgumentWithBelief) => (a.belief?.statement ?? a.claim ?? '').replace(/\.$/, '')

export function pageGaps(
  args: ArgumentWithBelief[],
  evidence: EvidenceItem[],
  criteria: ObjectiveCriteriaItem[],
): PageGap[] {
  const out: PageGap[] = []
  const agree = args.filter(a => a.side === 'agree').length
  const disagree = args.filter(a => a.side === 'disagree').length
  if (disagree < Math.max(1, agree) || agree < Math.max(1, disagree)) {
    const weak = disagree <= agree ? 'disagree' : 'agree'
    const top = strongest(args, weak === 'disagree' ? 'agree' : 'disagree')
    out.push({
      gap: top
        ? `A reason to ${weak} that answers: “${label(top)}”`
        : `A first reason to ${weak}`,
      where: `Argument Trees, Reasons to ${weak}`,
      who: 'someone who holds the opposing position',
    })
  }
  const supporting = evidence.filter(e => /support|agree|strengthen/i.test(e.side)).length
  const weakening = evidence.filter(e => /weaken|disagree|against/i.test(e.side)).length
  if (!evidence.length) {
    out.push({
      gap: 'A study, record or dataset that bears on this belief directly; every row above rests on argument alone',
      where: 'Evidence Ledger',
      who: 'anyone with the source',
    })
  } else if (!supporting || !weakening) {
    out.push({
      gap: `A finding on the ${supporting ? 'weakening' : 'supporting'} side, which has none yet`,
      where: `Evidence Ledger, ${supporting ? 'Weakening' : 'Supporting'}`,
      who: 'anyone with the source',
    })
  }
  const unread = criteria.find(c => !(c.currentStatus ?? '').trim())
  if (!criteria.length) {
    out.push({
      gap: 'A measurement both sides would accept in advance, with the reading each side predicts',
      where: 'Objective Criteria',
      who: 'anyone who can name a yardstick the other side would sign',
    })
  } else if (unread) {
    out.push({
      gap: `The first sourced reading of: “${unread.description.replace(/\.$/, '')}”`,
      where: 'Objective Criteria, Latest Reading',
      who: 'anyone with the number',
    })
  }
  return out.slice(0, 3)
}

/** The one slot the invitation names: a typed ask if the author wrote one, else the first derived gap. */
export function invitationAsk(typed: string | null | undefined, gaps: PageGap[]): string {
  const t = (typed ?? '').trim()
  if (t) return t
  if (gaps.length) return `${gaps[0].gap}.`
  return 'Any reason, finding or yardstick this page does not have yet.'
}
