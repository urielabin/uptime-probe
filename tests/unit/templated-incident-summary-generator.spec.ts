import { describe, expect, it } from 'vitest'
import { TemplatedIncidentSummaryGenerator } from '../../src/ai/templated-incident-summary-generator.js'
import type { ProbeSummary } from '../../src/metrics/types.js'

const baseSummary: ProbeSummary = {
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
}

describe('TemplatedIncidentSummaryGenerator', () => {
  it('mentions the config name and pass status when thresholds are satisfied', async () => {
    const narrative = await new TemplatedIncidentSummaryGenerator().generate({
      configName: 'production api',
      summary: baseSummary,
      thresholdResult: { passed: true, violations: [] },
    })
    expect(narrative).toContain('production api')
    expect(narrative).toContain('within all declared thresholds')
  })

  it('mentions a failure streak when a check has one', async () => {
    const summary: ProbeSummary = {
      ...baseSummary,
      checks: [{ ...baseSummary.checks[0]!, consecutiveFailures: 3 }],
    }
    const narrative = await new TemplatedIncidentSummaryGenerator().generate({
      configName: 'production api',
      summary,
      thresholdResult: { passed: false, violations: [{ metric: 'maxConsecutiveFailures:health', limit: 2, actual: 3 }] },
    })
    expect(narrative).toContain('3-run failure streak')
    expect(narrative).toContain('breached 1 declared threshold(s)')
  })

  it('mentions latency drift when late p95 is significantly worse than early p95', async () => {
    const summary: ProbeSummary = {
      ...baseSummary,
      checks: [{ ...baseSummary.checks[0]!, earlyP95Ms: 340, lateP95Ms: 1200 }],
    }
    const narrative = await new TemplatedIncidentSummaryGenerator().generate({
      configName: 'production api',
      summary,
      thresholdResult: { passed: true, violations: [] },
    })
    expect(narrative).toContain('degraded 340ms→1200ms')
  })

  it('does not mention drift for a stable check', async () => {
    const narrative = await new TemplatedIncidentSummaryGenerator().generate({
      configName: 'production api',
      summary: baseSummary,
      thresholdResult: { passed: true, violations: [] },
    })
    expect(narrative).not.toContain('degraded')
  })
})
