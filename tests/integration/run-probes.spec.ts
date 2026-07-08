import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFixtureApp } from '../fixtures/app.js'
import { runProbes } from '../../src/run-probes.js'
import { ProbeCollector } from '../../src/metrics/probe-collector.js'
import type { CheckConfig } from '../../src/config/check-schema.js'
import type { ReportContext } from '../../src/reporters/report-context.js'
import type { Reporter } from '../../src/reporters/reporter.interface.js'

class CapturingReporter implements Reporter {
  context: ReportContext | undefined
  report(context: ReportContext): void {
    this.context = context
  }
}

describe('runProbes (real HTTP, no mocking)', () => {
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    server = createFixtureApp().listen(0)
    await new Promise<void>((resolve) => server.once('listening', resolve))
    const { port } = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(() => {
    server.close()
  })

  it('passes thresholds against a healthy endpoint', async () => {
    const config: CheckConfig = {
      name: 'health check',
      checks: [{ type: 'http', name: 'health', url: `${baseUrl}/health`, method: 'GET', expectStatus: 200, timeoutMs: 5000 }],
      intervalSeconds: 60,
      thresholds: { minUptimePercent: 99 },
    }

    const reporter = new CapturingReporter()
    const { passed } = await runProbes(config, new ProbeCollector(), [reporter], [])

    expect(passed).toBe(true)
    expect(reporter.context?.summary.overallUptimePercent).toBe(100)
    expect(reporter.context?.narrative).toBeTruthy()
  })

  it('fails the threshold gate against a consistently failing endpoint', async () => {
    const config: CheckConfig = {
      name: 'down check',
      checks: [{ type: 'http', name: 'down', url: `${baseUrl}/down`, method: 'GET', expectStatus: 200, timeoutMs: 5000 }],
      intervalSeconds: 60,
      thresholds: { minUptimePercent: 100 },
    }

    const reporter = new CapturingReporter()
    const { passed } = await runProbes(config, new ProbeCollector(), [reporter], [])

    expect(passed).toBe(false)
    expect(reporter.context?.thresholdResult.violations[0]?.metric).toBe('minUptimePercent')
  })

  it('flags a latency threshold breach against a slow endpoint', async () => {
    const config: CheckConfig = {
      name: 'slow check',
      checks: [{ type: 'http', name: 'slow', url: `${baseUrl}/slow`, method: 'GET', expectStatus: 200, timeoutMs: 5000 }],
      intervalSeconds: 60,
      thresholds: { maxLatencyP95Ms: 50 },
    }

    const reporter = new CapturingReporter()
    const { passed } = await runProbes(config, new ProbeCollector(), [reporter], [])

    expect(passed).toBe(false)
    expect(reporter.context?.thresholdResult.violations[0]?.metric).toBe('maxLatencyP95Ms')
  })

  it('accumulates uptime across multiple runs against the same collector', async () => {
    const config: CheckConfig = {
      name: 'health check',
      checks: [{ type: 'http', name: 'health', url: `${baseUrl}/health`, method: 'GET', expectStatus: 200, timeoutMs: 5000 }],
      intervalSeconds: 60,
    }
    const collector = new ProbeCollector()

    await runProbes(config, collector, [], [])
    const { context } = await runProbes(config, collector, [], [])

    expect(context.summary.checks[0]?.totalRuns).toBe(2)
  })
})
