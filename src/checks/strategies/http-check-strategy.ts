import type { HttpCheck } from '../../config/check-schema.js'
import type { CheckStrategy, ProbeOutcome } from './check-strategy.interface.js'

/** Runs one HTTP check via fetch, validating status and (optionally) a body substring — never throws. */
export class HttpCheckStrategy implements CheckStrategy {
  constructor(private readonly check: HttpCheck) {}

  async run(): Promise<ProbeOutcome> {
    const { check } = this
    const startedAtMs = Date.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), check.timeoutMs)

    try {
      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        signal: controller.signal,
      })
      const body = check.bodyContains !== undefined ? await response.text() : undefined
      const latencyMs = Date.now() - startedAtMs

      const statusOk = response.status === check.expectStatus
      const bodyOk = check.bodyContains === undefined || (body?.includes(check.bodyContains) ?? false)
      const latencyOk = check.maxLatencyMs === undefined || latencyMs <= check.maxLatencyMs

      const success = statusOk && bodyOk && latencyOk
      const error = success
        ? undefined
        : [
            !statusOk && `expected status ${check.expectStatus}, got ${response.status}`,
            !bodyOk && `body did not contain "${check.bodyContains}"`,
            !latencyOk && `latency ${latencyMs}ms exceeded maxLatencyMs ${check.maxLatencyMs}`,
          ].filter(Boolean).join('; ')

      return {
        checkName: check.name,
        timestampMs: startedAtMs,
        latencyMs,
        success,
        statusCode: response.status,
        error: error || undefined,
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
      clearTimeout(timeout)
    }
  }
}
