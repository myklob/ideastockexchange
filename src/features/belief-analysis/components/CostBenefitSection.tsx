import Link from 'next/link'
import type { CostBenefitData, CostBenefitItemRow, ImpactData, ImpactEntryItem, CompromiseItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../lib/ranking'
import ExpandableRows from './ExpandableRows'

interface CostBenefitSectionProps {
  cba: CostBenefitData | null
  /** Row-based benefit/cost claims, ranked by Expected Value. */
  items?: CostBenefitItemRow[]
  /** Short vs. long-term impacts render as a sub-table inside the CBA section. */
  impact?: ImpactData | null
  /** Row-based short/long-term impacts, ranked by score. */
  impactEntries?: ImpactEntryItem[]
  /** Best Compromise Solutions render as a sub-table inside the CBA section. */
  compromises: CompromiseItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

function lines(text: string | null | undefined): React.ReactNode {
  if (!text) return <span>&nbsp;</span>
  return text.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
}

/** Join two free-text columns into one cell, skipping blanks. */
function joined(a: string | null | undefined, b: string | null | undefined): React.ReactNode {
  const parts = [a, b].filter(Boolean) as string[]
  if (parts.length === 0) return <span>&nbsp;</span>
  return lines(parts.join('\n'))
}

function pct(likelihood: number | null | undefined): string | null {
  if (likelihood == null) return null
  return `${Math.round(likelihood * 100)}%`
}

function ItemRow({ item }: { item: CostBenefitItemRow | null }) {
  return (
    <tr>
      <td className={TD}>
        {item ? (
          item.claimBelief ? (
            <Link href={`/beliefs/${item.claimBelief.slug}`} className="text-[var(--accent)] hover:underline">
              {item.claim}
            </Link>
          ) : (
            item.claim
          )
        ) : (
          <span>&nbsp;</span>
        )}
      </td>
      <td className={TDC}>{item?.category ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(item?.magnitude) ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{pct(item?.likelihood) ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(item?.expectedValue) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

/**
 * One side of the CBA (Benefits or Costs and Risks): rows ranked by Expected
 * Value, then one subtotal row per category — unlike categories (dollars,
 * life-years, hours, freedom) never sum together.
 */
function ItemsTable({
  items,
  header,
  headerClass,
  claimHeader,
}: {
  items: CostBenefitItemRow[]
  header: string
  headerClass: string
  claimHeader: string
}) {
  const { top, rest } = rankByScore(items, i => i.expectedValue)
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[]
  const subtotal = (cat: string) =>
    items
      .filter(i => i.category === cat && i.expectedValue != null)
      .reduce((sum, i) => sum + (i.expectedValue as number), 0)

  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr>
          <th className={`border border-gray-300 text-center font-semibold px-3 py-2 ${headerClass}`} colSpan={5}>
            {header}
          </th>
        </tr>
        <tr className="bg-gray-100 text-xs">
          <th className={`${TH} w-[34%]`}>{claimHeader}</th>
          <th className={`${TH} text-center w-[16%]`}>Category (Units)</th>
          <th className={`${TH} text-center w-[16%]`}>Magnitude</th>
          <th className={`${TH} text-center w-[14%]`}>Likelihood %</th>
          <th className={`${TH} text-center w-[20%]`}>Expected Value</th>
        </tr>
      </thead>
      <tbody>
        {(top.length > 0 ? top : [null]).map((item, i) => (
          <ItemRow key={item?.id ?? i} item={item} />
        ))}
        <ExpandableRows moreCount={rest.length} colSpan={5}>
          {rest.map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ExpandableRows>
        {categories.length > 0 ? (
          categories.map(cat => (
            <tr key={cat} className="bg-gray-100 italic text-[#666]">
              <td className={`${TD} text-right font-semibold`} colSpan={4}>
                Subtotal ({cat} only):
              </td>
              <td className={`${TDC} font-mono`}>{formatScore(subtotal(cat))}</td>
            </tr>
          ))
        ) : (
          <tr className="bg-gray-100 italic text-[#666]">
            <td className={`${TD} text-right font-semibold`} colSpan={4}>
              Subtotal (within each category only):
            </td>
            <td className={TDC}>&nbsp;</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function ImpactPairRow({ s, l }: { s: ImpactEntryItem | null; l: ImpactEntryItem | null }) {
  return (
    <tr>
      <td className={TD}>{s?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(s?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{l?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(l?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )
}

export default function CostBenefitSection({
  cba,
  items = [],
  impact,
  impactEntries = [],
  compromises,
}: CostBenefitSectionProps) {
  const benefits = items.filter(i => i.side === 'benefit')
  const costs = items.filter(i => i.side === 'cost')

  const shortTerm = rankByScore(impactEntries.filter(e => e.term === 'short'), e => e.score, Infinity).top
  const longTerm = rankByScore(impactEntries.filter(e => e.term === 'long'), e => e.score, Infinity).top
  const impactPairs = pairBySide(shortTerm, longTerm)
  const topImpactPairs = impactPairs.slice(0, TABLE_TOP_LIMIT)
  const restImpactPairs = impactPairs.slice(TABLE_TOP_LIMIT)

  const rankedCompromises = rankByScore(compromises, c => c.score)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
          <span>&#9878;</span>
          <Link href="/cost-benefit%20analysis" className="text-[var(--accent)] hover:underline">Cost-Benefit Analysis</Link>
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Every cost and benefit is itself a debatable claim with its own argument tree. Magnitude is
          an estimate in explicit units. Likelihood is computed from how that claim&apos;s pro and con
          arguments score, never assigned by gut. Expected Value = Magnitude &times; Likelihood.
        </p>
        {items.length > 0 ? (
          <div className="space-y-4">
            <ItemsTable
              items={benefits}
              header="✅ Benefits"
              headerClass="bg-green-100"
              claimHeader="Benefit Claim (links to its own page)"
            />
            <ItemsTable
              items={costs}
              header="❌ Costs and Risks"
              headerClass="bg-red-100"
              claimHeader="Cost Claim (links to its own page)"
            />
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className={`${TH} w-1/2`}>Benefits</th>
                <th className={`${TH} w-1/2`}>Costs and Risks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TD}>{lines(cba?.benefits)}</td>
                <td className={TD}>{lines(cba?.costs)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#127919;</span> Short vs. Long-Term Impacts
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[42%]`}>Short-Term (0-2 Years)</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
              <th className={`${TH} w-[42%]`}>Long-Term (5+ Years)</th>
              <th className={`${TH} text-center w-[8%]`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {impactPairs.length > 0 ? (
              <>
                {topImpactPairs.map(([s, l], i) => (
                  <ImpactPairRow key={s?.id ?? l?.id ?? i} s={s} l={l} />
                ))}
                <ExpandableRows moreCount={restImpactPairs.length} colSpan={4}>
                  {restImpactPairs.map(([s, l], i) => (
                    <ImpactPairRow key={s?.id ?? l?.id ?? i} s={s} l={l} />
                  ))}
                </ExpandableRows>
              </>
            ) : (
              <tr>
                <td className={TD}>{joined(impact?.shortTermEffects, impact?.shortTermCosts)}</td>
                <td className={TDC}>&nbsp;</td>
                <td className={TD}>{joined(impact?.longTermEffects, impact?.longTermChanges)}</td>
                <td className={TDC}>&nbsp;</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span>&#129309;</span>
          <Link href="/Compromise" className="text-[var(--accent)] hover:underline">Best Compromise Solutions</Link>
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${TH} w-[28%]`}>Shared Premise Both Sides Accept</th>
              <th className={`${TH} w-[30%]`}>Proposed Synthesis</th>
              <th className={`${TH} w-[28%]`}>Why This Is Difficult</th>
              <th className={`${TH} text-center w-[14%]`}>Score (interests satisfied)</th>
            </tr>
          </thead>
          <tbody>
            {(rankedCompromises.top.length > 0 ? rankedCompromises.top : [null]).map((c, i) => (
              <tr key={c?.id ?? i}>
                <td className={TD}>{lines(c?.sharedPremise)}</td>
                <td className={TD}>{lines(c?.synthesis ?? c?.description)}</td>
                <td className={TD}>{lines(c?.whyDifficult)}</td>
                <td className={`${TDC} font-mono`}>{formatScore(c?.score) ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
            <ExpandableRows moreCount={rankedCompromises.rest.length} colSpan={4}>
              {rankedCompromises.rest.map(c => (
                <tr key={c.id}>
                  <td className={TD}>{lines(c.sharedPremise)}</td>
                  <td className={TD}>{lines(c.synthesis ?? c.description)}</td>
                  <td className={TD}>{lines(c.whyDifficult)}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(c.score) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
