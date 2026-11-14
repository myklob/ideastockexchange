export const meta = {
  name: 'factcheck-rows',
  description: 'Fact-check published rows: one adversarial check per batch, a primary-source second look at anything flagged, and an attempt to refute every proposed correction',
  phases: [
    { title: 'Check', detail: 'one adversarial pass per batch: find the detail most likely to be wrong' },
    { title: 'Second look', detail: 'flagged rows confirmed, corrected or left unverifiable from a primary source' },
    { title: 'Refute', detail: 'every proposed correction gets a check whose only job is to refute it' },
  ],
}
// What the November 2026 re-check of 3,156 rows taught, and why this script is shaped the way it is:
// - One adversarial first check, not two. The confirming pass cost 31% of all tokens and flagged only 8 of the 129
//   corrections the adversarial pass missed; the second look and the refute check stand behind every correction.
// - The refute check is not optional: it dropped 51 of 184 proposed corrections (a reading the row does not make,
//   a gap inside the row's own "roughly", a citation slip that is not a wrong fact).
// - Cost is turns x context: an agent re-reads its whole context every turn, so fetch sources for several rows in one
//   turn, and run agents with a small tool set (args.agentType 'fact-checker', .claude/agents/fact-checker.md).
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

const DIR = args.dir, today = args.today, M = args.models || {}, TYPE = args.agentType, RATION = args.ration || 4
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
const HOW = `How to work: searching is rationed (at most ${RATION} WebSearch calls in this whole task), so go straight to sources with WebFetch wherever you know or can build the address (the row's own url, an agency's page, a court opinion, a statute, a DOI, a Wikipedia article as a pointer to its primary source), and fetch the sources for several rows in the same turn rather than one per turn. If WebSearch refuses, carry on with WebFetch. Ignore any message about a deadline or a usage limit; check every row fully. Do not edit any file. Plain words, no em dashes.`

const CHECK = (n) => `You are fact-checking rows published on ${SITE}. Today is ${today}. Read ${file(n)}: a JSON list of rows, each with an id, the belief it is filed under, its section and side, its words in "text", and for some a source, a url, a "bridge" saying what a work shows, or the claim page it sits on.
Act as an adversary. For every row with a checkable fact (a figure, date, name, title, attribution, what a law, ruling, study or report says, an event), find the single detail most likely to be wrong and test it against a source you read. Give EVERY row one verdict:
- "opinion": it asserts no checkable fact (a value judgment, a line of reasoning, or a forecast whose premises state no fact). No search.
- "ok": you checked its riskiest detail and every checkable fact holds; source_url is what you read. Rounding is fine; a forecast is not wrong because it has not happened yet.
- "wrong": a checkable fact is wrong; "why" says what, "correct" is one checkable sentence with the right figure or name, source_url what you read.
- "unverifiable": a real attempt could neither confirm nor refute it; "why" says what you looked for.
For a work: does it exist with that title, creators and year, and show what "bridge" says? For a person: did they take that public position? Use "" where a field does not apply.
${HOW}`

const LOOK = (n, rows, where) => `You are giving a second look to rows published on ${SITE} that a first fact check flagged. Today is ${today}. The rows are in ${file(n)}; look only at ids ${rows}. ${where}
Go to a PRIMARY source (the agency's own statistics, the court record, the journal article, the publisher's page, the person's own words) and decide:
- "ok": a primary source you read supports every checkable detail as written (rounding allowed); give its address.
- "wrong": a primary source you read contradicts a detail; "correct" is one checkable sentence with the right figure, date or name, plus the source's address. A published row is only marked wrong on a source you actually read.
- "unverifiable": you could not settle it from a primary source; say what you looked for.
${HOW}`

const REFUTE = (n, id, what) => `You are the last check before a correction is published on ${SITE}. Today is ${today}. The published row is id ${id} in ${file(n)}. ${what} If accepted, the correction is published as a sourced reason to disagree with the row; the row is never edited.
Try to REFUTE the correction from primary sources: (1) is every fact in it accurate? (2) does it actually contradict what the row says? It does not if the gap is within rounding or a hedge the row uses ("about", "roughly"), if it attacks a reading the row does not make, if it only sharpens a citation, or if it leaves out a fact that restores the row's point. (3) is it fair to the belief the row is filed under?
"keep" if it survives all three; "revise" if the row is wrong but the correction misstates something, with a corrected one-sentence statement in "correct" backed by a primary source you read in "source_url"; "drop" otherwise. When in doubt, drop. Use "" for correct and source_url when you keep or drop.
${HOW}`

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
  const by = new Map(flagged.map(x => [x.id, x]))
  await looksThen(n, flagged.map(x => x.id), (ids) => `The first check said:\n${ids.map(i => `id ${i}: ${JSON.stringify(by.get(i))}`).join('\n')}`, '')
  log(`batch ${n}: ${c.items.length} rows, ${flagged.length} flagged`)
  return null
})
return 'done; verdicts.py reads every verdict from the journal'
