import Link from 'next/link'

export default function WhyProConMediaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/media" className="text-sm text-[var(--accent)] hover:underline">Media</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-sm text-[var(--muted-foreground)]">Why Track Pro/Con Media?</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          Why We Need to Identify the Best Pro/Con Media for Every Belief
        </h1>

        {/* Plato quote */}
        <div className="bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-500 p-4 mb-6 text-sm italic">
          &ldquo;Musical training is a more potent instrument than any other, because rhythm and harmony find
          their way into the inward places of the soul, on which they mightily fasten.&rdquo;
          <span className="not-italic"> &mdash; Plato, <em>The Republic</em></span>
        </div>

        <p className="text-sm text-[var(--foreground)] leading-relaxed mb-6">
          Plato understood something that modern epistemology often ignores: <strong>the most powerful arguments
          are not always the most logical ones.</strong> A peer-reviewed paper might conclusively prove a point,
          but a hit song or blockbuster film can reach millions of people who will never read that paper. If we
          want to understand why people believe what they believe, we must track not just the <em>best</em>
          arguments, but the arguments that actually <em>reach</em> people.
        </p>

        <hr className="border-gray-200 mb-8" />

        {/* The Influence Gap */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
            <span>&#x1F4CA;</span> The Influence Gap
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            The gap between what has the best evidence and what actually shapes culture is enormous:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Source Type</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Typical Reach</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Truth Score</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Epistemic Impact</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Directness</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">&#x1F52C; Peer-reviewed paper</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">500</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-green-700 font-semibold">0.95</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">475</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">95%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">&#x1F4D6; Non-fiction book</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">500K</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-green-700 font-semibold">0.70</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">350K</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">70%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">&#x1F4F0; Investigative article</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">2M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-orange-600 font-semibold">0.65</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">1.3M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">60%</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-3 py-2 border border-gray-300 font-bold">&#x1F3AC; Blockbuster film</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold">50M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-orange-600 font-semibold">0.40</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold text-red-700">20M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">5%</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-3 py-2 border border-gray-300 font-bold">&#x1F3B5; Hit song</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold">500M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-red-700 font-semibold">0.20</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold text-red-700">100M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">2%</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-3 py-2 border border-gray-300 font-bold">&#x1F5BC; Viral meme/image</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold">100M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center text-red-700 font-semibold">0.10</td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-bold text-red-700">10M</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">10%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Paradox callout */}
          <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 p-4 mt-4 text-sm">
            <strong>The paradox:</strong> The sources with the <em>highest truth scores</em> often have the{' '}
            <em>lowest reach</em>, while the sources with the <em>highest reach</em> often have the{' '}
            <em>lowest truth scores</em>. A film with a truth score of 0.40 reaching 50 million people has{' '}
            <strong>42,000&times; more epistemic impact</strong> than a peer-reviewed paper with a truth
            score of 0.95 reaching 500 people.
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Two Reasons */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
            <span>&#x1F3AF;</span> Two Reasons We Need This
          </h2>

          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            Reason 1: Understanding Cultural Influence
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-3">
            If a belief is clearly wrong, it is critical to know <strong>which media are currently reaching
            the most people</strong> to both spread and counter that belief. Is the main vehicle a scientific
            paper that precisely 500 specialists have read? Or is it a pop song that 500 million people have
            heard? The answer determines the strategy for any intervention.
          </p>
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-2">
            By tracking <strong>Epistemic Impact</strong> (Truth Score &times; Reach), we can answer:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 mb-6 ml-4">
            <li>What is the single most influential piece of media <em>supporting</em> this belief?</li>
            <li>What media is <em>countering</em> a dangerous falsehood most effectively?</li>
            <li>Are there beliefs with strong evidence but no popular media communicating that evidence?</li>
            <li>Which beliefs are primarily spread through entertainment (low directness) vs. explicit argument?</li>
          </ul>

          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            Reason 2: Finding the Best Content for Education
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-2">
            If you want to understand <em>both sides</em> of any issue, you need to know the best books, videos,
            songs, and other media that present each side. ISE becomes a curated library where for any belief you
            can find:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 mb-4 ml-4">
            <li>The best <strong>book</strong> that argues for and against this belief</li>
            <li>The best <strong>documentary or film</strong> that makes each case</li>
            <li>The most <strong>impactful song or poem</strong> on each side</li>
            <li>The strongest <strong>scientific paper</strong> supporting or challenging it</li>
            <li>The most <strong>powerful image</strong> that captures each perspective</li>
          </ul>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Danger of Low Directness */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <span>&#x26A0;&#xFE0F;</span> The Danger of Low Directness
          </h2>
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4">
            Media with <strong>low directness of advocacy</strong> (0%&ndash;10%) can be the most dangerous
            vectors for belief transmission, precisely because the audience is not aware they are being persuaded.
            Entertainment teaches ethics and shapes values through <strong>character aspiration</strong>: we want
            to be like characters we admire, and we unconsciously adopt their worldview.
          </p>

          <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 p-4 text-sm">
            <strong>Example:</strong> A film where the hero lives a lifestyle that normalizes a particular belief
            never <em>argues</em> for it. But 50 million viewers unconsciously update their priors: &ldquo;If the
            person I admire does X, X must be okay.&rdquo; The <strong>Directness of Advocacy = 0%</strong>, yet
            the epistemic impact is enormous. Tracking this allows ISE to flag implicit belief transmission that
            no argument tree would catch.
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Scoring Dimensions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-2">
            <span>&#x1F4CA;</span> ISE Scoring Dimensions for Media
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Each piece of media tracked by ISE is scored on six dimensions:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Dimension</th>
                  <th className="px-3 py-2 text-center font-semibold border border-gray-300">Range</th>
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Quality Score</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">0 &ndash; 1.0</td>
                  <td className="px-3 py-2 border border-gray-300">Technical merit regardless of ideological content. A beautifully crafted propaganda film can score high here.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Truth Score</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">&minus;1.0 &ndash; +1.0</td>
                  <td className="px-3 py-2 border border-gray-300">Accuracy of central claims. Positive = truthful, negative = misleading.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Linkage Score</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">0 &ndash; 1.0</td>
                  <td className="px-3 py-2 border border-gray-300">How central a belief is to the work&rsquo;s core argument. Passing mention = 0.1; entire thesis = 0.95.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Reach</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">0 &ndash; &infin;</td>
                  <td className="px-3 py-2 border border-gray-300">Estimated audience size: copies sold, box office attendance, streams, citations &times; readers.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Epistemic Impact</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">computed</td>
                  <td className="px-3 py-2 border border-gray-300">Truth Score &times; Reach. The single most important number: how much this media is moving the needle.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300 font-bold">Directness of Advocacy</td>
                  <td className="px-3 py-2 border border-gray-300 text-center">0% &ndash; 100%</td>
                  <td className="px-3 py-2 border border-gray-300">How explicitly the media argues for its beliefs. 100% = explicit thesis. 0% = implicit normalization.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Use Cases */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
            <span>&#x1F4A1;</span> What You Can Do With This
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Use Case</th>
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">Sort By</th>
                  <th className="px-3 py-2 text-left font-semibold border border-gray-300">What You&rsquo;ll Find</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">What&rsquo;s currently shaping culture most?</td>
                  <td className="px-3 py-2 border border-gray-300">Epistemic Impact (desc)</td>
                  <td className="px-3 py-2 border border-gray-300">Media actually moving belief needles at scale</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">What&rsquo;s the most sneaky propaganda?</td>
                  <td className="px-3 py-2 border border-gray-300">Directness (asc) + Reach (desc)</td>
                  <td className="px-3 py-2 border border-gray-300">High-reach media that never explicitly argues its position</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">What should I read/watch to learn about X?</td>
                  <td className="px-3 py-2 border border-gray-300">Linkage (desc) + Quality (desc)</td>
                  <td className="px-3 py-2 border border-gray-300">The best, most focused media on a specific belief</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">What are the best books/films overall?</td>
                  <td className="px-3 py-2 border border-gray-300">Quality Score (desc)</td>
                  <td className="px-3 py-2 border border-gray-300">Highest-quality works regardless of their message</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 mb-8" />

        {/* Related pages */}
        <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-4 rounded-r text-sm">
          <p className="font-bold mb-2">Related pages:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><Link href="/media" className="text-[var(--accent)] hover:underline">Media Index</Link> &mdash; Browse all tracked media</li>
            <li><Link href="/beliefs" className="text-[var(--accent)] hover:underline">All Beliefs</Link> &mdash; Every belief analyzed by ISE</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
