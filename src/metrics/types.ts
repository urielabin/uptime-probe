export interface LatencyStats {
  readonly min: number
  readonly max: number
  readonly mean: number
  readonly p50: number
  readonly p90: number
  readonly p95: number
  readonly p99: number
}

export interface CheckSummary {
  readonly checkName: string
  readonly totalRuns: number
  readonly totalFailures: number
  readonly uptimePercent: number
  /** Current failure streak as of the last recorded result. */
  readonly consecutiveFailures: number
  /** Worst failure streak observed across this session. */
  readonly maxConsecutiveFailures: number
  readonly latency: LatencyStats
  /** p95 of the first half of this check's results, for detecting latency drift. */
  readonly earlyP95Ms: number
  /** p95 of the second half of this check's results, for detecting latency drift. */
  readonly lateP95Ms: number
}

export interface ProbeSummary {
  readonly overallUptimePercent: number
  readonly overallLatency: LatencyStats
  readonly checks: readonly CheckSummary[]
}
