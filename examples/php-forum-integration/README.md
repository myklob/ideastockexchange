# Forum → belief-page integration: PHP + SQL demo

Chatrooms and web forums reset discussion to zero: every conversation
repeats arguments made a thousand times, and whatever clarity is reached
dies with the scroll. The fix is architectural — **give every belief one
permanent page, and let every conversation plug into it**. This directory
is a runnable, self-contained implementation of that architecture in plain
PHP + SQL, seeded with a real worked example:

- **Topic:** *Protecting the Constitution* — every belief at one fixed
  address (Direction −100…+100, Magnitude band, general-to-specific rung
  and branch), so the thousand ways of saying the same thing collapse into
  single entries.
- **Belief pages:** *We should accept certified election results even when
  our side loses* and *Officials should comply with final court rulings
  while appealing the ones they believe are wrong* — full pro/con argument
  trees with linkage and importance sub-debates, plus evidence ledgers.
- **One imported Reddit-style thread** showing every candidate outcome:
  one point **integrated** (it created the "acceptance norms bind
  asymmetrically" argument on the page), one **folded** as a restatement of
  an existing argument (no double-counting), two **pending**, one
  **dismissed**.

## Run it

Requires PHP 8+ with `pdo_sqlite` (bundled in most distributions).

```bash
cd examples/php-forum-integration
php -S localhost:8080
```

Open <http://localhost:8080/>. On first request a `demo.sqlite` database is
created from `schema.sqlite.sql` and seeded.

- `index.php` — the topic page: every belief at its three-part address,
  scored where a real tree exists, blank where none does, plus the imported
  conversations.
- `belief.php?id=accept-certified-results` — a permanent belief page: the
  scorecard, argument trees ranked by impact, evidence ledger, and the
  incoming conversation lane with live integrate / fold / dismiss review
  moves.
- `import.php` — paste any transcript (`Author: message` per line); the
  miner extracts candidate pro/con claims and queues them for review.

Use `?m=` on any page to change the sub-argument multiplier.

## The pipeline (find → track → organize → integrate)

1. **Find** (`mine.php`): strip chat noise (URLs, mentions, emoji, quoted
   replies), split sentences, keep only standalone claims (the same
   fragment / topic-label rules the main app's ingestion firewall
   enforces), read each message's stance from its openers and negations,
   and fold near-duplicates within the thread.
2. **Track** (`fi_candidates`): every mined claim is a *candidate*, scanned
   against the arguments already on the page (`similarity.php`, token +
   bigram Jaccard). The similarity band routes it: `distinct` extends the
   outline, `related-link` integrates with the cluster recorded,
   `probable-group`/`same-claim` folds into the existing argument.
3. **Organize** (`scoring.php` + views in `schema.sqlite.sql`): scores are
   **never stored** — every score is computed on read by a recursive CTE
   over the argument graph:

   ```
   LS  = (linkAgree − linkDisagree) / total     (1.0 when undebated)
   IMP = same shape over the importance entries
   score(B) = (nAgree − nDisagree)
            + m·( Σ agree score(child)·LS·IMP − Σ disagree score(child)·LS·IMP )
   Impact(edge) = score(child) × LS × IMP
   Net = Pro Total − Con Total = score(B)
   ```

   The belief page computes the totals two ways (table arithmetic in PHP,
   recursive CTE in SQL) and flags any disagreement instead of rendering it.
4. **Integrate** (`integrate.php`): an explicit, audited review move. A
   candidate becomes an argument only after re-validation against the
   standalone-claim rule; the mechanism sentence (the "why") lands in the
   audit log, auto-drafted mechanisms are flagged as such, and folds and
   dismissals leave audit rows too.

## The same process in the main app

The Next.js app implements the production version of this pipeline:

- `src/lib/conversations/` — extract, match, import, integrate, outline,
  lookup (TypeScript, Prisma, unit-tested in
  `tests/unit/lib/conversations/`).
- `POST /api/v1/conversations` — import a transcript;
  `POST /api/v1/conversations/[id]/integrate` — the review move;
  `GET /api/v1/conversations/lookup?statement=...` — resolve a statement
  made mid-chat to its permanent page and outline.
- `examples/php-score-retrieval/` — the founding-workbook score recursion
  this demo's formula extends (adding the importance factor).
