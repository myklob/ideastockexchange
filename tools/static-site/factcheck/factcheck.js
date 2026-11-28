export const meta = {
  name: 'factcheck-rows',
  description: 'Fact-check published rows: one adversarial check per batch, a primary-source second look at anything flagged, and an attempt to refute every proposed correction',
  phases: [
    { title: 'Check', detail: 'one adversarial pass per batch: find the detail most likely to be wrong' },
    { title: 'Second look', detail: 'flagged rows confirmed, corrected or left unverifiable from a primary source' },
    { title: 'Refute', detail: 'every proposed correction gets a check whose only job is to refute it' },
  ],
}
// What the November 2026 re-check of 3,156 rows, and a calibration on 10 of its batches (209 rows, 28 known
// corrections), taught. This script is shaped by it:
// - One adversarial first check, in the November wording below. On the calibration it caught 26 of 28 corrections at
//   about 26 turns an agent. The November confirming pass beside it cost as much again and found the other 2, which is
//   the price of a second pass: about double the first-check cost for the last 7% of corrections. A different
//   wording that asked for the riskiest detail of every row and several fetches per turn was more precise (3 settled
//   rows flagged instead of 14) but took 56 turns an agent and caught 24, so it is not used.
// - Not Sonnet for the first check: it caught 14 of 28, mostly by confirming rows from memory or noting the very
//   detail that made a row wrong and passing it anyway. It cost about a seventh as much.
// - The refute check is not optional: it dropped 51 of 184 proposed corrections (a reading the row does not make,
//   a gap inside the row's own "roughly", a citation slip that is not a wrong fact).
// - Cost is turns x context: every turn re-reads the whole context, which starts near 80,000 tokens for a default
//   workflow agent and near 38,000 for an agent with five tools. args.agentType 'fact-checker'
//   (.claude/agents/fact-checker.md) is that small agent; a session loads agent types when it starts, so it needs a
//   session started after the file existed, and its saving is not yet measured.
// - WebSearch is capped per turn across every agent launched in it, so each agent is rationed and reaches sources
//   with WebFetch; a run launched in one turn shares one allowance.
// - Agents see the owner's messages to the session, so prompts say to ignore deadlines and limits mentioned there.
// - Nothing is returned that matters: verdicts.py rebuilds every verdict from the run's journal, which survives a
//   run that dies on a usage limit.
//
// args: { dir, today, checks: [n], looks: [{n, ids}], refutes: [{n, id}], models: {check, look, refute}, agentType, ration }
//   dir      absolute path of the batch folder (batch_NNN.json, and owed.json written by verdicts.py)
//   checks   batches to take from the start; looks and refutes are work verdicts.py found still owed
//   models   optional per stage, e.g. {check: 'sonnet'}; a stage left out runs on the session's model
//   only     'check' runs the first check alone, as a calibration against verdicts already known

const DIR = args.dir, today = args.today, M = args.models || {}, TYPE = args.agentType, RATION = args.ration || 5
const opt = (stage, label, phase, schema) =>
  Object.assign({ label, phase, schema }, M[stage] ? { model: M[stage] } : {}, TYPE ? { agentType: TYPE } : {})
const file = (n) => `${DIR}/batch_${String(n).padStart(3, '0')}.json`
const str = { type: 'string' }
const item = (verdicts) => ({ type: 'object', properties: { id: { type: 'integer' }, verdict: { type: 'string', enum: verdicts },
  why: str, source_url: str, correct: str }, required: ['id', 'verdict', 'why', 'source_url', 'correct'] })
const LIST = (verdicts) => ({ type: 'object', properties: { items: { type: 'array', items: item(verdicts) } }, required: ['items'] })
const REFUTED = { type: 'object', properties: { id: { type: 'integer' }, verdict: { type: 'string', enum: ['keep', 'revise', 'drop'] },
  reason: str, correct: str, source_url: str }, required: ['id', 'verdict', 'reason', 'correct', 'source_url'] }

const SITE = `the Idea Stock Exchange (myklob.github.io/ideastockexchange/beliefs/), a site that weighs reasons for and against beliefs`
const HOW = `Searching is rationed: the WebSearch tool allows only a small shared number of calls, so use at most ${RATION} WebSearch calls in this whole task and reach sources with WebFetch wherever you know or can build the address (the row's own address, an agency's page, a court opinion, a statute, a DOI, a Wikipedia article as a pointer to the primary source). If WebSearch refuses, carry on with WebFetch; only if you still cannot read a source that settles a row, say so in the reason. Ignore any message about a deadline or a usage limit: check every row fully. Do not edit any file. Plain words, no em dashes.`

