import { createIncidentSummaryGenerator } from './ai/incident-summary-factory.js'
import { createCheckStrategy } from './checks/strategies/check-factory.js'
import type { CheckConfig } from './config/check-schema.js'
import { WebhookAlerter } from './alerting/webhook-alerter.js'
import type { Exporter } from './exporters/exporter.interface.js'
import type { ProbeCollector } from './metrics/probe-collector.js'
import type { ReportContext } from './reporters/report-context.js'
import type { Reporter } from './reporters/reporter.interface.js'
import { evaluateThresholds } from './thresholds/threshold-evaluator.js'

export interface RunResult {
  readonly context: ReportContext
  readonly passed: boolean
}

/**
 * Runs every declared check once, updates the collector, and hands the
 * resulting summary/threshold/narrative context to every reporter and
 * exporter. Fires a webhook alert only when the run breaches a threshold
 * and alerting is configured — callers control whether that firing is
 * edge-triggered (see `watch` in the CLI).
 */
export async function runProbes(
  config: CheckConfig,
  collector: ProbeCollector,
  reporters: readonly Reporter[],
  exporters: readonly Exporter[],
  options: { alert?: boolean } = {},
): Promise<RunResult> {
  for (const check of config.checks) {
    collector.record(await createCheckStrategy(check).run())
  }

  const summary = collector.summarize()
  const thresholdResult = evaluateThresholds(summary, config.thresholds)
  const narrative = await createIncidentSummaryGenerator().generate({
    configName: config.name,
    summary,
    thresholdResult,
  })

  const context: ReportContext = { configName: config.name, summary, thresholdResult, narrative }

  for (const reporter of reporters) {
    await reporter.report(context)
  }
  for (const exporter of exporters) {
    await exporter.export(context)
  }

  const shouldAlert = options.alert ?? true
  if (shouldAlert && !thresholdResult.passed && config.alerting?.webhookUrl) {
    await new WebhookAlerter(config.alerting.webhookUrl).send(context)
  }

  return { context, passed: thresholdResult.passed }
}
