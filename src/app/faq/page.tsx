'use client';

import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    id: 'q1',
    question: 'Q1: How will this work when most people have limited time?',
    answer: (
      <div className="space-y-4">
        <p><strong>Short Answer:</strong> We make better use of time already spent, not ask for more.</p>
        <p>How can we use people&apos;s time better:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Group Similar arguments</strong> — Similar arguments link together, counted once (one page per belief)</li>
          <li><strong>Prioritize quality</strong> — Pro and Con arguments are in separate columns, given scores, and sorted by their scores</li>
          <li><strong>Fix chronological chaos</strong> — Reddit, Twitter, Facebook, and all other web forums waste everyone&apos;s time by organizing content chronologically, rather than organizing the content by topic and sub-topic, and by how arguments and evidence are linked to conclusions</li>
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
    question: 'Q2: Is multi-dimensional analysis too complex?',
    answer: (
      <div className="space-y-4">
        <p><strong>Not at all. At its heart, this is arithmetic you learned in elementary school.</strong></p>
        <p>The basic process breaks down into five straightforward steps:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li><strong>Count reasons that support a conclusion</strong></li>
          <li><strong>Count reasons that oppose it</strong></li>
          <li><strong>Subtract opposition from support</strong> = Your initial argument score</li>
          <li><strong>If supporting reasons have their own sub-arguments</strong>, add up their scores. Do the same for opposing reasons and subtract.</li>
          <li><strong>Apply linkage scores</strong> to show how strongly each reason actually connects to the conclusion. Multiply the standalone score by its linkage strength.</li>
        </ol>
        <p>Think of it this way: you&apos;re already doing this mental math every time you weigh a decision. We&apos;re just making the process visible and verifiable.</p>
        <p><strong>The first working version was built in a simple spreadsheet in 2005.</strong> No advanced programming. No complex algorithms. Just counting and multiplication.</p>
        <p>For those who want more sophistication, we can implement ReasonRank (based on Google&apos;s PageRank, whose patent has expired). Remember: PageRank itself started with two graduate students and computers in a broom closet more than 20 years ago. If they could revolutionize how we find information with basic tools, we can revolutionize how we evaluate it.</p>
        <p>We start simple. A template that puts reasons to agree and disagree on the same page and links arguments to evidence is easy to use and immediately beneficial. Once the code works well at this basic level, we add more sophisticated features.</p>
        <p className="text-sm text-gray-600">Learn more: <Link href="/protocol" className="text-blue-600 hover:underline">ReasonRank</Link>, <Link href="/cba" className="text-blue-600 hover:underline">Linkage Scores</Link></p>
      </div>
    ),
  },
  {
    id: 'q3',
    question: 'Q3: Only small percentages contribute to platforms. Is that a problem?',
    answer: (
      <div className="space-y-4">
        <p>No. This concern focuses on the symbolism not the substance of participation and transparency. It makes the same mistake America makes about voter turnout: obsessing over participation percentages instead of participation quality.</p>
        <h3 className="font-semibold text-lg">The Real Question</h3>
        <p>Not: &quot;What percentage contributes?&quot;</p>
        <p>But: &quot;Can anyone who wants to contribute do so meaningfully, and do we give people what evidence shows they want?&quot;</p>
        <p><strong>The Idea Stock Exchange is democratic because:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Anyone can read and verify arguments</li>
          <li>Anyone can add evidence when they have something valuable</li>
          <li>Anyone can challenge weak reasoning</li>
          <li>Anyone can engage as deeply as they choose</li>
        </ul>
        <p><strong>What&apos;s NOT democratic:</strong> Forcing everyone through arbitrary, pointless, performative rituals (like making everyone vote on issues they haven&apos;t researched, or guilting people into &quot;contributing&quot; when they have nothing to add).</p>
        <h3 className="font-semibold text-lg">The Parallel to Voter Turnout</h3>
        <p>Autocracies like Russia and North Korea force 90%+ turnout while crushing dissent. High turnout tells you nothing about whether government responds to what citizens actually want.</p>
        <p>One citizen contributing quality evidence helps democracy more than 100 uninformed votes. Wikipedia proved this: a tiny fraction of contributors built humanity&apos;s greatest encyclopedia because the process was transparent, organized, and focused — not because everyone was forced to edit articles.</p>
        <h3 className="font-semibold text-lg">What Makes Participation Democratic</h3>
        <p><strong>Democratic platforms are:</strong> Open, Transparent, Accountable, Meritocratic — quality arguments rise based on evidence, not volume.</p>
        <p><strong>Democratic platforms are NOT:</strong> Forcing everyone to contribute regardless of whether they have something valuable to add, measuring success by participation percentages, or treating all contributions equally regardless of quality.</p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;Democracy is two wolves and a lamb voting on what to have for lunch. Liberty is a well-armed lamb contesting the vote.&quot; The Idea Stock Exchange arms every participant with evidence, transparent reasoning, and organized ways to engage — not just a ballot.
        </blockquote>
      </div>
    ),
  },
  {
    id: 'q4',
    question: 'Q4: Is this vulnerable to manipulation?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Structure resists it.</strong></p>
        <p><strong>Why manipulation is harder:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Weak arguments hurt your side</strong> — Lower overall score</li>
          <li><strong>Redundancy grouped</strong> — Spam counted once</li>
          <li><strong>Unsupported claims rank low</strong> — Evidence-free statements visible and penalized</li>
          <li><strong>Quality beats volume</strong> — Logic trumps emotion</li>
        </ul>
        <p><strong>Structured reasoning is harder to game than chaotic platforms.</strong></p>
        <p className="text-sm text-gray-600">Learn more: <Link href="/cba" className="text-blue-600 hover:underline">Evidence Scores</Link></p>
      </div>
    ),
  },
  {
    id: 'q5',
    question: 'Q5: Does this require good faith participation?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Works even with pure self-interest.</strong></p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;If people on both sides only outline arguments that support their side, we are in business.&quot;
        </blockquote>
        <p><strong>Same as the legal system:</strong> Lawyers represent clients&apos; interests, the process reveals truth.</p>
        <p><strong>Mechanism:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Each side makes strongest case</li>
          <li>Opposition exposes weaknesses</li>
          <li>Open forum allows counter-arguments</li>
          <li>Quality emerges from adversarial process</li>
        </ul>
        <p><strong>Good faith helps but isn&apos;t required.</strong></p>
      </div>
    ),
  },
  {
    id: 'q6',
    question: 'Q6: What if truth is genuinely uncertain?',
    answer: (
      <div className="space-y-4">
        <p><strong>The system handles uncertainty explicitly.</strong></p>
        <p><strong>Not claiming absolute truth.</strong> A score of +17 means supporting arguments outweigh opposing by 17 points.</p>
        <p><strong>Includes confidence intervals</strong> based on:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Number of arguments evaluated</li>
          <li>Stability over time</li>
          <li>Review depth</li>
          <li>Expert agreement</li>
        </ul>
        <p><strong>Knowability tags:</strong> Settled fact, consensus science, expert judgment, speculation, inherently uncertain, unknowable.</p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;The system shows what we know, what we don&apos;t know, and how confident we should be. It does not force false certainty.&quot;
        </blockquote>
      </div>
    ),
  },
  {
    id: 'q7',
    question: 'Q7: Does crowdsourcing undermine expertise?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Expertise is incorporated but transparent.</strong></p>
        <p><strong>Right standard:</strong> Better than Facebook/Twitter/Reddit (a low bar).</p>
        <p><strong>How expertise is included:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Natural selection (experts engage their domains)</li>
          <li>Debate on objective criteria for each issue</li>
          <li>Transparent expert weighting with justification</li>
          <li>Public can question and flag issues</li>
        </ul>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;The best version combines expert knowledge with public transparency and participation.&quot;
        </blockquote>
        <p><strong>Balance, not either/or.</strong></p>
      </div>
    ),
  },
  {
    id: 'q8',
    question: 'Q8: Is this too difficult to build?',
    answer: (
      <div className="space-y-4">
        <p><strong>No. Core is simple; proof exists.</strong></p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;I built a version in Microsoft Excel 15 years ago that gave argument scores by adding reasons to agree and subtracting reasons to disagree.&quot;
        </blockquote>
        <p><strong>Core algorithm:</strong> Basic arithmetic in a spreadsheet or simple database.</p>
        <p><strong>Implementation plan:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Start small (single issue, 100 users)</li>
          <li>Build slowly with community</li>
          <li>Leverage existing content</li>
          <li>Multiple funding paths exist</li>
        </ul>
        <p><strong>Resources available:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Small fraction of political spending sufficient</li>
          <li>AI lowering development barriers</li>
          <li>Cultural demand exists</li>
          <li>Technology mature</li>
        </ul>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700">
          &quot;There is no project more worthwhile than building the tools that enable collective reasoning. The status quo is failing. We can do better, and we can start now.&quot;
        </blockquote>
      </div>
    ),
  },
  {
    id: 'q9',
    question: 'Q9: False Binary Framing — dividing arguments into "agree" and "disagree" oversimplifies complex issues.',
    answer: (
      <div className="space-y-4">
        <p>The &quot;false binary&quot; criticism misunderstands the level at which the structure operates.</p>
        <p>For any specific belief, an argument can do only one of two things: strengthen it or weaken it. That is not an oversimplification of the issue. It is the basic logic of evaluation. A courtroom does not oversimplify a case by asking &quot;guilty or not guilty.&quot; It isolates a specific claim so the evidence can actually be weighed.</p>
        <p><strong>The system handles complexity by decomposing it.</strong> A multi-faceted issue is not forced onto a single page with a chaotic discussion of everything at once. Instead, it is broken into many pages, each analyzing a specific claim.</p>
        <p><strong>Middle-ground positions are not ignored.</strong> They simply appear as separate beliefs along a spectrum, each with its own arguments and score.</p>
        <p>The alternative is evaluating every dimension of a complex issue simultaneously in one discussion. That is exactly what produces the tangled, circular debates the Idea Stock Exchange is designed to replace. Mixing related but distinct claims together does not create nuance. It creates confusion.</p>
        <p><strong>The binary is a measurement tool, not a worldview.</strong> The issue space can be as complex as reality demands. But each individual claim must still be tested by what supports it and what undermines it. That clarity is what makes systematic progress possible.</p>
      </div>
    ),
  },
  {
    id: 'q10',
    question: 'Q10: False Equivalence — presenting two columns implies both sides have equal merit.',
    answer: (
      <div className="space-y-4">
        <p>This objection confuses <strong>visual symmetry</strong> with <strong>epistemic equality</strong>. Placing two arguments side by side does not mean they are equally valid. It means they are finally forced to compete on the exact same scale. A debunked theory does not gain legitimacy by appearing next to an established fact. Its lack of supporting evidence is mathematically exposed by the scoring system for everyone to see.</p>
        <p><strong>Scores, not symmetry, determine epistemic weight.</strong> Every argument receives a score derived from its linked sub-arguments, evidence quality, and logical linkage to the claim. Flat-earth theory and plate tectonics can share a page without sharing epistemic status. The truth scores tell you which one survives scrutiny. Weak evidence cannot hide behind visual balance.</p>
        <p><strong>Suppressing weak claims makes them stronger, not weaker.</strong> When fringe ideas are excluded from mainstream debate, they migrate into echo chambers where they grow untested and undefeated. Side-by-side comparison exposes weak claims to the evidence that defeats them. Science already works this way: literature reviews routinely include studies both supporting and challenging a hypothesis. Listing opposing evidence is not endorsing it. It is the prerequisite for honest evaluation.</p>
        <p><strong>The two-column structure is a confirmation bias filter.</strong> Humans naturally seek information that confirms existing beliefs. Most media ecosystems reinforce this by presenting one-sided narratives. The ISE forces competing arguments into the same frame so they must be weighed rather than ignored.</p>
        <p>If an established fact can only survive by actively hiding opposing arguments from the audience, that is not science. That is narrative control. The Idea Stock Exchange does not elevate bad ideas. It eliminates their hiding places by forcing them onto the same page, sorted by their argument scores, where the math proves exactly why each one rises or collapses.</p>
        <p className="font-medium">Strong arguments rise.<br />Weak arguments collapse.<br />And everyone can see exactly why.</p>
      </div>
    ),
  },
  {
    id: 'q11',
    question: 'Q11: Loss of Narrative Context — stripping arguments into bullet points removes essential human context.',
    answer: (
      <div className="space-y-4">
        <p>This objection confuses persuasion with evaluation. The fact that humans are powerfully moved by narrative is not an argument for building an evidence system around narrative. It is precisely the problem that system needs to solve.</p>
        <p><strong>Narrative is the most effective tool ever invented for bypassing careful reasoning.</strong> Stories trigger emotional identification before the audience has evaluated a single claim. They bundle assumptions, causal claims, and value judgments into a single package designed to be felt rather than tested. As Paul Bloom documents in <em>Against Empathy</em>, emotionally compelling narratives routinely distort both moral and policy judgment. The fact that we are wired to respond to stories is a cognitive bias we need to correct for, not a design principle we should build into our evidence evaluation system.</p>
        <p><strong>The identifiable victim problem illustrates why narrative-driven reasoning fails at scale.</strong> A single emotionally resonant story about one visible victim will routinely cause voters and policymakers to ignore millions of unseen statistical victims. Societies divert massive resources to solve highly publicized individual cases while starving systemic solutions that would help far more people. Sound cost-benefit analysis requires evaluating systemic outcomes, not reacting to whichever story was told most compellingly last week.</p>
        <p><strong>The ISE does not strip context. It separates context from conclusions so each can be evaluated properly.</strong> Historical background, human experience, and illustrative examples all have a place in the system. They belong in the context sections, the media resources, and the framing of individual belief pages. What they cannot do is determine the truth score of a claim. A story can help you understand what a problem feels like. It cannot tell you whether a proposed solution works.</p>
        <p><strong>Structured argument trees preserve more context than narratives, not less.</strong> A narrative forces a single interpretive path through the evidence. The ISE&apos;s linked belief pages let users explore the full web of assumptions, interests, upstream principles, and downstream consequences that a story would bundle together invisibly. Narratives hide their logical structure. The ISE makes it explicit and navigable.</p>
        <p><strong>Most debates fail not because they lack narrative, but because they have too much of it.</strong> The same emotionally charged stories circulate for decades. Arguments do not accumulate. The ISE builds a compounding database where resolved questions stay resolved and argument scores carry forward. A narrative resets to zero every time it is told. A scored belief page does not.</p>
        <p className="font-medium italic">Stories may move us. Evidence must decide.</p>
      </div>
    ),
  },
];

