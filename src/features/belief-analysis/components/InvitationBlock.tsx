import type { PageGap } from '../lib/gaps'
import { invitationAsk } from '../lib/gaps'

interface InvitationBlockProps {
  hook?: string | null
  question?: string | null
  ask?: string | null
  gaps: PageGap[]
}

/**
 * The boxed block under the heading (template: INVITATION BLOCK). It is not a summary of the topic,
 * which Rule 2 forbids: it names an itch, asks the one question the page dissects, says why this is
 * not a feed, and points the reader who disagrees at one slot they can fill. The hook and question are
 * typed by the author; the slot is read off the page's own gaps when the author has not typed one.
 */
export default function InvitationBlock({ hook, question, ask, gaps }: InvitationBlockProps) {
  const h = (hook ?? '').trim()
  const q = (question ?? '').trim()
  return (
    <div className="border-2 border-[#0055a4] bg-[#f4f9ff] px-[18px] py-4 my-[18px]">
      {h && <p className="m-0 mb-[10px] text-[15px] font-bold">{h}</p>}
      {q && <p className="m-0 mb-[10px] text-[15px]">{q}</p>}
      {(h || q) && (
        <p className="m-0 mb-[10px] text-[13px] text-gray-700">
          One belief, both sides, ranked by how well the arguments hold up rather than how often they are
          repeated. Permanent, and open to revision by anyone with a better argument.
        </p>
      )}
      <p className="m-0 text-[13px] px-[10px] py-2 bg-white border-l-[3px] border-[#0055a4]">
        <strong>If you disagree, this page has a column for you.</strong> {invitationAsk(ask, gaps)}
      </p>
    </div>
  )
}
