import type { ReportContext } from '../reporters/report-context.js'

/**
 * Pure formatter: renders a real Prometheus exposition-format text body.
 * `probe_success`/`probe_duration_seconds` are the same metric names
 * Prometheus's own `blackbox_exporter` emits, so this file is scrapable by
 * an actual Grafana/Prometheus setup via the textfile collector.
 */
export function formatPrometheusText(context: ReportContext): string {
  const { summary } = context
  const lines: string[] = []

  lines.push('# HELP probe_success Whether the most recent probe succeeded (1) or failed (0)')
  lines.push('# TYPE probe_success gauge')
  for (const check of summary.checks) {
    const latest = check.consecutiveFailures === 0 ? 1 : 0
    lines.push(`probe_success{check="${check.checkName}"} ${latest}`)
  }

  lines.push('# HELP probe_duration_seconds Mean latency of probes in this session, in seconds')
  lines.push('# TYPE probe_duration_seconds gauge')
  for (const check of summary.checks) {
    lines.push(`probe_duration_seconds{check="${check.checkName}"} ${(check.latency.mean / 1000).toFixed(3)}`)
  }

  lines.push('# HELP probe_uptime_ratio Uptime ratio over this session for the check (0-1)')
  lines.push('# TYPE probe_uptime_ratio gauge')
  for (const check of summary.checks) {
    lines.push(`probe_uptime_ratio{check="${check.checkName}"} ${(check.uptimePercent / 100).toFixed(4)}`)
  }

  lines.push('# HELP probe_consecutive_failures Current consecutive failure streak')
  lines.push('# TYPE probe_consecutive_failures gauge')
  for (const check of summary.checks) {
    lines.push(`probe_consecutive_failures{check="${check.checkName}"} ${check.consecutiveFailures}`)
  }

  return lines.join('\n') + '\n'
}