function FAQItem({ faq, isOpen, onToggle }: {
  faq: typeof faqs[0];
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
          <p className="text-gray-600 max-w-2xl text-lg">
            Honest answers to the most common objections to evidence-based, structured democratic discourse.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Questions</h2>
          <ol className="space-y-1.5 text-sm">
            {faqs.map(faq => (
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

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} id={faq.id}>
              <FAQItem
                faq={faq}
                isOpen={openItems.has(faq.id)}
                onToggle={() => toggle(faq.id)}
              />
            </div>
          ))}
        </div>

        {/* Why This Works Summary */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Why This Works</h2>
          <ul className="space-y-2 text-blue-800">
            <li>✓ <strong>Simpler than it seems</strong> — Basic arithmetic</li>
            <li>✓ <strong>Doesn&apos;t need perfection</strong> — Just better than the status quo</li>
            <li>✓ <strong>Leverages existing behavior</strong> — People already argue</li>
            <li>✓ <strong>Has natural defenses</strong> — Structure resists gaming</li>
            <li>✓ <strong>Historical precedents</strong> — Wikipedia, PageRank, legal system work</li>
            <li>✓ <strong>Need is urgent</strong> — Current systems failing</li>
            <li>✓ <strong>Resources exist</strong> — Technology, funding, demand ready</li>
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
