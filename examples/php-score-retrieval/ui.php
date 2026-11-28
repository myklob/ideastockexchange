<?php

/** Shared page chrome for the demo. Palette matches the repo's index.html. */

declare(strict_types=1);

// Accepts ints too: PHP silently converts numeric-string array keys
// ('46') to integers, so conclusion IDs arrive as either type.
function e(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function iseFormatScore(float $score): string
{
    $rounded = round($score, 4);
    return $rounded == (int) $rounded
        ? (string) (int) $rounded
        : rtrim(rtrim(number_format($rounded, 4, '.', ''), '0'), '.');
}

function isePageOpen(string $title): void
{
    ?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($title) ?></title>
<style>
  :root {
    --ink: #1a1f2c; --muted: #5a6275; --line: #e3e6ec; --bg: #ffffff;
    --tint: #f6f8fb; --accent: #2a5cad; --accent-soft: #e8efff;
    --pro: #15803d; --con: #b91c1c; --pro-bg: #ecfdf5; --con-bg: #fef2f2;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
         Roboto, Helvetica, Arial, sans-serif; color: var(--ink);
         background: var(--bg); line-height: 1.55; font-size: 16px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 24px 64px; }
  header.site { padding: 20px 0; border-bottom: 1px solid var(--line);
                margin-bottom: 32px; }
  header.site .wrap { padding-bottom: 0; display: flex; align-items: baseline;
                      justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  header.site strong { font-size: 18px; }
  h1 { font-size: 30px; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 8px; }
  h2 { font-size: 21px; margin: 40px 0 12px; }
  p.lede { color: var(--muted); margin: 0 0 24px; max-width: 700px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line);
           vertical-align: top; }
  th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;
       color: var(--muted); }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums;
                   white-space: nowrap; }
  .score-pill { display: inline-block; min-width: 52px; text-align: center;
                padding: 2px 10px; border-radius: 999px; font-weight: 600;
                background: var(--accent-soft); color: var(--accent); }
  .score-pill.negative { background: var(--con-bg); color: var(--con); }
  .side-agree { color: var(--pro); font-weight: 600; }
  .side-disagree { color: var(--con); font-weight: 600; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media (max-width: 720px) { .columns { grid-template-columns: 1fr; } }
  .col h3 { margin: 0 0 8px; font-size: 16px; }
  .col.agree h3 { color: var(--pro); }
  .col.disagree h3 { color: var(--con); }
  .panel { background: var(--tint); border: 1px solid var(--line);
           border-radius: 10px; padding: 16px 20px; margin: 16px 0 24px; }
  .panel.ok { border-color: #bde3c8; background: var(--pro-bg); }
  .panel.fail { border-color: #f3c1c1; background: var(--con-bg); }
  .formula { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
             font-size: 14px; overflow-x: auto; white-space: pre; padding: 12px 0 4px; }
  pre.sql { background: var(--tint); border: 1px solid var(--line); border-radius: 10px;
            padding: 16px 20px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
  .muted { color: var(--muted); }
  .switcher a { display: inline-block; padding: 4px 12px; border: 1px solid var(--line);
                border-radius: 999px; margin-right: 8px; font-size: 14px; }
  .switcher a.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .crumbs { font-size: 14px; margin-bottom: 16px; }
</style>
</head>
<body>
<header class="site">
  <div class="wrap">
    <strong><a href="index.php" style="color:inherit">Idea Stock Exchange</a></strong>
    <span class="muted">conclusion-score demo &mdash; PHP + SQL</span>
  </div>
</header>
<div class="wrap">
<?php
}

function isePageClose(): void
{
    ?>
<p class="muted" style="margin-top:48px; font-size:14px">
  The same process, elsewhere in the repo:
  <code>src/lib/conclusion-score.ts</code> (TypeScript engine),
  <code>sql/conclusion_score_process.sql</code> (MySQL/MariaDB schema),
  <code>docs/conclusion-score-calculations.xlsx</code> (the workbook with every
  formula live). All are verified against the same example numbers.
</p>
</div>
</body>
</html><?php
}

/** The little "how the score is computed" box shown on both pages. */
function iseFormulaPanel(float $multiplier): void
{
    ?>
<div class="panel">
  <strong>The process</strong> (from the founding Excel workbook):
  each conclusion&rsquo;s page lists reasons to agree and reasons to disagree in
  separate columns. Every listed reason is worth one point to its column; a
  reason with its own page adds its own score, weighted by the edge&rsquo;s
  linkage score and the sub-argument multiplier
  <em>m&nbsp;=&nbsp;<?= e(iseFormatScore($multiplier)) ?></em>.
  <div class="formula">score = (nAgree &minus; nDisagree) + m &middot; ( &Sigma; agree childScore&middot;LS &minus; &Sigma; disagree childScore&middot;LS )
LS    = (linkAgree &minus; linkDisagree) / (linkAgree + linkDisagree),  1 when undebated</div>
</div>
<?php
}
