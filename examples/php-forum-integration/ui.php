<?php

/** Shared page chrome. Palette matches the repo's other PHP demo. */

declare(strict_types=1);

function e(string|int|float|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function fi_format_score(float $score): string
{
    $rounded = round($score, 3);
    return $rounded == (int) $rounded
        ? (string) (int) $rounded
        : rtrim(rtrim(number_format($rounded, 3, '.', ''), '0'), '.');
}

function fi_band_label(?string $band): string
{
    return match ($band) {
        'same-claim' => 'same claim — fold it',
        'probable-group' => 'probable restatement — fold or justify',
        'related-link' => 'related — integrate, cluster recorded',
        default => 'distinct — extends the outline',
    };
}

function fi_page_open(string $title): void
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
    --warn-bg: #fffbeb; --warn-line: #f4d68a;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
         Roboto, Helvetica, Arial, sans-serif; color: var(--ink);
         background: var(--bg); line-height: 1.55; font-size: 15px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px 64px; }
  header.site { padding: 16px 0; border-bottom: 1px solid var(--line); margin-bottom: 28px; }
  header.site .wrap { padding-bottom: 0; display: flex; align-items: baseline;
                      justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  header.site strong { font-size: 17px; }
  h1 { font-size: 26px; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 8px; }
  h2 { font-size: 19px; margin: 36px 0 10px; }
  p.lede { color: var(--muted); margin: 0 0 20px; max-width: 760px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; font-size: 14px; }
  th, td { border: 1px solid var(--line); padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: var(--tint); font-weight: 600; }
  td.num, th.num { text-align: center; white-space: nowrap; }
  .pro-head { background: var(--pro-bg); }
  .con-head { background: var(--con-bg); }
  .pro { color: var(--pro); font-weight: 600; }
  .con { color: var(--con); font-weight: 600; }
  .panel { border: 1px solid var(--line); background: var(--tint);
           padding: 10px 14px; border-radius: 6px; margin: 12px 0; }
  .panel.firewall { background: var(--warn-bg); border-color: var(--warn-line); font-size: 13px; }
  .panel.notice { background: var(--accent-soft); border-color: var(--accent); }
  .badge { display: inline-block; font-size: 11px; text-transform: uppercase;
           letter-spacing: 0.03em; border: 1px solid var(--line); border-radius: 4px;
           padding: 0 6px; background: var(--tint); color: var(--muted); }
  .badge.integrated { background: var(--pro-bg); color: var(--pro); border-color: var(--pro); }
  .badge.pending { background: var(--warn-bg); color: #92400e; border-color: var(--warn-line); }
  .badge.duplicate { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
  .badge.dismissed { color: var(--muted); }
  .small { font-size: 12px; color: var(--muted); }
  form.inline { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
  input[type=text], textarea, select { font: inherit; padding: 5px 8px;
        border: 1px solid var(--line); border-radius: 4px; }
  textarea { width: 100%; }
  button { font: inherit; font-size: 13px; padding: 5px 12px; border-radius: 4px;
           border: 1px solid var(--accent); background: var(--accent-soft);
           color: var(--accent); cursor: pointer; }
  button:hover { background: var(--accent); color: #fff; }
  .tree-indent { color: var(--muted); }
</style>
</head>
<body>
<header class="site"><div class="wrap">
  <strong><a href="index.php">Idea Stock Exchange</a> · forum → belief-page integration demo</strong>
  <span class="small"><a href="index.php">Topic</a> · <a href="import.php">Import a conversation</a></span>
</div></header>
<div class="wrap">
<?php
}

function fi_page_close(): void
{
    echo "</div>\n</body>\n</html>\n";
}

function fi_firewall_panel(): void
{
    echo '<div class="panel firewall"><strong>Firewall:</strong> imported conversations never '
        . 'affect any score. A mined candidate becomes an argument only through an explicit, '
        . 'audited integration move, and every score below is a view computed on read from the '
        . 'argument graph — nothing stores a score, so nothing can hand-pick one.</div>';
}
