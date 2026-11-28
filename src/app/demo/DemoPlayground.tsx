'use client'

/**
 * The interactive half of /demo: a chat-style lookup that resolves a
 * statement to its permanent page, and a transcript import that mines
 * candidates, lets the visitor review them (integrate / fold / dismiss),
 * and shows the page's outline afterwards. All writes go through the
 * capped demo routes; nothing here touches a score.
 */

import { useState } from 'react'
import Link from 'next/link'
import type { StatementLookup } from '@/lib/conversations/lookup'
import type { ImportedCandidate } from '@/lib/conversations/import'
import type { BeliefOutline, OutlineCluster } from '@/lib/conversations/outline'
import type { ExtractionResult } from '@/lib/conversations/extract'
import { CONVERSATION_PLATFORMS, type ConversationPlatform } from '@/lib/conversations/contract'
import { DEMO_MAX_ACTIONS_PER_REQUEST } from '@/lib/conversations/demo-caps'

interface BeliefOption {
  id: number
  slug: string
  statement: string
}

interface DemoPlaygroundProps {
  beliefs: BeliefOption[]
  sampleTranscript: string
}

type Status = 'idle' | 'submitting' | 'error' | 'done'

interface Issue {
  mode: string
  path: string
  message: string
}

interface ImportResponse {
  threadId: string
  reviewToken: string
  belief: BeliefOption | null
  beliefUrl: string | null
  candidates: ImportedCandidate[]
  skipped: ExtractionResult['skipped']
}

interface ReviewResponse {
  batchId: string | null
  batchUrl: string | null
  integrated: { candidateId: string; argumentId: number; beliefSlug: string }[]
  folded: string[]
  dismissed: string[]
}

type Decision = 'skip' | 'integrate' | 'fold' | 'dismiss'

interface DecisionState {
  action: Decision
  mechanism: string
  direction: 'pro' | 'con'
}

const BAND_LABEL: Record<string, string> = {
  'same-claim': 'same claim — fold it',
  'probable-group': 'probable restatement — fold or justify',
  'related-link': 'related — integrate, cluster recorded',
  distinct: 'distinct — extends the outline',
}

const SKIP_LABEL: Record<string, string> = {
  question: 'question',
  'fragment-or-label': 'fragment or topic label',
  'social-noise': 'social noise',
  'quoted-text': 'quoted someone else',
  'restates-focal-belief': 'restates the belief itself',
  'duplicate-in-thread': 'already said in this thread',
}

async function readJson<T>(response: Response): Promise<T & { error?: string; issues?: Issue[] }> {
  return (await response.json()) as T & { error?: string; issues?: Issue[] }
}

function describeError(data: { error?: string; issues?: Issue[] }, fallback: string): string {
  const issue = data.issues?.[0]?.message
  if (data.error && issue && data.error !== issue) return `${data.error} ${issue}`
  return data.error ?? issue ?? fallback
}

type Move = { candidateId: string; howItSupports?: string; direction: 'pro' | 'con' } | { fold: string } | { dismiss: string }

/** Split moves into requests the demo route accepts (capped per request). */
function chunkMoves(moves: Move[], size: number): Move[][] {
  const chunks: Move[][] = []
  for (let i = 0; i < moves.length; i += size) chunks.push(moves.slice(i, i + size))
  return chunks
}

