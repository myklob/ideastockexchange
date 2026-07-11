import type { DebateEscalation } from '@/core/types/debate-topic';

interface Props {
  escalationLevels: DebateEscalation[];
}

const ROW_COLORS = [
  'bg-[#e8f5e9]',
  'bg-[#c8e6c9]',
  'bg-[#fff9c4]',
  'bg-[#ffe082]',
  'bg-[#ffb74d]',
  'bg-[#ef9a9a]',
];

const LEVEL_SUBLABELS: Record<number, string> = {
  1: 'Slight lean',
  2: 'Engaged supporter',
  3: 'Conscientious objector',
  4: 'Principled lawbreaking',
  5: 'Active disruption',
  6: 'No limiting principles',
};

export default function Spectrum3Escalation({ escalationLevels }: Props) {
  return (
    <div id="engagement" className="mb-8">
      <h2 className="text-xl font-bold mb-1">
        4. The Engagement Landscape: Civic Escalation (Preference ↔ Any Means)
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        How many other principles is someone willing to violate to advance this belief? This is the other
        meaning of &ldquo;strength of conviction&rdquo;: not <em>how extreme is the claim</em> (section 3),
        but <em>what limits does the believer accept on acting</em>. Thomas More held the most absolute
        possible conviction Henry VIII was wrong and chose silent execution rather than act outside legal
        process. Martin Luther King held an equally total conviction and chose to openly violate unjust
        laws while accepting the consequences. Both are coherent positions. Unlike sections 1, 3, and 6,
        this ladder describes believers rather than beliefs, so it never enters belief matching; see the
        note below the table.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-[#f0f3f6]">
              <th className="border border-gray-300 px-3 py-2 w-[22%]">Level</th>
              <th className="border border-gray-300 px-3 py-2 w-[28%]">What It Looks Like</th>
              <th className="border border-gray-300 px-3 py-2 w-[30%]">Historical Example</th>
              <th className="border border-gray-300 px-3 py-2 w-[20%]">Principles Still Honored</th>
            </tr>
          </thead>
          <tbody>
            {escalationLevels.map((row, i) => (
              <tr key={row.level}>
                <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${ROW_COLORS[i] ?? ''}`}>
                  <strong>{row.level}. {row.levelLabel}</strong>
                  {LEVEL_SUBLABELS[row.level] && (
                    <>
                      <br />
                      <span className="text-xs font-normal text-gray-600">{LEVEL_SUBLABELS[row.level]}</span>
                    </>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.description}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700">{row.example}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs">{row.principles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#fff0f0] p-3 border-l-4 border-[#c00] mt-3 text-sm">
        <strong>Escalation is an overlay, not a matching coordinate.</strong> The system matches and
        groups beliefs on properties of the claim itself: direction (section 1), magnitude (section 3),
        and level of abstraction (section 6). Escalation describes the believer. Two people can assert the
        identical claim, same direction, same magnitude, same rung on the abstraction ladder, and sit four
        levels apart on this ladder: one holds a moderate claim (section 3 = 50%) he barely leans into
        (section 1 = +40%) and goes to prison for it (Level 4); another holds an extreme claim (100%) she
        cares about totally (+100%) and never steps outside the law (Level 2). If escalation entered
        matching, the system would file one claim on two pages because its holders differ. The ladder
        earns its place on the page anyway, because a debate&apos;s temperature is a property of the
        conflict worth tracking: when a topic&apos;s believers start climbing it, the conflict resolution
        pipeline wants to know.
      </div>
    </div>
  );
}
