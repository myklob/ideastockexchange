"""What a recorded outcome says about a belief, computed beside the argued truth score rather than instead of it.

A belief page says what should be observed if it is true and what if it is false. Each prediction is a claim with a
page of its own, and what happened is a finding filed on that page (predictions.py). The truth score counts that
finding as one more row, through the same gates as any other: a single report on a one-row page passes
(2 x 0.65 - 1) x confidence 0.10 x importance 0.50 = 0.015 to the prediction, and the prediction passes less than
that to the belief, where every poll and forecast filed before the event still counts in full. So an election that
has been held leaves the page that forecast it where the polls left it.

The rule here is the one probability gives: once what a belief predicted has been observed, the observation answers
the question, and evidence that only predicted the answer has nothing left to add (the outcome screens it off).

    a finding about what happened weighs   max(0, 2 x Truth - 1) x Linkage, read from the finding's own page and
                                           its row on the prediction's page: 0.30 for a news report, 0.90 for an
                                           official record, less once either is argued down
    a prediction is settled by             its strongest finding that it happened minus its strongest that it did
                                           not, so two records that disagree cancel as far as the weaker one goes
    it settles the belief by               that x the prediction's Linkage to the belief: toward the belief when a
                                           prediction that follows from it came true or one that follows from its
                                           denial did not, against it otherwise
    up, down                               the strongest settling each way over the page's predictions
    after the outcome                      (up + rest x Truth) / (up + down + rest), rest = max(0, 1 - up - down)

So `up` of the page rests on what happened and counts as 1, `down` counts as 0, and the page's ordinary truth score
keeps only what is left. With nothing recorded there is no reading at all, and with a record that weighs nothing the
reading is the truth score.

What it keeps from the argued rule: every factor is read from a page or a labelled constant. A finding is a claim
with a page, so a report shown to be wrong settles nothing, and a prediction argued not to bear on the belief
settles little. What it drops, for these findings only: the confidence gate and the importance factor, which ask how
much work is behind a claim and which interest it speaks to, neither of which is the question once the thing itself
has been observed. A finding argued false weighs zero rather than counting the other way: a report that was wrong
does not show the opposite happened.

The strongest and not the sum, because one event recorded under two predictions is still one event, and nothing at
this level says which records are independent. Nothing else reads this number: no truth score, confidence, ranking
or tally. It is printed so the two can be compared on real pages before either leads, which is the owner's standing
direction on scoring rules."""

from score_reference import is_page

DEFLINK = 1.0


def finding_weight(c, d):
    """How far one finding on a prediction's page settles what happened, in 0 to 1."""
    cid = d.get('id')
    if not is_page(cid) or cid not in c.specs: return 0.0
    return max(0.0, 2.0 * c.truth(cid) - 1.0) * c.pg(d.get('link'), DEFLINK)


def _strongest(c, rows):
    """(weight, finding page) of the heaviest finding, ties broken by key so the order rows are stored in changes
    nothing."""
    found = sorted(((finding_weight(c, d), d.get('id')) for d in rows),
                   key=lambda x: (-x[0], str(c.key.get(x[1], ''))))
    return found[0] if found else (0.0, None)


def settled(c, pid):
    """A prediction's own page: how far it is settled as having happened (positive) or not (negative), the weight
    each way, and the finding that carries the larger one. None when no outcome is recorded on it."""
    ev = c.specs[pid].get('evid') or {}
    yes, no = ev.get('for') or [], ev.get('against') or []
    if not (yes or no): return None
    y, n = _strongest(c, yes), _strongest(c, no)
    return dict(net=y[0] - n[0], happened=y[0], did_not=n[0], finding=(y if y[0] >= n[0] else n)[1])


def reading(c, pid):
    """The page's reading once its predictions' outcomes are counted, or None when none of them has one recorded.
    rows carries every settled prediction with its factors, so the number can be traced to the pages it rests on."""
    sp, rows = c.specs[pid], []
    for side, key in ((1, 'pred_true'), (-1, 'pred_false')):
        for d in sp.get(key, []):
            p = d.get('id')
            if not is_page(p) or p not in c.specs: continue
            s = settled(c, p)
            if s is None: continue
            link = c.pg(d.get('link'), DEFLINK)
            rows.append(dict(page=p, side=side, link=link, settles=side * s['net'] * link, **s))
    if not rows: return None
    up = max((r['settles'] for r in rows), default=0.0)
    down = max((-r['settles'] for r in rows), default=0.0)
    up, down = max(0.0, up), max(0.0, down)
    rest = max(0.0, 1.0 - up - down)
    return dict(up=up, down=down, rest=rest, after=(up + rest * c.truth(pid)) / (up + down + rest), rows=rows)


def lead(c, r):
    """The settled prediction a reading leans on most: the one that settles the most either way, ties by key."""
    return sorted(r['rows'], key=lambda x: (-abs(x['settles']), str(c.key.get(x['page'], ''))))[0]
