'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StrongestOpposing {
  id: number
  claim: string
  impactScore: number
}

interface NearDuplicate {
  id: number
  claim: string
  similarity: number
}

interface AddArgumentFormProps {
  beliefId: number
  /** High-stakes beliefs route the post through the speed-bump flow. */
  highStakes: boolean
  /** Strongest current argument per side, for the steelman acknowledgment. */
  strongestAgree: StrongestOpposing | null
  strongestDisagree: StrongestOpposing | null
}

/**
 * The add-a-row move: post a new reason to agree or disagree. The reason
 * becomes a belief page of its own and the engine scores it — no score is
 * ever submitted from here (audit lock).
 *
 * On high-stakes beliefs the form walks the two speed bumps the API enforces:
 * acknowledge the strongest point on the other side, and check the proposal
 * against the moral principle it claims to rest on.
 */
export default function AddArgumentForm({
  beliefId,
  highStakes,
  strongestAgree,
  strongestDisagree,
}: AddArgumentFormProps) {
  const router = useRouter()
  const [side, setSide] = useState<'agree' | 'disagree'>('agree')
  const [statement, setStatement] = useState('')
  const [claim, setClaim] = useState('')
  const [rationale, setRationale] = useState('')
  const [steelmanAcknowledged, setSteelmanAcknowledged] = useState(false)
  const [principle, setPrinciple] = useState('')
  const [principleConsistent, setPrincipleConsistent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [nearDuplicate, setNearDuplicate] = useState<NearDuplicate | null>(null)
  const [restatementAcknowledged, setRestatementAcknowledged] = useState(false)

  const strongestOpposing = side === 'agree' ? strongestDisagree : strongestAgree
  const bumpsRequired = highStakes
  const bumpsSatisfied =
    !bumpsRequired ||
    ((strongestOpposing == null || steelmanAcknowledged) &&
      principle.trim().length > 0 &&
      principleConsistent)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch(`/api/beliefs/${beliefId}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          statement,
          claim: claim || undefined,
          rationale: rationale || undefined,
          ...(nearDuplicate && restatementAcknowledged
            ? { restatementAcknowledgedId: nearDuplicate.id }
            : {}),
          ...(bumpsRequired
            ? {
                steelmanArgumentId: strongestOpposing?.id,
                principle,
                principleConsistent,
              }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error ?? 'Submission failed.')
        // Drift guard: keep the flagged row so the user can acknowledge it
        // and post again — the documented recovery path.
        if (data.nearDuplicate) {
          setNearDuplicate(data.nearDuplicate)
          setRestatementAcknowledged(false)
        }
        return
      }
      setStatus('done')
      setStatement('')
      setClaim('')
      setRationale('')
      setNearDuplicate(null)
      setRestatementAcknowledged(false)
      router.refresh()
    } catch {
      setStatus('error')
      setError('Network error — try again.')
    }
  }

  return (
    <form onSubmit={submit} className="border border-gray-300 p-4 text-sm space-y-3 bg-gray-50">
      <p className="font-semibold">
        Add a reason {highStakes && <span className="text-xs font-normal text-[var(--muted-foreground)]">(high-stakes belief — speed bumps apply)</span>}
      </p>

      <div className="flex gap-4">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="side"
            checked={side === 'agree'}
            onChange={() => setSide('agree')}
          />
          Reason to agree
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="side"
            checked={side === 'disagree'}
            onChange={() => setSide('disagree')}
          />
          Reason to disagree
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-[var(--muted-foreground)]">
          The claim — a standalone statement with a truth value. It becomes a belief page of its own.
        </span>
        <textarea
          className="mt-1 w-full border border-gray-300 p-2"
          rows={2}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="e.g. Cash transfers reduce recipient stress measurably"
          required
          minLength={10}
        />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--muted-foreground)]">Short table label (2–6 words, optional)</span>
        <input
          className="mt-1 w-full border border-gray-300 p-2"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="e.g. Reduces recipient stress"
        />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--muted-foreground)]">Why does this belong here? (rationale, stored in the audit log)</span>
        <textarea
          className="mt-1 w-full border border-gray-300 p-2"
          rows={2}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>

      {bumpsRequired && (
        <div className="border-l-4 border-amber-400 bg-amber-50 p-3 space-y-2">
          <p className="font-medium">Speed bumps</p>
          {strongestOpposing ? (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={steelmanAcknowledged}
                onChange={(e) => setSteelmanAcknowledged(e.target.checked)}
              />
              <span>
                I have read the strongest point on the other side —{' '}
                <em>&ldquo;{strongestOpposing.claim}&rdquo;</em>{' '}
                (impact {strongestOpposing.impactScore >= 0 ? '+' : ''}
                {strongestOpposing.impactScore.toFixed(1)}) — and my reason is not already
                answered by it.
              </span>
            </label>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              No opposing arguments yet — the steelman acknowledgment is waived.
            </p>
          )}
          <label className="block">
            <span className="text-xs text-[var(--muted-foreground)]">
              The moral principle this reason rests on
            </span>
            <input
              className="mt-1 w-full border border-gray-300 p-2"
              value={principle}
              onChange={(e) => setPrinciple(e.target.value)}
              placeholder="e.g. No one who works full-time should live in poverty"
            />
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={principleConsistent}
              onChange={(e) => setPrincipleConsistent(e.target.checked)}
            />
            <span>
              I have checked that what I am proposing is consistent with this principle —
              including where it cuts against my side.
            </span>
          </label>
        </div>
      )}

      {error && <p className="text-red-700">{error}</p>}
      {nearDuplicate && (
        <div className="border-l-4 border-amber-400 bg-amber-50 p-3 space-y-2">
          <p className="text-xs">
            Flagged as a restatement of:{' '}
            <em>&ldquo;{nearDuplicate.claim}&rdquo;</em>{' '}
            ({Math.round(nearDuplicate.similarity * 100)}% similar)
          </p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={restatementAcknowledged}
              onChange={(e) => setRestatementAcknowledged(e.target.checked)}
            />
            <span className="text-xs">
              I have read that row and my point genuinely differs — post anyway. The uniqueness
              discount will price whatever overlap remains.
            </span>
          </label>
        </div>
      )}
      {status === 'done' && (
        <p className="text-green-700">
          Posted. The engine has scored it and updated every dependent conclusion.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || !bumpsSatisfied || statement.trim().length < 10}
        className="px-4 py-2 border border-gray-400 bg-white font-medium disabled:opacity-50 hover:bg-gray-100"
      >
        {status === 'submitting' ? 'Posting…' : 'Post — the engine scores it'}
      </button>
      <p className="text-xs text-[var(--muted-foreground)]">
        No score is submitted from this form. Linkage starts at the schema default and is
        debatable on the argument&apos;s linkage page; impact is computed by the engine.
      </p>
    </form>
  )
}
