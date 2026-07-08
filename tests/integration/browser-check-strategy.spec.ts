import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFixtureApp } from '../fixtures/app.js'
import { BrowserCheckStrategy } from '../../src/checks/strategies/browser-check-strategy.js'
import type { BrowserCheck } from '../../src/config/check-schema.js'

describe('BrowserCheckStrategy (real headless chromium, no mocking)', () => {
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

  it('succeeds when the expected text is visible on the real page', async () => {
    const check: BrowserCheck = { type: 'browser', name: 'home', url: baseUrl, expectText: 'Welcome', timeoutMs: 15000 }
    const outcome = await new BrowserCheckStrategy(check).run()

    expect(outcome.success).toBe(true)
    expect(outcome.statusCode).toBe(200)
    expect(outcome.latencyMs).toBeGreaterThan(0)
  }, 20000)

  it('fails when the expected text is never rendered', async () => {
    const check: BrowserCheck = { type: 'browser', name: 'home', url: baseUrl, expectText: 'Nonexistent Text', timeoutMs: 2000 }
    const outcome = await new BrowserCheckStrategy(check).run()

    expect(outcome.success).toBe(false)
    expect(outcome.error).toBeTruthy()
  }, 20000)
})
