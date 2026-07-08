import type { Publisher } from './publisher.interface.js'
import type { ReportContext } from '../reporters/report-context.js'

/**
 * Pushes every run's ReportContext to a hosted dashboard's ingestion API.
 * Unlike WebhookAlerter (conditional, fires only on threshold breach), this
 * fires unconditionally every cycle. Never throws -- a dashboard being
 * unreachable must never break local monitoring, especially in the
 * never-terminating `watch` loop.
 */
export class HttpDashboardPublisher implements Publisher {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async publish(context: ReportContext): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(context),
      })
      if (!response.ok) {
        console.warn(`uptime-probe: dashboard publish failed with status ${response.status}`)
      }
    } catch (error) {
      console.warn(`uptime-probe: dashboard publish failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
