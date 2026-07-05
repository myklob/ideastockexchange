import { describe, it, expect } from 'vitest'
import { forecastYesProbability, normalCdf } from '@/lib/markets/forecast'

describe('probabilistic score forecast (feed only, never settlement)', () => {
  it('normalCdf sanity', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4)
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2)
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 2)
  })

  it('is a step function at the boundary, with equality resolving NO', () => {
    const base = { threshold: 0.5, daysToResolution: 0 }
    expect(forecastYesProbability({ ...base, currentScore: 0.6, direction: 'ABOVE' })).toBe(1)
    expect(forecastYesProbability({ ...base, currentScore: 0.4, direction: 'ABOVE' })).toBe(0)
    expect(forecastYesProbability({ ...base, currentScore: 0.5, direction: 'ABOVE' })).toBe(0)
    expect(forecastYesProbability({ ...base, currentScore: 0.5, direction: 'BELOW' })).toBe(0)
  })

  it('is monotonic in the current score for ABOVE', () => {
    const p = (score: number) =>
      forecastYesProbability({
        currentScore: score, threshold: 0.5, direction: 'ABOVE', daysToResolution: 30,
      })
    expect(p(0.6)).toBeGreaterThan(p(0.5))
    expect(p(0.5)).toBeGreaterThan(p(0.4))
  })

  it('ABOVE and BELOW are mirror images', () => {
    const params = { currentScore: 0.58, threshold: 0.5, daysToResolution: 30 }
    const above = forecastYesProbability({ ...params, direction: 'ABOVE' })
    const below = forecastYesProbability({ ...params, direction: 'BELOW' })
    expect(above + below).toBeCloseTo(1, 10)
  })

  it('more time to resolution pulls the forecast toward 0.5', () => {
    const p = (days: number) =>
      forecastYesProbability({
        currentScore: 0.6, threshold: 0.5, direction: 'ABOVE', daysToResolution: days,
      })
    expect(p(3)).toBeGreaterThan(p(30))
    expect(p(30)).toBeGreaterThan(p(365))
    expect(p(365)).toBeGreaterThan(0.5)
  })
})
