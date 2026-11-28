import { describe, it, expect } from 'vitest'
import {
  validateFallacyClaimInput,
  logicalValidityMultiplier,
  confirmedClaimsToDetectedFallacies,
  counterArgumentStrength,
  VALIDITY_NO_FALLACY,
  VALIDITY_MINOR,
  VALIDITY_MAJOR,
  VALIDITY_MULTIPLE,
  type FallacyClaimInput,
} from '@/lib/fallacy/claims'
import { FALLACY_CATALOG, catalogEntry } from '@/lib/fallacy/catalog'
import { detectFallacies } from '@/lib/agent-ingest/fallacy-detector'

const completeClaim = (overrides: Partial<FallacyClaimInput> = {}): FallacyClaimInput => ({
  fallacyType: 'false-dilemma',
  quotedText: 'Either we drastically reduce emissions immediately or we face catastrophe',
  explanation:
    'Presents only two extreme options when many intermediate paths exist: gradual reduction, adaptation, carbon capture, policy mixes.',
  missingElements: 'Gradual pathways, adaptation strategies, technological options.',
  evidenceLinks: [{ label: 'IPCC AR6 emission scenarios', url: 'https://www.ipcc.ch/report/ar6/' }],
  consequences: 'Polarizes the debate and excludes feasible middle-ground policy.',
  ...overrides,
})

describe('validateFallacyClaimInput (an accusation is an argument)', () => {
  it('accepts a complete template', () => {
    expect(validateFallacyClaimInput(completeClaim())).toEqual([])
  })

  it('rejects a bare "FALLACY!" with one issue per missing field', () => {
    const issues = validateFallacyClaimInput({
      fallacyType: 'false-dilemma',
      quotedText: '',
      explanation: '',
      missingElements: '',
      evidenceLinks: [],
      consequences: '',
    })
    const fields = issues.map(i => i.field)
    expect(fields).toContain('quotedText')
    expect(fields).toContain('explanation')
    expect(fields).toContain('missingElements')
    expect(fields).toContain('evidenceLinks')
    expect(fields).toContain('consequences')
  })

  it('rejects unknown fallacy types', () => {
    const issues = validateFallacyClaimInput(completeClaim({ fallacyType: 'being-wrong' }))
    expect(issues.some(i => i.field === 'fallacyType')).toBe(true)
  })

  it('rejects a one-word explanation', () => {
    const issues = validateFallacyClaimInput(completeClaim({ explanation: 'obviously' }))
    expect(issues.some(i => i.field === 'explanation')).toBe(true)
  })

  it('requires exhibits for evidence-demanding types (straw man needs the actual position)', () => {
    const issues = validateFallacyClaimInput(
      completeClaim({ fallacyType: 'straw-man', evidenceLinks: [] }),
    )
    expect(issues.some(i => i.field === 'evidenceLinks')).toBe(true)
  })

  it('allows empty exhibits for types with no evidence requirement', () => {
    const issues = validateFallacyClaimInput(
      completeClaim({ fallacyType: 'ad-hominem', evidenceLinks: [] }),
    )
    expect(issues).toEqual([])
  })
})

describe('logicalValidityMultiplier (the confirmation ladder)', () => {
  it('matches the ladder: none 0.95, minor 0.75, major 0.45, multiple 0.25', () => {
    expect(logicalValidityMultiplier([])).toBe(VALIDITY_NO_FALLACY)
    expect(logicalValidityMultiplier([{ severity: 'minor' }])).toBe(VALIDITY_MINOR)
    expect(logicalValidityMultiplier([{ severity: 'major' }])).toBe(VALIDITY_MAJOR)
    expect(
      logicalValidityMultiplier([{ severity: 'minor' }, { severity: 'major' }]),
    ).toBe(VALIDITY_MULTIPLE)
  })

  it('rewards removing the fallacy: the de-fallacied argument scores higher', () => {
    // Same evidence, fallacy removed: 0.95 multiplier beats 0.45. Restating
    // the point without the false binary is the profitable move.
    expect(VALIDITY_NO_FALLACY).toBeGreaterThan(VALIDITY_MAJOR)
  })
})

describe('confirmedClaimsToDetectedFallacies (bridge into scoreArgument)', () => {
  it('sizes impacts so the engine lands exactly on the ladder multiplier', () => {
    const confirmed = [
      { fallacyType: 'false-dilemma', severity: 'major', quotedText: 'either/or' },
      { fallacyType: 'cherry-picking', severity: 'major', quotedText: 'one study' },
    ]
    const detected = confirmedClaimsToDetectedFallacies(confirmed)
    // scoreArgument applies truth × (1 − Σ|impact|/100)
    const penalty = detected.reduce((s, d) => s + Math.abs(d.impact) / 100, 0)
    expect(1 - penalty).toBeCloseTo(VALIDITY_MULTIPLE)
    expect(detected.every(d => d.impact < 0)).toBe(true)
  })

  it('returns nothing when nothing is confirmed', () => {
    expect(confirmedClaimsToDetectedFallacies([])).toEqual([])
  })
})

describe('catalog coherence', () => {
  it('every automated detector type is a catalog entry', () => {
    const detections = detectFallacies(
      'He is a liar. Everyone knows this. Correlation proves causation here. ' +
        'It always works. One study confirms it. My uncle saw it happen.',
    )
    expect(detections.length).toBeGreaterThanOrEqual(6)
    for (const d of detections) {
      const entry = catalogEntry(d.fallacyType)
      expect(entry, `detector type ${d.fallacyType} missing from catalog`).toBeDefined()
      expect(d.targetFactor).toBe(entry!.targetFactor)
    }
  })

  it('major counter-arguments carry more sub-debate weight than minor ones', () => {
    expect(counterArgumentStrength('major')).toBeGreaterThan(counterArgumentStrength('minor'))
  })

  it('every entry names a valid target factor and severity', () => {
    for (const entry of FALLACY_CATALOG.values()) {
      expect(['relevance', 'logical-validity', 'evidence-quality']).toContain(entry.targetFactor)
      expect(['minor', 'major']).toContain(entry.severity)
    }
  })
})
