import type { ReportContext } from '../reporters/report-context.js'

/** Pure function: builds a Slack-compatible incoming-webhook payload from a breached run. */
export function buildSlackPayload(context: ReportContext): { text: string } {
  const lines = context.thresholdResult.violations.map(
    (v) => `• ${v.metric}: ${v.actual.toFixed(2)} violates limit ${v.limit}`,
  )
  return {
    text: `🔴 uptime-probe: ${context.thresholdResult.violations.length} threshold violation(s) in "${context.configName}"\n${lines.join('\n')}`,
  }
}

/** Fires a Slack-compatible webhook POST — the same payload shape Slack, Discord (with a shim), and most generic webhook consumers accept. */
export class WebhookAlerter {
  constructor(private readonly webhookUrl: string) {}

  async send(context: ReportContext): Promise<void> {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildSlackPayload(context)),
    })
  }
}
