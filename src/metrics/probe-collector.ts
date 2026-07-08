import { EventEmitter } from 'node:events'
import { percentile } from './percentiles.js'
import type { ProbeOutcome } from '../checks/strategies/check-strategy.interface.js'
import type { CheckSummary, LatencyStats, ProbeSummary } from './types.js'

interface ProbeCollectorEvents {
  result: [ProbeOutcome]
}

function latencyStats(latenciesMs: readonly number[]): LatencyStats {
  const sorted = [...latenciesMs].sort((a, b) => a - b)
  return {
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    mean: sorted.length === 0 ? 0 : sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  }
}

/**
 * Collects probe results as they happen and emits a 'result' event per
 * outcome. Unlike a fire-and-forget event, `watch` mode subscribes to this
 * for real, printing a live per-check status line as results land.
 */
export class ProbeCollector extends EventEmitter<ProbeCollectorEvents> {
  private readonly resultsByCheck = new Map<string, ProbeOutcome[]>()

  record(outcome: ProbeOutcome): void {
    const list = this.resultsByCheck.get(outcome.checkName) ?? []
    list.push(outcome)
    this.resultsByCheck.set(outcome.checkName, list)
    this.emit('result', outcome)
  }

  summarize(): ProbeSummary {
    const checks: CheckSummary[] = []
    const allLatencies: number[] = []

    for (const [checkName, results] of this.resultsByCheck) {
      const totalRuns = results.length
      const totalFailures = results.filter((r) => !r.success).length
      const latenciesMs = results.map((r) => r.latencyMs)
      allLatencies.push(...latenciesMs)

      let consecutiveFailures = 0
      let maxConsecutiveFailures = 0
      let runningStreak = 0
      for (const result of results) {
        runningStreak = result.success ? 0 : runningStreak + 1
        maxConsecutiveFailures = Math.max(maxConsecutiveFailures, runningStreak)
      }
      consecutiveFailures = runningStreak

      const midpoint = Math.floor(results.length / 2)
      const earlyP95Ms = percentile(results.slice(0, midpoint).map((r) => r.latencyMs).sort((a, b) => a - b), 95)
      const lateP95Ms = percentile(results.slice(midpoint).map((r) => r.latencyMs).sort((a, b) => a - b), 95)

      checks.push({
        checkName,
        totalRuns,
        totalFailures,
        uptimePercent: totalRuns === 0 ? 100 : ((totalRuns - totalFailures) / totalRuns) * 100,
        consecutiveFailures,
        maxConsecutiveFailures,
        latency: latencyStats(latenciesMs),
        earlyP95Ms,
        lateP95Ms,
      })
    }

    const totalRuns = checks.reduce((sum, c) => sum + c.totalRuns, 0)
    const totalFailures = checks.reduce((sum, c) => sum + c.totalFailures, 0)

    return {
      overallUptimePercent: totalRuns === 0 ? 100 : ((totalRuns - totalFailures) / totalRuns) * 100,
      overallLatency: latencyStats(allLatencies),
      checks,
    }
  }
}
