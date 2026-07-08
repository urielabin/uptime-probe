import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFixtureApp } from '../fixtures/app.js'
import { WebhookAlerter } from '../../src/alerting/webhook-alerter.js'
import type { ReportContext } from '../../src/reporters/report-context.js'

describe('WebhookAlerter (real POST, no mocking)', () => {
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

  it('actually POSTs the Slack-compatible payload to the webhook URL', async () => {
    const context: ReportContext = {
      configName: 'production api',
      summary: { overallUptimePercent: 90, overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 }, checks: [] },
      thresholdResult: { passed: false, violations: [{ metric: 'minUptimePercent', limit: 99, actual: 90 }] },
      narrative: 'degraded',
    }

    await new WebhookAlerter(`${baseUrl}/webhook`).send(context)

    const response = await fetch(`${baseUrl}/webhook/received`)
    const received = (await response.json()) as Array<{ text: string }>
    expect(received).toHaveLength(1)
    expect(received[0]?.text).toContain('production api')
  })
})
