import Link from "next/link";
import { notFound } from "next/navigation";
import { getConceptBySlug, getAllConcepts, concepts } from "@/lib/concepts";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllConcepts().map((c) => ({ slug: c.slug }));
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);

  if (!concept) return notFound();

  const relatedConcepts = concept.relatedConcepts
    .map((s) => concepts[s])
    .filter(Boolean);

  return (
    <div>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        <Link href="/concepts">All Concepts</Link> &gt; {concept.title}
      </p>

      <h1 className="text-3xl font-bold mb-4">{concept.title}</h1>
      <p className="text-lg mb-6">{concept.description}</p>

      {concept.sections.map((section, i) => (
        <div key={i} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
          <div className="whitespace-pre-line text-[var(--color-foreground)]">
            {section.content}
          </div>
        </div>
      ))}

      {relatedConcepts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <h2 className="text-lg font-semibold mb-3">Related Concepts</h2>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((rc) => (
              <Link
                key={rc.slug}
                href={`/concepts/${rc.slug}`}
                className="px-3 py-1 border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-neutral)]"
              >
                {rc.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-sm text-[var(--color-muted)]">
        <p>
          This concept is part of the Idea Stock Exchange analysis framework.
          See the{" "}
          <Link href="/concepts/scoring">scoring system</Link> for how all
          components combine, or{" "}
          <Link href="/">browse beliefs</Link> to see these concepts in action.
        </p>
      </div>
    </div>
  );
}
