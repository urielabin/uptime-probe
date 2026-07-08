import type { Reporter } from './reporter.interface.js'
import type { ReportContext } from './report-context.js'

export class ConsoleReporter implements Reporter {
  report(context: ReportContext): void {
    const { configName, summary, thresholdResult, narrative } = context

    console.log(`\n${configName}`)
    console.log('-'.repeat(configName.length))
    console.log(`Overall uptime:  ${summary.overallUptimePercent.toFixed(2)}%`)
    console.log(`Overall latency (ms):`)
    console.log(`  min=${summary.overallLatency.min.toFixed(0)} mean=${summary.overallLatency.mean.toFixed(0)} p50=${summary.overallLatency.p50.toFixed(0)} p95=${summary.overallLatency.p95.toFixed(0)} p99=${summary.overallLatency.p99.toFixed(0)} max=${summary.overallLatency.max.toFixed(0)}`)

    console.log('\nChecks:')
    for (const check of summary.checks) {
      const status = check.consecutiveFailures === 0 ? 'UP' : 'DOWN'
      console.log(`  [${status}] ${check.checkName}: uptime=${check.uptimePercent.toFixed(2)}% p95=${check.latency.p95.toFixed(0)}ms streak=${check.consecutiveFailures}`)
    }

    console.log(`\n${thresholdResult.passed ? 'PASS' : 'FAIL'} thresholds`)
    for (const violation of thresholdResult.violations) {
      console.log(`  ✗ ${violation.metric}: ${violation.actual.toFixed(2)} exceeds/violates limit ${violation.limit}`)
    }

    console.log(`\n${narrative}\n`)
  }
}
