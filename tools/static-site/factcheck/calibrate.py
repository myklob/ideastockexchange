"""Score a check-only factcheck.js run against the calibration set, for catches and for cost.

calibration/ holds 10 batches from the November 2026 re-check (209 rows) and expected.json, each row's settled verdict:
28 of them are corrections that survived the refute check. A first check is good if it flags (wrong, unverifiable, or no
answer) every correction and few of the rows that settled ok or opinion, since each of those costs a second look. Cost
is read from the run's agent transcripts: every turn re-reads the agent's whole context, so input tokens are about turns
times context, and the context an agent starts with is the floor under every turn.

Measured on 2026-11-14 (no 'fact-checker' agent type yet):
  Opus, November adversarial wording   26 of 28 caught, 14 settled rows flagged, 26 turns, start 39,600 (early November)
  Opus, a stricter wording             24 of 28 caught,  3 settled rows flagged, 56 turns, start 79,900
  Sonnet, the stricter wording         14 of 28 caught, 13 settled rows flagged, 18 turns, start 80,000

usage: python3 calibrate.py RUNDIR [RUNDIR ...]
  RUNDIR is a workflow run's transcript folder (it holds journal.jsonl and one agent-*.jsonl per agent). Run the check
  with args {dir: <absolute path of this calibration folder>, today, checks: [12, 25, 26, 48, 53, 66, 70, 88, 110, 145],
  only: 'check', models: {check: ...}, agentType: ...}.
"""
import collections, json, os, statistics as st, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from factcheck import verdicts as V

CAL = os.path.join(HERE, 'calibration')


def cost(dirs):
    rows = []
    for d in dirs:
        for f in sorted(os.listdir(d)):
            if not f.endswith('.meta.json'): continue
            with open(os.path.join(d, f)) as fh: meta = json.load(fh)
            if not meta.get('description', '').startswith('check:'): continue
            ctx, out, models = [], 0, collections.Counter()
            with open(os.path.join(d, f.replace('.meta.json', '.jsonl'))) as fh:
                for line in fh:
                    try: m = json.loads(line).get('message') or {}
                    except ValueError: continue
                    u = m.get('usage')
                    if not u: continue
                    if m.get('model'): models[m['model']] += 1
                    ctx.append((u.get('input_tokens') or 0) + (u.get('cache_creation_input_tokens') or 0) + (u.get('cache_read_input_tokens') or 0))
                    out += u.get('output_tokens') or 0
            if ctx: rows.append((sum(ctx), out, len(ctx), ctx[0], models.most_common(1)[0][0] if models else '?', meta.get('agentType', '')))
    return rows


def main():
    dirs = sys.argv[1:]
    with open(os.path.join(CAL, 'expected.json')) as fh: expected = {int(k): v for k, v in json.load(fh).items()}
    got = V.journals(dirs)
    caught = flagged_settled = swapped = unanswered_batches = 0
    missed = []
    for f in sorted(os.listdir(CAL)):
        if not f.startswith('batch_'): continue
        n = int(f[6:9])
        with open(os.path.join(CAL, f)) as fh: batch = json.load(fh)
        C = V.latest(got.get(f'check:{n}', []))
        if not C: unanswered_batches += 1
        for r in batch:
            want, v = expected[r['id']], C.get(r['id'], {}).get('verdict', 'none')
            flagged = v in ('wrong', 'unverifiable', 'none')
            if want == 'wrong':
                caught += flagged
                if not flagged: missed.append((r['id'], v, r['text'][:90]))
            if want in ('ok', 'opinion'):
                flagged_settled += flagged
                swapped += {want, v} == {'ok', 'opinion'}
    corrections = sum(1 for v in expected.values() if v == 'wrong')
    print(f'corrections caught {caught} of {corrections}; settled rows flagged {flagged_settled}; ok and opinion swapped {swapped}'
          + (f'; batches with no answer {unanswered_batches}' if unanswered_batches else ''))
    for i, v, t in missed: print(f'  missed {i} ({v}): {t}')
    c = cost(dirs)
    if c:
        print(f'{len(c)} check agents: input {int(st.mean(x[0] for x in c)):,} and output {int(st.mean(x[1] for x in c)):,} tokens an agent, '
              f'{st.mean(x[2] for x in c):.1f} turns, starting context {int(st.mean(x[3] for x in c)):,}; model {c[0][4]}, agent type {c[0][5] or "default"}')


if __name__ == '__main__':
    main()
