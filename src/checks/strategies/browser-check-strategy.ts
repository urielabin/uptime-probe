import type { BrowserCheck } from '../../config/check-schema.js'
import type { CheckStrategy, ProbeOutcome } from './check-strategy.interface.js'

/**
 * Runs one real-browser check via Playwright — navigates to the target and
 * asserts visible text is present. `playwright` is lazily imported inside
 * `run()` (not at module load) so a config with only `http` checks never
 * pays the browser-launch cost.
 */
export class BrowserCheckStrategy implements CheckStrategy {
  constructor(private readonly check: BrowserCheck) {}

  async run(): Promise<ProbeOutcome> {
    const { check } = this
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()

    // Timing starts after the browser is up, not before -- launching a
    // fresh headless chromium process is tool/environment overhead (slow
    // and highly variable on a cold CI runner), not part of the target's
    // real-world latency a synthetic check is meant to measure.
    const startedAtMs = Date.now()

    try {
      const page = await browser.newPage()
      const response = await page.goto(check.url, { timeout: check.timeoutMs })
      await page.getByText(check.expectText).waitFor({ state: 'visible', timeout: check.timeoutMs })

      const latencyMs = Date.now() - startedAtMs
      const latencyOk = check.maxLatencyMs === undefined || latencyMs <= check.maxLatencyMs

      return {
        checkName: check.name,
        timestampMs: startedAtMs,
        latencyMs,
        success: latencyOk,
        statusCode: response?.status() ?? null,
        error: latencyOk ? undefined : `latency ${latencyMs}ms exceeded maxLatencyMs ${check.maxLatencyMs}`,
      }
    } catch (error) {
      return {
        checkName: check.name,
        timestampMs: startedAtMs,
        latencyMs: Date.now() - startedAtMs,
        success: false,
        statusCode: null,
        error: error instanceof Error ? error.message : String(error),
      }
    } finally {
      await browser.close()
    }
  }
}
