import { describe, expect, it } from 'vitest'
import { buildSlackPayload } from '../../src/alerting/webhook-alerter.js'
import type { ReportContext } from '../../src/reporters/report-context.js'

function makeContext(): ReportContext {
  return {
    configName: 'production api',
    summary: { overallUptimePercent: 90, overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 }, checks: [] },
    thresholdResult: {
      passed: false,
      violations: [{ metric: 'minUptimePercent', limit: 99, actual: 90 }],
    },
    narrative: 'degraded',
  }
}

describe('buildSlackPayload', () => {
  it('mentions the config name and violation count', () => {
    const payload = buildSlackPayload(makeContext())
    expect(payload.text).toContain('production api')
    expect(payload.text).toContain('1 threshold violation(s)')
  })

  it('lists each violated metric with actual and limit', () => {
    const payload = buildSlackPayload(makeContext())
    expect(payload.text).toContain('minUptimePercent: 90.00 violates limit 99')
  })
})
