import type { Thresholds } from '../config/check-schema.js'
import type { ProbeSummary } from '../metrics/types.js'

export interface ThresholdViolation {
  readonly metric: string
  readonly limit: number
  readonly actual: number
}

export interface ThresholdResult {
  readonly passed: boolean
  readonly violations: readonly ThresholdViolation[]
}

/** Pure function: compares a run's summary against the config's declared thresholds (a CI pass/fail gate). */
export function evaluateThresholds(summary: ProbeSummary, thresholds: Thresholds | undefined): ThresholdResult {
  if (!thresholds) {
    return { passed: true, violations: [] }
  }

  const violations: ThresholdViolation[] = []

  if (thresholds.minUptimePercent !== undefined && summary.overallUptimePercent < thresholds.minUptimePercent) {
    violations.push({ metric: 'minUptimePercent', limit: thresholds.minUptimePercent, actual: summary.overallUptimePercent })
  }
  if (thresholds.maxLatencyP95Ms !== undefined && summary.overallLatency.p95 > thresholds.maxLatencyP95Ms) {
    violations.push({ metric: 'maxLatencyP95Ms', limit: thresholds.maxLatencyP95Ms, actual: summary.overallLatency.p95 })
  }
  if (thresholds.maxConsecutiveFailures !== undefined) {
    for (const check of summary.checks) {
      if (check.maxConsecutiveFailures > thresholds.maxConsecutiveFailures) {
        violations.push({
          metric: `maxConsecutiveFailures:${check.checkName}`,
          limit: thresholds.maxConsecutiveFailures,
          actual: check.maxConsecutiveFailures,
        })
      }
    }
  }

  return { passed: violations.length === 0, violations }
}
