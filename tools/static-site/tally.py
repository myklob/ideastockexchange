"""The owner's starting rule for belief strength, computed beside the argued truth score rather than instead of it.

The owner's direction (October 2026): for pure belief strength, start from the quantity of truly independent reasons
to agree and disagree, rank how valid they are against each other, and let the weight of pro against con decide.
Contributions count from the moment they are posted and are argued down (or up) from there, because a rule under
which a reason counts for nothing until someone does the work of proving it tells contributors their work is wasted.
Evidence can weigh more than any argument, without a ceiling: a body of replicated work should be able to outweigh a
pile of opinion by 15 or 200 times. The owner also said to change the inputs and see whether volume counts, so this
is published next to the argued truth score, and the two can be compared on real pages before either one leads.

    a reason or a prediction weighs   Truth x Linkage x Importance x Uniqueness
    a finding weighs                  the same, x (1 + ESIW x ERQ x ERP/100), its uncapped evidence strength
    independent reasons on a side     the sum of Uniqueness over its reasons: two reasons that say the same thing
                                      count as one once a uniqueness page says so
    share for                         (weight for + w x p0) / (weight for + weight against + w), where p0 and w are the
                                      page's own starting point and its weight (evidence.prior), the same starting vote
                                      the truth score uses, so one unanswered reason moves a page part of the way and
                                      not to certainty

What it deliberately keeps from the argued rule: every factor is read from a page or a labelled constant, so a reason
argued false (Truth near 0) weighs nearly nothing and a duplicate argued redundant (Uniqueness near 0) adds nearly
nothing. What it drops: the (2 x Truth - 1) that makes an unargued reason worth exactly zero, and the confidence gate
that zeroes a row whose own page has no work behind it. Those two are why every argued truth score in the corpus
reads 0.50. A vote never enters either rule. Choices for action are a different question, answered by cost and
benefit across the interests at stake, and are scored in the cost-benefit section, not here."""

import evidence as EV


def finding_strength(spec):
    """ESIW x ERQ x ERP/100 for a finding's own page, unbounded. Zero when no source type is named, so an
    unclassified finding weighs exactly what a reason does."""
    c = EV.classify(spec or {})
    return c['esiw'] * c['erq'] * (c['erp'] / 100.0)


def weight(row, strength=0.0):
    """One row's weight under this rule, from the factors render_site.Corpus.row already read for it."""
    return row['truth'] * row['link'] * row['imp'] * row['uniq'] * (1.0 + strength)


def tally(rows, specs, ids, basis=None):
    """rows: the Corpus.stats rows dict ('agree', 'disagree', 'for', 'against', 'pt', 'pf'); ids: the same keys
    mapping to the row specs, so a finding's own page can be read for its source; basis: the page's evidence.prior,
    defaulting to the neutral start (0.5 with weight 1). Returns the counts, the weights and the share for, or a
    share of None when nothing is listed on either side."""
    basis = basis or {'p0': 0.5, 'weight': 1.0}
    def side(reason_keys, finding_key):
        # a claim page listed more than once on a side counts once, at its heaviest, as the truth score's rule does
        best, loose = {}, []
        for k in reason_keys + (finding_key,):
            for r, d in zip(rows.get(k, []), ids.get(k, [])):
                wt = weight(r, finding_strength(specs.get(d.get('id')))) if k == finding_key else weight(r)
                item = (wt, r['uniq'] if k in ('agree', 'disagree') else 0.0, k == finding_key)
                cid = d.get('id')
                if not (isinstance(cid, int) and cid >= 1): loose.append(item)
                elif cid not in best or wt > best[cid][0]: best[cid] = item
        kept = loose + list(best.values())
        return (sum(n for _, n, _ in kept), sum(w for w, _, f in kept if not f), sum(w for w, _, f in kept if f))
    n_for, w_for, f_for = side(('agree', 'pt'), 'for')
    n_against, w_against, f_against = side(('disagree', 'pf'), 'against')
    total_for, total_against = w_for + f_for, w_against + f_against
    share = ((total_for + basis['weight'] * basis['p0']) / (total_for + total_against + basis['weight'])
             if total_for + total_against > 0 else None)
    return dict(reasons_for=n_for, reasons_against=n_against, weight_for=total_for, weight_against=total_against,
                findings_for=f_for, findings_against=f_against, share=share)