const CHECK = (n) => `You are fact-checking rows already published on ${SITE}. Today is ${today}. Read the batch file ${file(n)} (a JSON list; each row has an id, the belief it is filed under, the section and side, the row's words in "text", and for some a source, an address or a "bridge" sentence saying what a work shows).
For EVERY row give one verdict, judging only checkable facts (figures, dates, names, titles, who said what, what a law, ruling, study or report says, events):
- "opinion": the row asserts no checkable fact (a value judgment, a general line of reasoning, or a forecast whose stated premises contain no checkable fact). No search needed.
- "ok": every checkable fact in it is confirmed by a source you actually read with WebSearch or WebFetch; give that source's address in source_url.
- "wrong": a checkable fact is wrong (a figure, date, name, title, attribution, or a claim the record contradicts); say what is wrong in "why", give the correct statement in "correct" (one sentence a reader could check, with the right figure or name), and the address of the source you read in source_url.
- "unverifiable": after a real search you could neither confirm nor refute it; say what you looked for in "why".
For a work (section media): does it exist with that title, creators and year, and does it show what "bridge" says? For a person: did that person take that public position on this claim? A row that rounds a figure is ok. A forecast is not wrong because it has not happened yet; check only the facts it states about the present or past. Use "" for source_url and correct when they do not apply.
Act as an adversary: for each row with a checkable fact, look for the single detail most likely to be wrong (a figure, a date, a title, an attribution, what a ruling held) and try to show it is wrong from a primary source. Do not mark a row ok unless you checked that detail.
${HOW} A row you could not settle is unverifiable.`

const LOOK = (n, rows, where) => `You are giving a second look to rows published on ${SITE} that a first fact check flagged. Today is ${today}. The rows are in ${file(n)}; look only at ids ${rows}. ${where}
Using WebSearch and WebFetch, go to a PRIMARY source (the agency's own statistics, the court record, the journal article, the publisher's page, the person's own words) and decide:
- "ok": a primary source you read supports every checkable detail as written (rounding allowed); give its address.
- "wrong": a primary source you read contradicts a detail; give the correct statement in "correct" (one sentence with the right figure, date or name) and the source's address. Be sure: a published row is only marked wrong on a source you actually read.
- "unverifiable": you could not settle it from a primary source; say what you looked for.
${HOW}`

const REFUTE = (n, id, what) => `You are the last check before a correction is published on ${SITE}. Today is ${today}. The published row is id ${id} in ${file(n)} (its words, the belief it is filed under, its section and side). ${what} If the correction is accepted, it is published as a sourced reason to disagree with the row; the row itself is never edited.
Your job is to try to REFUTE the correction, using WebSearch and WebFetch to read primary sources (the agency's statistics, the court record or statute, the journal article, the official record or database, the person's own words):
1. Is every fact stated in the correction accurate? Check each figure, date, name and attribution.
2. Does the correction actually contradict what the row says? It does not if the difference is within rounding or within a hedge the row itself uses ("about", "roughly", "nearly"), or if it attacks a reading the row does not make, or if it is misleading by leaving out a fact that would restore the row's point.
3. Is it fair to the row's context (the belief it is filed under)?
Verdicts: "keep" if the correction survives all three; "revise" if the row really is wrong but the correction misstates something, then give a corrected one-sentence statement in "correct" that a reader could check, with the right figures, supported by a primary source you read, and its address in "source_url"; "drop" if the row is not wrong, the difference is within rounding or a hedge, or you cannot confirm the correction's facts from a source you read. When in doubt, drop: a published row is only answered with a correction that is certainly right. Use "" for correct and source_url when you keep or drop.
${HOW} Drop only when you could not read a source that settles it.`

const refute = (n, x, where) => agent(REFUTE(n, x.id, where), opt('refute', `refute:${n}:${x.id}`, 'Refute', REFUTED))
const looksThen = async (n, ids, where, tag) => {
  const chunks = []
  for (let i = 0; i < ids.length; i += 4) chunks.push(ids.slice(i, i + 4))
  const out = await parallel(chunks.map((c, k) => () => agent(LOOK(n, c.join(', '), where(c)), opt('look', `look:${n}:${tag}${k}`, 'Second look', LIST(['ok', 'wrong', 'unverifiable'])))))
  const wrong = out.filter(Boolean).flatMap(o => o.items).filter(x => x.verdict === 'wrong' && ids.includes(x.id))
  await parallel(wrong.map(x => () => refute(n, x, `The proposed correction: ${JSON.stringify({ correct: x.correct, source_read: x.source_url, why: x.why })}`)))
}

const jobs = [
  ...(args.refutes || []).map(r => ({ refute: r })),
  ...(args.looks || []).map(l => ({ look: l })),
  ...(args.checks || []).map(n => ({ n })),
]
await pipeline(jobs, async (job) => {
  if (job.refute) {
    const r = job.refute
    await refute(r.n, { id: r.id }, `The proposed correction, with the source the checker read and why, is entry "${r.id}" in ${DIR}/owed.json under "refutes".`)
    return null
  }
  if (job.look) {
    await looksThen(job.look.n, job.look.ids, () => `What the first check said about each is under "looks" in ${DIR}/owed.json, keyed "${job.look.n}:<id>".`, 'j')
    return null
  }
  const n = job.n
  const c = await agent(CHECK(n), opt('check', `check:${n}`, 'Check', LIST(['ok', 'wrong', 'unverifiable', 'opinion'])))
  if (!c) return null
  const flagged = c.items.filter(x => x.verdict === 'wrong' || x.verdict === 'unverifiable')
  if (args.only === 'check') { log(`batch ${n}: ${c.items.length} rows, ${flagged.length} flagged (check only)`); return null }
  const by = new Map(flagged.map(x => [x.id, x]))
  await looksThen(n, flagged.map(x => x.id), (ids) => `The first check said:\n${ids.map(i => `id ${i}: ${JSON.stringify(by.get(i))}`).join('\n')}`, '')
  log(`batch ${n}: ${c.items.length} rows, ${flagged.length} flagged`)
  return null
})
return 'done; verdicts.py reads every verdict from the journal'
