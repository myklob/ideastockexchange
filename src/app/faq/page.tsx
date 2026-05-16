'use client';

import Link from 'next/link';
import { useState } from 'react';

type FAQ = {
  id: string;
  part: 1 | 2 | 3 | 4;
  question: string;
  answer: React.ReactNode;
};

const parts: Record<1 | 2 | 3 | 4, string> = {
  1: 'Part 1: Is this worth my attention?',
  2: 'Part 2: Can the system actually work?',
  3: 'Part 3: Who does this, and who runs it?',
  4: 'Part 4: How is this different, and can you actually build it?',
};

const faqs: FAQ[] = [
  {
    id: 'q1',
    part: 1,
    question: 'Q1: I have no time. Why should I care?',
    answer: (
      <div className="space-y-4">
        <p><strong>Short answer: We&apos;re not asking you for more time. We&apos;re asking you to stop wasting the time you already spend.</strong></p>
        <p>You already argue. You already read political takes. You already sit through debates. You already scroll through Twitter fights about the same three issues you scrolled through last year and the year before. That time is already gone.</p>
        <p>What the Idea Stock Exchange does is make that time <em>cumulative</em> instead of circular. Right now, every debate you participate in starts from zero. Someone makes the same argument your cousin made at Thanksgiving, and you type the same rebuttal you typed last month, and the whole thing disappears into the algorithm&apos;s maw and nothing is preserved. On every platform, forever.</p>
        <p>How we use existing time better:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Group similar arguments.</strong> Similar arguments link together and get counted once instead of being re-typed forever in different words.</li>
          <li><strong>Prioritize quality.</strong> Pro and con arguments go in separate columns, get scored, and get sorted by strength.</li>
          <li><strong>Stop organizing by time.</strong> Reddit, Twitter, Facebook, every forum you&apos;ve ever used organizes content chronologically, which is exactly wrong for reasoning. The Idea Stock Exchange organizes by topic, sub-topic, and how arguments link to conclusions.</li>
        </ul>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          We do not need more civic engagement. We need better organization of the engagement that already exists.
        </blockquote>
        <p>The content already exists in social media, think tanks, academic papers, news articles, and debates. We organize and evaluate it systematically.</p>
      </div>
    ),
  },
  {
    id: 'q2',
    part: 1,
    question: "Q2: Isn't multi-dimensional analysis too complex?",
    answer: (
      <div className="space-y-4">
        <p><strong>Not at all. At its heart, this is arithmetic you learned in elementary school.</strong></p>
        <p>The basic process breaks down into five straightforward steps:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li><strong>Count reasons that support a conclusion.</strong></li>
          <li><strong>Count reasons that oppose it.</strong></li>
          <li><strong>Subtract opposition from support.</strong> That&apos;s your initial argument score.</li>
          <li><strong>If supporting reasons have their own sub-arguments,</strong> add up their scores. Do the same for opposing reasons and subtract.</li>
          <li><strong>Apply linkage scores</strong> to show how strongly each reason actually connects to the conclusion. Multiply the standalone score by its linkage strength.</li>
        </ol>
        <p>You&apos;re already doing this mental math every time you weigh a decision. We&apos;re just making the process visible and verifiable.</p>
        <p><strong>I built the first working version in a spreadsheet in 2005.</strong> No advanced programming. No complex algorithms. Just counting and multiplication.</p>
        <p>For those who want more sophistication, we can implement <Link href="/protocol" className="text-blue-600 hover:underline">ReasonRank</Link> (based on Google&apos;s PageRank, whose patent has expired). Remember: PageRank itself started with two graduate students and computers in a broom closet. If they could revolutionize how we find information with basic tools, we can revolutionize how we evaluate it.</p>
        <p>We start simple. A template that puts reasons to agree and disagree on the same page and links arguments to evidence is easy to use and immediately beneficial. Once the code works well at this basic level, we add more sophisticated features. The system evolves from simple to complex as we prove each layer works.</p>
        <p className="text-sm text-gray-600">Learn more: <Link href="/protocol" className="text-blue-600 hover:underline">ReasonRank</Link>, <Link href="/cba" className="text-blue-600 hover:underline">Linkage &amp; Evidence Scores</Link></p>
      </div>
    ),
  },
  {
    id: 'q3',
    part: 2,
    question: "Q3: Who decides what's true?",
    answer: (
      <div className="space-y-4">
        <p><strong>Nobody. The structure decides, and the structure is visible to everyone.</strong></p>
        <p>This is the philosophical core of the whole project, so it&apos;s worth spending a minute on. On every existing platform, <em>someone</em> decides. On Twitter, the algorithm decides (and the algorithm answers to whoever owns the company that week). On Reddit, moderators decide. On Facebook, fact-checkers decide. On cable news, editors decide. On academic panels, peer reviewers decide. In every case, a small group of humans hold the switch, and you are asked to trust them.</p>
        <p>The Idea Stock Exchange removes the switch.</p>
        <p>A belief&apos;s score is the output of arguments and evidence that have been posted in response to it, weighted by linkage and adjusted for redundancy. That&apos;s the formula. No moderator overrides it. No committee meets. No fact-checker stamps it. If the score is 72, the score is 72 because of the specific arguments posted, and you can click into any of them to see why they got the weight they got.</p>
        <p>If you disagree with the score, you disagree with the arguments that produced it. Post your counter-argument. If it&apos;s well-evidenced and tightly linked to the conclusion, the score shifts. If it&apos;s weak, it doesn&apos;t. Either way, your reasoning is visible and the math is visible and nobody gets to quietly squash you because they don&apos;t like where you&apos;re pointing.</p>
        <p>This is the same move courts make. No individual decides a verdict. The process does. A juror doesn&apos;t trust the judge to be right. The juror trusts the <em>adversarial structure</em> (prosecution, defense, evidence rules, cross-examination) to produce a better answer than any individual could.</p>
        <p>&quot;Trust the structure, not the people running it&quot; is not a new idea. The American Founders built an entire government on that premise. The Idea Stock Exchange is that idea applied to the arguments themselves.</p>
      </div>
    ),
  },
  {
    id: 'q4',
    part: 2,
    question: "Q4: Isn't this vulnerable to brigading, vote manipulation, or coordinated attacks?",
    answer: (
      <div className="space-y-4">
        <p><strong>No. And the reason is one sentence long: the system doesn&apos;t count participation at all. It scores arguments.</strong></p>
        <p>That distinction matters, so let&apos;s be precise about it. Every platform you already hate has the same bug. Reddit, Twitter, YouTube, Facebook, every comment section on the internet. They all treat <em>number of humans clicking a button</em> as the signal. That&apos;s the bug. Ten thousand people clicking &quot;disagree&quot; on a correct argument does not make it wrong. A million upvotes on a fallacy does not make it true. Popularity is not truth. Volume is not logic.</p>
        <p>The Idea Stock Exchange has no concept of &quot;how many people think X.&quot; It has a concept of &quot;what distinct, evidence-backed, tightly-linked arguments exist about X, and how well have they survived counter-argument.&quot; The final score is a function of argument quality, evidence strength, linkage to the conclusion, and redundancy compression. The number of humans who showed up to press a button does not appear in that function anywhere.</p>
        <p><strong>The Idea Stock Exchange has no disagree button. It has a reasons column.</strong></p>
        <p>If you think a claim is wrong, you don&apos;t click a thumb. You write a reason it&apos;s wrong. That reason becomes its own argument node, and it has to survive the same gauntlet as the argument it&apos;s attacking: evidence quality, logical validity, linkage to the conclusion, and redundancy checks against every other reason already posted on the same page.</p>
        <h3 className="font-semibold text-lg">What this kills, mechanically</h3>
        <p><strong>Brigading dies because duplicates get compressed.</strong> If 10,000 sockpuppets post &quot;this is stupid,&quot; they get grouped as one argument node, not ten thousand. Saying the same thing a thousand times doesn&apos;t make it a thousand arguments. It makes it one argument, shouted. Our grouping engine uses three layers: mechanical equivalence (synonym and double-negation detection), semantic overlap (embedding similarity), and community verification for edge cases. Volume advantage disappears.</p>
        <p><strong>Flooding dies because weak arguments drag your side down.</strong> Post 500 evidence-free one-liners onto the pro column and the <em>average</em> argument quality of the pro column drops. Your team actively loses ground by posting junk. This is the exact opposite of every existing platform, where noise and signal look identical because both are measured by click count.</p>
        <p><strong>Volume attacks die because the score comes from structure, not participation.</strong> Your Truth Score does not rise because more people supported you. It rises because better-evidenced, better-linked, non-redundant arguments were added. A room full of partisans shouting the same talking point moves the needle less than one person posting a tight study with a strong linkage score.</p>
        <h3 className="font-semibold text-lg">The five attack types and why each one fails</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Attack type</th>
                <th className="border border-gray-300 px-3 py-2 text-left">How it fails</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2"><strong>Volume brigading</strong></td>
                <td className="border border-gray-300 px-3 py-2">Duplicates get compressed into one node. Ten thousand restatements = one argument.</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2"><strong>Appeal to authority</strong></td>
                <td className="border border-gray-300 px-3 py-2">Author identity doesn&apos;t enter the score formula. Credentials don&apos;t override evidence.</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2"><strong>False fallacy tagging</strong></td>
                <td className="border border-gray-300 px-3 py-2">Accusations are themselves arguments that must win their own sub-debate. No tag-and-kill.</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2"><strong>Spam flooding</strong></td>
                <td className="border border-gray-300 px-3 py-2">Weak arguments drag down your column&apos;s average quality. Junk backfires.</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2"><strong>Bot farms</strong></td>
                <td className="border border-gray-300 px-3 py-2">Same defense as spam, because the system is indifferent to authorship and sensitive to quality.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="font-semibold text-lg">The legal system analogy</h3>
        <p>Courts don&apos;t decide cases by counting how many supporters each side brings to the courthouse. They decide by evaluating the arguments and evidence presented in front of the judge. A mob outside the building doesn&apos;t change the verdict. The Idea Stock Exchange works the same way. The jury is the argument structure itself, and the structure is auditable by anyone with a browser.</p>
        <p className="text-sm text-gray-600">Learn more: <Link href="/cba" className="text-blue-600 hover:underline">Evidence Scores</Link>, <Link href="/protocol" className="text-blue-600 hover:underline">Linkage Scores</Link></p>
      </div>
    ),
  },
  {
    id: 'q5',
    part: 2,
    question: 'Q5: What stops someone from falsely tagging a good argument as a fallacy?',
    answer: (
      <div className="space-y-4">
        <p><strong>Nothing stops them from trying. The system stops them from succeeding.</strong></p>
        <p>On every existing platform, a fallacy accusation is a rhetorical move. You yell &quot;straw man!&quot; in a comment thread and hope it sticks. On the Idea Stock Exchange, a fallacy accusation is a structured argument node with required fields. To make one, you must state:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li><strong>Which fallacy</strong> you are claiming, from a defined taxonomy</li>
          <li><strong>What the original argument actually says,</strong> with a direct link</li>
          <li><strong>How the fallacy&apos;s definition applies</strong> to this specific case</li>
          <li><strong>What evidence</strong> supports your reading</li>
        </ol>
        <p>That accusation is now a node in the graph. It has its own pro/con arguments. It has its own linkage score. The community can counter-argue that you misidentified the fallacy, that you misrepresented the original claim, or that the fallacy label doesn&apos;t fit the facts.</p>
        <p><strong>Only if your fallacy claim wins its own sub-debate does it affect the target argument&apos;s logical validity score.</strong> Accusation alone does nothing. Only winning does.</p>
        <p>And here&apos;s the kicker: the system tracks whether your fallacy accusations tend to land. Cross-partisan calibration watches for the classic tribal pattern: finding fallacies exclusively in arguments you disagree with. If you only ever spot slippery slopes when conservatives argue and only ever spot ad hominems when liberals argue, and the community consistently rejects your claims, your accusations get weighted down as tribal pattern-matching rather than honest analysis. If you consistently identify real fallacies on <em>both</em> sides of the aisle and the community agrees with you, your future accusations carry more weight.</p>
        <p>Short version: <strong>you cannot tag-and-kill. You can only argue-and-maybe-win.</strong></p>
      </div>
    ),
  },
  {
    id: 'q6',
    part: 2,
    question: 'Q6: Doesn’t reputation weighting reduce to appeal-to-authority?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Reputation never overrides argument structure. It only affects speed and friction.</strong></p>
        <p>This is a fair worry and it deserves a precise answer. If high-reputation users&apos; arguments automatically beat low-reputation users&apos; arguments, the system has built a credentialist echo chamber with extra steps. We reject that design.</p>
        <p><strong>What reputation does NOT do:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>It does not determine whether an argument is true</li>
          <li>It does not override the argument&apos;s evidence or linkage score</li>
          <li>It does not turn a weak argument into a strong one</li>
          <li>It does not suppress a strong argument because a new account posted it</li>
        </ul>
        <p><strong>What reputation DOES do:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Speed of integration.</strong> A high-reputation contributor&apos;s argument may be provisionally weighted faster, while a brand-new account&apos;s argument sits in a stabilization window before its full weight propagates. Both converge to the same final score. Reputation affects how quickly, not how high.</li>
          <li><strong>Anti-spam friction.</strong> Brand-new accounts posting a thousand arguments a day face extra scrutiny. Established accounts with a track record face less. This is standard anti-abuse hygiene, not epistemic weighting.</li>
          <li><strong>Initial uncertainty bands.</strong> A claim backed by a known expert in the relevant field may start with tighter confidence intervals, but those intervals adjust as evidence accumulates. The expert can still be wrong, and the system will show it.</li>
        </ul>
        <p>The final argument score is computed from structure, evidence, and linkage. The author&apos;s name never appears in that formula. Reputation only affects the <em>process</em> of getting there.</p>
        <p>Think of it as the difference between <em>who gets a preliminary hearing quickly</em> versus <em>who wins the trial</em>. Reputation can affect the first. It cannot affect the second.</p>
      </div>
    ),
  },
  {
    id: 'q7',
    part: 2,
    question: 'Q7: How does the system check itself against reality?',
    answer: (
      <div className="space-y-4">
        <p><strong>Empirically testable claims get tracked against outcomes. Scores adjust when reality shows up.</strong></p>
        <p>Some arguments imply predictions. &quot;Policy X will reduce unemployment by 2027.&quot; &quot;This drug will show efficacy in Phase III trials.&quot; &quot;This candidate will follow through on stated positions.&quot; Claims like these are resolvable. The world will eventually tell us if they were right.</p>
        <p>The Idea Stock Exchange does three things with resolvable claims:</p>
        <p><strong>1. It tags them as predictive.</strong> The argument node is marked as resolvable, and the observable is defined in advance: which dataset, which metric, which date. No moving goalposts.</p>
        <p><strong>2. It resolves them at the defined time.</strong> When the date arrives, the claim is scored against what actually happened. That result feeds back into the credibility of the arguments that supported the prediction.</p>
        <p><strong>3. It learns.</strong> Arguments that consistently predict correctly gain a track record. Arguments that consistently predict incorrectly lose credibility on <em>future</em> predictions, not on past debates they may have legitimately won on argument structure alone.</p>
        <p>This is a separate, parallel system to the logical-structural scoring. It doesn&apos;t override the Truth Score. An argument can be well-structured and still wrong about the future, and the world will tell us so. An argument can be poorly structured and right by accident. The system tracks both independently and surfaces the gap so readers can see it.</p>
        <h3 className="font-semibold text-lg">The separation of truth from sentiment</h3>
        <p>One more architectural point worth stating plainly: <strong>ReasonRank (logic plus evidence) and Market Price (sentiment plus betting) run as independent subsystems. Neither can directly influence the other&apos;s score.</strong></p>
        <p>When the two diverge, the gap is a signal, not a problem.</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>High ReasonRank with low Market Price</strong> means &quot;rigorously proven but the crowd hasn&apos;t caught up.&quot;</li>
          <li><strong>Low ReasonRank with high Market Price</strong> means &quot;popular but not proven.&quot;</li>
        </ul>
        <p>Both are visible. Neither silently overrides the other. No other platform on earth shows you that gap.</p>
      </div>
    ),
  },
  {
    id: 'q8',
    part: 2,
    question: 'Q8: What happens when a key piece of evidence gets retracted?',
    answer: (
      <div className="space-y-4">
        <p><strong>Everything built on it updates automatically.</strong></p>
        <p>This is one of the system&apos;s strongest features and most platforms don&apos;t have it at all. It&apos;s also the piece most people miss when they first hear about the Idea Stock Exchange, so it&apos;s worth spelling out.</p>
        <p>On Twitter, when a study gets retracted, the tweets citing it stay up with their original engagement counts. The retraction never propagates. On Facebook, same. On Reddit, same. On cable news, the pundit who cited the now-debunked study never has to revisit the conclusion they drew from it. The foundation crumbles and the building stays standing.</p>
        <p>On Wikipedia, the system is better: a human editor can update affected pages. But that requires a human to actually do it, and it usually requires many humans to do it across many pages, and the result depends on whether anyone cares enough to trace the citation chain. In practice, a lot of Wikipedia pages still cite retracted studies years after retraction because no one went back and checked.</p>
        <p>On the Idea Stock Exchange, arguments are linked to their evidence the way web pages are linked in PageRank. When a piece of evidence gets retracted or its evidence score drops, every argument that used it recalculates automatically. Every belief those arguments supported recalculates. The cascade propagates through the dependency graph without anyone having to notice it manually.</p>
        <h3 className="font-semibold text-lg">What this means in practice</h3>
        <p>Consider a belief like &quot;Drug X is safe for children.&quot; Suppose that belief was supported by three arguments, each citing different studies. One of those studies fails to replicate. Here&apos;s what happens:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>The evidence score for the failed study drops (because replication failure is a significant quality signal).</li>
          <li>Every argument that cited that study sees its evidence-backing weaken.</li>
          <li>Those arguments&apos; contribution to the parent belief drops proportionally.</li>
          <li>The belief&apos;s truth score updates.</li>
          <li>Any higher-level belief that depended on &quot;Drug X is safe for children&quot; also updates.</li>
        </ol>
        <p>The whole chain recomputes. Nobody had to go find and edit every affected page. The system is a <em>recursive dependency graph with continuous recomputation</em>, which is a mouthful but describes exactly what it is.</p>
        <h3 className="font-semibold text-lg">No zombie arguments</h3>
        <p>A zombie argument is a claim based on a foundation that has long since collapsed but which still circulates because no one went back to update everything downstream. The world is full of them. &quot;Breakfast is the most important meal of the day&quot; is a zombie. &quot;Fat makes you fat&quot; is a zombie. &quot;We only use 10% of our brains&quot; is a zombie. Each one was built on research that has been superseded or debunked, and each one still circulates because the platforms where they live don&apos;t update automatically.</p>
        <p>The Idea Stock Exchange has no zombies. When the foundation fails, the building updates.</p>
      </div>
    ),
  },
  {
    id: 'q9',
    part: 2,
    question: 'Q9: What if truth is genuinely uncertain?',
    answer: (
      <div className="space-y-4">
        <p><strong>The system handles uncertainty explicitly.</strong></p>
        <p>It doesn&apos;t claim absolute truth. A score of +17 means supporting arguments outweigh opposing ones by 17 points. That&apos;s all it means.</p>
        <p>It includes confidence intervals based on:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Number of arguments evaluated</li>
          <li>Stability over time</li>
          <li>Review depth</li>
          <li>Expert agreement</li>
        </ul>
        <p><strong>Knowability tags:</strong> Settled fact, consensus science, expert judgment, speculation, inherently uncertain, unknowable.</p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          The system shows what we know, what we don&apos;t know, and how confident we should be. It does not force false certainty.
        </blockquote>
      </div>
    ),
  },
  {
    id: 'q10',
    part: 2,
    question: 'Q10: Does this require good faith participation?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. The system works even with pure self-interest.</strong></p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          If people on both sides only outline arguments that support their side, we&apos;re in business.
        </blockquote>
        <p><strong>Same as the legal system:</strong> Lawyers represent their clients&apos; interests. The adversarial process reveals truth anyway.</p>
        <p>Mechanism:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Each side makes its strongest case</li>
          <li>Opposition exposes weaknesses</li>
          <li>The open forum allows counter-arguments</li>
          <li>Quality emerges from the adversarial process</li>
        </ul>
        <p>Good faith helps, but it&apos;s not required.</p>
      </div>
    ),
  },
  {
    id: 'q11',
    part: 3,
    question: 'Q11: Does crowdsourcing undermine expertise?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Expertise is incorporated, but transparently.</strong></p>
        <p><strong>The right standard:</strong> Better than Facebook, Twitter, Reddit. A low bar, worth clearing.</p>
        <p>How expertise is included:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Natural selection. Experts engage their own domains.</li>
          <li>Debate on objective criteria for each issue.</li>
          <li>Transparent expert weighting with justification.</li>
          <li>Public can question and flag decisions.</li>
        </ul>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          The best version combines expert knowledge with public transparency and participation.
        </blockquote>
        <p>Balance, not either/or.</p>
      </div>
    ),
  },
  {
    id: 'q12',
    part: 3,
    question: 'Q12: But experts have been wrong and self-serving. Why should I trust "follow the evidence"?',
    answer: (
      <div className="space-y-4">
        <p><strong>Because &quot;follow the evidence&quot; is not the same as &quot;follow the experts,&quot; and the Idea Stock Exchange exists precisely because the two got conflated.</strong></p>
        <p>Let&apos;s be honest about the credentialed class&apos;s track record over the last twenty years. The Iraq WMD consensus was held by nearly every serious foreign policy expert in Washington. It was wrong. The 2008 financial models were built by the sharpest quants on Wall Street and certified by credentialed rating agencies. They were wrong. The food pyramid told a generation to load up on refined carbs. Wrong. The replication crisis has gutted huge swaths of published social psychology. The Purdue-funded opioid guidelines came from board-certified pain specialists. Wrong in ways that killed people. The lab-leak hypothesis was dismissed by credentialed virologists for two years as a racist conspiracy theory before becoming a reasonable possibility held by the same institutions.</p>
        <p>If you&apos;re suspicious of &quot;trust the experts,&quot; you are not paranoid. You&apos;re paying attention.</p>
        <p>And if a system&apos;s pitch to you is &quot;we&apos;ve done the thinking, just trust us,&quot; that system has earned your suspicion. The Idea Stock Exchange is the opposite pitch. It&apos;s built on the premise that <em>no credential gets you a free pass</em>.</p>
        <h3 className="font-semibold text-lg">What this means in practice</h3>
        <p><strong>Every expert claim has to show its work.</strong> An economist&apos;s argument and an anonymous blogger&apos;s argument get scored by the same rules: evidence quality, logical validity, linkage strength, predictive track record. If the blogger&apos;s argument is better evidenced and more tightly linked, the blogger&apos;s score is higher. Full stop. The economist&apos;s PhD doesn&apos;t appear in the formula.</p>
        <p><strong>Predictive track record matters more than title.</strong> An expert who has been wrong about their field for a decade will have a visible track record of wrong predictions. A non-credentialed contributor who has been right for a decade will have a visible track record of right predictions. The track records are public. Reputation is built by outcomes, not by diplomas.</p>
        <p><strong>Conflicts of interest are visible, not hidden.</strong> If a study is funded by Purdue Pharma, that funding source attaches to the evidence score. Industry-funded research doesn&apos;t get excluded, but it doesn&apos;t get treated as identical to independently-funded research either. You, the reader, get to see the source and judge.</p>
        <p><strong>Consensus without evidence is not consensus.</strong> On Twitter and cable news, &quot;scientists agree&quot; is a conversation-ender. On the Idea Stock Exchange, &quot;scientists agree&quot; is an argument that still has to show its linkage. <em>What</em> do they agree on, <em>based on what studies</em>, with <em>what confidence interval</em>, and <em>what happens to the score if a key study fails to replicate?</em> Those are the questions the structure forces.</p>
        <p><strong>The meritocracy is the scoring, not the credentials.</strong> The reason America&apos;s meritocracy has lost legitimacy is that it stopped being a meritocracy. Credentials got inherited. Institutions closed ranks. Experts faced no consequences for being spectacularly wrong. A real meritocracy would reward being right and penalize being wrong, regardless of who you are. That&apos;s what a public scoring system does.</p>
        <h3 className="font-semibold text-lg">The honest version of &quot;follow the evidence&quot;</h3>
        <p>Follow the evidence means: look at what the evidence actually shows, weighted by its quality, checked against its track record, with conflicts of interest visible and predictions tracked.</p>
        <p>It does <em>not</em> mean: do whatever people with degrees, money, power, or influence tell you to do.</p>
        <p>If you&apos;ve been burned by the second version, the Idea Stock Exchange is trying to build the first. The whole system is an answer to the legitimate populist objection that expertise has been captured by the people holding the credentials. The answer isn&apos;t to trust credentials less. It&apos;s to stop asking anyone to trust credentials at all. Trust the structure that scores the arguments.</p>
      </div>
    ),
  },
  {
    id: 'q13',
    part: 3,
    question: "Q13: Won't one political tribe dominate the platform?",
    answer: (
      <div className="space-y-4">
        <p><strong>No. The design actively resists tribal capture, and both sides can check the math.</strong></p>
        <p>Every tribe assumes the other tribe will flood any new platform and drown them out. Conservatives assume liberals will brigade it. Liberals assume conservatives will brigade it. Libertarians assume both will brigade it. None of them is wrong to worry, because that&apos;s exactly what happens on every existing platform.</p>
        <p>The Idea Stock Exchange&apos;s defense against tribal capture is the same defense as against any other kind of manipulation: <strong>flooding doesn&apos;t help, because the system scores arguments rather than counting participants (see Q4)</strong>. But there&apos;s a second, specifically anti-tribal layer worth explaining.</p>
        <h3 className="font-semibold text-lg">Cross-partisan calibration</h3>
        <p>For every user, the system tracks whether their fallacy accusations, counter-arguments, and evidence challenges tend to land across the political spectrum, or only when targeting one side.</p>
        <p>A user who finds fallacies in left-leaning arguments 30% of the time and right-leaning arguments 35% of the time, and whose accuracy rate is similar across both, is clearly trying to evaluate arguments on their merits. Their accusations carry full weight.</p>
        <p>A user who finds fallacies in opposing arguments 42% of the time and in their own side&apos;s arguments 5% of the time is exhibiting the classic tribal pattern: you can see flaws in the other guys, you&apos;re blind to the same flaws on your own side. Their accusations get down-weighted as tribal pattern-matching, not honest analysis.</p>
        <p>This doesn&apos;t silence them. They can still post arguments. Those arguments still get scored. What gets reduced is the <em>authority of their fallacy accusations</em>, because their track record shows they use the fallacy system as a political weapon rather than an analytical tool.</p>
        <h3 className="font-semibold text-lg">The structural reasons this works</h3>
        <p><strong>Weak partisan arguments hurt your side.</strong> If a tribe floods the platform with 500 poorly-reasoned one-liners supporting their position, the <em>average</em> strength of their side&apos;s column drops. On every other platform, more bodies means more clout. Here, more junk means less clout.</p>
        <p><strong>Both sides can audit the math.</strong> Every score shows its calculation. If conservatives think a score is unfairly low, they can click in and see exactly which arguments got what weight and why. Same for liberals. If the system is being gamed, the game is visible. On Twitter, the algorithm is a black box. Here, the algorithm is the page.</p>
        <p><strong>The structure rewards steel-manning.</strong> A person who posts the strongest version of their own side <em>and</em> accurately represents the strongest version of the other side builds reputation faster than a partisan who only posts against the other side. The system&apos;s incentives reward understanding your opponent well enough to argue against their best case.</p>
        <p>No platform can guarantee neither tribe will try to dominate. The Idea Stock Exchange guarantees that trying doesn&apos;t work, and that the attempt is visible to everyone.</p>
      </div>
    ),
  },
  {
    id: 'q14',
    part: 3,
    question: 'Q14: What about AI-generated arguments flooding the system?',
    answer: (
      <div className="space-y-4">
        <p><strong>LLMs have to pass the same tests as everyone else. AI flooding hits the same wall as human flooding.</strong></p>
        <p>In 2026, every platform is bracing for LLM slop. Comment sections are already 30% AI. Reviews are fake. Social media is a swamp of generated content designed to look like human opinion. The worry: won&apos;t the Idea Stock Exchange just become a scoreboard of who has more GPU credits?</p>
        <p>No. Because the system has a structural defense most platforms lack.</p>
        <h3 className="font-semibold text-lg">What breaks AI flooding</h3>
        <p><strong>Duplication detection doesn&apos;t care if a bot wrote it.</strong> If an LLM generates 10,000 variations of &quot;tax cuts boost growth,&quot; the grouping engine sees 10,000 restatements of one argument. They get compressed into one node. Generating more variations doesn&apos;t produce more score. It produces more text that collapses to the same point.</p>
        <p><strong>Evidence scoring doesn&apos;t care if a bot cited it.</strong> An AI-generated argument that cites &quot;studies show...&quot; without a link to an actual study gets a low evidence score. An AI-generated argument that cites a real study with strong methodology and relevant findings gets a high evidence score. The bot&apos;s authorship doesn&apos;t matter. The citation&apos;s quality does.</p>
        <p><strong>Linkage scoring doesn&apos;t care if a bot reasoned it.</strong> An AI-generated argument that makes a logically tight connection from evidence to conclusion scores high. An AI-generated argument that doesn&apos;t scores low. The structure evaluates the reasoning, not the reasoner.</p>
        <h3 className="font-semibold text-lg">A surprising conclusion</h3>
        <p>AI that generates <em>genuinely novel, well-evidenced, tightly-linked arguments</em> is... welcome, actually. That&apos;s what we want. The defense isn&apos;t against AI. It&apos;s against low-quality contributions, and it&apos;s the same defense either way.</p>
        <p>If an LLM helps a user articulate a strong, well-cited argument they couldn&apos;t have written as cleanly on their own, great. If an LLM spams junk, the junk gets scored as junk. The system is indifferent to authorship and sensitive to quality. That&apos;s the right design for a world where human and AI writing are increasingly indistinguishable.</p>
        <h3 className="font-semibold text-lg">What about authenticity?</h3>
        <p>Some platforms are pursuing an arms race of bot detection. That arms race can&apos;t be won. The Idea Stock Exchange doesn&apos;t try to win it. Instead, the system makes authorship largely irrelevant to scoring. It&apos;s not that we can&apos;t tell if a bot wrote it. It&apos;s that we don&apos;t need to.</p>
      </div>
    ),
  },
  {
    id: 'q15',
    part: 3,
    question: 'Q15: How do you score values and moral questions?',
    answer: (
      <div className="space-y-4">
        <p><strong>You don&apos;t score morality with evidence. You make the value stack visible so readers can see what each position actually depends on.</strong></p>
        <p>This is a legitimate concern and it&apos;s worth being precise about. You cannot evidence your way to whether abortion is wrong, whether loyalty beats honesty, or whether freedom matters more than equality. These are value questions, not empirical ones, and any system that pretends to reduce them to a number is lying about what it&apos;s doing.</p>
        <p>The Idea Stock Exchange doesn&apos;t do that. Here&apos;s how it actually handles values.</p>
        <h3 className="font-semibold text-lg">Knowability tags</h3>
        <p>Every claim gets tagged by what kind of claim it is:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Empirical.</strong> Can be settled by evidence. (&quot;Violent crime rose 12% in Denver from 2020 to 2024.&quot;)</li>
          <li><strong>Definitional.</strong> Depends on how terms are defined. (&quot;Is a 20-week fetus a person?&quot;)</li>
          <li><strong>Value-laden.</strong> Depends on which values you hold. (&quot;Should individual liberty take priority over collective safety?&quot;)</li>
          <li><strong>Predictive.</strong> Resolvable by future evidence. (&quot;Carbon pricing will reduce emissions by 15% by 2030.&quot;)</li>
        </ul>
        <p>These get scored differently. An empirical claim gets scored on evidence and linkage. A value claim gets displayed as a value claim, with its own node and sub-arguments about <em>why</em> someone holds that value.</p>
        <h3 className="font-semibold text-lg">Making the value stack visible</h3>
        <p>Here&apos;s what this looks like in practice. Take the abortion debate. Most public arguments about abortion sound empirical (&quot;a fetus feels pain at X weeks&quot;) but the real disagreement is underneath: a value-stack about personhood, bodily autonomy, the moral weight of potential versus actual life, and the role of government.</p>
        <p>On most platforms, people argue the surface claims and never get to the underlying values. The conversation is doomed because the participants don&apos;t actually disagree about the empirical claims. They disagree about which values those claims should be read through.</p>
        <p>On the Idea Stock Exchange, the value premises become their own nodes. You can click into &quot;bodily autonomy is a fundamental right&quot; and see the sub-arguments for and against that premise. You can click into &quot;a fetus is a person at conception&quot; and see the definitional arguments. You can see exactly which value premises a given position depends on, and which ones you&apos;d have to accept or reject to reach the same conclusion.</p>
        <p>This doesn&apos;t resolve the values disagreement. Nothing resolves values disagreement. But it makes the disagreement <em>legible</em>. You can see clearly what the other side believes and why. You can see which of your own beliefs are load-bearing. You can see where you actually disagree instead of shouting past each other about surface claims.</p>
        <h3 className="font-semibold text-lg">Why this is better than ignoring values</h3>
        <p>Every existing platform pretends political disagreements are factual disagreements. They aren&apos;t. Most political fights are values fights wearing empirical clothes. By separating the two and making the value-stack explicit, the Idea Stock Exchange does something no other system does: it tells you honestly when a disagreement is empirical (and therefore resolvable by evidence) and when it&apos;s value-based (and therefore not).</p>
        <p>That honesty is the point. Pretending to score morality would be dishonest. Hiding that values are doing the work would be worse. Making it visible is the only option that respects the reader.</p>
      </div>
    ),
  },
  {
    id: 'q16',
    part: 4,
    question: 'Q16: How is this different from Wikipedia, Kialo, or Debatepedia?',
    answer: (
      <div className="space-y-4">
        <p><strong>They&apos;re all missing the scoring layer. The Idea Stock Exchange is the scoring layer.</strong></p>
        <p>This is a fair question. Structured-debate platforms are a graveyard. Let&apos;s go through the predecessors and be specific about what&apos;s different.</p>
        <h3 className="font-semibold text-lg">Wikipedia</h3>
        <p>Wikipedia is the best thing the internet has ever produced, and it&apos;s not what we&apos;re doing. Wikipedia aims for <em>neutral description of existing views</em>. Its editorial standard is &quot;represent what reliable sources say, don&apos;t take sides.&quot; That&apos;s the right design for an encyclopedia. It&apos;s the wrong design for a truth-scoring system.</p>
        <p>The Idea Stock Exchange aims to score <em>which view is actually better supported</em>. On an issue where experts disagree, Wikipedia says &quot;experts disagree, and here&apos;s the range of views.&quot; The Idea Stock Exchange says &quot;here are the arguments on each side, here are their evidence scores, here are their linkage scores, here&apos;s which side the structure currently weights more heavily, and here&apos;s the confidence interval.&quot; Different goals. Different designs.</p>
        <h3 className="font-semibold text-lg">Kialo</h3>
        <p>Kialo is the closest existing system to what we&apos;re building. It shows arguments in pro/con trees and lets users rate them. What Kialo doesn&apos;t have:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Evidence scored separately from arguments.</strong> Kialo rates arguments but doesn&apos;t break out evidence as its own layer with its own quality scoring.</li>
          <li><strong>Linkage scores.</strong> Kialo doesn&apos;t distinguish between &quot;this argument is true&quot; and &quot;this argument is relevant to the conclusion.&quot; In the Idea Stock Exchange, a true-but-irrelevant argument gets a low linkage score and doesn&apos;t move the conclusion.</li>
          <li><strong>Fallacy detection as structured argument.</strong> Kialo has no mechanism for disputing the logical validity of an argument separate from disputing its content.</li>
          <li><strong>Prediction tracking.</strong> Kialo doesn&apos;t check its arguments against future outcomes.</li>
          <li><strong>Duplication compression.</strong> Kialo doesn&apos;t group semantically similar arguments, so the same claim restated twenty ways inflates the visible support.</li>
        </ul>
        <p>Kialo is a visualization layer. The Idea Stock Exchange is a scoring engine. They&apos;re adjacent but different.</p>
        <h3 className="font-semibold text-lg">Debatepedia</h3>
        <p>Debatepedia tried to be Wikipedia-for-debates and quietly died. Why? Because it didn&apos;t have a scoring engine. Debates just accumulated. Arguments piled up. Nothing ever got resolved. A thousand-argument debate and a ten-argument debate looked roughly the same, because neither had a mechanism for saying &quot;this side&apos;s arguments are stronger because of X, Y, Z.&quot;</p>
        <p>Without scoring, structured debate becomes just another archive. You end up with a more organized version of the same problem: lots of text, no conclusion, no way to figure out who&apos;s actually making more sense. Debatepedia&apos;s fate is the warning.</p>
        <h3 className="font-semibold text-lg">Why the Idea Stock Exchange should survive where others didn&apos;t</h3>
        <p>The scoring layer is the difference. Everything the predecessors did well (pro/con structure, crowd contributions, cross-linking) the Idea Stock Exchange keeps. What&apos;s new is the recursive scoring: arguments built from sub-arguments, evidence scored by source quality, linkage scored separately from truth, predictions tracked over time, and a visible gap between logical scoring (ReasonRank) and crowd sentiment (Market Price).</p>
        <p>Without scoring, you have a library. With scoring, you have a search engine for what&apos;s actually true.</p>
      </div>
    ),
  },
  {
    id: 'q17',
    part: 4,
    question: 'Q17: Is this too difficult to build?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. The core is simple, and proof already exists.</strong></p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          I built a version in Microsoft Excel 15 years ago that gave argument scores by adding reasons to agree and subtracting reasons to disagree.
        </blockquote>
        <p><strong>Core algorithm:</strong> Basic arithmetic in a spreadsheet or simple database.</p>
        <p>Implementation plan:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Start small. Single issue, 100 users.</li>
          <li>Build slowly with community.</li>
          <li>Leverage existing content.</li>
          <li>Multiple funding paths exist.</li>
        </ul>
        <p>Resources available:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>A small fraction of annual political spending would be enough.</li>
          <li>AI is lowering development barriers faster than anyone expected.</li>
          <li>Cultural demand exists.</li>
          <li>Technology is mature.</li>
        </ul>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          There is no project more worthwhile than building the tools that enable collective reasoning. The status quo is failing. We can do better, and we can start now.
        </blockquote>
      </div>
    ),
  },
  {
    id: 'q18',
    part: 4,
    question: 'Q18: Only small percentages contribute to platforms. Is that a problem?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. This confuses symbolism with substance, and it makes the same mistake America makes about voter turnout.</strong></p>
        <p>The question isn&apos;t &quot;what percentage contributes?&quot; It&apos;s &quot;can anyone who wants to contribute do so meaningfully, and does the system give people what they would want if they had thousands of hours to weigh the trade-offs?&quot;</p>
        <p>The Idea Stock Exchange is democratic because:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Anyone can read and verify arguments.</li>
          <li>Anyone can add evidence when they have something valuable.</li>
          <li>Anyone can challenge weak reasoning.</li>
          <li>Anyone can engage as deeply as they choose.</li>
        </ul>
        <p>What&apos;s <em>not</em> democratic: forcing everyone through arbitrary, pointless, performative rituals (like making everyone vote on issues they haven&apos;t researched, or guilting people into &quot;contributing&quot; when they have nothing to add).</p>
        <h3 className="font-semibold text-lg">The parallel to voter turnout</h3>
        <p><strong>Voter turnout is a poor metric for democratic health.</strong> America obsesses over turnout percentages, but autocracies like Russia and North Korea force 90%+ turnout while crushing dissent. High turnout tells you nothing about whether government responds to what citizens actually want.</p>
        <p><strong>Evidence-based participation beats voting frequency.</strong> One citizen contributing quality evidence helps democracy more than 100 uninformed votes. Wikipedia proved this: a tiny fraction of contributors built humanity&apos;s greatest encyclopedia because the process was transparent, organized, and focused, not because everyone was forced to edit articles.</p>
        <p><strong>Iraq proved elections alone don&apos;t create democracy.</strong> We gave Iraq ballots and a constitution. We didn&apos;t give them transparent systems connecting beliefs to evidence. The result: tribal voting blocks and sectarian violence. High participation in meaningless rituals does not equal democracy.</p>
        <p><strong>The Constitution is an algorithm for filtering ideas, not a shallow everyone-votes cult.</strong> The Founders built deliberative structures (Senate, Federalist Papers, separation of powers, amendment process) because they wanted to see what evidence each side could bring, not just which side could manipulate the most voters.</p>
        <p><strong>Organized participation outperforms mass voting.</strong> Forcing everyone to vote on everything produces terrible results. Creating transparent, organized, focused ways for anyone to participate democratically produces wisdom.</p>
        <h3 className="font-semibold text-lg">The path forward</h3>
        <p>Everyone is invited. Everyone can contribute. Everyone can verify. But we&apos;re not measuring success by what percentage contributes. We&apos;re measuring success by whether the system produces collective intelligence through organized, open, meaningful participation.</p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          <p><em>Democracy is two wolves and a lamb voting on what to have for lunch. Liberty is a well-armed lamb contesting the vote.</em></p>
          <p className="mt-2"><em>The Idea Stock Exchange arms every participant with evidence, transparent reasoning, and organized ways to engage, not just a ballot.</em></p>
        </blockquote>
      </div>
    ),
  },
];

