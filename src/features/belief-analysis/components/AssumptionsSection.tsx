import type { AssumptionItem, ComponentClaimItem } from '../types'
import SectionHeading from './SectionHeading'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface AssumptionsSectionProps {
  assumptions: AssumptionItem[]
  /** Logical Anatomy rows: the component claims inside the belief statement. */
  componentClaims?: ComponentClaimItem[]
  /** The belief decomposed into ANDs/ORs, e.g. "[This belief] = [Part 1] AND [Part 2]". */
  logicalForm?: string | null
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function strengthBadge(strength: string): string {
  switch (strength) {
    case 'CRITICAL': return 'bg-red-100 text-red-800'
    case 'STRONG': return 'bg-orange-100 text-orange-800'
    case 'MODERATE': return 'bg-yellow-100 text-yellow-800'
    case 'WEAK': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function ComponentClaimRow({ c }: { c: ComponentClaimItem | null }) {
  return (
    <tr>
      <td className={TD}>{c?.claim ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c?.claimType ?? <span>&nbsp;</span>}</td>
      <td className={TDC}>{c ? (c.stated ? 'Stated' : 'Implied') : <span>&nbsp;</span>}</td>
      <td className={TDC}>
        {c?.survivesWithout == null ? (
          <span>&nbsp;</span>
        ) : c.survivesWithout ? (
          'Yes'
        ) : (
          <strong>No = load-bearing</strong>
        )}
      </td>
      <td className={TD}>{c?.unstatedAssumptions ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

function AssumptionCell({ a }: { a: AssumptionItem | null }) {
  if (!a) return <span>&nbsp;</span>
  return (
    <>
      {a.statement}
      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${strengthBadge(a.strength)}`}>
        {a.strength}
      </span>
    </>
  )
}

export default function AssumptionsSection({
  assumptions,
  componentClaims = [],
  logicalForm,
}: AssumptionsSectionProps) {
  const accept = rankByScore(assumptions.filter(a => a.side === 'accept'), a => a.score, Infinity).top
  const reject = rankByScore(assumptions.filter(a => a.side === 'reject'), a => a.score, Infinity).top
  const pairs = pairBySide(accept, reject)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [AssumptionItem | null, AssumptionItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const claims = rankByScore(componentClaims, c => c.score)

  return (
    <section className="space-y-6">
      <div>
        <SectionHeading
          emoji="&#x1F4A1;"
          title="Logical Anatomy and Foundational Assumptions"
          href="/algorithms/assumptions"
        />
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          A belief statement that reads as one claim is usually several claims wearing one sentence.
          If the belief is a chain of ANDs, it is exactly as strong as its weakest load-bearing part.
        </p>
        <p className="text-sm mb-3">
          <strong>Logical form:</strong>{' '}
          {logicalForm ?? (
            <span className="text-[var(--muted-foreground)] italic">
              [This belief] = [Part 1] AND [Part 2] AND ([Part 3] OR [Part 4])
            </span>
          )}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-xs">
                <th className={`${TH} w-[30%]`}>Component Claim (stated or implied)</th>
                <th className={`${TH} text-center w-[14%]`}>Type</th>
                <th className={`${TH} text-center w-[12%]`}>Stated?</th>
                <th className={`${TH} text-center w-[18%]`}>If this part is false, does the belief survive?</th>
                <th className={`${TH} w-[18%]`}>Unstated assumptions this part relies on</th>
                <th className={`${TH} text-center w-[8%]`}>Score</th>
              </tr>
            </thead>
            <tbody>
              {(claims.top.length > 0 ? claims.top : [null]).map((c, i) => (
                <ComponentClaimRow key={c?.id ?? i} c={c} />
              ))}
              <ExpandableRows moreCount={claims.rest.length} colSpan={6}>
                {claims.rest.map(c => (
                  <ComponentClaimRow key={c.id} c={c} />
                ))}
              </ExpandableRows>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2">Assumptions by Side</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className={`${TH} w-[42%]`}>Required to Accept This Belief</th>
                <th className={`${TH} text-center w-[8%]`}>Score</th>
                <th className={`${TH} w-[42%]`}>Required to Reject This Belief</th>
                <th className={`${TH} text-center w-[8%]`}>Score</th>
              </tr>
            </thead>
            <tbody>
              {topPairs.map(([a, r], i) => (
                <tr key={a?.id ?? r?.id ?? i}>
                  <td className={TD}><AssumptionCell a={a} /></td>
                  <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
                  <td className={TD}><AssumptionCell a={r} /></td>
                  <td className={`${TDC} font-mono`}>{formatScore(r?.score) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
              <ExpandableRows moreCount={restPairs.length} colSpan={4}>
                {restPairs.map(([a, r], i) => (
                  <tr key={a?.id ?? r?.id ?? i}>
                    <td className={TD}><AssumptionCell a={a} /></td>
                    <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
                    <td className={TD}><AssumptionCell a={r} /></td>
                    <td className={`${TDC} font-mono`}>{formatScore(r?.score) ?? <span>&nbsp;</span>}</td>
                  </tr>
                ))}
              </ExpandableRows>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
