import { describe, expect, it } from 'vitest'
import { evaluateThresholds } from '../../src/thresholds/threshold-evaluator.js'
import type { ProbeSummary } from '../../src/metrics/types.js'

function makeSummary(overrides: Partial<ProbeSummary> = {}): ProbeSummary {
  return {
    overallUptimePercent: 100,
    overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
    checks: [],
    ...overrides,
  }
}

describe('evaluateThresholds', () => {
  it('passes when no thresholds are declared', () => {
    const result = evaluateThresholds(makeSummary(), undefined)
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('passes when metrics are within limits', () => {
    const result = evaluateThresholds(makeSummary({ overallUptimePercent: 99.9 }), { minUptimePercent: 99 })
    expect(result.passed).toBe(true)
  })

  it('fails and reports a violation when uptime drops below the limit', () => {
    const result = evaluateThresholds(makeSummary({ overallUptimePercent: 95 }), { minUptimePercent: 99 })
    expect(result.passed).toBe(false)
    expect(result.violations).toEqual([{ metric: 'minUptimePercent', limit: 99, actual: 95 }])
  })

  it('fails when p95 latency exceeds the limit', () => {
    const summary = makeSummary({ overallLatency: { min: 10, max: 900, mean: 200, p50: 150, p90: 700, p95: 900, p99: 950 } })
    const result = evaluateThresholds(summary, { maxLatencyP95Ms: 500 })
    expect(result.passed).toBe(false)
    expect(result.violations[0]?.metric).toBe('maxLatencyP95Ms')
  })

  it('fails per-check when a failure streak exceeds the limit', () => {
    const summary = makeSummary({
      checks: [
        {
          checkName: 'checkout',
          totalRuns: 5,
          totalFailures: 4,
          uptimePercent: 20,
          consecutiveFailures: 4,
          maxConsecutiveFailures: 4,
          latency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
          earlyP95Ms: 90,
          lateP95Ms: 90,
        },
      ],
    })
    const result = evaluateThresholds(summary, { maxConsecutiveFailures: 3 })
    expect(result.passed).toBe(false)
    expect(result.violations[0]?.metric).toBe('maxConsecutiveFailures:checkout')
  })

  it('reports every violated metric, not just the first', () => {
    const result = evaluateThresholds(
      makeSummary({ overallUptimePercent: 90 }),
      { minUptimePercent: 99, maxLatencyP95Ms: 10 },
    )
    expect(result.violations).toHaveLength(2)
  })
})
