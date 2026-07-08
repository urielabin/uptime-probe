import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFixtureApp } from '../fixtures/app.js'
import { HttpDashboardPublisher } from '../../src/publishers/http-dashboard-publisher.js'
import type { ReportContext } from '../../src/reporters/report-context.js'

function makeContext(): ReportContext {
  return {
    configName: 'production api',
    summary: { overallUptimePercent: 100, overallLatency: { min: 10, max: 100, mean: 50, p50: 50, p90: 80, p95: 90, p99: 95 }, checks: [] },
    thresholdResult: { passed: true, violations: [] },
    narrative: 'all good',
  }
}

describe('HttpDashboardPublisher (real POST, no mocking)', () => {
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

  it('POSTs the full ReportContext with a bearer auth header', async () => {
    await new HttpDashboardPublisher(`${baseUrl}/dashboard/ingest`, 'test-key').publish(makeContext())

    const response = await fetch(`${baseUrl}/dashboard/received`)
    const received = (await response.json()) as Array<{ authorization: string; body: ReportContext }>

    expect(received).toHaveLength(1)
    expect(received[0]?.authorization).toBe('Bearer test-key')
    expect(received[0]?.body).toEqual(makeContext())
  })

  it('resolves without throwing when the dashboard is unreachable', async () => {
    const publisher = new HttpDashboardPublisher('http://127.0.0.1:1/dashboard/ingest', 'test-key')
    await expect(publisher.publish(makeContext())).resolves.toBeUndefined()
  })
})