function FAQItem({ faq, isOpen, onToggle }: {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 bg-white hover:bg-gray-50 flex justify-between items-start gap-4 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900">{faq.question}</span>
        <span className="text-gray-400 text-xl flex-shrink-0 mt-0.5">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 text-gray-700 text-sm leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['q1']));

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setOpenItems(new Set(faqs.map(f => f.id)));
  const collapseAll = () => setOpenItems(new Set());

  const partGroups: Array<{ part: 1 | 2 | 3 | 4; items: FAQ[] }> = ([1, 2, 3, 4] as const).map(p => ({
    part: p,
    items: faqs.filter(f => f.part === p),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">Idea Stock Exchange</h1>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <Link href="/debate-topics" className="text-blue-600 hover:text-blue-800">Debate Topics</Link>
            <Link href="/beliefs" className="text-blue-600 hover:text-blue-800">Beliefs</Link>
            <Link href="/faq" className="text-blue-600 hover:text-blue-800 font-semibold">FAQ</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions and Criticisms
          </h1>
          <p className="text-gray-600 max-w-3xl text-lg">
            This page is organized by topic, not by the order questions got asked. If the Idea Stock Exchange is supposed to replace chronological chaos with structured reasoning, the FAQ about it should do the same.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Contents</h2>
          <div className="space-y-5 text-sm">
            {partGroups.map(group => (
              <div key={group.part}>
                <p className="font-semibold text-gray-800 mb-2">{parts[group.part]}</p>
                <ol className="space-y-1.5 ml-4">
                  {group.items.map(faq => (
                    <li key={faq.id}>
                      <button
                        onClick={() => {
                          setOpenItems(prev => new Set([...prev, faq.id]));
                          setTimeout(() => {
                            document.getElementById(faq.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 50);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {faq.question}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6 text-sm">
          <button
            onClick={expandAll}
            className="px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* FAQ Items by Part */}
        <div className="space-y-10">
          {partGroups.map(group => (
            <section key={group.part}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                {parts[group.part]}
              </h2>
              <div className="space-y-3">
                {group.items.map(faq => (
                  <div key={faq.id} id={faq.id}>
                    <FAQItem
                      faq={faq}
                      isOpen={openItems.has(faq.id)}
                      onToggle={() => toggle(faq.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Why This Works Summary */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Why This Works</h2>
          <ul className="space-y-2 text-blue-800">
            <li>✓ <strong>Simpler than it seems</strong> — Basic arithmetic</li>
            <li>✓ <strong>Doesn&apos;t need perfection</strong> — Just better than the status quo</li>
            <li>✓ <strong>Leverages existing behavior</strong> — People already argue</li>
            <li>✓ <strong>Has natural defenses</strong> — The system scores arguments instead of counting participants, so brigading and flooding don&apos;t work</li>
            <li>✓ <strong>Trusts structure, not authority</strong> — No credential gets a free pass</li>
            <li>✓ <strong>Updates itself</strong> — When evidence changes, dependent beliefs recalculate automatically. No zombie arguments.</li>
            <li>✓ <strong>Historical precedents</strong> — Wikipedia, PageRank, the legal system all work</li>
            <li>✓ <strong>Need is urgent</strong> — Current systems are failing</li>
            <li>✓ <strong>Resources exist</strong> — Technology, funding, demand are ready</li>
          </ul>
        </div>

        {/* Learn More */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Learn More</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-2">Core Framework</p>
              <ul className="space-y-1">
                <li><Link href="/debate-topics" className="text-blue-600 hover:underline">One Page Per Topic</Link></li>
                <li><Link href="/protocol" className="text-blue-600 hover:underline">ReasonRank</Link></li>
                <li><Link href="/cba" className="text-blue-600 hover:underline">Evidence &amp; Linkage Scores</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-2">Related</p>
              <ul className="space-y-1">
                <li><Link href="/beliefs" className="text-blue-600 hover:underline">Beliefs</Link></li>
                <li><Link href="/arguments" className="text-blue-600 hover:underline">Arguments</Link></li>
                <li><a href="https://github.com/myklob/ideastockexchange" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View the Vision on GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </footer>
    </div>
  );
}
