"""Possible fallacies, flagged by wording and settled by argument.

The owner's direction (October 2026): nothing is final. Software may flag a possible fallacy, and the flag is a
claim people argue for and against like any other; a flag alone moves no score. This file is the flagger.

It is deliberately a short, readable list of phrases, not a model. A reader can see exactly which words set a
flag off, which is what lets them argue it: a flag that cannot say why it fired cannot be answered. It fires on
reasons and objections only, because a finding is an observation and its weakness is argued on its own page.

What it cannot do is decide. On this site, whose subject is often officials acting on their own financial
interests, "attacking the person rather than the argument" fires on legitimate arguments about conflicts of
interest; "everyone knows" can introduce a real consensus. So each flag is phrased as a question, carries the words
that set it off, and links two prefilled forms on the flagged claim's own page: a reason to disagree saying it is
the fallacy, and a reason to agree saying it is not. What the argument there concludes moves the claim's truth
score through the ordinary rules; the flag never does.

    python3 fallacy.py content/      prints every flag in the tables, most common pattern first
"""
import os, re, sys

# name, what it is, the phrases that suggest it (word-bounded, case-insensitive)
PATTERNS = (
    ('Attacking the person', 'answers who said a thing instead of whether it is true',
     (r"(?:he|she|they)(?:'s| is| are) (?:a |an )?(?:liar|idiot|hypocrite|fool|crook|shill|extremist)s?",
      r"can'?t be trusted because (?:he|she|they)", r'what do you expect from', r'paid shills?', r'only says? (?:that|this) because')),
    ('Appeal to popularity', 'treats how many believe a claim as evidence that it is true',
     (r'everyone knows', r'everybody knows', r'most people (?:agree|believe|think|know)', r'millions of (?:people|americans) (?:agree|believe|can.t be wrong)',
      r'common knowledge', r'nobody (?:really )?believes')),
    ('Appeal to authority', 'rests a claim on who endorses it rather than on the evidence they had',
     (r'experts (?:agree|say|all agree)', r'scientists (?:agree|say)', r'(?:doctors|economists) (?:agree|say)', r'according to (?:the )?experts',
      r'trust the (?:experts|science)')),
    ('Slippery slope', 'claims a first step will lead to an extreme outcome without showing each step',
     (r'slippery slope', r'(?:will|would) inevitably lead to', r'open(?:s|ing)? the floodgates', r'where does it (?:end|stop)', r'next thing you know')),
    ('False choice', 'presents two options as the only ones when others exist',
     (r'the only (?:alternative|other option|choice) is', r'either we .{3,60}? or we', r'there are only two (?:options|choices)', r"if we don'?t .{3,40}?, we will")),
    ('Sweeping generalization', 'states a rule with no exceptions where exceptions are likely',
     (r'\ball (?:politicians|immigrants|corporations|liberals|conservatives|experts|scientists) are', r'\bno one ever\b', r'\bevery single one\b')),
    ('Appeal to tradition', 'treats a practice as right because it is old',
     (r"(?:we'?ve|it has|it'?s) always been (?:done|this way)", r'for (?:centuries|generations),', r'the way (?:it has|things have) always been')),
    ('Pointing at the other side', 'answers a criticism by saying the critic does the same thing',
     (r'what about (?:the |when )', r'they do it too', r'the other side (?:does|did) (?:it|the same)')),
    ('After, therefore because of', 'concludes that one thing caused another because it came first',
     (r'ever since .{3,60}?, ', r'right after .{3,60}?, (?:crime|prices|test scores|unemployment)', r'and then (?:crime|prices|scores) (?:rose|fell|went)')),
)
COMPILED = [(name, what, [re.compile(r'\b' + p, re.I) for p in pats]) for name, what, pats in PATTERNS]


def flags(text):
    """Every pattern the text matches, as (name, what it is, the words that set it off), in PATTERNS order."""
    out = []
    for name, what, pats in COMPILED:
        for p in pats:
            m = p.search(text or '')
            if m:
                out.append((name, what, m.group(0))); break
    return out


def page_flags(c, pid):
    """The reasons and objections on a belief or claim page whose wording suggests a fallacy, as
    [(row spec, side, [(name, what, words)])]. Reads the rows' own text, never their scores."""
    sp = c.specs.get(pid) or {}
    out = []
    for side in ('agree', 'disagree'):
        for d in (sp.get('args') or {}).get(side, []):
            f = flags(c.text(d['id']) if d.get('id') in c.specs else d.get('text') or '')
            if f: out.append((d, side, f))
    return out


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import render_site as RS
    c = RS.Corpus(sys.argv[1] if len(sys.argv) > 1 else 'content', 'fallacy')
    count = {}
    for pid in c.specs:
        if c.kind(pid) not in ('belief', 'claim'): continue
        for d, side, fs in page_flags(c, pid):
            for name, _, words in fs:
                count[name] = count.get(name, 0) + 1
                print(f'{c.key[pid]}: {name}: "{words}"')
    for name, n in sorted(count.items(), key=lambda x: -x[1]): print(f'{n:5d}  {name}')
