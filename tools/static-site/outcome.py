"""What a recorded outcome says about a belief, computed beside the argued truth score rather than instead of it.

A belief page says what should be observed if it is true and what if it is false. Each prediction is a claim with a
page of its own, and what happened is a finding posted on that page as a report that the prediction came true or
did not (vocab test.came-true, test.came-false; the two forms on the predictions page post exactly these). The
truth score counts that finding as one more row, through the same gates as any other: a single news report passes
(2 x 0.65 - 1) x confidence 0.10 x importance 0.50 = 0.015 to the prediction, and the prediction passes less than
that to the belief, where every poll and forecast filed before the event still counts in full. So an election that
has been held leaves the page that forecast it where the polls left it.

The rule here is the one probability gives: once what a belief predicted has been observed, the observation is
counted first, and evidence that only predicted the answer adds nothing to the part the observation settles.

    a record of what happened weighs   max(0, 2 x Truth - 1) x Linkage, read from the finding's own page and its
                                       row on the prediction's page: a news report starts at 0.30 and an official
                                       record at 0.90, lower once argued down, higher once corroborated
    a prediction happened, did not     the strongest record each way on its page
    toward the belief                  the strongest, over the page's predictions, of Linkage x happened for a
                                       prediction that follows if the belief is true, and Linkage x did not for
                                       one that follows if it is false
    against the belief                 the same with the two cases swapped
    settled                            toward - against: records that disagree cancel as far as the weaker goes,
                                       wherever on the page's predictions they were posted
    after the outcome                  up + rest x Truth when settled is toward the belief (up = settled, rest =
                                       1 - up); rest x Truth when it is against (rest = 1 - down)

So the settled part of the page rests on what happened, and the page's ordinary truth score keeps only what is left.
With no record there is no reading, and with records that weigh nothing or cancel the reading is the truth score.

Only a finding posted as a report of the outcome is read. Any other finding on a prediction's page is evidence
about whether it will happen, a forecast of the forecast, and stays with the truth score.

What it keeps from the argued rule: every factor is read from a page or a labelled constant. A record is a claim
with a page, so a report shown to be wrong settles nothing, and a prediction argued not to bear on the belief
settles less. What it drops, for a record and for the prediction's row on the belief page: the confidence gate,
importance and uniqueness. The first two ask how much work is behind a claim and which interest it speaks to,
neither of which is the question once the thing itself has been observed; repeats are handled by taking the
strongest record instead of the sum, because one event recorded under two predictions is still one event and
nothing at this level says which records are independent. A record argued false weighs zero rather than counting
the other way: a report that was wrong does not show the opposite happened.

Two limits a reader should know, both stated on the method page. A prediction's Linkage is the only guard against
affirming the consequent: a prediction that follows from the belief and came true is counted as if nothing else
could have produced it until its linkage page is argued down, an unargued row reads 1, and under the truth score's
rule a linkage page moves slowly. And one Linkage discounts both directions, what the prediction's coming true
shows and what its failing shows, because the linkage page is the only place either is argued.

Nothing else reads this number: no truth score, confidence, ranking or tally. The predictions tracker reads only
whether a record exists. It is printed so the readings can be compared on real pages before any of them leads,
which is the owner's standing direction on scoring rules."""

from score_reference import is_page

DEFLINK = 1.0
OUTCOME_TAGS = ('test.came-true', 'test.came-false')


def finding_weight(c, d):
    """How far one record on a prediction's page settles what happened, in 0 to 1."""
    cid = d.get('id')
    if not is_page(cid) or cid not in c.specs: return 0.0
    return max(0.0, 2.0 * c.truth(cid) - 1.0) * c.pg(d.get('link'), DEFLINK)


def records(c, pid):
    """The findings on a prediction's page posted as a report of what happened: (it happened, it did not)."""
    ev = c.specs[pid].get('evid') or {}
    pick = lambda rows: [d for d in rows or [] if d.get('tag') in OUTCOME_TAGS]
    return pick(ev.get('for')), pick(ev.get('against'))


def _strongest(c, rows):
    """(weight, finding page) of the heaviest record, ties broken by key so the order rows are stored in changes
    nothing."""
    found = sorted(((finding_weight(c, d), d.get('id')) for d in rows), key=lambda x: (-x[0], str(c.key.get(x[1], ''))))
    return found[0] if found else (0.0, None)


def settled(c, pid):
    """A prediction's own page: how far its records say it happened and did not, the difference, and the finding
    behind the heavier (on a tie, a side that has one). None when no outcome is recorded on it."""
    yes, no = records(c, pid)
    if not (yes or no): return None
    y, n = _strongest(c, yes), _strongest(c, no)
    lead_ = y if (y[0] > n[0] or (y[0] == n[0] and y[1] is not None)) else n
    return dict(net=y[0] - n[0], happened=y[0], did_not=n[0], finding=lead_[1])


def argued(c, v):
    """Has anyone argued on this linkage page? A row with none reads the starting value, counted in full."""
    sp = c.specs.get(v) if is_page(v) else None
    a = (sp or {}).get('args') or {}
    return bool(a.get('agree') or a.get('disagree'))


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
            toward, against = (s['happened'], s['did_not']) if side > 0 else (s['did_not'], s['happened'])
            rows.append(dict(page=p, side=side, link=link, argued=argued(c, d.get('link')), toward=link * toward,
                             against=link * against, settles=link * (toward - against) + 0.0, **s))
    if not rows: return None
    toward, against = max(r['toward'] for r in rows), max(r['against'] for r in rows)
    net = toward - against
    up, down = max(0.0, net), max(0.0, -net)
    rest = 1.0 - up - down
    return dict(toward=toward, against=against, up=up, down=down, rest=rest, after=up + rest * c.truth(pid), rows=rows)


def lead(c, r, way='toward'):
    """The settled prediction that weighs most toward the belief (or against it), ties by key, and how many tie."""
    top = max(x[way] for x in r['rows'])
    best = sorted((x for x in r['rows'] if x[way] == top), key=lambda x: str(c.key.get(x['page'], '')))
    return best[0], len(best)
