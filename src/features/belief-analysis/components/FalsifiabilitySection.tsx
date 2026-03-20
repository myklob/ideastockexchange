interface FalsifiabilitySectionProps {
  falsifiability: string | null
}

export default function FalsifiabilitySection({ falsifiability }: FalsifiabilitySectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">🔬 Falsifiability Test</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-2">Conditions that would weaken or disprove the belief</p>
      {falsifiability ? (
        <p className="text-sm">{falsifiability}</p>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] italic">No falsifiability conditions specified yet.</p>
      )}
    </section>
  )
}
