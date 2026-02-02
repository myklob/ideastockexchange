import Link from "next/link";
import { getAllConcepts } from "@/lib/concepts";

export default function ConceptsIndexPage() {
  const concepts = getAllConcepts();

  const groups: Record<string, typeof concepts> = {
    "Scoring & Algorithms": concepts.filter((c) =>
      ["scoring", "reasonrank", "argument-scores-from-sub-arguments", "truth", "linkage-scores", "importance-score"].includes(c.slug)
    ),
    "Evidence & Criteria": concepts.filter((c) =>
      ["evidence", "objective-criteria"].includes(c.slug)
    ),
    "Argument Structure": concepts.filter((c) =>
      ["reasons", "one-page-per-topic", "belief-sorting", "combine-similar-beliefs", "positivity-continuum"].includes(c.slug)
    ),
    "Conflict Resolution": concepts.filter((c) =>
      ["automate-conflict-resolution", "interests", "compromise", "obstacles-to-resolution", "american-values", "assumptions", "cost-benefit-analysis", "bias"].includes(c.slug)
    ),
    "Media & Resources": concepts.filter((c) =>
      ["media", "legal-framework", "books", "podcasts", "movies", "songs-that-agree", "contact-me"].includes(c.slug)
    ),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">ISE Concepts</h1>
      <p className="text-[var(--color-muted)] mb-8">
        Each concept below corresponds to a linked description in the belief
        analysis template. These pages explain the methodology, scoring
        algorithms, and frameworks used in the Idea Stock Exchange.
      </p>

      {Object.entries(groups).map(([groupName, groupConcepts]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-xl font-semibold mb-3 border-b border-[var(--color-border)] pb-2">
            {groupName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupConcepts.map((concept) => (
              <div
                key={concept.slug}
                className="border border-[var(--color-border)] rounded p-4"
              >
                <h3 className="font-semibold mb-1">
                  <Link href={`/concepts/${concept.slug}`}>
                    {concept.title}
                  </Link>
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                  {concept.description.slice(0, 150)}
                  {concept.description.length > 150 ? "..." : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
