/* Participation on the static site. As a reader types a claim, the page scores it against every claim already
   in the tables (published or draft) with the same rule similarity.py uses, so a duplicate turns into a vote
   for the existing claim instead of a second page: when the duplicate is already a row on this page the button
   opens its page to vote there; when it is elsewhere on the site, submitting files it here as a row too.
   Submitting opens a prefilled GitHub issue; the intake Action re-checks with the Python engine. Copy as text
   puts the same submission on the clipboard for a reader without an account. Plain ES5, no dependencies;
   loads under node for the tests. */
(function (root) {
  'use strict';
  var FLAG = 0.45, MERGE = 0.70, NGRAM = 4, QUERY_MAX = 6000, DEBOUNCE = 150;
  var STOP = ('the a an of to in on and or that is are be been being would should could for from it its they ' +
    'their them not no by with as at this these those was were has have had but than then so if when what ' +
    'which who whom whose there here about into over under more most less least any all each other such can ' +
    'may might must will shall do does did one two up down').split(' ');
  /* The issue title's prefix per section, when the form did not hand one over in its hidden title field.
     render_site.TITLES is the full list; a form built by it always carries its own. */
  var TITLES = {argument: {agree: 'Reason to agree', disagree: 'Reason to disagree'}, evidence: 'Evidence',
    prediction: 'Prediction', criterion: 'Criterion', cba: 'Cost or benefit', interest: 'Interest',
    belief: 'Belief'};
  /* The kinds of claim a section's duplicate check looks at: an interest form matches interests, every other
     form matches beliefs and claims, so a need is never offered as a duplicate of a reason. */
  var INTEREST_SECTIONS = ['interest', 'interest_listing'];
  /* Field ids -> the labels GitHub renders them under, for Copy as text: the copied text is the issue as the
     intake Action reads it, so it can be pasted into an issue, an email or a message and still parse. */
  var LABELS = {page: 'Page', section: 'Section', side: 'Side', text: 'The claim', source: 'Source', url: 'URL',
    date: 'Date checked', category: 'Category', why: 'Why it bears on the page'};
  var BELIEF_LABELS = {text: 'The belief', topic: 'Topic', agree: 'A reason to agree', disagree: 'A reason to disagree', source: 'Source'};

  function words(text) {
    var out = [], parts = String(text || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ');
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] && STOP.indexOf(parts[i]) < 0) out.push(parts[i]);
    }
    return out;
  }

  /* Word and gram maps have no prototype, so a claim about a "constructor" gets its weight and not Object's. */
  function map() { return Object.create(null); }

  function grams(text, n) {
    n = n || NGRAM;
    var t = String(text || '').toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/ +/g, ' ').trim(), out = map();
    if (t.length < n) { if (t) out[t] = 1; return out; }
    for (var i = 0; i + n <= t.length; i++) { var g = t.slice(i, i + n); out[g] = (out[g] || 0) + 1; }
    return out;
  }

  function idf(docs) {
    var df = map(), out = map(), t;
    for (var i = 0; i < docs.length; i++) {
      var seen = map();
      for (var j = 0; j < docs[i].length; j++) seen[docs[i][j]] = true;
      for (t in seen) df[t] = (df[t] || 0) + 1;
    }
    for (t in df) out[t] = Math.max(0, Math.log((docs.length + 1) / (df[t] + 1)));
    return out;
  }

  function wjaccard(a, b, w) {
    if (!a.length || !b.length) return 0;
    var sa = map(), sb = map(), inter = 0, union = 0, t;
    for (var i = 0; i < a.length; i++) sa[a[i]] = true;
    for (var j = 0; j < b.length; j++) sb[b[j]] = true;
    for (t in sa) { union += w[t] || 0; if (sb[t]) inter += w[t] || 0; }
    for (t in sb) if (!sa[t]) union += w[t] || 0;
    return union > 0 ? inter / union : 0;
  }

  /* One claim's word list and unit-length weighted gram vector, computed once, as Similarity does per page. */
  function vec(text, model) {
    var g = grams(text), v = map(), norm = 0, k, x;
    for (k in g) { x = g[k] * (model.gidf[k] || 0); v[k] = x; norm += x * x; }
    norm = Math.sqrt(norm);
    var gv = map();
    if (norm) for (k in v) if (v[k]) gv[k] = v[k] / norm;
    return {w: words(text), gv: gv, size: Object.keys(gv).length};
  }

  function score(a, b, model) {
    if (typeof a === 'string') a = vec(a, model);
    if (typeof b === 'string') b = vec(b, model);
    var x = a.gv, y = b.gv, dot = 0;
    if (a.size > b.size) { x = b.gv; y = a.gv; }
    for (var k in x) dot += x[k] * (y[k] || 0);
    return 0.5 * wjaccard(a.w, b.w, model.widf) + 0.5 * dot;
  }

  function build(claims) {
    var ws = [], gs = [], i;
    for (i = 0; i < claims.length; i++) { ws.push(words(claims[i].text)); gs.push(Object.keys(grams(claims[i].text))); }
    var model = {claims: claims, widf: idf(ws), gidf: idf(gs), vecs: []};
    for (i = 0; i < claims.length; i++) model.vecs.push(vec(claims[i].text, model));
    return model;
  }

  function nearest(text, model, k, kinds) {
    var q = vec(text, model), out = [];
    if (!q.w.length && !q.size) return out;
    for (var i = 0; i < model.claims.length; i++) {
      if (kinds && kinds.indexOf(model.claims[i].kind) < 0) continue;
      var s = score(q, model.vecs[i], model);
      if (s >= FLAG) out.push({claim: model.claims[i], score: s});
    }
    out.sort(function (p, r) { return r.score - p.score || (p.claim.key < r.claim.key ? -1 : 1); });
    return out.slice(0, k || 5);
  }

  /* ---------------------------------------------------------------- GitHub issue URLs (section C) */
  function query(params) {
    var parts = [];
    for (var i = 0; i < params.length; i++) {
      if (params[i][1]) parts.push(params[i][0] + '=' + encodeURIComponent(params[i][1]));
    }
    return parts.join('&');
  }

  function voteUrl(repo, key, vote) {
    return repo + '/issues/new?' + query([['template', 'vote.yml'], ['labels', 'vote'],
      ['title', 'Vote ' + vote + ': ' + key], ['page', key], ['vote', vote]]);
  }

  /* fields: {text, source, why, topic, agree, disagree}. The free text is cut until the query fits GitHub's
     limit; the form has the rest typed by the person anyway. The one-line inputs are capped up front so the
     fixed part can never be over the limit on its own. */
  function issueUrl(repo, section, side, page, fields) {
    var belief = section === 'belief', title = (fields.title || '').replace(/:\s*$/, '') || (belief ? TITLES.belief : TITLES[section]);
    if (typeof title === 'object') title = title[side] || title.agree;
    if (!title) title = section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, ' ');
    var text = fields.text || '', source = (fields.source || '').slice(0, 500), topic = (fields.topic || '').slice(0, 200);
    var fixed = query(belief ?
      [['template', 'belief.yml'], ['labels', 'belief'], ['title', title + ': ' + text.slice(0, 60)],
       ['topic', topic], ['source', source]] :
      [['template', 'contribute.yml'], ['labels', 'contribution'], ['title', title + ': ' + text.slice(0, 60)],
       ['page', page], ['section', section], ['side', side], ['category', (fields.category || '').slice(0, 60)],
       ['source', source], ['url', (fields.url || '').slice(0, 500)], ['date', (fields.date || '').slice(0, 10)]]);
    var free = [['text', text], ['why', fields.why], ['agree', fields.agree], ['disagree', fields.disagree]], q, before;
    while (true) {
      q = fixed + '&' + query(free);
      if (q.length <= QUERY_MAX) break;
      before = q.length;
      for (var i = 0; i < free.length; i++) free[i][1] = (free[i][1] || '').slice(0, Math.floor((free[i][1] || '').length * 0.8));
      if ((fixed + '&' + query(free)).length === before) break;
    }
    return repo + '/issues/new?' + q;
  }

  /* ---------------------------------------------------------------- the page (section E) */
  var index = {model: null, waiting: [], started: false};

  function loadIndex(path, done) {
    if (index.model) return done(index.model);
    index.waiting.push(done);
    if (index.started) return;
    index.started = true;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        index.model = build(JSON.parse(xhr.responseText).claims);
        var w = index.waiting; index.waiting = [];
        for (var i = 0; i < w.length; i++) w[i](index.model);
      }
    };
    xhr.send();
  }

  function el(tag, text, attrs) {
    var node = document.createElement(tag);
    if (text) node.appendChild(document.createTextNode(text));
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }

  /* Is the matched claim already a row on the page the reader is on? Every row that is a page links it, so
     the page itself is the record; nothing else has to be stored. */
  function onThisPage(key) {
    if (typeof document === 'undefined' || !document.querySelector) return false;
    return !!document.querySelector('a[href$="/' + key + '.html"], a[href="' + key + '.html"]');
  }

  /* The text a reader typed is the issue as GitHub renders a filled-in form: one "### Label" heading per
     field. The intake Action reads exactly this, so pasted text parses the same as a submitted form. */
  function issueText(form) {
    var belief = form.getAttribute('data-section') === 'belief', labels = belief ? BELIEF_LABELS : LABELS;
    var inputs = form.querySelectorAll('[name]'), out = [], seen = {}, k;
    for (var i = 0; i < inputs.length; i++) {
      var n = inputs[i].name;
      if (!labels[n] || seen[n]) continue;
      seen[n] = true;
      out.push('### ' + labels[n] + '\n\n' + (inputs[i].value.trim() || '_No response_'));
    }
    for (k in labels) if (!seen[k]) out.push('### ' + labels[k] + '\n\n_No response_');
    return out.join('\n\n') + '\n';
  }

  function copyText(form, status) {
    var text = issueText(form), done = function () { status.textContent = 'Copied. Paste it into an email or message to the maintainer, or into a new issue on GitHub.'; };
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = el('textarea', text, {'aria-label': 'Your submission as text', readonly: 'readonly', rows: '6'});
      status.textContent = 'Copy this text and send it to the maintainer:';
      status.appendChild(ta); ta.select();
    }
  }

  function showMatches(form, matches) {
    var dup = form.querySelector('.dup'), button = form.querySelector('button[type=submit]');
    var repo = form.getAttribute('data-repo'), site = (form.getAttribute('data-index') || '').replace(/data\/[^\/]*$/, '');
    while (dup.firstChild) dup.removeChild(dup.firstChild);
    form.openPage = null;
    button.textContent = button.getAttribute('data-label') || button.textContent;
    if (!matches.length) return;
    var merged = matches[0].score >= MERGE, top = matches[0].claim, here = merged && onThisPage(top.key);
    if (here) {
      /* already a row here: the button opens the claim's own page, where Agree and Disagree are both on the heading line */
      form.openPage = top.page ? site + top.page : null;
      button.textContent = 'This is already here: open it and vote';
    } else if (merged) {
      /* on the site, but not on this page: submitting places the claim already here as a row on this page */
      button.textContent = 'Already on the site; add it here as well';
    }
    dup.appendChild(el('span', merged ? 'Already on the site: ' : 'Is it one of these? '));
    var list = el('ul');
    for (var i = 0; i < matches.length; i++) {
      var c = matches[i].claim, li = el('li');
      li.appendChild(c.page ? el('a', c.text, {href: site + c.page}) : el('span', c.text + (c.draft ? ' (a draft)' : '')));
      li.appendChild(document.createTextNode(' It is this one: '));
      li.appendChild(el('a', 'agree', {href: voteUrl(repo, c.key, 'agree'), rel: 'nofollow', target: '_blank'}));
      li.appendChild(document.createTextNode(' / '));
      li.appendChild(el('a', 'disagree', {href: voteUrl(repo, c.key, 'disagree'), rel: 'nofollow', target: '_blank'}));
      list.appendChild(li);
    }
    dup.appendChild(list);
  }

  function wireForm(form) {
    var text = form.querySelector('textarea[name=text], input[name=text]'), timer = null;
    var button = form.querySelector('button[type=submit]'), section = form.getAttribute('data-section');
    if (!text || !button) return;
    var kinds = INTEREST_SECTIONS.indexOf(section) >= 0 ? ['interest'] : ['belief', 'claim'];
    button.setAttribute('data-label', button.textContent);
    /* no account needed: the whole submission as text, on the clipboard */
    var status = el('span', '', {'class': 'copied', role: 'status'});
    var copy = el('button', 'Copy as text', {type: 'button', 'class': 'copy', title: 'Put this submission on the clipboard as text, to send without a GitHub account'});
    copy.addEventListener('click', function () { while (status.firstChild) status.removeChild(status.firstChild); copyText(form, status); });
    button.parentNode.insertBefore(copy, button.nextSibling);
    copy.parentNode.insertBefore(status, copy.nextSibling);
    text.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        loadIndex(form.getAttribute('data-index'), function (model) {
          showMatches(form, text.value.trim() ? nearest(text.value, model, 5, kinds) : []);
        });
      }, DEBOUNCE);
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.openPage) { window.location.href = form.openPage; return; }
      var fields = {}, inputs = form.querySelectorAll('[name]');
      for (var i = 0; i < inputs.length; i++) fields[inputs[i].name] = inputs[i].value.trim();
      var url = issueUrl(form.getAttribute('data-repo'), section, form.getAttribute('data-side'), form.getAttribute('data-page'), fields);
      window.open(url, '_blank', 'noopener');
    });
  }

  function wire(scope) {
    var forms = (scope || document).querySelectorAll('form.add');
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  }

  var api = {FLAG: FLAG, MERGE: MERGE, words: words, grams: grams, idf: idf, score: score, build: build,
    nearest: nearest, voteUrl: voteUrl, issueUrl: issueUrl, wire: wire, INTEREST_SECTIONS: INTEREST_SECTIONS};
  if (typeof module !== 'undefined') module.exports = api;
  if (root) {
    root.ISEContribute = api;
    if (root.document && root.document.readyState !== 'loading') wire();
    else if (root.document) root.document.addEventListener('DOMContentLoaded', function () { wire(); });
  }
})(typeof window !== 'undefined' ? window : null);
