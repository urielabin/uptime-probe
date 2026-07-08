import type { IncidentSummaryGenerator, IncidentSummaryInput } from './incident-summary-generator.interface.js'

/** Zero-cost fallback: a deterministic, templated summary — always available, no API key required. */
export class TemplatedIncidentSummaryGenerator implements IncidentSummaryGenerator {
  async generate({ configName, summary, thresholdResult }: IncidentSummaryInput): Promise<string> {
    const status = thresholdResult.passed
      ? 'stayed within all declared thresholds'
      : `breached ${thresholdResult.violations.length} declared threshold(s)`

    const streakClauses = summary.checks
      .filter((check) => check.consecutiveFailures > 0)
      .map((check) => ` "${check.checkName}" is in a ${check.consecutiveFailures}-run failure streak.`)

    const degradedClauses = summary.checks
      .filter((check) => check.earlyP95Ms > 0 && check.lateP95Ms > check.earlyP95Ms * 1.2)
      .map((check) => ` p95 latency on "${check.checkName}" degraded ${check.earlyP95Ms.toFixed(0)}ms→${check.lateP95Ms.toFixed(0)}ms.`)

    return `"${configName}" ran ${summary.checks.length} checks. Overall uptime is ${summary.overallUptimePercent.toFixed(2)}% `
      + `with p95 latency of ${summary.overallLatency.p95.toFixed(0)}ms.`
      + streakClauses.join('')
      + degradedClauses.join('')
      + ` The run ${status}.`
  }
}
