import { describe, expect, it } from 'vitest'
import { formatPrometheusText } from '../../src/exporters/prometheus.js'
import type { ReportContext } from '../../src/reporters/report-context.js'

function makeContext(overrides: Partial<ReportContext> = {}): ReportContext {
  return {
    configName: 'production api',
    summary: {
      overallUptimePercent: 100,
      overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
      checks: [
        {
          checkName: 'health',
          totalRuns: 10,
          totalFailures: 0,
          uptimePercent: 100,
          consecutiveFailures: 0,
          maxConsecutiveFailures: 0,
          latency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
          earlyP95Ms: 90,
          lateP95Ms: 90,
        },
      ],
    },
    thresholdResult: { passed: true, violations: [] },
    narrative: 'all good',
    ...overrides,
  }
}

describe('formatPrometheusText', () => {
  it('emits probe_success as 1 for an up check', () => {
    const text = formatPrometheusText(makeContext())
    expect(text).toContain('probe_success{check="health"} 1')
  })

  it('emits probe_success as 0 for a check with a failure streak', () => {
    const context = makeContext({
      summary: {
        overallUptimePercent: 0,
        overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
        checks: [{
          checkName: 'checkout',
          totalRuns: 5,
          totalFailures: 5,
          uptimePercent: 0,
          consecutiveFailures: 5,
          maxConsecutiveFailures: 5,
          latency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 },
          earlyP95Ms: 90,
          lateP95Ms: 90,
        }],
      },
    })
    const text = formatPrometheusText(context)
    expect(text).toContain('probe_success{check="checkout"} 0')
  })

  it('includes HELP/TYPE lines for every metric family', () => {
    const text = formatPrometheusText(makeContext())
    expect(text).toContain('# TYPE probe_success gauge')
    expect(text).toContain('# TYPE probe_duration_seconds gauge')
    expect(text).toContain('# TYPE probe_uptime_ratio gauge')
    expect(text).toContain('# TYPE probe_consecutive_failures gauge')
  })

  it('emits uptime ratio as a 0-1 fraction', () => {
    const text = formatPrometheusText(makeContext())
    expect(text).toContain('probe_uptime_ratio{check="health"} 1.0000')
  })
})
