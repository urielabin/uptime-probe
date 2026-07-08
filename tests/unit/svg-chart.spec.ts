import { describe, expect, it } from 'vitest'
import { renderLatencySparkline } from '../../src/reporters/svg-chart.js'
import type { CheckSummary } from '../../src/metrics/types.js'

function makeCheck(overrides: Partial<CheckSummary> = {}): CheckSummary {
  return {
    checkName: 'health',
    totalRuns: 1,
    totalFailures: 0,
    uptimePercent: 100,
    consecutiveFailures: 0,
    maxConsecutiveFailures: 0,
    latency: { min: 18, max: 18, mean: 18, p50: 18, p90: 18, p95: 18, p99: 18 },
    earlyP95Ms: 0,
    lateP95Ms: 18,
    ...overrides,
  }
}

describe('renderLatencySparkline', () => {
  it('does not flag drift when earlyP95Ms is 0 (insufficient data, not a real regression)', () => {
    const svg = renderLatencySparkline(makeCheck({ earlyP95Ms: 0, lateP95Ms: 18 }))
    expect(svg).toContain('#2997ff')
    expect(svg).not.toContain('#ff3b30')
  })

  it('flags drift when late p95 is significantly worse than early p95', () => {
    const svg = renderLatencySparkline(makeCheck({ earlyP95Ms: 340, lateP95Ms: 1200 }))
    expect(svg).toContain('#ff3b30')
  })

  it('does not flag drift for a stable check', () => {
    const svg = renderLatencySparkline(makeCheck({ earlyP95Ms: 100, lateP95Ms: 105 }))
    expect(svg).toContain('#2997ff')
    expect(svg).not.toContain('#ff3b30')
  })
})