function ClusterList({ clusters, side }: { clusters: OutlineCluster[]; side: 'pro' | 'con' }) {
  if (clusters.length === 0) {
    return <p className="text-xs text-[var(--muted-foreground)] italic">No {side} arguments yet — the outline extends here.</p>
  }
  return (
    <ul className="space-y-1">
      {clusters.map(c => (
        <li key={c.lead.id} className="text-sm">
          <Link href={`/beliefs/${c.lead.slug}`} className="text-[var(--accent)] hover:underline">
            {c.lead.label}
          </Link>
          {c.members.length > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]"> (+{c.members.length} restatement{c.members.length === 1 ? '' : 's'} combined)</span>
          )}
          {c.lead.score !== null && (
            <span className="text-xs text-[var(--muted-foreground)]"> · score {Math.round(c.lead.score * 10) / 10}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function OutlineView({ outline }: { outline: BeliefOutline }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border border-green-300 bg-green-50 p-3">
        <h4 className="text-xs uppercase tracking-wide text-green-800 font-semibold mb-2">Reasons to agree</h4>
        <ClusterList clusters={[...outline.pro.top, ...outline.pro.rest]} side="pro" />
      </div>
      <div className="border border-red-300 bg-red-50 p-3">
        <h4 className="text-xs uppercase tracking-wide text-red-800 font-semibold mb-2">Reasons to disagree</h4>
        <ClusterList clusters={[...outline.con.top, ...outline.con.rest]} side="con" />
      </div>
      {outline.gaps.length > 0 && (
        <div className="md:col-span-2 text-xs text-[var(--muted-foreground)]">
          <span className="font-semibold">Open gaps the next conversation could fill:</span>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            {outline.gaps.slice(0, 4).map(g => (
              <li key={`${g.side}-${g.answering}`}>{g.prompt}</li>
            ))}
          </ul>
        </div>
      )}
      {outline.incoming.length > 0 && (
        <p className="md:col-span-2 text-xs text-[var(--muted-foreground)]">
          {outline.incoming.length} candidate{outline.incoming.length === 1 ? '' : 's'} from conversations waiting on review.
        </p>
      )}
    </div>
  )
}

export default function DemoPlayground({ beliefs, sampleTranscript }: DemoPlaygroundProps) {
  // Step 1 — say it in chat
  const [statement, setStatement] = useState('You have to accept certified election results even when your side loses')
  const [lookup, setLookup] = useState<StatementLookup | null>(null)
  const [lookupStatus, setLookupStatus] = useState<Status>('idle')
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Step 2 — plug a thread into the page
  const [platform, setPlatform] = useState<ConversationPlatform>('reddit')
  const [title, setTitle] = useState('Do you actually have to accept election results if you think it was rigged?')
  const [beliefSlug, setBeliefSlug] = useState(beliefs[0]?.slug ?? '')
  const [transcript, setTranscript] = useState(sampleTranscript)
  const [importStatus, setImportStatus] = useState<Status>('idle')
  const [importError, setImportError] = useState<string | null>(null)
  const [imported, setImported] = useState<ImportResponse | null>(null)
  const [showSkipped, setShowSkipped] = useState(false)

  // Step 3 — review
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({})
  const [reviewStatus, setReviewStatus] = useState<Status>('idle')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState<ReviewResponse | null>(null)
  const [outlineAfter, setOutlineAfter] = useState<BeliefOutline | null>(null)

  const selectedBelief = beliefs.find(b => b.slug === beliefSlug) ?? imported?.belief ?? null

  async function runLookup() {
    setLookupStatus('submitting')
    setLookupError(null)
    try {
      const res = await fetch(`/api/v1/conversations/lookup?statement=${encodeURIComponent(statement.trim())}`)
      const data = await readJson<StatementLookup>(res)
      if (!res.ok) {
        setLookupStatus('error')
        setLookupError(data.error ?? 'Lookup failed.')
        return
      }
      setLookup(data)
      setLookupStatus('done')
      if (data.best) setBeliefSlug(data.best.belief.slug)
    } catch {
      setLookupStatus('error')
      setLookupError('Network error — try again.')
    }
  }

  async function runImport() {
    setImportStatus('submitting')
    setImportError(null)
    setImported(null)
    setReviewed(null)
    setReviewStatus('idle')
    setReviewError(null)
    setOutlineAfter(null)
    setDecisions({})
    try {
      const res = await fetch('/api/v1/conversations/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, title, beliefSlug, transcript }),
      })
      const data = await readJson<ImportResponse>(res)
      if (!res.ok) {
        setImportStatus('error')
        setImportError(describeError(data, 'Import failed.'))
        return
      }
      setImported(data)
      const initial: Record<string, DecisionState> = {}
      for (const c of data.candidates) {
        const restates = c.band === 'same-claim' || c.band === 'probable-group'
        initial[c.id] = {
          action: restates && c.nearestArgumentId !== null ? 'fold' : 'integrate',
          mechanism: '',
          direction: c.direction === 'con' ? 'con' : 'pro',
        }
      }
      setDecisions(initial)
      setImportStatus('done')
    } catch {
      setImportStatus('error')
      setImportError('Network error — try again.')
    }
  }

  function setDecision(id: string, patch: Partial<DecisionState>) {
    setDecisions(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function runReview() {
    if (!imported) return
    const moves: Move[] = []
    for (const c of imported.candidates) {
      const d = decisions[c.id]
      if (!d || d.action === 'skip') continue
      if (d.action === 'integrate') {
        moves.push({ candidateId: c.id, howItSupports: d.mechanism.trim() || undefined, direction: d.direction })
      } else if (d.action === 'fold') {
        moves.push({ fold: c.id })
      } else {
        moves.push({ dismiss: c.id })
      }
    }
    if (moves.length === 0) {
      setReviewStatus('error')
      setReviewError('Choose at least one move: integrate, fold, or dismiss.')
      return
    }

    setReviewStatus('submitting')
    setReviewError(null)
    try {
      // The demo route caps moves per request; larger reviews go in batches.
      const merged: ReviewResponse = { batchId: null, batchUrl: null, integrated: [], folded: [], dismissed: [] }
      for (const chunk of chunkMoves(moves, DEMO_MAX_ACTIONS_PER_REQUEST)) {
        const payload = {
          reviewToken: imported.reviewToken,
          integrate: chunk.filter((m): m is Extract<Move, { candidateId: string }> => 'candidateId' in m),
          fold: chunk.filter((m): m is { fold: string } => 'fold' in m).map(m => m.fold),
          dismiss: chunk.filter((m): m is { dismiss: string } => 'dismiss' in m).map(m => m.dismiss),
        }
        const res = await fetch(`/api/v1/conversations/demo/${imported.threadId}/integrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await readJson<ReviewResponse>(res)
        if (!res.ok) {
          setReviewStatus('error')
          setReviewError(describeError(data, 'Review failed.'))
          if (merged.integrated.length + merged.folded.length + merged.dismissed.length > 0) setReviewed(merged)
          return
        }
        merged.batchId = data.batchId ?? merged.batchId
        merged.batchUrl = data.batchUrl ?? merged.batchUrl
        merged.integrated.push(...data.integrated)
        merged.folded.push(...data.folded)
        merged.dismissed.push(...data.dismissed)
      }
      setReviewed(merged)
      setReviewStatus('done')
      if (imported.belief) {
        const outlineRes = await fetch(`/api/beliefs/${imported.belief.id}/outline`)
        if (outlineRes.ok) {
          const outlineData = (await outlineRes.json()) as { outline: BeliefOutline }
          setOutlineAfter(outlineData.outline)
        }
      }
    } catch {
      setReviewStatus('error')
      setReviewError('Network error — try again.')
    }
  }

  const stepBox = 'border border-gray-300 p-4 text-sm space-y-3 bg-gray-50'
  const label = 'text-xs text-[var(--muted-foreground)]'
  const input = 'mt-1 w-full border border-gray-300 p-2 bg-white'
  const button = 'px-4 py-2 border border-gray-400 bg-white font-medium disabled:opacity-50 hover:bg-gray-100'

  return (
    <div className="space-y-8">
      {/* Step 1 */}
      <section className={stepBox}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">1. Say it in chat</h2>
        <p className={label}>
          Type what someone just said. The statement resolves to its permanent page so the conversation starts where the last one left off.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className={`${input} mt-0 flex-1`}
            maxLength={500}
            value={statement}
            onChange={e => setStatement(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void runLookup() }}
          />
          <button type="button" className={button} disabled={lookupStatus === 'submitting' || !statement.trim()} onClick={() => void runLookup()}>
            {lookupStatus === 'submitting' ? 'Looking…' : 'Find the page'}
          </button>
        </div>
        {lookupError && <p className="text-red-700">{lookupError}</p>}
        {lookup && (
          <div className="space-y-3">
            {lookup.claimNotes.length > 0 && (
              <p className="text-xs text-amber-800 border-l-4 border-amber-400 bg-amber-50 p-2">
                {lookup.claimNotes[0]}
              </p>
            )}
            {lookup.best ? (
              <>
                <p>
                  <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Permanent page</span>
                  <br />
                  <Link href={lookup.best.url} className="text-[var(--accent)] hover:underline font-medium">
                    {lookup.best.belief.statement}
                  </Link>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {' '}· match {Math.round(lookup.matches[0].similarity * 100)}% ({lookup.matches[0].band})
                  </span>
                </p>
                <OutlineView outline={lookup.best.outline} />
                {lookup.best.recentThreads.length > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Conversations already plugged into this page:{' '}
                    {lookup.best.recentThreads.map(t => `“${t.title}” (${t.platform})`).join('; ')}
                  </p>
                )}
                {lookup.matches.length > 1 && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Other possible pages:{' '}
                    {lookup.matches.slice(1).map(m => (
                      <span key={m.belief.id}>
                        <Link href={m.url} className="text-[var(--accent)] hover:underline">{m.belief.statement}</Link>
                        {' '}({Math.round(m.similarity * 100)}%)
                        {'; '}
                      </span>
                    ))}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)]">
                No permanent page holds this claim yet. Suggested slug: <code>{lookup.newPage?.suggestedSlug}</code>. {lookup.newPage?.hint}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Step 2 */}
      <section className={stepBox}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">2. Plug a thread into the page</h2>
        <p className={label}>
          Paste a chat or forum thread, one <code>Author: message</code> per line. The transcript is stored verbatim and mined for candidate arguments; the graph does not move yet.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className={label}>Platform</span>
            <select className={input} value={platform} onChange={e => setPlatform(e.target.value as ConversationPlatform)}>
              {CONVERSATION_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className={label}>Thread title</span>
            <input type="text" className={input} value={title} onChange={e => setTitle(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Belief page it plugs into</span>
          <select className={input} value={beliefSlug} onChange={e => setBeliefSlug(e.target.value)}>
            {beliefs.map(b => <option key={b.slug} value={b.slug}>{b.statement}</option>)}
            {lookup?.best && !beliefs.some(b => b.slug === lookup.best?.belief.slug) && (
              <option value={lookup.best.belief.slug}>{lookup.best.belief.statement}</option>
            )}
          </select>
        </label>
        <label className="block">
          <span className={label}>Transcript</span>
          <textarea className={`${input} font-mono text-xs`} rows={9} value={transcript} onChange={e => setTranscript(e.target.value)} />
        </label>
        <button type="button" className={button} disabled={importStatus === 'submitting' || !transcript.trim() || !title.trim()} onClick={() => void runImport()}>
          {importStatus === 'submitting' ? 'Mining…' : 'Import and mine candidates'}
        </button>
        {importError && <p className="text-red-700">{importError}</p>}
        {imported && (
          <div className="space-y-3">
            <p className="text-green-700">
              Imported as thread <code>{imported.threadId}</code>: {imported.candidates.length} candidate{imported.candidates.length === 1 ? '' : 's'} mined,{' '}
              {imported.skipped.length} sentence{imported.skipped.length === 1 ? '' : 's'} skipped.
              {imported.beliefUrl && (
                <> Plugged into <Link href={imported.beliefUrl} className="text-[var(--accent)] hover:underline">{imported.belief?.statement}</Link>.</>
              )}
            </p>
            {imported.skipped.length > 0 && (
              <div>
                <button type="button" className="text-xs text-[var(--accent)] hover:underline" onClick={() => setShowSkipped(s => !s)}>
                  {showSkipped ? 'Hide' : 'Show'} what the miner skipped, and why
                </button>
                {showSkipped && (
                  <ul className="mt-1 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                    {imported.skipped.map((s, i) => (
                      <li key={`${s.messageIndex}-${i}`}>
                        <span className="text-[10px] uppercase tracking-wide border rounded px-1 mr-1">{SKIP_LABEL[s.reason] ?? s.reason}</span>
                        {s.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 3 */}
      {imported && (
        <section className={stepBox}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Review: extend, combine, or drop</h2>
          <p className={label}>
            Each candidate was scanned against the arguments already on the page. Distinct points extend the outline; restatements fold into the argument the page already has (no double-counting); noise is dismissed. Nothing moves until you apply the review.
          </p>
          {imported.candidates.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] italic">No standalone claims were mined from this transcript.</p>
          ) : (
            <div className="space-y-3">
              {imported.candidates.map(c => {
                const d = decisions[c.id]
                if (!d) return null
                return (
                  <div key={c.id} className="border border-gray-200 bg-white p-3 space-y-2">
                    <p>
                      <span className={`text-[10px] uppercase tracking-wide mr-2 ${c.direction === 'pro' ? 'text-green-700' : 'text-red-700'}`}>{c.direction}</span>
                      <span className="text-[var(--foreground)]">{c.statement}</span>
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      From message #{c.messageIndex}. {BAND_LABEL[c.band ?? 'distinct'] ?? c.band}
                      {c.nearestArgumentId !== null && c.similarity !== null && (
                        <> — nearest existing argument #{c.nearestArgumentId} (similarity {Math.round(c.similarity * 100)}%)</>
                      )}
                      {c.evidenceUrls.length > 0 && <> — {c.evidenceUrls.length} shared link{c.evidenceUrls.length === 1 ? '' : 's'} offered as evidence provenance</>}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {(['integrate', 'fold', 'dismiss', 'skip'] as Decision[]).map(action => (
                        <label key={action} className={`flex items-center gap-1 ${action === 'fold' && c.nearestArgumentId === null ? 'opacity-40' : ''}`}>
                          <input
                            type="radio"
                            name={`decision-${c.id}`}
                            checked={d.action === action}
                            disabled={action === 'fold' && c.nearestArgumentId === null}
                            onChange={() => setDecision(c.id, { action })}
                          />
                          {action === 'integrate' ? 'Integrate (extend the page)' : action === 'fold' ? 'Fold (combine with existing)' : action === 'dismiss' ? 'Dismiss' : 'Leave pending'}
                        </label>
                      ))}
                    </div>
                    {d.action === 'integrate' && (
                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          type="text"
                          className={`${input} mt-0 md:col-span-3`}
                          placeholder="How it bears on the page's claim (the linkage mechanism; auto-drafted and flagged if blank)"
                          value={d.mechanism}
                          onChange={e => setDecision(c.id, { mechanism: e.target.value })}
                        />
                        <select className={`${input} mt-0`} value={d.direction} onChange={e => setDecision(c.id, { direction: e.target.value as 'pro' | 'con' })}>
                          <option value="pro">pro</option>
                          <option value="con">con</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
              <button type="button" className={button} disabled={reviewStatus === 'submitting' || reviewStatus === 'done'} onClick={() => void runReview()}>
                {reviewStatus === 'submitting' ? 'Applying…' : reviewStatus === 'done' ? 'Review applied' : 'Apply the review through the firewall'}
              </button>
              {reviewError && <p className="text-red-700">{reviewError}</p>}
            </div>
          )}
        </section>
      )}

      {/* Step 4 */}
      {reviewed && (
        <section className={stepBox}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Where it landed</h2>
          <p className="text-green-700">
            {reviewed.integrated.length} integrated · {reviewed.folded.length} folded · {reviewed.dismissed.length} dismissed.
            {reviewed.batchUrl && (
              <> Batch record: <Link href={reviewed.batchUrl} className="text-[var(--accent)] hover:underline">{reviewed.batchId}</Link>.</>
            )}
          </p>
          {reviewed.integrated.length > 0 && (
            <ul className="text-xs text-[var(--muted-foreground)] list-disc pl-5">
              {reviewed.integrated.map(i => (
                <li key={i.candidateId}>
                  Argument #{i.argumentId} now lives under{' '}
                  <Link href={`/beliefs/${i.beliefSlug}`} className="text-[var(--accent)] hover:underline">/beliefs/{i.beliefSlug}</Link>
                  {' '}(<Link href={`/arguments/${i.argumentId}/linkage`} className="text-[var(--accent)] hover:underline">its linkage sub-debate</Link>).
                </li>
              ))}
            </ul>
          )}
          {outlineAfter && (
            <div className="space-y-2">
              <p className={label}>The page&apos;s outline now — this is what the next conversation starts from:</p>
              <OutlineView outline={outlineAfter} />
            </div>
          )}
          {selectedBelief && (
            <p>
              <Link href={`/beliefs/${selectedBelief.slug}`} className="ise-btn ise-btn--primary">
                Open the permanent page
              </Link>
            </p>
          )}
        </section>
      )}
    </div>
  )
}
