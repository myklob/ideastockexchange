import type { UserProfileItem, DecisionRuleItem } from '../types'
import { formatScore, pairBySide, rankByScore, TABLE_TOP_LIMIT } from '../../belief-analysis/lib/ranking'
import ExpandableRows from '../../belief-analysis/components/ExpandableRows'

interface UserProfilesSectionProps {
  profiles: UserProfileItem[]
  decisionRules?: DecisionRuleItem[]
}

const TH = 'border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-100'
const TD = 'border border-gray-300 px-3 py-2 align-top'
const TDC = 'border border-gray-300 px-3 py-2 align-top text-center'

export default function UserProfilesSection({ profiles, decisionRules = [] }: UserProfilesSectionProps) {
  const ideal = rankByScore(profiles.filter(p => p.side === 'ideal'), p => p.score, Infinity).top
  const notIdeal = rankByScore(profiles.filter(p => p.side === 'not_ideal'), p => p.score, Infinity).top
  const pairs = pairBySide(ideal, notIdeal)
  const topPairs = pairs.length > 0 ? pairs.slice(0, TABLE_TOP_LIMIT) : [[null, null] as [UserProfileItem | null, UserProfileItem | null]]
  const restPairs = pairs.slice(TABLE_TOP_LIMIT)

  const rules = rankByScore(decisionRules, r => r.score)

  const pairRow = ([a, b]: [UserProfileItem | null, UserProfileItem | null], key: React.Key) => (
    <tr key={key}>
      <td className={TD}>{a?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(a?.score) ?? <span>&nbsp;</span>}</td>
      <td className={TD}>{b?.description ?? <span>&nbsp;</span>}</td>
      <td className={`${TDC} font-mono`}>{formatScore(b?.score) ?? <span>&nbsp;</span>}</td>
    </tr>
  )

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-2">👥 Who Should Buy This</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[42%]`}>Ideal for</th>
              <th className={`${TH} w-[8%] text-center`}>Score</th>
              <th className={`${TH} w-[42%]`}>Not ideal for</th>
              <th className={`${TH} w-[8%] text-center`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {topPairs.map((pair, i) => pairRow(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
            <ExpandableRows moreCount={restPairs.length} colSpan={4}>
              {restPairs.map((pair, i) => pairRow(pair, pair[0]?.id ?? pair[1]?.id ?? i))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2">Decision rules</h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-[88%]`}>
                If you prioritize [criterion], buy [this product / named alternative], because [evidence]
              </th>
              <th className={`${TH} w-[12%] text-center`}>Score</th>
            </tr>
          </thead>
          <tbody>
            {(rules.top.length > 0 ? rules.top : [null]).map((r, i) => (
              <tr key={r?.id ?? i}>
                <td className={TD}>
                  {r ? (
                    <>
                      <strong>{r.condition}:</strong> {r.advice}
                    </>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </td>
                <td className={`${TDC} font-mono`}>{formatScore(r?.score) ?? <span>&nbsp;</span>}</td>
              </tr>
            ))}
            <ExpandableRows moreCount={rules.rest.length} colSpan={2}>
              {rules.rest.map(r => (
                <tr key={r.id}>
                  <td className={TD}><strong>{r.condition}:</strong> {r.advice}</td>
                  <td className={`${TDC} font-mono`}>{formatScore(r.score) ?? <span>&nbsp;</span>}</td>
                </tr>
              ))}
            </ExpandableRows>
          </tbody>
        </table>
      </div>
    </section>
  )
}
