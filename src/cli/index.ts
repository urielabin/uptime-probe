#!/usr/bin/env node
import { Command } from 'commander'
import { WebhookAlerter } from '../alerting/webhook-alerter.js'
import { loadCheckConfig } from '../config/load-check-config.js'
import type { Exporter } from '../exporters/exporter.interface.js'
import { PrometheusExporter } from '../exporters/prometheus-exporter.js'
import { ProbeCollector } from '../metrics/probe-collector.js'
import { ConsoleReporter } from '../reporters/console-reporter.js'
import { HtmlReporter } from '../reporters/html-reporter.js'
import { JsonReporter } from '../reporters/json-reporter.js'
import type { Reporter } from '../reporters/reporter.interface.js'
import { runProbes } from '../run-probes.js'

interface ReportOptions {
  json?: string
  html?: string
  prom?: string
}

function buildReporters(options: ReportOptions): Reporter[] {
  const reporters: Reporter[] = [new ConsoleReporter()]
  if (options.json) reporters.push(new JsonReporter(options.json))
  if (options.html) reporters.push(new HtmlReporter(options.html))
  return reporters
}

function buildExporters(options: ReportOptions): Exporter[] {
  const exporters: Exporter[] = []
  if (options.prom) exporters.push(new PrometheusExporter(options.prom))
  return exporters
}

const program = new Command()

program
  .name('probe')
  .description('Run declarative synthetic-monitoring checks against live targets.')
  .version('1.0.0')

program
  .command('run')
  .description('Run every check once and exit with a pass/fail code')
  .argument('<config>', 'path to a check config YAML file')
  .option('--json <path>', 'write a JSON report to this path')
  .option('--html <path>', 'write an HTML report to this path')
  .option('--prom <path>', 'write a Prometheus exposition-format report to this path')
  .action(async (configPath: string, options: ReportOptions) => {
    const config = await loadCheckConfig(configPath)
    const collector = new ProbeCollector()

    const { passed } = await runProbes(config, collector, buildReporters(options), buildExporters(options))
    process.exitCode = passed ? 0 : 1
  })

program
  .command('watch')
  .description('Continuously poll checks on an interval and rewrite reports each cycle (does not terminate)')
  .argument('<config>', 'path to a check config YAML file')
  .option('--interval <seconds>', 'override the config\'s intervalSeconds', Number.parseFloat)
  .option('--json <path>', 'write a JSON report to this path, refreshed every cycle')
  .option('--html <path>', 'write an HTML report to this path, refreshed every cycle')
  .option('--prom <path>', 'write a Prometheus exposition-format report to this path, refreshed every cycle')
  .action(async (configPath: string, options: ReportOptions & { interval?: number }) => {
    const config = await loadCheckConfig(configPath)
    const collector = new ProbeCollector()
    const reporters = buildReporters(options)
    const exporters = buildExporters(options)
    const intervalMs = (options.interval ?? config.intervalSeconds) * 1000

    collector.on('result', (outcome) => {
      const status = outcome.success ? 'OK  ' : 'FAIL'
      console.log(`[${new Date(outcome.timestampMs).toISOString()}] ${status} ${outcome.checkName} (${outcome.latencyMs}ms)`)
    })

    // Edge-triggered: only alert on the pass->fail transition, not every
    // poll cycle, so a sustained outage doesn't re-page on each interval.
    let previousPassed = true
    for (;;) {
      const { context, passed } = await runProbes(config, collector, reporters, exporters, { alert: false })
      if (previousPassed && !passed && config.alerting?.webhookUrl) {
        await new WebhookAlerter(config.alerting.webhookUrl).send(context)
      }
      previousPassed = passed
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  })

program.parseAsync(process.argv)
