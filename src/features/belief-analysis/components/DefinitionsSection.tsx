import type { Definition } from '@/generated/prisma'

interface DefinitionsSectionProps {
  definitions: Definition[]
}

export default function DefinitionsSection({ definitions }: DefinitionsSectionProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">📖 Definitions</h1>
      <table className="w-full border-collapse text-sm" style={{ borderColor: '#cccccc' }}>
        <thead>
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-center bg-gray-50 w-[30%]">Term</th>
            <th className="border border-gray-300 px-3 py-2 text-center bg-gray-50 w-[70%]">Definition Used in This Analysis</th>
          </tr>
        </thead>
        <tbody>
          {definitions.length > 0 ? (
            definitions.map(def => (
              <tr key={def.id}>
                <td className="border border-gray-300 px-3 py-2 font-medium">{def.term}</td>
                <td className="border border-gray-300 px-3 py-2">{def.definition}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">&nbsp;</td>
              <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">&nbsp;</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
