const TIER_STYLES: Record<number, string> = {
  1: 'bg-[#1e7e34]',
  2: 'bg-[#b8860b]',
  3: 'bg-[#7f8c8d]',
  4: 'bg-[#a0522d]',
}

/**
 * Evidence tier badge. Tier 1 independent lab tests and certified ratings;
 * Tier 2 professional reviewer consensus, third-party-verified manufacturer
 * data; Tier 3 aggregated user reviews, investigative journalism; Tier 4
 * individual testimonials, unverified manufacturer claims.
 */
export default function TierBadge({ tier }: { tier: number | null | undefined }) {
  if (tier == null) return null
  return (
    <span className={`${TIER_STYLES[tier] ?? 'bg-gray-500'} text-white text-[11px] px-1.5 py-0.5 ml-1 whitespace-nowrap`}>
      Tier {tier}
    </span>
  )
}
