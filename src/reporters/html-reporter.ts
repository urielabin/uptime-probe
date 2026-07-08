import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Reporter } from './reporter.interface.js'
import type { ReportContext } from './report-context.js'
import { renderLatencySparkline } from './svg-chart.js'

export class HtmlReporter implements Reporter {
  constructor(private readonly outputPath: string) {}

  async report(context: ReportContext): Promise<void> {
    await mkdir(dirname(this.outputPath), { recursive: true })
    await writeFile(this.outputPath, renderHtml(context), 'utf-8')
  }
}

function renderHtml(context: ReportContext): string {
  const { configName, summary, thresholdResult, narrative } = context
  const statusColor = thresholdResult.passed ? '#34c759' : '#ff3b30'
  const statusLabel = thresholdResult.passed ? 'PASS' : 'FAIL'

  const violationsHtml = thresholdResult.violations
    .map((v) => `<li>${v.metric}: ${v.actual.toFixed(2)} violates limit ${v.limit}</li>`)
    .join('')

  const checkCards = summary.checks
    .map((check) => {
      const checkStatusColor = check.consecutiveFailures === 0 ? '#34c759' : '#ff3b30'
      return `<div class="card">
        <div class="card-header">
          <span class="dot" style="background:${checkStatusColor}"></span>
          <strong>${escapeHtml(check.checkName)}</strong>
        </div>
        <table>
          <tr><th>Uptime</th><td>${check.uptimePercent.toFixed(2)}%</td></tr>
          <tr><th>p95 latency</th><td>${check.latency.p95.toFixed(0)}ms</td></tr>
          <tr><th>Failure streak</th><td>${check.consecutiveFailures} (max ${check.maxConsecutiveFailures})</td></tr>
        </table>
        ${renderLatencySparkline(check)}
      </div>`
    })
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Uptime Probe report — ${escapeHtml(configName)}</title>
<style>
  body { background: #000; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 13px; background: ${statusColor}22; color: ${statusColor}; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  td, th { text-align: left; padding: 6px 0; border-bottom: 1px solid #2a2a2a; font-size: 13px; }
  th { color: #86868b; font-weight: 500; }
  .narrative { background: #111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.5; color: #86868b; margin-top: 16px; }
  ul { color: ${statusColor}; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .card { background: #111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 16px; }
  .card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .summary-table { margin-bottom: 24px; }
</style>
</head>
<body>
  <h1>${escapeHtml(configName)}</h1>
  <span class="status">${statusLabel}</span>
  <table class="summary-table">
    <tr><th>Overall uptime</th><td>${summary.overallUptimePercent.toFixed(2)}%</td></tr>
    <tr><th>p50 / p90 / p95 / p99 latency</th><td>${summary.overallLatency.p50.toFixed(0)} / ${summary.overallLatency.p90.toFixed(0)} / ${summary.overallLatency.p95.toFixed(0)} / ${summary.overallLatency.p99.toFixed(0)} ms</td></tr>
  </table>
  ${violationsHtml ? `<ul>${violationsHtml}</ul>` : ''}
  <div class="grid">${checkCards}</div>
  <div class="narrative">${escapeHtml(narrative)}</div>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
