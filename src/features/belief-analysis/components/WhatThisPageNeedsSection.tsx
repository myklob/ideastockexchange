import type { PageGap } from '../lib/gaps'
import SectionHeading from './SectionHeading'

interface WhatThisPageNeedsSectionProps {
  gaps: PageGap[]
}

/**
 * Named gaps, read off the tables above, so a newcomer sees exactly where a contribution goes. None of
 * them requires agreeing with the page. Renders nothing when the page has no gap to name.
 */
export default function WhatThisPageNeedsSection({ gaps }: WhatThisPageNeedsSectionProps) {
  if (!gaps.length) return null
  return (
    <section>
      <SectionHeading emoji="🛠" title="What This Page Needs Right Now" />
      <p className="text-sm text-gray-600 mb-3">
        Named gaps, updated as they fill. A strong entry in any of these raises the page&apos;s score, and
        none of them require agreeing with the page.
      </p>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-[#f0f3f6]">
            <th className="border border-gray-300 px-3 py-2 w-[8%]">#</th>
            <th className="border border-gray-300 px-3 py-2 w-[52%] text-left">The gap</th>
            <th className="border border-gray-300 px-3 py-2 w-[20%] text-left">Where it goes</th>
            <th className="border border-gray-300 px-3 py-2 w-[20%] text-left">Who is best placed to fill it</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((g, i) => (
            <tr key={g.where + i} className={i % 2 ? 'bg-[#f9f9f9]' : ''}>
              <td className="border border-gray-300 px-3 py-2 text-center">{i + 1}</td>
              <td className="border border-gray-300 px-3 py-2">{g.gap}</td>
              <td className="border border-gray-300 px-3 py-2">{g.where}</td>
              <td className="border border-gray-300 px-3 py-2">{g.who}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
